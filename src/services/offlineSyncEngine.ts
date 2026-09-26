/**
 * Central Offline Synchronization Engine
 * Handles automatic network detection, background syncing, topological queue execution,
 * server pull-merges, conflict handling, and local IndexedDB state updates.
 */

import { indexedDbService, OfflineSyncQueueRecord, OfflineMediaRecord } from './indexedDbService';
import { storageService } from './storageService';
import { SwineRecord, IssuedCertificate, MessageItem, Barangay } from '../types';

export type SyncState = 'ONLINE' | 'OFFLINE' | 'SYNCING' | 'SYNCED' | 'ERROR';

export interface SyncEngineStatus {
  state: SyncState;
  isOnline: boolean;
  isBackendReachable: boolean;
  pendingCount: number;
  lastSyncedAt: string | null;
  lastError: string | null;
  syncedThisSession: number;
}

class OfflineSyncEngine {
  private syncState: SyncState = 'ONLINE';
  private isBackendReachable: boolean = true;
  private isCheckingHealth: boolean = false;
  private isSyncInProgress: boolean = false;
  private lastSyncedAt: string | null = null;
  private lastError: string | null = null;
  private syncedCountSession: number = 0;
  private healthIntervalId: any = null;

  constructor() {
    this.init();
  }

  private init() {
    if (typeof window === 'undefined') return;

    // Load last sync metadata from IndexedDB
    indexedDbService.getSyncMetadata().then(meta => {
      if (meta && meta.lastSyncedAt) {
        this.lastSyncedAt = meta.lastSyncedAt;
      }
      this.broadcastStatus();
    }).catch(() => {});

    // Listen to browser network events
    window.addEventListener('online', () => {
      this.checkConnectivityAndAutoSync('network_online_event');
    });

    window.addEventListener('offline', () => {
      this.setOfflineState('Browser offline event triggered');
    });

    // Listen to simulated offline toggle
    window.addEventListener('da_connectivity_change', (e: any) => {
      if (e.detail?.isSimulatedOffline) {
        this.setOfflineState('Simulated offline active');
      } else {
        this.checkConnectivityAndAutoSync('simulation_disabled');
      }
    });

    // Listen for visibility change to auto-sync when tab gains focus
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        this.checkConnectivityAndAutoSync('tab_visible');
      }
    });

    // Periodic connectivity & sync loop (every 25 seconds)
    this.healthIntervalId = setInterval(() => {
      this.checkConnectivityAndAutoSync('interval_heartbeat');
    }, 25000);

    // Initial background sync check on boot
    setTimeout(() => {
      this.checkConnectivityAndAutoSync('app_start');
    }, 1500);
  }

  public getStatus(): SyncEngineStatus {
    const isSimulated = storageService.getSimulatedOffline();
    const isOnline = typeof navigator !== 'undefined' ? (navigator.onLine && !isSimulated && this.isBackendReachable) : true;

    return {
      state: isOnline ? (this.isSyncInProgress ? 'SYNCING' : this.syncState) : 'OFFLINE',
      isOnline,
      isBackendReachable: this.isBackendReachable && !isSimulated,
      pendingCount: 0, // dynamic
      lastSyncedAt: this.lastSyncedAt,
      lastError: this.lastError,
      syncedThisSession: this.syncedCountSession,
    };
  }

  private broadcastStatus(pendingCount?: number) {
    if (typeof window === 'undefined') return;

    const countPromise = pendingCount !== undefined
      ? Promise.resolve(pendingCount)
      : indexedDbService.getPendingSyncQueue().then(q => q.length).catch(() => 0);

    countPromise.then(cnt => {
      const status: SyncEngineStatus = {
        ...this.getStatus(),
        pendingCount: cnt,
      };
      window.dispatchEvent(new CustomEvent('da_sync_status_updated', { detail: status }));
    });
  }

  private setOfflineState(reason?: string) {
    this.syncState = 'OFFLINE';
    this.broadcastStatus();
  }

  /**
   * Health Ping to check actual backend reachability
   */
  public async pingBackend(): Promise<boolean> {
    if (storageService.getSimulatedOffline()) {
      this.isBackendReachable = false;
      return false;
    }

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      this.isBackendReachable = false;
      return false;
    }

    if (this.isCheckingHealth) return this.isBackendReachable;
    this.isCheckingHealth = true;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);

      const res = await fetch('/api/health', {
        method: 'GET',
        signal: controller.signal,
        cache: 'no-store',
      });
      clearTimeout(timeoutId);

      this.isBackendReachable = res.ok;
      return res.ok;
    } catch {
      this.isBackendReachable = false;
      return false;
    } finally {
      this.isCheckingHealth = false;
    }
  }

  /**
   * Auto-trigger sync safely when condition allows
   */
  public async checkConnectivityAndAutoSync(triggerReason?: string): Promise<void> {
    if (this.isSyncInProgress) return;

    const isReachable = await this.pingBackend();
    if (!isReachable) {
      this.setOfflineState(`Backend unreachable (${triggerReason})`);
      return;
    }

    // Backend is reachable! Trigger sync
    await this.syncNow();
  }

  /**
   * Complete 2-Way Sync Engine:
   * 1. Flush offline pending queue (PUSH) to backend
   * 2. Download latest authoritative server state (PULL)
   * 3. Reconcile IndexedDB & memory caches
   */
  public async syncNow(): Promise<{ success: boolean; pushedCount: number; pulledCount: number; error?: string }> {
    if (this.isSyncInProgress) {
      return { success: false, pushedCount: 0, pulledCount: 0, error: 'Sync already in progress' };
    }

    const isReachable = await this.pingBackend();
    if (!isReachable) {
      this.syncState = 'OFFLINE';
      this.broadcastStatus();
      return { success: false, pushedCount: 0, pulledCount: 0, error: 'No internet connection or server unreachable.' };
    }

    this.isSyncInProgress = true;
    this.syncState = 'SYNCING';
    this.broadcastStatus();

    let pushedCount = 0;
    let pulledCount = 0;

    try {
      // -------------------------------------------------------------
      // STEP 1: PUSH PENDING OPERATIONS QUEUE
      // -------------------------------------------------------------
      const pendingQueue = await indexedDbService.getPendingSyncQueue();

      if (pendingQueue.length > 0) {
        const user = storageService.getCurrentUser();
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        };
        if (user) {
          headers['x-user-role'] = user.role || 'focal';
          headers['x-user-id'] = user.id || '';
          headers['x-user-name'] = user.username || user.name || '';
          if (user.assignedBarangay) headers['x-user-assigned-barangay'] = user.assignedBarangay;
          if (user.barangay_id) headers['x-user-barangay-id'] = user.barangay_id;
        }

        const pushPayload = {
          operations: pendingQueue.map(item => ({
            clientOperationId: item.clientOperationId,
            operation: item.operation,
            entity: item.entity,
            entityId: item.entityId,
            payload: item.payload,
          })),
        };

        const pushRes = await fetch('/api/sync/push', {
          method: 'POST',
          headers,
          body: JSON.stringify(pushPayload),
        });

        if (pushRes.ok) {
          const pushData = await pushRes.json();
          if (pushData.results && Array.isArray(pushData.results)) {
            for (const resItem of pushData.results) {
              const matchedQueue = pendingQueue.find(q => q.clientOperationId === resItem.clientOperationId);
              if (matchedQueue) {
                if (resItem.success) {
                  // Mark synced and delete from queue
                  await indexedDbService.removeQueueItem(matchedQueue.id);
                  pushedCount++;

                  // If server assigned new Pig ID or new Entity ID, update local store
                  if (matchedQueue.entity === 'swine') {
                    const localSwine = await indexedDbService.get<SwineRecord>('swineRecords', matchedQueue.entityId);
                    if (localSwine) {
                      const updatedLocal = {
                        ...localSwine,
                        id: resItem.serverEntityId || localSwine.id,
                        pigIdTag: resItem.serverPigId || localSwine.pigIdTag,
                        earTagNo: resItem.serverPigId || localSwine.earTagNo,
                        isSynced: true,
                      };
                      if (resItem.serverEntityId && resItem.serverEntityId !== matchedQueue.entityId) {
                        await indexedDbService.delete('swineRecords', matchedQueue.entityId);
                      }
                      await indexedDbService.put('swineRecords', updatedLocal);
                    }
                  }
                } else {
                  await indexedDbService.updateQueueItemStatus(matchedQueue.id, 'FAILED', resItem.error);
                }
              }
            }
          }
        }
      }

      // -------------------------------------------------------------
      // STEP 2: PULL AUTHORITATIVE SERVER DATA
      // -------------------------------------------------------------
      const user = storageService.getCurrentUser();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (user) {
        headers['x-user-role'] = user.role || 'focal';
        headers['x-user-id'] = user.id || '';
        headers['x-user-name'] = user.username || user.name || '';
        if (user.assignedBarangay) headers['x-user-assigned-barangay'] = user.assignedBarangay;
        if (user.barangay_id) headers['x-user-barangay-id'] = user.barangay_id;
      }

      const pullRes = await fetch('/api/sync/pull', { method: 'GET', headers });
      if (pullRes.ok) {
        const pullData = await pullRes.json();
        if (pullData.success && pullData.data) {
          const { swineRecords, certificates, messages } = pullData.data;

          // Merge Swine Records safely (Preserve any locally created pending records)
          if (Array.isArray(swineRecords)) {
            pulledCount = swineRecords.length;
            const remainingQueue = await indexedDbService.getPendingSyncQueue();
            const pendingSwineIds = new Set(
              remainingQueue.filter(q => q.entity === 'swine').map(q => q.entityId)
            );

            // Fetch existing local records
            const localRecords = await indexedDbService.getAll<SwineRecord>('swineRecords');
            const pendingLocalRecords = localRecords.filter(r => pendingSwineIds.has(r.id) || !r.isSynced);

            // Server records are authoritative
            const serverMarked = swineRecords.map((s: SwineRecord) => ({ ...s, isSynced: true }));

            // Merge server records + local pending records
            const mergedMap = new Map<string, SwineRecord>();
            serverMarked.forEach((s: SwineRecord) => mergedMap.set(s.id, s));
            pendingLocalRecords.forEach((s: SwineRecord) => mergedMap.set(s.id, s));

            const finalMergedList = Array.from(mergedMap.values()).sort(
              (a, b) => new Date(b.registeredAt || 0).getTime() - new Date(a.registeredAt || 0).getTime()
            );

            // Update IndexedDB
            await indexedDbService.clear('swineRecords');
            await indexedDbService.putBatch('swineRecords', finalMergedList);

            // Sync to storageService memory/localStorage mirror
            storageService.saveSwineRecords(finalMergedList);
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('swine_records_updated', { detail: finalMergedList }));
            }
          }

          // Update certificates & messages in IndexedDB
          if (Array.isArray(certificates)) {
            await indexedDbService.putBatch('certificates', certificates);
          }
          if (Array.isArray(messages)) {
            await indexedDbService.putBatch('messages', messages);
          }
        }
      }

      // -------------------------------------------------------------
      // STEP 3: UPDATE METADATA & COMPLETE
      // -------------------------------------------------------------
      const now = new Date().toISOString();
      this.lastSyncedAt = now;
      this.lastError = null;
      this.syncedCountSession += pushedCount;
      this.syncState = 'SYNCED';

      await indexedDbService.updateSyncMetadata({
        lastSyncedAt: now,
        lastSyncStatus: 'SUCCESS',
        totalSyncedCount: this.syncedCountSession,
        pendingCount: 0,
      });

      this.broadcastStatus(0);

      return { success: true, pushedCount, pulledCount };
    } catch (err: any) {
      console.error('Sync process error:', err);
      this.lastError = err?.message || 'Synchronization failed';
      this.syncState = 'ERROR';
      this.broadcastStatus();
      return { success: false, pushedCount, pulledCount, error: this.lastError || undefined };
    } finally {
      this.isSyncInProgress = false;
      this.broadcastStatus();
    }
  }

  // =========================================================================
  // QUEUE OPERATIONS FOR OFFLINE ACTIONS
  // =========================================================================

  public async queueSwineCreate(record: SwineRecord): Promise<void> {
    // 1. Save directly into local IndexedDB
    const localRecord: SwineRecord = {
      ...record,
      isSynced: false,
      updatedAt: new Date().toISOString(),
    };
    await indexedDbService.put('swineRecords', localRecord);

    // 2. Add to persistent queue
    await indexedDbService.enqueueSyncItem('create', 'swine', localRecord.id, localRecord, 2);

    // 3. Update memory mirror
    const currentList = storageService.getSwineRecords();
    const updated = [localRecord, ...currentList.filter(s => s.id !== localRecord.id)];
    storageService.saveSwineRecords(updated);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('swine_records_updated', { detail: updated }));
    }

    // 4. Try auto-sync in background if online
    this.checkConnectivityAndAutoSync('swine_create');
  }

  public async queueSwineUpdate(record: SwineRecord): Promise<void> {
    const localRecord: SwineRecord = {
      ...record,
      isSynced: false,
      updatedAt: new Date().toISOString(),
    };
    await indexedDbService.put('swineRecords', localRecord);
    await indexedDbService.enqueueSyncItem('update', 'swine', localRecord.id, localRecord, 2);

    const currentList = storageService.getSwineRecords();
    const updated = currentList.map(s => (s.id === localRecord.id ? localRecord : s));
    storageService.saveSwineRecords(updated);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('swine_records_updated', { detail: updated }));
    }

    this.checkConnectivityAndAutoSync('swine_update');
  }

  public async queueSwineDelete(id: string): Promise<void> {
    await indexedDbService.delete('swineRecords', id);
    await indexedDbService.enqueueSyncItem('delete', 'swine', id, { id }, 2);

    const currentList = storageService.getSwineRecords();
    const updated = currentList.filter(s => s.id !== id);
    storageService.saveSwineRecords(updated);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('swine_records_updated', { detail: updated }));
    }

    this.checkConnectivityAndAutoSync('swine_delete');
  }

  public async queueSwineSell(id: string, readyToSell: boolean, priceEstimate?: number): Promise<void> {
    const local = await indexedDbService.get<SwineRecord>('swineRecords', id);
    if (local) {
      const updated: SwineRecord = {
        ...local,
        readyToSell,
        status: readyToSell ? 'ready_to_sell' : (local.status === 'ready_to_sell' ? 'healthy' : local.status),
        estimatedPricePhp: priceEstimate !== undefined ? priceEstimate : local.estimatedPricePhp,
        isSynced: false,
        updatedAt: new Date().toISOString(),
      };
      await indexedDbService.put('swineRecords', updated);
      await indexedDbService.enqueueSyncItem('sell', 'swine', id, { readyToSell, priceEstimate }, 2);

      const currentList = storageService.getSwineRecords();
      const updatedList = currentList.map(s => (s.id === id ? updated : s));
      storageService.saveSwineRecords(updatedList);

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('swine_records_updated', { detail: updatedList }));
      }
    }
    this.checkConnectivityAndAutoSync('swine_sell');
  }

  public async queueMediaUpload(media: OfflineMediaRecord): Promise<void> {
    await indexedDbService.put('media', media);
    await indexedDbService.enqueueSyncItem('upload_media', 'media', media.id, media, 1);
    this.checkConnectivityAndAutoSync('media_upload');
  }

  public async queueCertificate(cert: IssuedCertificate): Promise<void> {
    const certId = cert.id || cert.certificateNo;
    const certToSave = { ...cert, id: certId };
    await indexedDbService.put('certificates', certToSave);
    await indexedDbService.enqueueSyncItem('create', 'certificate', certId, certToSave, 2);
    this.checkConnectivityAndAutoSync('certificate_create');
  }

  public async queueMessage(msg: MessageItem): Promise<void> {
    await indexedDbService.put('messages', msg);
    await indexedDbService.enqueueSyncItem('create', 'message', msg.id, msg, 3);
    this.checkConnectivityAndAutoSync('message_create');
  }
}

export const offlineSyncEngine = new OfflineSyncEngine();
