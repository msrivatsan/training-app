/**
 * OfflineIndicator Component
 *
 * Shows connection status and pending sync count in header
 */

'use client';

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WifiOff, Wifi, RefreshCw, Cloud, CloudOff } from 'lucide-react';
import { useOfflineStore } from '@/lib/offlineStore';
import { syncManager } from '@/lib/syncManager';

export default function OfflineIndicator() {
  const {
    isOnline,
    isSyncing,
    getPendingSyncCount,
    lastSyncTime,
  } = useOfflineStore();

  const pendingCount = getPendingSyncCount();

  useEffect(() => {
    // Start auto-sync when component mounts
    syncManager.startAutoSync(30000); // Every 30 seconds

    return () => {
      syncManager.stopAutoSync();
    };
  }, []);

  const handleManualSync = async () => {
    await syncManager.syncAll();
  };

  const getTimeSinceLastSync = (): string => {
    if (!lastSyncTime) return 'Never';

    const now = new Date();
    const lastSync = new Date(lastSyncTime);
    const diffMs = now.getTime() - lastSync.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins === 1) return '1 min ago';
    if (diffMins < 60) return `${diffMins} mins ago`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours === 1) return '1 hour ago';
    if (diffHours < 24) return `${diffHours} hours ago`;

    return new Date(lastSyncTime).toLocaleDateString();
  };

  return (
    <AnimatePresence>
      {/* Offline Banner */}
      {!isOnline && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-orange-500 to-red-500 text-white px-4 py-3 shadow-lg"
        >
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <WifiOff className="w-5 h-5 animate-pulse" />
              <div>
                <p className="font-bold text-sm">You're Offline</p>
                <p className="text-xs opacity-90">
                  Your workout data is being saved locally and will sync when connection is restored
                </p>
              </div>
            </div>
            {pendingCount > 0 && (
              <div className="bg-white/20 px-3 py-1 rounded-full backdrop-blur-sm">
                <p className="text-xs font-semibold">
                  {pendingCount} item{pendingCount !== 1 ? 's' : ''} pending
                </p>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Online with Pending Sync Indicator */}
      {isOnline && pendingCount > 0 && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          className="fixed top-4 right-4 z-50"
        >
          <button
            onClick={handleManualSync}
            disabled={isSyncing}
            className={`flex items-center gap-2 px-4 py-2 rounded-full shadow-lg transition-all ${
              isSyncing
                ? 'bg-blue-500 text-white cursor-wait'
                : 'bg-yellow-500 hover:bg-yellow-600 text-white hover:scale-105'
            }`}
          >
            {isSyncing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span className="text-sm font-semibold">Syncing...</span>
              </>
            ) : (
              <>
                <CloudOff className="w-4 h-4" />
                <span className="text-sm font-semibold">
                  {pendingCount} unsaved
                </span>
              </>
            )}
          </button>
        </motion.div>
      )}

      {/* Sync Success Indicator */}
      {isOnline && pendingCount === 0 && lastSyncTime && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          className="fixed top-4 right-4 z-40"
        >
          <div className="flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-200 rounded-full shadow-sm">
            <Cloud className="w-4 h-4 text-green-600" />
            <span className="text-xs font-medium text-green-700">
              Synced {getTimeSinceLastSync()}
            </span>
          </div>
        </motion.div>
      )}

      {/* Syncing Indicator (floating) */}
      <AnimatePresence>
        {isSyncing && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50"
          >
            <div className="flex items-center gap-3 px-5 py-3 bg-blue-600 text-white rounded-full shadow-lg">
              <RefreshCw className="w-5 h-5 animate-spin" />
              <div>
                <p className="font-semibold text-sm">Syncing your workout data...</p>
                <p className="text-xs opacity-90">{pendingCount} items remaining</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </AnimatePresence>
  );
}
