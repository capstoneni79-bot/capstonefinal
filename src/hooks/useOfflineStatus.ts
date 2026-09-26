import { useOffline, OfflineContextValue } from '../context/OfflineContext';

/**
 * Global hook to access reactive offline & synchronization status
 */
export function useOfflineStatus(): OfflineContextValue {
  return useOffline();
}

export type { OfflineContextValue };
