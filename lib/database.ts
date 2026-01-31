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
  ExerciseLibrary,
  ExerciseAnalytics,
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
 * Exercise Library Operations
 */
export const exerciseLibrary = {
  /**
   * Get all exercises from library
   */
  async list(): Promise<ExerciseLibrary[]> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('exercise_library')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching exercise library:', error);
      return [];
    }

    return data || [];
  },

  /**
   * Search exercises by name, muscle group, or equipment
   */
  async search(query: string): Promise<ExerciseLibrary[]> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('exercise_library')
      .select('*')
      .or(`name.ilike.%${query}%,primary_muscle_group.ilike.%${query}%`)
      .order('name', { ascending: true });

    if (error) {
      console.error('Error searching exercise library:', error);
      return [];
    }

    return data || [];
  },

  /**
   * Filter exercises by criteria
   */
  async filter(filters: {
    muscle_group?: string;
    equipment?: string;
    difficulty?: 'beginner' | 'intermediate' | 'advanced';
    is_compound?: boolean;
    is_priority?: boolean;
  }): Promise<ExerciseLibrary[]> {
    const supabase = createClient();
    let query = supabase.from('exercise_library').select('*');

    if (filters.muscle_group) {
      query = query.or(`primary_muscle_group.eq.${filters.muscle_group},secondary_muscle_groups.cs.{${filters.muscle_group}}`);
    }

    if (filters.equipment) {
      query = query.contains('equipment_needed', [filters.equipment]);
    }

    if (filters.difficulty) {
      query = query.eq('difficulty_level', filters.difficulty);
    }

    if (filters.is_compound !== undefined) {
      query = query.eq('is_compound', filters.is_compound);
    }

    if (filters.is_priority !== undefined) {
      query = query.eq('is_priority', filters.is_priority);
    }

    query = query.order('name', { ascending: true });

    const { data, error } = await query;

    if (error) {
      console.error('Error filtering exercise library:', error);
      return [];
    }

    return data || [];
  },

  /**
   * Get exercise by ID
   */
  async getById(exerciseId: string): Promise<ExerciseLibrary | null> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('exercise_library')
      .select('*')
      .eq('id', exerciseId)
      .single();

    if (error) {
      console.error('Error fetching exercise:', error);
      return null;
    }

    return data;
  },

  /**
   * Get analytics for an exercise
   */
  async getAnalytics(exerciseId: string, userId: string): Promise<ExerciseAnalytics | null> {
    const supabase = createClient();

    // Get all sets for this exercise by the user
    const { data: setsData, error: setsError } = await supabase
      .from('sets')
      .select(`
        *,
        session:workout_sessions!inner(user_id, started_at, status),
        exercise:exercises!inner(exercise_library_id, name)
      `)
      .eq('session.user_id', userId)
      .eq('session.status', 'completed')
      .eq('exercise.exercise_library_id', exerciseId)
      .order('session.started_at', { ascending: false });

    if (setsError) {
      console.error('Error fetching exercise analytics:', setsError);
      return null;
    }

    if (!setsData || setsData.length === 0) {
      return null;
    }

    // Calculate analytics
    const totalSets = setsData.length;
    const totalVolume = setsData.reduce((sum, set) => sum + (set.reps * set.weight_kg), 0);
    const sessions = new Set(setsData.map((set: any) => set.session_id)).size;
    const averageVolume = sessions > 0 ? totalVolume / sessions : 0;

    // Find personal record (highest weight × reps)
    let personalRecord = null;
    let maxScore = 0;
    for (const set of setsData) {
      const score = set.weight_kg * set.reps;
      if (score > maxScore) {
        maxScore = score;
        personalRecord = {
          exercise_id: exerciseId,
          exercise_name: (set as any).exercise.name,
          weight_kg: set.weight_kg,
          reps: set.reps,
          date: (set as any).session.started_at,
          one_rep_max: set.weight_kg * (1 + set.reps / 30), // Epley formula
        };
      }
    }

    // Calculate frequency (sessions per week)
    const firstSession = new Date(setsData[setsData.length - 1]?.session?.started_at || Date.now());
    const lastSession = new Date(setsData[0]?.session?.started_at || Date.now());
    const weeksBetween = Math.max(1, (lastSession.getTime() - firstSession.getTime()) / (7 * 24 * 60 * 60 * 1000));
    const frequencyPerWeek = sessions / weeksBetween;

    // Build volume history (last 10 sessions)
    const volumeHistory: { date: string; volume_kg: number; sets: number }[] = [];
    const sessionMap = new Map();

    for (const set of setsData) {
      const sessionId = set.session_id;
      const sessionDate = (set as any).session.started_at;

      if (!sessionMap.has(sessionId)) {
        sessionMap.set(sessionId, {
          date: sessionDate,
          volume_kg: 0,
          sets: 0,
        });
      }

      const sessionData = sessionMap.get(sessionId);
      sessionData.volume_kg += set.reps * set.weight_kg;
      sessionData.sets += 1;
    }

    Array.from(sessionMap.values())
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 10)
      .forEach(session => volumeHistory.push(session));

    return {
      exercise_id: exerciseId,
      exercise_name: (setsData[0] as any).exercise.name,
      total_sessions: sessions,
      total_volume_kg: totalVolume,
      average_volume_kg: averageVolume,
      total_sets: totalSets,
      personal_record: personalRecord,
      last_performed: setsData[0]?.session?.started_at || null,
      frequency_per_week: frequencyPerWeek,
      volume_history: volumeHistory,
    };
  },

  /**
   * Get priority exercises (big 4 lifts)
   */
  async getPriority(): Promise<ExerciseLibrary[]> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('exercise_library')
      .select('*')
      .eq('is_priority', true)
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching priority exercises:', error);
      return [];
    }

    return data || [];
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
