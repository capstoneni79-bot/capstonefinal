import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { storageService } from '../services/storageService';
import { offlineSyncEngine, SyncEngineStatus, SyncState } from '../services/offlineSyncEngine';
import { indexedDbService, OfflineSyncQueueRecord } from '../services/indexedDbService';

export interface OfflineContextValue {
  isOnline: boolean;
  isBrowserOnline: boolean;
  isBackendReachable: boolean;
  isSimulatedOffline: boolean;
  syncState: SyncState;
  pendingQueueCount: number;
  pendingItems: OfflineSyncQueueRecord[];
  lastSyncedAt: string | null;
  lastError: string | null;
  syncedThisSession: number;
  toggleSimulateOffline: () => void;
  setSimulatedOffline: (status: boolean) => void;
  forceSync: () => Promise<{
    success: boolean;
    syncedCount: number;
    pushedCount: number;
    pulledCount: number;
    error?: string;
  }>;
  clearQueue: () => Promise<void>;
  refreshQueueData: () => Promise<void>;
}

export const OfflineContext = createContext<OfflineContextValue | undefined>(undefined);

export const OfflineProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [status, setStatus] = useState<SyncEngineStatus>(() => offlineSyncEngine.getStatus());
  const [isSimulatedOffline, setIsSimulatedOfflineState] = useState<boolean>(() => storageService.getSimulatedOffline());
  const [pendingQueueCount, setPendingQueueCount] = useState<number>(0);
  const [pendingItems, setPendingItems] = useState<OfflineSyncQueueRecord[]>([]);

  const refreshQueueData = useCallback(async () => {
    try {
      const items = await indexedDbService.getPendingSyncQueue();
      setPendingItems(items);
      setPendingQueueCount(items.length);
    } catch {
      const legacyCount = storageService.getOfflineQueue().length;
      setPendingQueueCount(legacyCount);
    }
  }, []);

  useEffect(() => {
    refreshQueueData();

    const handleSyncStatus = (e: Event) => {
      const customEvent = e as CustomEvent<SyncEngineStatus>;
      if (customEvent.detail) {
        setStatus(customEvent.detail);
      }
      setIsSimulatedOfflineState(storageService.getSimulatedOffline());
      refreshQueueData();
    };

    const handleQueueChange = () => {
      refreshQueueData();
    };

    const handleConnectivityChange = (e: Event) => {
      const customEvent = e as CustomEvent<{ isSimulatedOffline?: boolean }>;
      if (customEvent.detail && typeof customEvent.detail.isSimulatedOffline === 'boolean') {
        setIsSimulatedOfflineState(customEvent.detail.isSimulatedOffline);
      } else {
        setIsSimulatedOfflineState(storageService.getSimulatedOffline());
      }
      setStatus(offlineSyncEngine.getStatus());
      refreshQueueData();
    };

    window.addEventListener('da_sync_status_updated', handleSyncStatus);
    window.addEventListener('da_offline_queue_changed', handleQueueChange);
    window.addEventListener('da_connectivity_change', handleConnectivityChange);

    return () => {
      window.removeEventListener('da_sync_status_updated', handleSyncStatus);
      window.removeEventListener('da_offline_queue_changed', handleQueueChange);
      window.removeEventListener('da_connectivity_change', handleConnectivityChange);
    };
  }, [refreshQueueData]);

  const setSimulatedOffline = useCallback((statusVal: boolean) => {
    storageService.setSimulatedOffline(statusVal);
    setIsSimulatedOfflineState(statusVal);
    setStatus(offlineSyncEngine.getStatus());
  }, []);

  const toggleSimulateOffline = useCallback(() => {
    const nextState = !storageService.getSimulatedOffline();
    setSimulatedOffline(nextState);
  }, [setSimulatedOffline]);

  const forceSync = useCallback(async () => {
    const result = await offlineSyncEngine.syncNow();
    await refreshQueueData();
    setStatus(offlineSyncEngine.getStatus());
    return {
      success: result.success,
      syncedCount: result.pushedCount + result.pulledCount,
      pushedCount: result.pushedCount,
      pulledCount: result.pulledCount,
      error: result.error,
    };
  }, [refreshQueueData]);

  const clearQueue = useCallback(async () => {
    await indexedDbService.clear('syncQueue');
    storageService.clearOfflineQueue();
    await refreshQueueData();
  }, [refreshQueueData]);

  const value: OfflineContextValue = {
    isOnline: !isSimulatedOffline && status.isOnline,
    isBrowserOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    isBackendReachable: status.isBackendReachable,
    isSimulatedOffline,
    syncState: isSimulatedOffline ? ('OFFLINE' as SyncState) : (status.state as SyncState),
    pendingQueueCount,
    pendingItems,
    lastSyncedAt: status.lastSyncedAt,
    lastError: status.lastError,
    syncedThisSession: status.syncedThisSession,
    toggleSimulateOffline,
    setSimulatedOffline,
    forceSync,
    clearQueue,
    refreshQueueData,
  };

  return <OfflineContext.Provider value={value}>{children}</OfflineContext.Provider>;
};

export const useOffline = (): OfflineContextValue => {
  const context = useContext(OfflineContext);
  if (!context) {
    const isSimulated = storageService.getSimulatedOffline();
    const st = offlineSyncEngine.getStatus();
    return {
      isOnline: !isSimulated && st.isOnline,
      isBrowserOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
      isBackendReachable: st.isBackendReachable,
      isSimulatedOffline: isSimulated,
      syncState: isSimulated ? ('OFFLINE' as SyncState) : (st.state as SyncState),
      pendingQueueCount: 0,
      pendingItems: [],
      lastSyncedAt: st.lastSyncedAt,
      lastError: st.lastError,
      syncedThisSession: st.syncedThisSession,
      toggleSimulateOffline: () => {
        const next = !storageService.getSimulatedOffline();
        storageService.setSimulatedOffline(next);
      },
      setSimulatedOffline: (s: boolean) => storageService.setSimulatedOffline(s),
      forceSync: async () => {
        const res = await offlineSyncEngine.syncNow();
        return {
          success: res.success,
          syncedCount: res.pushedCount + res.pulledCount,
          pushedCount: res.pushedCount,
          pulledCount: res.pulledCount,
          error: res.error,
        };
      },
      clearQueue: async () => {},
      refreshQueueData: async () => {},
    };
  }
  return context;
};
