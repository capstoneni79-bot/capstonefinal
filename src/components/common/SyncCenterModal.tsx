import React, { useState } from 'react';
import {
  X,
  RefreshCw,
  Wifi,
  WifiOff,
  Database,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Trash2,
  Layers,
  FileSpreadsheet,
  Image as ImageIcon,
  ShieldCheck,
  Smartphone,
} from 'lucide-react';
import { useOfflineStatus } from '../../hooks/useOfflineStatus';
import { useLanguage } from '../../context/LanguageContext';

interface SyncCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSyncComplete?: () => void;
}

export const SyncCenterModal: React.FC<SyncCenterModalProps> = ({
  isOpen,
  onClose,
  onSyncComplete,
}) => {
  const {
    isOnline,
    isSimulatedOffline,
    syncState,
    pendingQueueCount,
    pendingItems,
    lastSyncedAt,
    lastError,
    syncedThisSession,
    toggleSimulateOffline,
    forceSync,
    clearQueue,
  } = useOfflineStatus();

  const { t } = useLanguage();
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<{ success: boolean; message: string } | null>(null);

  if (!isOpen) return null;

  const handleManualSync = async () => {
    setIsSyncing(true);
    setSyncFeedback(null);
    try {
      const res = await forceSync();
      if (res.success) {
        setSyncFeedback({
          success: true,
          message: `Synchronized ${res.pushedCount} local changes and updated ${res.pulledCount} server records.`,
        });
        if (onSyncComplete) onSyncComplete();
      } else {
        setSyncFeedback({
          success: false,
          message: res.error || 'Synchronization failed. Please check network connectivity.',
        });
      }
    } catch (err: any) {
      setSyncFeedback({
        success: false,
        message: err?.message || 'Error occurred during sync.',
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleClear = async () => {
    if (window.confirm('Are you sure you want to clear the pending offline queue? Un-synced offline records will not be uploaded to the server.')) {
      await clearQueue();
      setSyncFeedback({
        success: true,
        message: 'Pending queue cleared.',
      });
    }
  };

  const formatTime = (isoString?: string | null) => {
    if (!isoString) return 'Not yet synced in this session';
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ', ' + d.toLocaleDateString();
    } catch {
      return isoString;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-emerald-800 via-emerald-900 to-slate-900 text-white p-5 flex items-center justify-between border-b border-emerald-700/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-700/80 border border-emerald-400/30 flex items-center justify-center text-emerald-200 shadow-inner">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
                {t('sync_center_title')}
              </h2>
              <p className="text-xs text-emerald-200/80 line-clamp-1">
                {t('sync_center_subtitle')}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-emerald-200 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1 text-slate-800">
          {/* Real-time Status Card */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between">
              <div className="space-y-1">
                <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Connection State</div>
                <div className="flex items-center gap-2">
                  {isOnline ? (
                    <>
                      <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                      </span>
                      <span className="font-bold text-emerald-800 text-sm">{t('sync_status_online')}</span>
                    </>
                  ) : (
                    <>
                      <span className="relative flex h-3 w-3">
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
                      </span>
                      <span className="font-bold text-amber-800 text-sm">
                        {isSimulatedOffline ? t('offline_banner_simulated') : t('sync_status_offline')}
                      </span>
                    </>
                  )}
                </div>
              </div>
              <div className={`p-2.5 rounded-xl ${isOnline ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                {isOnline ? <Wifi className="w-5 h-5" /> : <WifiOff className="w-5 h-5" />}
              </div>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between">
              <div className="space-y-1">
                <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Pending Actions</div>
                <div className="flex items-center gap-2">
                  <span className={`text-base font-extrabold ${pendingQueueCount > 0 ? 'text-amber-700' : 'text-emerald-700'}`}>
                    {pendingQueueCount} items
                  </span>
                  {pendingQueueCount === 0 && (
                    <span className="text-xs text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full font-medium">
                      All Synced
                    </span>
                  )}
                </div>
              </div>
              <div className={`p-2.5 rounded-xl ${pendingQueueCount > 0 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                {pendingQueueCount > 0 ? <Clock className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
              </div>
            </div>
          </div>

          {/* Sync Stats & Last Sync timestamp */}
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-100 text-xs text-emerald-950 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>
                <strong>{t('sync_last_synced', { time: formatTime(lastSyncedAt) })}</strong>
              </span>
            </div>
            {syncedThisSession > 0 && (
              <span className="bg-emerald-200/70 text-emerald-900 font-semibold px-2 py-0.5 rounded-md">
                +{syncedThisSession} synced this session
              </span>
            )}
          </div>

          {/* Feedback banner */}
          {syncFeedback && (
            <div
              className={`p-3.5 rounded-xl text-xs flex items-center gap-2.5 border ${
                syncFeedback.success
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-red-50 border-red-200 text-red-900'
              }`}
            >
              {syncFeedback.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
              )}
              <span>{syncFeedback.message}</span>
            </div>
          )}

          {/* Testing Toggle: Simulate Offline Mode */}
          <div className={`p-4 rounded-xl border transition-all ${
            isSimulatedOffline
              ? 'bg-amber-50 border-amber-300 ring-2 ring-amber-400/30'
              : 'bg-slate-100 border-slate-200'
          } flex flex-col sm:flex-row sm:items-center justify-between gap-3`}>
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-slate-800">{t('sync_simulate_offline_toggle')}</span>
                {isSimulatedOffline && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-amber-200 text-amber-900 border border-amber-300">
                    Active
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500">
                Simulate zero-connectivity environment for testing offline forms, offline photo caching, and sync queue.
              </p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              {isSimulatedOffline && (
                <button
                  type="button"
                  onClick={toggleSimulateOffline}
                  className="px-3 py-1 rounded-lg text-xs font-bold bg-emerald-700 hover:bg-emerald-600 text-white shadow-xs transition cursor-pointer"
                >
                  Go Online Now
                </button>
              )}
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={isSimulatedOffline}
                  onChange={toggleSimulateOffline}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-300 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"></div>
              </label>
            </div>
          </div>

          {/* Pending Queue List */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Layers className="w-4 h-4 text-emerald-700" />
                {t('sync_queue_title')}
              </h3>
              {pendingQueueCount > 0 && (
                <button
                  onClick={handleClear}
                  className="text-xs text-red-600 hover:text-red-700 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Clear Queue
                </button>
              )}
            </div>

            {pendingItems.length === 0 ? (
              <div className="p-6 rounded-xl border border-dashed border-slate-200 text-center text-slate-500 text-xs">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
                <p className="font-semibold text-slate-700">{t('sync_status_synced')}</p>
                <p className="mt-0.5">{t('sync_queue_empty')}</p>
              </div>
            ) : (
              <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 max-h-48 overflow-y-auto">
                {pendingItems.map(item => (
                  <div key={item.id} className="p-3 text-xs flex items-center justify-between bg-white hover:bg-slate-50">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600">
                        {item.entity === 'swine' && <ShieldCheck className="w-4 h-4 text-emerald-600" />}
                        {item.entity === 'certificate' && <FileSpreadsheet className="w-4 h-4 text-blue-600" />}
                        {item.entity === 'media' && <ImageIcon className="w-4 h-4 text-purple-600" />}
                        {item.entity !== 'swine' && item.entity !== 'certificate' && item.entity !== 'media' && (
                          <Database className="w-4 h-4 text-slate-600" />
                        )}
                      </div>
                      <div>
                        <div className="font-bold text-slate-800 capitalize">
                          {item.operation} {item.entity}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          ID: {item.entityId} • {new Date(item.createdAt).toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {item.status === 'FAILED' ? (
                        <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-bold text-[10px]">
                          Retry ({item.retryCount})
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-bold text-[10px]">
                          Pending
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 p-4 border-t border-slate-200 flex items-center justify-between gap-3">
          <div className="text-xs text-slate-500 hidden sm:block">
            IndexedDB v2 + Cloud SQL Resilient Engine
          </div>
          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-200 transition cursor-pointer"
            >
              Close
            </button>
            <button
              onClick={handleManualSync}
              disabled={isSyncing || !isOnline}
              className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-600 active:bg-emerald-800 shadow-sm flex items-center gap-2 transition disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing ? t('sync_syncing') : t('sync_now')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
