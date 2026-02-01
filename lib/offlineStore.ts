/**
 * Offline Store - Zustand
 *
 * Manages offline workout state, caching, and synchronization
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface OfflineSet {
  id: string;
  session_id: string;
  exercise_id: string;
  set_number: number;
  weight_kg: number;
  reps: number;
  rpe?: number;
  rest_seconds?: number;
  is_warmup: boolean;
  is_drop_set: boolean;
  notes?: string;
  created_at: string;
  synced: boolean;
}

interface OfflineSession {
  id: string;
  user_id: string;
  workout_id: string;
  program_id?: string;
  started_at: string;
  completed_at?: string;
  duration_minutes?: number;
  total_volume_kg?: number;
  status: 'in_progress' | 'completed' | 'cancelled';
  synced: boolean;
}

interface CachedWorkout {
  id: string;
  program_id?: string;
  name: string;
  exercises: any[];
  cached_at: string;
}

interface OfflineStore {
  isOnline: boolean;
  isSyncing: boolean;
  pendingSets: OfflineSet[];
  pendingSessions: OfflineSession[];
  cachedWorkouts: Record<string, CachedWorkout>;
  lastSyncTime: string | null;

  // Actions
  setOnlineStatus: (online: boolean) => void;
  addPendingSet: (set: Omit<OfflineSet, 'synced' | 'created_at'>) => void;
  addPendingSession: (session: Omit<OfflineSession, 'synced'>) => void;
  cacheWorkout: (workout: Omit<CachedWorkout, 'cached_at'>) => void;
  getCachedWorkout: (workoutId: string) => CachedWorkout | null;
  markSetAsSynced: (setId: string) => void;
  markSessionAsSynced: (sessionId: string) => void;
  clearSyncedData: () => void;
  startSync: () => void;
  endSync: () => void;
  setLastSyncTime: (time: string) => void;
  getPendingSyncCount: () => number;
}

export const useOfflineStore = create<OfflineStore>()(
  persist(
    (set, get) => ({
      isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
      isSyncing: false,
      pendingSets: [],
      pendingSessions: [],
      cachedWorkouts: {},
      lastSyncTime: null,

      setOnlineStatus: (online) => set({ isOnline: online }),

      addPendingSet: (setData) =>
        set((state) => ({
          pendingSets: [
            ...state.pendingSets,
            {
              ...setData,
              created_at: new Date().toISOString(),
              synced: false,
            },
          ],
        })),

      addPendingSession: (sessionData) =>
        set((state) => ({
          pendingSessions: [
            ...state.pendingSessions,
            {
              ...sessionData,
              synced: false,
            },
          ],
        })),

      cacheWorkout: (workout) =>
        set((state) => ({
          cachedWorkouts: {
            ...state.cachedWorkouts,
            [workout.id]: {
              ...workout,
              cached_at: new Date().toISOString(),
            },
          },
        })),

      getCachedWorkout: (workoutId) => {
        const cached = get().cachedWorkouts[workoutId];
        if (!cached) return null;

        // Check if cache is stale (older than 24 hours)
        const cacheAge = Date.now() - new Date(cached.cached_at).getTime();
        const maxAge = 24 * 60 * 60 * 1000; // 24 hours

        if (cacheAge > maxAge) {
          return null;
        }

        return cached;
      },

      markSetAsSynced: (setId) =>
        set((state) => ({
          pendingSets: state.pendingSets.map((s) =>
            s.id === setId ? { ...s, synced: true } : s
          ),
        })),

      markSessionAsSynced: (sessionId) =>
        set((state) => ({
          pendingSessions: state.pendingSessions.map((s) =>
            s.id === sessionId ? { ...s, synced: true } : s
          ),
        })),

      clearSyncedData: () =>
        set((state) => ({
          pendingSets: state.pendingSets.filter((s) => !s.synced),
          pendingSessions: state.pendingSessions.filter((s) => !s.synced),
        })),

      startSync: () => set({ isSyncing: true }),

      endSync: () => set({ isSyncing: false }),

      setLastSyncTime: (time) => set({ lastSyncTime: time }),

      getPendingSyncCount: () => {
        const state = get();
        return (
          state.pendingSets.filter((s) => !s.synced).length +
          state.pendingSessions.filter((s) => !s.synced).length
        );
      },
    }),
    {
      name: 'training-app-offline-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);

// Initialize online/offline event listeners
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    useOfflineStore.getState().setOnlineStatus(true);
  });

  window.addEventListener('offline', () => {
    useOfflineStore.getState().setOnlineStatus(false);
  });
}
