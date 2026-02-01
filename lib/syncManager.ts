/**
 * Sync Manager
 *
 * Handles synchronization of offline data to Supabase when connection is restored
 */

import { createBrowserClient } from '@supabase/ssr';
import { useOfflineStore } from './offlineStore';

export class SyncManager {
  private static instance: SyncManager;
  private supabase: ReturnType<typeof createBrowserClient>;
  private syncInterval: NodeJS.Timeout | null = null;

  private constructor() {
    this.supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }

  static getInstance(): SyncManager {
    if (!SyncManager.instance) {
      SyncManager.instance = new SyncManager();
    }
    return SyncManager.instance;
  }

  /**
   * Start automatic sync polling
   */
  startAutoSync(intervalMs: number = 30000) {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    this.syncInterval = setInterval(() => {
      this.syncAll();
    }, intervalMs);

    // Also sync immediately
    this.syncAll();
  }

  /**
   * Stop automatic sync
   */
  stopAutoSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  /**
   * Sync all pending data
   */
  async syncAll(): Promise<{ success: boolean; error?: string }> {
    const store = useOfflineStore.getState();

    // Only sync if online and not already syncing
    if (!store.isOnline || store.isSyncing) {
      return { success: false, error: 'Offline or already syncing' };
    }

    const pendingCount = store.getPendingSyncCount();
    if (pendingCount === 0) {
      return { success: true };
    }

    store.startSync();

    try {
      // Sync sessions first
      await this.syncSessions();

      // Then sync sets
      await this.syncSets();

      // Clean up synced data
      store.clearSyncedData();

      // Update last sync time
      store.setLastSyncTime(new Date().toISOString());

      return { success: true };
    } catch (error) {
      console.error('Sync failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    } finally {
      store.endSync();
    }
  }

  /**
   * Sync pending sessions
   */
  private async syncSessions(): Promise<void> {
    const store = useOfflineStore.getState();
    const pendingSessions = store.pendingSessions.filter((s) => !s.synced);

    for (const session of pendingSessions) {
      try {
        const { id, synced, ...sessionData } = session;

        // Check if session already exists
        const { data: existing } = await this.supabase
          .from('workout_sessions')
          .select('id')
          .eq('id', id)
          .single();

        if (existing) {
          // Update existing session
          await this.supabase
            .from('workout_sessions')
            .update(sessionData)
            .eq('id', id);
        } else {
          // Insert new session
          await this.supabase
            .from('workout_sessions')
            .insert({ id, ...sessionData });
        }

        store.markSessionAsSynced(id);
      } catch (error) {
        console.error(`Failed to sync session ${session.id}:`, error);
        // Continue with other sessions
      }
    }
  }

  /**
   * Sync pending sets
   */
  private async syncSets(): Promise<void> {
    const store = useOfflineStore.getState();
    const pendingSets = store.pendingSets.filter((s) => !s.synced);

    for (const set of pendingSets) {
      try {
        const { id, synced, created_at, ...setData } = set;

        // Check if set already exists
        const { data: existing } = await this.supabase
          .from('sets')
          .select('id')
          .eq('id', id)
          .single();

        if (existing) {
          // Update existing set
          await this.supabase.from('sets').update(setData).eq('id', id);
        } else {
          // Insert new set
          await this.supabase.from('sets').insert({ id, ...setData });
        }

        store.markSetAsSynced(id);
      } catch (error) {
        console.error(`Failed to sync set ${set.id}:`, error);
        // Continue with other sets
      }
    }
  }

  /**
   * Cache workout data for offline use
   */
  async cacheWorkout(workoutId: string): Promise<void> {
    try {
      const { data: workout } = await this.supabase
        .from('workouts')
        .select(
          `
          id,
          name,
          program_id,
          exercises (
            id,
            name,
            target_sets,
            target_reps,
            target_weight_kg,
            rest_seconds,
            warmup_protocol,
            muscle_groups,
            equipment
          )
        `
        )
        .eq('id', workoutId)
        .single();

      if (workout) {
        useOfflineStore.getState().cacheWorkout(workout);
      }
    } catch (error) {
      console.error('Failed to cache workout:', error);
    }
  }
}

// Export singleton instance
export const syncManager = SyncManager.getInstance();
