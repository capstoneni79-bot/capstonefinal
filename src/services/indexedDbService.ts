/**
 * Native IndexedDB Service for DA Hinunangan Swine Registry
 * Complete Offline-First storage layer with structured stores and indexing.
 */

export const DB_NAME = 'da_hinunangan_offline_db_v2';
export const DB_VERSION = 2;

export interface OfflineSyncQueueRecord {
  id: string;
  clientOperationId: string;
  operation: 'create' | 'update' | 'delete' | 'archive' | 'sell' | 'upload_media';
  entity: 'swine' | 'farmer' | 'barangay' | 'media' | 'message' | 'certificate' | 'setting' | 'user';
  entityId: string;
  payload: any;
  createdAt: string;
  updatedAt: string;
  status: 'PENDING' | 'SYNCING' | 'SYNCED' | 'FAILED' | 'CONFLICT';
  retryCount: number;
  lastError?: string;
  lastAttemptAt?: string;
  priority: number; // 1 = High (Media/Auth), 2 = Normal (Swine/Farmer), 3 = Low (Messages/Settings)
}

export interface OfflineMediaRecord {
  id: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  dataUrlOrBase64: string;
  category: string;
  altText?: string;
  uploadedBy?: string;
  uploadedAt: string;
  isSynced: boolean;
  serverUrl?: string;
}

export interface OfflineSyncMetadata {
  key: string;
  lastSyncedAt?: string;
  lastSyncStatus?: 'SUCCESS' | 'PARTIAL' | 'FAILED';
  totalSyncedCount?: number;
  pendingCount?: number;
  schemaVersion?: number;
  lastError?: string;
}

class IndexedDbService {
  private dbPromise: Promise<IDBDatabase> | null = null;

  private async getDB(): Promise<IDBDatabase> {
    if (typeof window === 'undefined' || !window.indexedDB) {
      throw new Error('IndexedDB is not supported in this environment.');
    }

    if (this.dbPromise) {
      return this.dbPromise;
    }

    this.dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // 1. Swine Records store
        if (!db.objectStoreNames.contains('swineRecords')) {
          const store = db.createObjectStore('swineRecords', { keyPath: 'id' });
          store.createIndex('pigIdTag', 'pigIdTag', { unique: false });
          store.createIndex('barangay', 'barangay', { unique: false });
          store.createIndex('farmerName', 'farmerName', { unique: false });
          store.createIndex('status', 'status', { unique: false });
          store.createIndex('readyToSell', 'readyToSell', { unique: false });
          store.createIndex('isSynced', 'isSynced', { unique: false });
          store.createIndex('updatedAt', 'updatedAt', { unique: false });
        }

        // 2. Farmers store
        if (!db.objectStoreNames.contains('farmers')) {
          const store = db.createObjectStore('farmers', { keyPath: 'id' });
          store.createIndex('farmerName', 'farmerName', { unique: false });
          store.createIndex('barangay', 'barangay', { unique: false });
          store.createIndex('isSynced', 'isSynced', { unique: false });
        }

        // 3. Barangays store
        if (!db.objectStoreNames.contains('barangays')) {
          const store = db.createObjectStore('barangays', { keyPath: 'id' });
          store.createIndex('name', 'name', { unique: false });
        }

        // 4. Users / Accounts store
        if (!db.objectStoreNames.contains('users')) {
          const store = db.createObjectStore('users', { keyPath: 'id' });
          store.createIndex('username', 'username', { unique: false });
          store.createIndex('role', 'role', { unique: false });
        }

        // 5. Media & Photos store (Stores Blobs/Base64 offline)
        if (!db.objectStoreNames.contains('media')) {
          const store = db.createObjectStore('media', { keyPath: 'id' });
          store.createIndex('category', 'category', { unique: false });
          store.createIndex('isSynced', 'isSynced', { unique: false });
          store.createIndex('uploadedAt', 'uploadedAt', { unique: false });
        }

        // 6. Messages store
        if (!db.objectStoreNames.contains('messages')) {
          const store = db.createObjectStore('messages', { keyPath: 'id' });
          store.createIndex('senderId', 'senderId', { unique: false });
          store.createIndex('targetBarangay', 'targetBarangay', { unique: false });
          store.createIndex('isSynced', 'isSynced', { unique: false });
        }

        // 7. Certificates & Permits store
        if (!db.objectStoreNames.contains('certificates')) {
          const store = db.createObjectStore('certificates', { keyPath: 'id' });
          store.createIndex('controlNumber', 'controlNumber', { unique: false });
          store.createIndex('barangay', 'barangay', { unique: false });
          store.createIndex('isSynced', 'isSynced', { unique: false });
        }

        // 8. Settings & Dynamic Form Schemas
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'key' });
        }

        // 9. GIS data & Boundaries
        if (!db.objectStoreNames.contains('gisData')) {
          db.createObjectStore('gisData', { keyPath: 'id' });
        }

        // 10. Sync Queue (Persistent offline actions queue)
        if (!db.objectStoreNames.contains('syncQueue')) {
          const store = db.createObjectStore('syncQueue', { keyPath: 'id' });
          store.createIndex('status', 'status', { unique: false });
          store.createIndex('entity', 'entity', { unique: false });
          store.createIndex('priority', 'priority', { unique: false });
          store.createIndex('createdAt', 'createdAt', { unique: false });
          store.createIndex('clientOperationId', 'clientOperationId', { unique: true });
        }

        // 11. Sync Metadata
        if (!db.objectStoreNames.contains('syncMetadata')) {
          db.createObjectStore('syncMetadata', { keyPath: 'key' });
        }
      };

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        this.dbPromise = null;
        reject(request.error || new Error('Failed to open IndexedDB'));
      };
    });

    return this.dbPromise;
  }

  // ==========================================
  // Generic CRUD Operations
  // ==========================================

  async getAll<T>(storeName: string): Promise<T[]> {
    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, 'readonly');
        const store = tx.objectStore(storeName);
        const req = store.getAll();

        req.onsuccess = () => resolve((req.result || []) as T[]);
        req.onerror = () => reject(req.error);
      });
    } catch (err) {
      console.warn(`IndexedDB getAll failed on ${storeName}:`, err);
      return [];
    }
  }

  async get<T>(storeName: string, key: IDBValidKey): Promise<T | null> {
    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, 'readonly');
        const store = tx.objectStore(storeName);
        const req = store.get(key);

        req.onsuccess = () => resolve(req.result ? (req.result as T) : null);
        req.onerror = () => reject(req.error);
      });
    } catch (err) {
      console.warn(`IndexedDB get failed on ${storeName} key ${key}:`, err);
      return null;
    }
  }

  async put<T>(storeName: string, value: T): Promise<T> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const req = store.put(value);

      req.onsuccess = () => resolve(value);
      req.onerror = () => reject(req.error);
    });
  }

  async putBatch<T>(storeName: string, items: T[]): Promise<void> {
    if (!items || items.length === 0) return;
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);

      items.forEach(item => store.put(item));

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async delete(storeName: string, key: IDBValidKey): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const req = store.delete(key);

      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  async clear(storeName: string): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const req = store.clear();

      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  async count(storeName: string): Promise<number> {
    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, 'readonly');
        const store = tx.objectStore(storeName);
        const req = store.count();

        req.onsuccess = () => resolve(req.result || 0);
        req.onerror = () => reject(req.error);
      });
    } catch {
      return 0;
    }
  }

  // ==========================================
  // SYNC QUEUE SPECIALIZED METHODS
  // ==========================================

  async getPendingSyncQueue(): Promise<OfflineSyncQueueRecord[]> {
    const all = await this.getAll<OfflineSyncQueueRecord>('syncQueue');
    return all
      .filter(item => item.status === 'PENDING' || item.status === 'FAILED' || item.status === 'SYNCING')
      .sort((a, b) => {
        if (a.priority !== b.priority) return a.priority - b.priority;
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      });
  }

  async enqueueSyncItem(
    operation: OfflineSyncQueueRecord['operation'],
    entity: OfflineSyncQueueRecord['entity'],
    entityId: string,
    payload: any,
    priority: number = 2
  ): Promise<OfflineSyncQueueRecord> {
    const now = new Date().toISOString();
    const clientOperationId = `op-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const queueRecord: OfflineSyncQueueRecord = {
      id: `sync-q-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      clientOperationId,
      operation,
      entity,
      entityId,
      payload,
      createdAt: now,
      updatedAt: now,
      status: 'PENDING',
      retryCount: 0,
      priority,
    };

    await this.put('syncQueue', queueRecord);
    this.broadcastQueueChange();
    return queueRecord;
  }

  async updateQueueItemStatus(
    id: string,
    status: OfflineSyncQueueRecord['status'],
    error?: string
  ): Promise<void> {
    const item = await this.get<OfflineSyncQueueRecord>('syncQueue', id);
    if (item) {
      item.status = status;
      item.updatedAt = new Date().toISOString();
      item.lastAttemptAt = new Date().toISOString();
      if (status === 'FAILED') {
        item.retryCount = (item.retryCount || 0) + 1;
        item.lastError = error || 'Synchronization error';
      }
      if (status === 'SYNCED') {
        item.lastError = undefined;
      }
      await this.put('syncQueue', item);
      this.broadcastQueueChange();
    }
  }

  async removeQueueItem(id: string): Promise<void> {
    await this.delete('syncQueue', id);
    this.broadcastQueueChange();
  }

  private broadcastQueueChange() {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('da_offline_queue_changed'));
    }
  }

  // ==========================================
  // SYNC METADATA METHODS
  // ==========================================

  async getSyncMetadata(): Promise<OfflineSyncMetadata> {
    const data = await this.get<OfflineSyncMetadata>('syncMetadata', 'global_sync_state');
    return (
      data || {
        key: 'global_sync_state',
        lastSyncedAt: new Date().toISOString(),
        lastSyncStatus: 'SUCCESS',
        totalSyncedCount: 0,
        pendingCount: 0,
        schemaVersion: DB_VERSION,
      }
    );
  }

  async updateSyncMetadata(updates: Partial<OfflineSyncMetadata>): Promise<OfflineSyncMetadata> {
    const current = await this.getSyncMetadata();
    const updated: OfflineSyncMetadata = {
      ...current,
      ...updates,
      key: 'global_sync_state',
    };
    await this.put('syncMetadata', updated);
    return updated;
  }
}

export const indexedDbService = new IndexedDbService();
