/**
 * Iron Quest - Type Definitions
 *
 * This file contains all TypeScript interfaces and types used throughout the app.
 * These types align with the Supabase database schema.
 */

// ============================================================================
// Database Table Types
// ============================================================================

/**
 * User Profile
 * Extends Supabase auth.users with additional profile information
 */
export interface UserProfile {
  id: string; // UUID from auth.users
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  date_of_birth: string | null; // ISO date string
  gender: 'male' | 'female' | 'other' | null;
  height_cm: number | null;
  weight_kg: number | null;
  fitness_level: 'beginner' | 'intermediate' | 'advanced' | null;
  goals: string[] | null;
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
}

/**
 * Workout Program
 * A structured training program with multiple workouts
 */
export interface Program {
  id: string; // UUID
  user_id: string; // UUID reference to users
  name: string;
  description: string | null;
  duration_weeks: number | null;
  difficulty_level: 'beginner' | 'intermediate' | 'advanced';
  is_active: boolean;
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
}

/**
 * Workout
 * Individual workout within a program
 */
export interface Workout {
  id: string; // UUID
  program_id: string; // UUID reference to programs
  name: string;
  description: string | null;
  day_of_week: number | null; // 0-6 (Sunday-Saturday)
  order_index: number; // Order within program
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
}

/**
 * Exercise Library
 * Master library of all available exercises (global, not user-specific)
 */
export interface ExerciseLibrary {
  id: string; // UUID
  name: string;
  description: string | null;
  primary_muscle_group: string;
  secondary_muscle_groups: string[];
  equipment_needed: string[];
  difficulty_level: 'beginner' | 'intermediate' | 'advanced';
  video_url: string | null;
  is_compound: boolean;
  is_priority: boolean;
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
}

/**
 * Exercise
 * Exercise definition with metadata (user-specific instances)
 */
export interface Exercise {
  id: string; // UUID
  workout_id: string; // UUID reference to workouts
  exercise_library_id: string | null; // UUID reference to exercise_library
  name: string;
  description: string | null;
  muscle_groups: string[]; // e.g., ['chest', 'triceps']
  equipment: string[]; // e.g., ['barbell', 'bench']
  video_url: string | null;
  image_url: string | null;
  order_index: number; // Order within workout
  target_sets: number | null;
  target_reps: number | null;
  target_weight_kg: number | null;
  rest_seconds: number | null;
  notes: string | null;
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
}

/**
 * Workout Session
 * Instance of a workout being performed
 */
export interface WorkoutSession {
  id: string; // UUID
  user_id: string; // UUID reference to users
  workout_id: string; // UUID reference to workouts
  program_id: string | null; // UUID reference to programs
  started_at: string; // ISO timestamp
  completed_at: string | null; // ISO timestamp
  duration_minutes: number | null;
  total_volume_kg: number | null; // Total weight lifted
  notes: string | null;
  status: 'in_progress' | 'completed' | 'cancelled';
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
}

/**
 * Set
 * Individual set data within a workout session
 */
export interface Set {
  id: string; // UUID
  session_id: string; // UUID reference to workout_sessions
  exercise_id: string; // UUID reference to exercises
  set_number: number; // 1-indexed
  reps: number;
  weight_kg: number;
  rpe: number | null; // Rate of Perceived Exertion (1-10)
  rest_seconds: number | null;
  notes: string | null;
  is_warmup: boolean;
  is_drop_set: boolean;
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
}

/**
 * Achievement
 * User achievements and milestones
 */
export interface Achievement {
  id: string; // UUID
  user_id: string; // UUID reference to users
  title: string;
  description: string;
  icon: string | null; // Icon identifier
  category: 'strength' | 'endurance' | 'consistency' | 'milestone';
  date_earned: string; // ISO timestamp
  created_at: string; // ISO timestamp
}

/**
 * Body Measurement
 * Track body measurements over time
 */
export interface BodyMeasurement {
  id: string; // UUID
  user_id: string; // UUID reference to users
  date: string; // ISO date string
  weight_kg: number | null;
  body_fat_percentage: number | null;
  muscle_mass_kg: number | null;
  chest_cm: number | null;
  waist_cm: number | null;
  hips_cm: number | null;
  bicep_left_cm: number | null;
  bicep_right_cm: number | null;
  thigh_left_cm: number | null;
  thigh_right_cm: number | null;
  notes: string | null;
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
}

// ============================================================================
// User Statistics Types
// ============================================================================

/**
 * User Stats
 * Aggregated statistics for user progress
 */
export interface UserStats {
  total_workouts: number;
  total_volume_kg: number;
  total_duration_minutes: number;
  current_streak_days: number;
  longest_streak_days: number;
  favorite_exercise: string | null;
  strongest_muscle_group: string | null;
  personal_records: PersonalRecord[];
  weekly_summary: WeeklySummary;
  monthly_summary: MonthlySummary;
}

/**
 * Personal Record
 * Track personal bests for exercises
 */
export interface PersonalRecord {
  exercise_id: string;
  exercise_name: string;
  weight_kg: number;
  reps: number;
  date: string; // ISO date string
  one_rep_max: number; // Calculated 1RM
}

/**
 * Weekly Summary
 * Statistics for the current week
 */
export interface WeeklySummary {
  week_start: string; // ISO date string
  week_end: string; // ISO date string
  workouts_completed: number;
  total_volume_kg: number;
  total_duration_minutes: number;
  average_duration_minutes: number;
  exercises_performed: number;
}

/**
 * Monthly Summary
 * Statistics for the current month
 */
export interface MonthlySummary {
  month: string; // e.g., '2024-01'
  workouts_completed: number;
  total_volume_kg: number;
  total_duration_minutes: number;
  average_duration_minutes: number;
  days_active: number;
  consistency_percentage: number;
}

// ============================================================================
// UI and Form Types
// ============================================================================

/**
 * Workout Session with Related Data
 * Extended workout session with joined data for UI display
 */
export interface WorkoutSessionWithDetails extends WorkoutSession {
  workout?: Workout;
  program?: Program;
  sets?: SetWithExercise[];
}

/**
 * Set with Exercise Data
 * Extended set with joined exercise data
 */
export interface SetWithExercise extends Set {
  exercise?: Exercise;
}

/**
 * Workout with Exercises
 * Extended workout with exercises for planning
 */
export interface WorkoutWithExercises extends Workout {
  exercises?: Exercise[];
}

/**
 * Program with Workouts
 * Extended program with workouts for overview
 */
export interface ProgramWithWorkouts extends Program {
  workouts?: WorkoutWithExercises[];
}

/**
 * Form Data Types
 */
export interface WorkoutFormData {
  name: string;
  description?: string;
  exercises: ExerciseFormData[];
}

export interface ExerciseFormData {
  name: string;
  description?: string;
  muscle_groups: string[];
  equipment: string[];
  target_sets?: number;
  target_reps?: number;
  target_weight_kg?: number;
  rest_seconds?: number;
  notes?: string;
}

export interface SetFormData {
  exercise_id: string;
  set_number: number;
  reps: number;
  weight_kg: number;
  rpe?: number;
  rest_seconds?: number;
  notes?: string;
  is_warmup: boolean;
  is_drop_set: boolean;
}

// ============================================================================
// Chart and Analytics Types
// ============================================================================

/**
 * Chart Data Point
 * Generic data point for charts
 */
export interface ChartDataPoint {
  date: string;
  value: number;
  label?: string;
}

/**
 * Volume Over Time
 * Track training volume progression
 */
export interface VolumeOverTime {
  date: string;
  total_volume_kg: number;
  workout_count: number;
}

/**
 * Exercise Progress
 * Track progress for a specific exercise
 */
export interface ExerciseProgress {
  exercise_id: string;
  exercise_name: string;
  data_points: {
    date: string;
    weight_kg: number;
    reps: number;
    volume_kg: number;
    estimated_1rm: number;
  }[];
}

/**
 * Muscle Group Volume
 * Volume distribution by muscle group
 */
export interface MuscleGroupVolume {
  muscle_group: string;
  total_volume_kg: number;
  workout_count: number;
  percentage: number;
}

/**
 * Exercise Analytics
 * Analytics for a specific exercise from the library
 */
export interface ExerciseAnalytics {
  exercise_id: string;
  exercise_name: string;
  total_sessions: number; // How many times performed
  total_volume_kg: number; // Total volume across all sessions
  average_volume_kg: number; // Average volume per session
  total_sets: number;
  personal_record: PersonalRecord | null;
  last_performed: string | null; // ISO date string
  frequency_per_week: number;
  volume_history: {
    date: string;
    volume_kg: number;
    sets: number;
  }[];
}

/**
 * Exercise Library with Analytics
 * Exercise library entry with usage analytics
 */
export interface ExerciseLibraryWithAnalytics extends ExerciseLibrary {
  analytics?: ExerciseAnalytics;
}

// ============================================================================
// API Response Types
// ============================================================================

/**
 * Standard API Response
 */
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

/**
 * Paginated Response
 */
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

// ============================================================================
// Utility Types
// ============================================================================

/**
 * Database Insert Types
 * Omit auto-generated fields for inserts
 */
export type UserProfileInsert = Omit<UserProfile, 'id' | 'created_at' | 'updated_at'>;
export type ProgramInsert = Omit<Program, 'id' | 'created_at' | 'updated_at'>;
export type WorkoutInsert = Omit<Workout, 'id' | 'created_at' | 'updated_at'>;
export type ExerciseLibraryInsert = Omit<ExerciseLibrary, 'id' | 'created_at' | 'updated_at'>;
export type ExerciseInsert = Omit<Exercise, 'id' | 'created_at' | 'updated_at'>;
export type WorkoutSessionInsert = Omit<WorkoutSession, 'id' | 'created_at' | 'updated_at'>;
export type SetInsert = Omit<Set, 'id' | 'created_at' | 'updated_at'>;
export type AchievementInsert = Omit<Achievement, 'id' | 'created_at'>;
export type BodyMeasurementInsert = Omit<BodyMeasurement, 'id' | 'created_at' | 'updated_at'>;

/**
 * Database Update Types
 * Partial types for updates
 */
export type UserProfileUpdate = Partial<Omit<UserProfile, 'id' | 'created_at' | 'updated_at'>>;
export type ProgramUpdate = Partial<Omit<Program, 'id' | 'user_id' | 'created_at' | 'updated_at'>>;
export type WorkoutUpdate = Partial<Omit<Workout, 'id' | 'program_id' | 'created_at' | 'updated_at'>>;
export type ExerciseUpdate = Partial<Omit<Exercise, 'id' | 'workout_id' | 'created_at' | 'updated_at'>>;
export type WorkoutSessionUpdate = Partial<Omit<WorkoutSession, 'id' | 'created_at' | 'updated_at'>>;
export type SetUpdate = Partial<Omit<Set, 'id' | 'session_id' | 'created_at' | 'updated_at'>>;
export type BodyMeasurementUpdate = Partial<Omit<BodyMeasurement, 'id' | 'user_id' | 'created_at' | 'updated_at'>>;
