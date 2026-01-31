/**
 * useWorkoutSession Hook
 *
 * Custom hook for managing active workout sessions
 */

'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { WorkoutSession, Set } from '@/lib/types';

export function useWorkoutSession(userId: string | undefined) {
  const [session, setSession] = useState<WorkoutSession | null>(null);
  const [sets, setSets] = useState<Set[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  // Fetch active session
  const fetchActiveSession = async () => {
    if (!userId) return;

    setLoading(true);
    const { data, error } = await supabase
      .from('workout_sessions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'in_progress')
      .order('started_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching active session:', error);
    }

    setSession(data);
    setLoading(false);

    // If session exists, fetch sets
    if (data) {
      fetchSets(data.id);
    }
  };

  // Fetch sets for session
  const fetchSets = async (sessionId: string) => {
    const { data, error } = await supabase
      .from('sets')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching sets:', error);
      return;
    }

    setSets(data || []);
  };

  // Start new session
  const startSession = async (workoutId: string, programId?: string) => {
    if (!userId) return null;

    const { data, error } = await supabase
      .from('workout_sessions')
      .insert({
        user_id: userId,
        workout_id: workoutId,
        program_id: programId,
        status: 'in_progress',
      })
      .select()
      .single();

    if (error) {
      console.error('Error starting session:', error);
      throw error;
    }

    setSession(data);
    setSets([]);
    return data;
  };

  // Add set to session
  const addSet = async (setData: Omit<Set, 'id' | 'session_id' | 'created_at' | 'updated_at'>) => {
    if (!session) return null;

    const { data, error } = await supabase
      .from('sets')
      .insert({ ...setData, session_id: session.id })
      .select()
      .single();

    if (error) {
      console.error('Error adding set:', error);
      throw error;
    }

    setSets([...sets, data]);
    return data;
  };

  // Complete session
  const completeSession = async () => {
    if (!session) return;

    const { data, error } = await supabase
      .from('workout_sessions')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
      })
      .eq('id', session.id)
      .select()
      .single();

    if (error) {
      console.error('Error completing session:', error);
      throw error;
    }

    setSession(null);
    setSets([]);
    return data;
  };

  // Cancel session
  const cancelSession = async () => {
    if (!session) return;

    const { data, error } = await supabase
      .from('workout_sessions')
      .update({
        status: 'cancelled',
      })
      .eq('id', session.id)
      .select()
      .single();

    if (error) {
      console.error('Error cancelling session:', error);
      throw error;
    }

    setSession(null);
    setSets([]);
    return data;
  };

  useEffect(() => {
    fetchActiveSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  return {
    session,
    sets,
    loading,
    startSession,
    addSet,
    completeSession,
    cancelSession,
    refreshSession: fetchActiveSession,
  };
}
