/**
 * Database Helper Functions
 *
 * Common database operations and queries
 */

import { createClient } from '@/lib/supabase/client';
import type {
  UserProfile,
  Program,
  Workout,
  Exercise,
  WorkoutSession,
  Set,
  Achievement,
  BodyMeasurement,
  UserStats,
} from './types';

/**
 * User Profile Operations
 */
export const userProfile = {
  /**
   * Get user profile by ID
   */
  async get(userId: string): Promise<UserProfile | null> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }

    return data;
  },

  /**
   * Update user profile
   */
  async update(userId: string, updates: Partial<UserProfile>) {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }

    return data;
  },
};

/**
 * Program Operations
 */
export const programs = {
  /**
   * Get all programs for a user
   */
  async list(userId: string): Promise<Program[]> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('programs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching programs:', error);
      return [];
    }

    return data || [];
  },

  /**
   * Get active program for a user
   */
  async getActive(userId: string): Promise<Program | null> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('programs')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .single();

    if (error) {
      console.error('Error fetching active program:', error);
      return null;
    }

    return data;
  },

  /**
   * Create a new program
   */
  async create(userId: string, program: Omit<Program, 'id' | 'user_id' | 'created_at' | 'updated_at'>) {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('programs')
      .insert({ ...program, user_id: userId })
      .select()
      .single();

    if (error) {
      console.error('Error creating program:', error);
      throw error;
    }

    return data;
  },
};

/**
 * Workout Operations
 */
export const workouts = {
  /**
   * Get all workouts for a program
   */
  async list(programId: string): Promise<Workout[]> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('workouts')
      .select('*')
      .eq('program_id', programId)
      .order('order_index', { ascending: true });

    if (error) {
      console.error('Error fetching workouts:', error);
      return [];
    }

    return data || [];
  },

  /**
   * Get workout with exercises
   */
  async getWithExercises(workoutId: string) {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('workouts')
      .select('*, exercises(*)')
      .eq('id', workoutId)
      .single();

    if (error) {
      console.error('Error fetching workout with exercises:', error);
      return null;
    }

    return data;
  },
};

/**
 * Workout Session Operations
 */
export const sessions = {
  /**
   * Get recent workout sessions
   */
  async list(userId: string, limit = 10): Promise<WorkoutSession[]> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('workout_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('started_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching workout sessions:', error);
      return [];
    }

    return data || [];
  },

  /**
   * Get active workout session
   */
  async getActive(userId: string): Promise<WorkoutSession | null> {
    const supabase = createClient();
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
      return null;
    }

    return data;
  },

  /**
   * Create a new workout session
   */
  async create(userId: string, workoutId: string, programId?: string) {
    const supabase = createClient();
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
      console.error('Error creating workout session:', error);
      throw error;
    }

    return data;
  },

  /**
   * Complete a workout session
   */
  async complete(sessionId: string) {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('workout_sessions')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
      })
      .eq('id', sessionId)
      .select()
      .single();

    if (error) {
      console.error('Error completing workout session:', error);
      throw error;
    }

    return data;
  },
};

/**
 * Set Operations
 */
export const sets = {
  /**
   * Get all sets for a session
   */
  async list(sessionId: string): Promise<Set[]> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('sets')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching sets:', error);
      return [];
    }

    return data || [];
  },

  /**
   * Create a new set
   */
  async create(sessionId: string, setData: Omit<Set, 'id' | 'session_id' | 'created_at' | 'updated_at'>) {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('sets')
      .insert({ ...setData, session_id: sessionId })
      .select()
      .single();

    if (error) {
      console.error('Error creating set:', error);
      throw error;
    }

    return data;
  },
};

/**
 * Achievement Operations
 */
export const achievements = {
  /**
   * Get all achievements for a user
   */
  async list(userId: string): Promise<Achievement[]> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('user_achievements')
      .select('*')
      .eq('user_id', userId)
      .order('date_earned', { ascending: false });

    if (error) {
      console.error('Error fetching achievements:', error);
      return [];
    }

    return data || [];
  },
};

/**
 * Body Measurement Operations
 */
export const measurements = {
  /**
   * Get recent body measurements
   */
  async list(userId: string, limit = 30): Promise<BodyMeasurement[]> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('body_measurements')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching body measurements:', error);
      return [];
    }

    return data || [];
  },

  /**
   * Create a new body measurement
   */
  async create(userId: string, measurement: Omit<BodyMeasurement, 'id' | 'user_id' | 'created_at' | 'updated_at'>) {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('body_measurements')
      .insert({ ...measurement, user_id: userId })
      .select()
      .single();

    if (error) {
      console.error('Error creating body measurement:', error);
      throw error;
    }

    return data;
  },
};
