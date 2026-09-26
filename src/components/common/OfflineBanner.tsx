import React, { useState } from 'react';
import { Wifi, WifiOff, RefreshCw, CheckCircle, Database, Settings } from 'lucide-react';
import { useOfflineStatus } from '../../hooks/useOfflineStatus';
import { useLanguage } from '../../context/LanguageContext';
import { SyncCenterModal } from './SyncCenterModal';

interface OfflineBannerProps {
  onSyncComplete?: () => void;
}

export const OfflineBanner: React.FC<OfflineBannerProps> = ({ onSyncComplete }) => {
  const { isOnline, isSimulatedOffline, pendingQueueCount, forceSync, toggleSimulateOffline } = useOfflineStatus();
  const { t } = useLanguage();
  const [syncing, setSyncing] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState<string | null>(null);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);

  const handleSync = async () => {
    setSyncing(true);
    try {
      const res = await forceSync();
      if (res.success) {
        setSyncSuccess(`Synchronized ${res.syncedCount} offline records successfully!`);
        if (onSyncComplete) onSyncComplete();
        setTimeout(() => setSyncSuccess(null), 3500);
      }
    } catch {
      // Ignored, state handles feedback
    } finally {
      setSyncing(false);
    }
  };

  if (isOnline && pendingQueueCount === 0 && !syncSuccess) {
    return (
      <>
        <SyncCenterModal
          isOpen={isSyncModalOpen}
          onClose={() => setIsSyncModalOpen(false)}
          onSyncComplete={onSyncComplete}
        />
      </>
    );
  }

  return (
    <>
      <div className="bg-gradient-to-r from-amber-700 via-amber-800 to-emerald-900 text-white px-4 py-2.5 text-xs sm:text-sm shadow-md flex flex-wrap items-center justify-between gap-2 border-b border-amber-500/30 z-30 relative">
        <div className="flex items-center gap-2.5 font-medium">
          {!isOnline ? (
            <>
              <span className="relative flex h-2.5 w-2.5 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-200 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white"></span>
              </span>
              <WifiOff className="w-4 h-4 text-amber-200 shrink-0" />
              <span>
                <strong>{t('offline_banner_active')}</strong>{' '}
                {isSimulatedOffline ? t('offline_banner_simulated') : t('offline_banner_no_internet')} — {t('offline_banner_desc')}
              </span>
            </>
          ) : (
            <>
              <Wifi className="w-4 h-4 text-emerald-300 shrink-0" />
              <span>
                {t('offline_banner_back_online', { count: pendingQueueCount })}
              </span>
            </>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {isSimulatedOffline && (
            <button
              type="button"
              onClick={toggleSimulateOffline}
              className="bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-bold px-2.5 py-1 rounded-md text-xs flex items-center gap-1.5 transition shadow-sm border border-emerald-400/40 cursor-pointer animate-pulse"
              title="Exit simulated offline test mode and resume live database connections"
            >
              <Wifi className="w-3.5 h-3.5" />
              <span>Go Online (End Simulation)</span>
            </button>
          )}

          {pendingQueueCount > 0 && (
            <button
              onClick={() => setIsSyncModalOpen(true)}
              className="bg-amber-950/70 text-amber-200 hover:bg-amber-900 px-2.5 py-1 rounded-md text-xs font-mono flex items-center gap-1.5 border border-amber-400/40 transition cursor-pointer"
            >
              <Database className="w-3.5 h-3.5" />
              <span>{pendingQueueCount} pending</span>
            </button>
          )}

          {isOnline && pendingQueueCount > 0 && (
            <button
              onClick={handleSync}
              disabled={syncing}
              className="bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-semibold px-3 py-1 rounded-md text-xs flex items-center gap-1.5 transition shadow-sm cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
              <span>{syncing ? t('sync_syncing') : t('sync_now')}</span>
            </button>
          )}

          <button
            onClick={() => setIsSyncModalOpen(true)}
            title="Open Sync Settings"
            className="p-1 text-amber-200 hover:text-white rounded-md hover:bg-white/10 transition cursor-pointer"
          >
            <Settings className="w-4 h-4" />
          </button>

          {syncSuccess && (
            <span className="bg-emerald-900/90 text-emerald-100 px-2.5 py-1 rounded-md text-xs flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-300" />
              <span>{syncSuccess}</span>
            </span>
          )}
        </div>
      </div>

      <SyncCenterModal
        isOpen={isSyncModalOpen}
        onClose={() => setIsSyncModalOpen(false)}
        onSyncComplete={onSyncComplete}
      />
    </>
  );
};
