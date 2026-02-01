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
  goals: string[]; // Fitness goals (strength, hypertrophy, endurance)
  days_per_week: number | null;
  is_template: boolean; // Pre-built template program
  template_category: string | null; // Category (push-pull-legs, full-body, etc.)
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
  workout_type: 'strength' | 'hypertrophy' | 'mixed' | 'deload'; // A day (strength) vs B day (hypertrophy)
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
 * Warm-up Set Configuration
 */
export interface WarmupSet {
  sets: number;
  reps: number;
  intensity: number; // Percentage of working weight
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
  intensity_percentage: number | null; // % of 1RM (e.g., 85.00)
  warmup_protocol: WarmupSet[]; // Structured warm-up sets
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

// ============================================================================
// Intelligent Progression System Types
// ============================================================================

/**
 * Progression History
 * Tracks weight progression over time for each exercise
 */
export interface ProgressionHistory {
  id: string; // UUID
  user_id: string; // UUID reference to users
  exercise_library_id: string; // UUID reference to exercise_library
  session_id: string | null; // UUID reference to workout_sessions
  previous_weight_kg: number | null;
  new_weight_kg: number;
  weight_change_kg: number; // Can be negative for deloads
  progression_reason: 'hit_top_range' | 'consistency' | 'deload' | 'fatigue' | 'form_breakdown' | 'manual';
  notes: string | null;
  created_at: string; // ISO timestamp
}

/**
 * Deload Schedule
 * Manages deload week scheduling and tracking
 */
export interface DeloadSchedule {
  id: string; // UUID
  user_id: string; // UUID reference to users
  program_id: string | null; // UUID reference to programs
  scheduled_week_start: string; // ISO date string
  scheduled_week_end: string; // ISO date string
  status: 'upcoming' | 'notified' | 'active' | 'completed' | 'skipped';
  volume_reduction_percent: number; // 20-60%
  trigger_reason: 'scheduled' | 'high_rpe' | 'fatigue' | 'manual';
  notified_at: string | null; // ISO timestamp
  started_at: string | null; // ISO timestamp
  completed_at: string | null; // ISO timestamp
  notes: string | null;
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
}

/**
 * Periodization Phase
 * Defines training mesocycles with specific parameters
 */
export interface PeriodizationPhase {
  id: string; // UUID
  program_id: string; // UUID reference to programs
  phase_type: 'hypertrophy' | 'strength' | 'peak' | 'deload';
  phase_order: number; // 1, 2, 3, etc.
  start_week: number;
  end_week: number;
  target_rep_min: number;
  target_rep_max: number;
  intensity_percent_min: number; // % of 1RM
  intensity_percent_max: number; // % of 1RM
  target_sets_per_exercise: number;
  rest_seconds_compounds: number;
  rest_seconds_accessories: number;
  description: string | null;
  is_active: boolean;
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
}

/**
 * Performance Prediction
 * Stores 1RM predictions and milestone forecasts
 */
export interface PerformancePrediction {
  id: string; // UUID
  user_id: string; // UUID reference to users
  exercise_library_id: string; // UUID reference to exercise_library
  predicted_1rm_kg: number;
  confidence_score: number; // 0.0 to 1.0
  based_on_sessions: number; // Number of recent sessions used
  prediction_method: 'epley' | 'brzycki' | 'lombardi' | 'weighted_average';
  created_at: string; // ISO timestamp
  valid_until: string; // ISO timestamp - predictions expire
}

/**
 * Milestone Tracking
 * Tracks user-defined weight milestones and predicted achievement dates
 */
export interface MilestoneTracking {
  id: string; // UUID
  user_id: string; // UUID reference to users
  exercise_library_id: string; // UUID reference to exercise_library
  target_weight_kg: number;
  target_reps: number;
  current_estimated_1rm_kg: number | null;
  predicted_achievement_date: string | null; // ISO date string
  weeks_to_achievement: number | null;
  achievement_probability: number | null; // 0.0 to 1.0
  status: 'in_progress' | 'achieved' | 'abandoned';
  achieved_at: string | null; // ISO timestamp
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
}

/**
 * RPE Weekly Average
 * Aggregate RPE data for auto-regulation
 */
export interface RpeWeeklyAverage {
  id: string; // UUID
  user_id: string; // UUID reference to users
  week_start_date: string; // ISO date string
  week_end_date: string; // ISO date string
  average_rpe: number;
  sessions_count: number;
  sets_count: number;
  auto_regulation_recommendation: 'maintain' | 'increase_weight' | 'deload_suggested' | 'take_rest' | null;
  created_at: string; // ISO timestamp
}

// ============================================================================
// Progression System Extended Types
// ============================================================================

/**
 * Progression Insight
 * Motivational insights based on progression data
 */
export interface ProgressionInsight {
  type: 'weight_gain' | 'strength_increase' | 'milestone_upcoming' | 'pr_potential' | 'consistency';
  exercise_name: string;
  exercise_id: string;
  message: string;
  prediction?: {
    weight_kg?: number;
    timeframe?: string;
    confidence?: number;
  };
  action?: string;
}

/**
 * Auto Regulation Recommendation
 * Recommendations based on RPE tracking
 */
export interface AutoRegulationRecommendation {
  exercise_id: string;
  exercise_name: string;
  current_average_rpe: number;
  recommendation: 'maintain' | 'increase_weight' | 'deload_suggested' | 'take_rest';
  suggested_weight_change_kg?: number;
  reasoning: string;
}

/**
 * Strength Curve Data
 * Data point for strength progression visualization
 */
export interface StrengthCurvePoint {
  date: string; // ISO date string
  estimated_1rm_kg: number;
  actual_weight_kg?: number;
  reps?: number;
  confidence?: number;
}

/**
 * Milestone with Exercise Info
 * Extended milestone with exercise details
 */
export interface MilestoneWithExercise extends MilestoneTracking {
  exercise?: ExerciseLibrary;
}

/**
 * Deload with Program Info
 * Extended deload schedule with program details
 */
export interface DeloadWithProgram extends DeloadSchedule {
  program?: Program;
}

/**
 * Periodization Phase with Program
 * Extended phase with program details
 */
export interface PeriodizationPhaseWithProgram extends PeriodizationPhase {
  program?: Program;
}

// ============================================================================
// Progression System Insert/Update Types
// ============================================================================

export type ProgressionHistoryInsert = Omit<ProgressionHistory, 'id' | 'created_at'>;
export type DeloadScheduleInsert = Omit<DeloadSchedule, 'id' | 'created_at' | 'updated_at'>;
export type PeriodizationPhaseInsert = Omit<PeriodizationPhase, 'id' | 'created_at' | 'updated_at'>;
export type PerformancePredictionInsert = Omit<PerformancePrediction, 'id' | 'created_at'>;
export type MilestoneTrackingInsert = Omit<MilestoneTracking, 'id' | 'created_at' | 'updated_at'>;
export type RpeWeeklyAverageInsert = Omit<RpeWeeklyAverage, 'id' | 'created_at'>;

export type DeloadScheduleUpdate = Partial<Omit<DeloadSchedule, 'id' | 'user_id' | 'created_at' | 'updated_at'>>;
export type PeriodizationPhaseUpdate = Partial<Omit<PeriodizationPhase, 'id' | 'program_id' | 'created_at' | 'updated_at'>>;
export type MilestoneTrackingUpdate = Partial<Omit<MilestoneTracking, 'id' | 'user_id' | 'exercise_library_id' | 'created_at' | 'updated_at'>>;

// ============================================================================
// Periodization Generator Types
// ============================================================================

/**
 * Periodization Template Input
 * Configuration for generating periodization phases
 */
export interface PeriodizationConfig {
  program_length_weeks: 4 | 8 | 12 | 16;
  program_type?: 'strength' | 'hypertrophy' | 'powerlifting' | 'general';
  include_deload?: boolean;
  custom_phases?: Partial<PeriodizationPhase>[];
}

/**
 * Generated Periodization Plan
 * Output from periodization generator
 */
export interface GeneratedPeriodizationPlan {
  total_weeks: number;
  phases: PeriodizationPhaseInsert[];
  description: string;
  recommended_for: string[];
}

// ============================================================================
// NUTRITION TRACKING SYSTEM
// ============================================================================

/**
 * Nutrition Goals
 * User's nutrition targets and macro calculations
 */
export interface NutritionGoal {
  id: string; // UUID
  user_id: string; // UUID reference to users

  // Goal settings
  goal_type: 'cut' | 'maintain' | 'bulk';
  activity_level: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';

  // User stats for calculation
  current_weight_kg: number;
  target_weight_kg: number | null;
  height_cm: number;
  age: number;
  gender: 'male' | 'female' | 'other';

  // Calculated targets
  daily_calories: number;
  daily_protein_g: number;
  daily_carbs_g: number;
  daily_fats_g: number;
  daily_water_ml: number;

  // Tracking settings
  is_active: boolean;
  auto_adjust: boolean;

  // Metadata
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
}

/**
 * Food Database
 * Local food database for quick search and logging
 */
export interface Food {
  id: string; // UUID

  // Food identification
  name: string;
  brand: string | null;
  barcode: string | null;

  // Nutritional info per 100g/100ml
  calories_per_100g: number;
  protein_per_100g: number;
  carbs_per_100g: number;
  fats_per_100g: number;
  fiber_per_100g: number;
  sugar_per_100g: number;
  sodium_mg_per_100g: number;

  // Serving info
  default_serving_size_g: number;
  serving_unit: string; // g, ml, cup, tbsp, etc.

  // Categorization
  category: string | null; // protein, carb, fat, vegetable, fruit, snack, beverage
  tags: string[]; // vegan, high-protein, low-carb, etc.

  // Source tracking
  source: string; // user, openfoodfacts, usda, custom
  user_id: string | null; // NULL for global foods
  is_verified: boolean;

  // Metadata
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
}

/**
 * Meal Log
 * Daily meal logging
 */
export interface MealLog {
  id: string; // UUID
  user_id: string; // UUID reference to users

  // Meal info
  date: string; // ISO date string
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'pre_workout' | 'post_workout';
  meal_name: string | null;

  // Time tracking
  logged_at: string; // ISO timestamp

  // Quick totals (denormalized)
  total_calories: number;
  total_protein: number;
  total_carbs: number;
  total_fats: number;

  // Metadata
  notes: string | null;
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
}

/**
 * Meal Log Item
 * Individual food item within a meal
 */
export interface MealLogItem {
  id: string; // UUID
  meal_log_id: string; // UUID reference to meal_logs
  food_id: string; // UUID reference to foods

  // Serving info
  serving_size_g: number;
  servings: number; // Multiplier: 1.5 servings, 2 servings, etc.

  // Calculated macros (for this specific serving)
  calories: number;
  protein: number;
  carbs: number;
  fats: number;

  // Metadata
  created_at: string; // ISO timestamp
}

/**
 * Meal Template
 * Saved meal templates for quick logging
 */
export interface MealTemplate {
  id: string; // UUID
  user_id: string; // UUID reference to users

  // Template info
  name: string;
  description: string | null;
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'pre_workout' | 'post_workout' | null;

  // Quick totals
  total_calories: number;
  total_protein: number;
  total_carbs: number;
  total_fats: number;

  // Usage tracking
  use_count: number;
  last_used_at: string | null; // ISO timestamp

  // Metadata
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
}

/**
 * Meal Template Item
 * Foods within a meal template
 */
export interface MealTemplateItem {
  id: string; // UUID
  template_id: string; // UUID reference to meal_templates
  food_id: string; // UUID reference to foods

  // Serving info
  serving_size_g: number;
  servings: number;

  // Order for display
  order_index: number;

  // Metadata
  created_at: string; // ISO timestamp
}

/**
 * Water Log
 * Daily water intake tracking
 */
export interface WaterLog {
  id: string; // UUID
  user_id: string; // UUID reference to users

  // Tracking
  date: string; // ISO date string
  amount_ml: number;

  // Metadata
  logged_at: string; // ISO timestamp
}

/**
 * Daily Nutrition Summary
 * Aggregated daily stats for performance
 */
export interface DailyNutritionSummary {
  id: string; // UUID
  user_id: string; // UUID reference to users
  date: string; // ISO date string

  // Totals
  total_calories: number;
  total_protein: number;
  total_carbs: number;
  total_fats: number;
  total_water_ml: number;

  // Goals (snapshot for historical accuracy)
  goal_calories: number | null;
  goal_protein: number | null;
  goal_carbs: number | null;
  goal_fats: number | null;
  goal_water_ml: number | null;

  // Compliance
  hit_protein_target: boolean;
  hit_calorie_target: boolean;
  hit_water_target: boolean;

  // Meal breakdown
  meals_logged: number;

  // Metadata
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
}

/**
 * Recent Food
 * Track recently used foods for quick-add
 */
export interface RecentFood {
  id: string; // UUID
  user_id: string; // UUID reference to users
  food_id: string; // UUID reference to foods

  // Usage tracking
  last_used_at: string; // ISO timestamp
  use_count: number;
}

/**
 * Nutrition Achievement
 * Nutrition-specific milestones
 */
export interface NutritionAchievement {
  id: string; // UUID

  // Achievement info
  title: string;
  description: string;
  icon: string;
  category: string;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum' | 'legendary';

  // Unlock criteria
  requirement_type: string; // protein_streak, calorie_accuracy, water_streak, etc.
  requirement_value: number;

  // Rewards
  xp_reward: number;

  // Visibility
  is_secret: boolean;

  created_at: string; // ISO timestamp
}

/**
 * User Nutrition Achievement Progress
 * User progress towards nutrition achievements
 */
export interface UserNutritionAchievementProgress {
  id: string; // UUID
  user_id: string; // UUID reference to users
  achievement_id: string; // UUID reference to nutrition_achievements

  // Progress tracking
  current_progress: number;
  is_unlocked: boolean;
  unlocked_at: string | null; // ISO timestamp

  // Metadata
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
}

// ============================================================================
// Nutrition Extended Types
// ============================================================================

/**
 * Meal Log with Items
 * Extended meal log with food items
 */
export interface MealLogWithItems extends MealLog {
  items?: MealLogItemWithFood[];
}

/**
 * Meal Log Item with Food
 * Extended meal log item with food details
 */
export interface MealLogItemWithFood extends MealLogItem {
  food?: Food;
}

/**
 * Meal Template with Items
 * Extended meal template with food items
 */
export interface MealTemplateWithItems extends MealTemplate {
  items?: MealTemplateItemWithFood[];
}

/**
 * Meal Template Item with Food
 * Extended meal template item with food details
 */
export interface MealTemplateItemWithFood extends MealTemplateItem {
  food?: Food;
}

/**
 * Daily Nutrition with Goal
 * Extended daily summary with active nutrition goal
 */
export interface DailyNutritionWithGoal extends DailyNutritionSummary {
  goal?: NutritionGoal;
}

/**
 * Recent Food with Details
 * Extended recent food with food details
 */
export interface RecentFoodWithDetails extends RecentFood {
  food?: Food;
}

/**
 * Nutrition Achievement with Progress
 * Extended achievement with user progress
 */
export interface NutritionAchievementWithProgress extends NutritionAchievement {
  progress?: UserNutritionAchievementProgress;
}

// ============================================================================
// Nutrition Insert/Update Types
// ============================================================================

export type NutritionGoalInsert = Omit<NutritionGoal, 'id' | 'created_at' | 'updated_at'>;
export type NutritionGoalUpdate = Partial<Omit<NutritionGoal, 'id' | 'user_id' | 'created_at' | 'updated_at'>>;

export type FoodInsert = Omit<Food, 'id' | 'created_at' | 'updated_at'>;
export type FoodUpdate = Partial<Omit<Food, 'id' | 'user_id' | 'created_at' | 'updated_at'>>;

export type MealLogInsert = Omit<MealLog, 'id' | 'logged_at' | 'created_at' | 'updated_at'>;
export type MealLogUpdate = Partial<Omit<MealLog, 'id' | 'user_id' | 'created_at' | 'updated_at'>>;

export type MealLogItemInsert = Omit<MealLogItem, 'id' | 'created_at'>;

export type MealTemplateInsert = Omit<MealTemplate, 'id' | 'use_count' | 'last_used_at' | 'created_at' | 'updated_at'>;
export type MealTemplateUpdate = Partial<Omit<MealTemplate, 'id' | 'user_id' | 'created_at' | 'updated_at'>>;

export type MealTemplateItemInsert = Omit<MealTemplateItem, 'id' | 'created_at'>;

export type WaterLogInsert = Omit<WaterLog, 'id' | 'logged_at'>;

export type DailyNutritionSummaryInsert = Omit<DailyNutritionSummary, 'id' | 'created_at' | 'updated_at'>;

// ============================================================================
// Nutrition Analytics Types
// ============================================================================

/**
 * Macro Progress
 * Current progress towards macro targets
 */
export interface MacroProgress {
  protein: {
    current: number;
    target: number;
    percentage: number;
    remaining: number;
  };
  carbs: {
    current: number;
    target: number;
    percentage: number;
    remaining: number;
  };
  fats: {
    current: number;
    target: number;
    percentage: number;
    remaining: number;
  };
  calories: {
    current: number;
    target: number;
    percentage: number;
    remaining: number;
  };
}

/**
 * Weekly Nutrition Stats
 * Aggregated nutrition stats for a week
 */
export interface WeeklyNutritionStats {
  week_start: string; // ISO date
  week_end: string; // ISO date
  average_calories: number;
  average_protein: number;
  average_carbs: number;
  average_fats: number;
  average_water_ml: number;
  days_logged: number;
  days_hit_protein: number;
  days_hit_calories: number;
  days_hit_water: number;
  compliance_score: number; // 0-100
}

/**
 * Weight Correlation Data Point
 * Data point for weight vs calories correlation
 */
export interface WeightCorrelationPoint {
  date: string; // ISO date
  weight_kg: number;
  calories: number;
  trend: 'gaining' | 'losing' | 'maintaining';
}

/**
 * Weight Trend Analysis
 * Analysis of weight trends and calorie intake
 */
export interface WeightTrendAnalysis {
  current_trend: 'gaining' | 'losing' | 'maintaining';
  weekly_change_kg: number;
  average_daily_calories: number;
  goal_alignment: 'on_track' | 'too_fast' | 'too_slow';
  suggested_adjustment: number; // Calorie adjustment
  message: string;
}

/**
 * Macro Calculator Input
 * Input for calculating macro targets
 */
export interface MacroCalculatorInput {
  weight_kg: number;
  height_cm: number;
  age: number;
  gender: 'male' | 'female' | 'other';
  activity_level: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
  goal_type: 'cut' | 'maintain' | 'bulk';
}

/**
 * Macro Calculator Result
 * Calculated macro targets
 */
export interface MacroCalculatorResult {
  bmr: number; // Basal Metabolic Rate
  tdee: number; // Total Daily Energy Expenditure
  daily_calories: number;
  daily_protein_g: number;
  daily_carbs_g: number;
  daily_fats_g: number;
  daily_water_ml: number;
  protein_per_kg: number;
  explanation: string;
}

// ============================================================================
// EXERCISE SWAP AND CUSTOMIZATION SYSTEM
// ============================================================================

/**
 * Movement Pattern Type
 * Classification of exercise movement patterns for intelligent substitution
 */
export type MovementPatternType =
  | 'horizontal_push'  // Bench Press, Push-ups, Dips
  | 'vertical_push'    // OHP, Arnold Press
  | 'horizontal_pull'  // Rows, Face Pulls
  | 'vertical_pull'    // Pull-ups, Lat Pulldown
  | 'squat_pattern'    // Back Squat, Front Squat, Leg Press
  | 'hinge_pattern'    // Deadlift, RDL, Good Morning
  | 'lunge_pattern'    // Lunges, Split Squats, Step-ups
  | 'isolation_upper'  // Curls, Extensions, Raises
  | 'isolation_lower'  // Leg Curls, Extensions, Calf Raises
  | 'core_rotation'    // Russian Twists, Pallof Press
  | 'core_stability'   // Planks, Dead Bugs
  | 'core_flexion'     // Crunches, Leg Raises
  | 'carry'            // Farmer's Walk, Suitcase Carry
  | 'explosive'        // Box Jumps, Medicine Ball Slams
  | 'olympic';         // Clean and Press, Thrusters

/**
 * Exercise Library with Movement Pattern
 * Extended exercise library with movement pattern classification
 */
export interface ExerciseLibraryWithMovementPattern extends ExerciseLibrary {
  movement_pattern: MovementPatternType | null;
}

/**
 * Equipment Profile
 * User's available equipment for filtering exercise substitutions
 */
export interface EquipmentProfile {
  id: string; // UUID
  user_id: string; // UUID reference to users
  profile_name: string;
  available_equipment: string[]; // e.g., ['barbell', 'dumbbells', 'bench']
  is_active: boolean;
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
}

/**
 * Exercise Note
 * Per-exercise notes that carry over across all instances
 */
export interface ExerciseNote {
  id: string; // UUID
  user_id: string; // UUID reference to users
  exercise_library_id: string; // UUID reference to exercise_library
  note_text: string;
  is_pinned: boolean;
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
}

/**
 * Custom Workout Template
 * Saved custom workout templates created by users
 */
export interface CustomWorkoutTemplate {
  id: string; // UUID
  user_id: string; // UUID reference to users
  name: string;
  description: string | null;
  template_data: WorkoutTemplateData;
  is_public: boolean;
  use_count: number;
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
}

/**
 * Workout Template Data
 * Structure for custom workout template
 */
export interface WorkoutTemplateData {
  exercises: WorkoutTemplateExercise[];
  total_estimated_duration_minutes?: number;
  difficulty_level?: 'beginner' | 'intermediate' | 'advanced';
  target_muscle_groups?: string[];
}

/**
 * Workout Template Exercise
 * Exercise definition within a template
 */
export interface WorkoutTemplateExercise {
  exercise_library_id: string;
  exercise_name: string;
  order_index: number;
  target_sets: number;
  target_reps: number;
  rest_seconds: number;
  notes?: string;
}

/**
 * Exercise Swap History
 * Track exercise swaps for analytics and suggestions
 */
export interface ExerciseSwapHistory {
  id: string; // UUID
  user_id: string; // UUID reference to users
  workout_id: string | null; // UUID reference to workouts
  original_exercise_id: string | null; // UUID reference to exercise_library
  swapped_exercise_id: string; // UUID reference to exercise_library
  reason: string | null; // Why the swap was made
  created_at: string; // ISO timestamp
}

/**
 * Exercise Alternative
 * Suggested alternative exercise with compatibility score
 */
export interface ExerciseAlternative {
  exercise_id: string;
  exercise_name: string;
  primary_muscle_group: string;
  movement_pattern: MovementPatternType | null;
  equipment_needed: string[];
  difficulty_level: 'beginner' | 'intermediate' | 'advanced';
  is_compound: boolean;
  compatibility_score: number; // 0-100
  swap_suggestion?: SwapSuggestion;
}

/**
 * Swap Suggestion
 * Smart suggestion when swapping exercises
 */
export interface SwapSuggestion {
  type: 'weight_adjustment' | 'add_exercise' | 'volume_adjustment' | 'none';
  message: string;
  weight_multiplier?: number; // e.g., 1.3 for leg press (30% more than squat)
  suggested_exercises?: string[]; // Additional exercises to add
  volume_adjustment?: {
    sets_delta: number;
    reps_delta: number;
  };
}

/**
 * Exercise Note with Exercise
 * Extended exercise note with exercise details
 */
export interface ExerciseNoteWithExercise extends ExerciseNote {
  exercise?: ExerciseLibraryWithMovementPattern;
}

/**
 * Custom Workout Template with Details
 * Extended template with usage stats
 */
export interface CustomWorkoutTemplateWithDetails extends CustomWorkoutTemplate {
  total_exercises: number;
  estimated_duration_minutes: number;
}

// ============================================================================
// Exercise Swap Insert/Update Types
// ============================================================================

export type EquipmentProfileInsert = Omit<EquipmentProfile, 'id' | 'created_at' | 'updated_at'>;
export type EquipmentProfileUpdate = Partial<Omit<EquipmentProfile, 'id' | 'user_id' | 'created_at' | 'updated_at'>>;

export type ExerciseNoteInsert = Omit<ExerciseNote, 'id' | 'created_at' | 'updated_at'>;
export type ExerciseNoteUpdate = Partial<Omit<ExerciseNote, 'id' | 'user_id' | 'exercise_library_id' | 'created_at' | 'updated_at'>>;

export type CustomWorkoutTemplateInsert = Omit<CustomWorkoutTemplate, 'id' | 'use_count' | 'created_at' | 'updated_at'>;
export type CustomWorkoutTemplateUpdate = Partial<Omit<CustomWorkoutTemplate, 'id' | 'user_id' | 'created_at' | 'updated_at'>>;

export type ExerciseSwapHistoryInsert = Omit<ExerciseSwapHistory, 'id' | 'created_at'>;

// ============================================================================
// Exercise Swap Utility Types
// ============================================================================

/**
 * Exercise Swap Filter
 * Criteria for filtering exercise alternatives
 */
export interface ExerciseSwapFilter {
  same_movement_pattern?: boolean;
  same_muscle_group?: boolean;
  same_difficulty?: boolean;
  available_equipment_only?: boolean;
  compound_only?: boolean;
  max_results?: number;
}

/**
 * Exercise Swap Request
 * Request to find alternative exercises
 */
export interface ExerciseSwapRequest {
  exercise_id: string;
  user_id?: string;
  filter?: ExerciseSwapFilter;
}

/**
 * Exercise Swap Response
 * Response with alternative exercises
 */
export interface ExerciseSwapResponse {
  original_exercise: ExerciseLibraryWithMovementPattern;
  alternatives: ExerciseAlternative[];
  user_equipment_profile?: EquipmentProfile;
}

// ============================================================================
// NOTIFICATION SYSTEM
// ============================================================================

/**
 * Notification Type
 * All possible notification types
 */
export type NotificationType =
  | 'workout_reminder'
  | 'rest_day_reminder'
  | 'deload_week_alert'
  | 'streak_milestone'
  | 'achievement_unlocked'
  | 'friend_activity'
  | 'weekly_summary'
  | 'friend_request'
  | 'friend_accepted'
  | 'post_like'
  | 'post_comment'
  | 'partner_request'
  | 'workout_invite'
  | 'challenge_complete';

/**
 * Notification Delivery Method
 * How a notification should be delivered
 */
export type NotificationDeliveryMethod = 'push' | 'email' | 'sms' | 'in_app';

/**
 * Notification Preferences
 * User preferences for notification settings
 */
export interface NotificationPreferences {
  id: string; // UUID
  user_id: string; // UUID reference to users

  // Enable/disable each notification type
  workout_reminder_enabled: boolean;
  rest_day_reminder_enabled: boolean;
  deload_week_alert_enabled: boolean;
  streak_milestone_enabled: boolean;
  achievement_unlocked_enabled: boolean;
  friend_activity_enabled: boolean;
  weekly_summary_enabled: boolean;

  // Delivery methods
  push_notifications_enabled: boolean;
  email_notifications_enabled: boolean;
  sms_notifications_enabled: boolean;

  // Quiet hours (24-hour format)
  quiet_hours_start: number; // 0-23
  quiet_hours_end: number; // 0-23

  // Reminder timing
  reminder_minutes_before: number;

  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
}

/**
 * Notification
 * Individual notification record
 */
export interface Notification {
  id: string; // UUID
  user_id: string; // UUID reference to users

  // Notification details
  type: NotificationType;
  title: string;
  message: string;
  link: string | null; // Deep link to relevant page

  // Metadata
  metadata: Record<string, any> | null; // Additional data specific to notification type

  // Status
  read: boolean;
  sent: boolean;
  sent_at: string | null; // ISO timestamp
  delivery_method: NotificationDeliveryMethod | null;

  // Scheduling
  scheduled_for: string | null; // ISO timestamp

  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
}

/**
 * User Activity Pattern
 * Learn and store user's typical workout patterns for smart timing
 */
export interface UserActivityPattern {
  id: string; // UUID
  user_id: string; // UUID reference to users

  // Day of week (0 = Sunday, 6 = Saturday)
  day_of_week: number; // 0-6

  // Typical workout time (24-hour format)
  typical_hour: number | null; // 0-23

  // Frequency (how often they work out on this day/time)
  frequency_count: number;

  // Last workout at this time
  last_workout_at: string | null; // ISO timestamp

  // Confidence score (0-100, higher = more consistent)
  confidence_score: number; // 0-100

  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
}

/**
 * Weekly Summary Data
 * Data for weekly summary notification/email
 */
export interface WeeklySummaryData {
  user_id: string;
  week_start: string; // ISO date
  week_end: string; // ISO date

  // Workout stats
  workouts_completed: number;
  total_volume_kg: number;
  total_duration_minutes: number;

  // Progress
  personal_records: PersonalRecord[];
  new_achievements: Achievement[];

  // Streak
  current_streak_days: number;

  // Next week preview
  scheduled_deload: boolean;
  upcoming_milestones: MilestoneWithExercise[];

  // Motivational message
  motivational_message: string;
}

/**
 * Notification Template
 * Template for generating notifications
 */
export interface NotificationTemplate {
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  metadata?: Record<string, any>;
}

/**
 * Notification Schedule Request
 * Request to schedule a notification
 */
export interface NotificationScheduleRequest {
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  metadata?: Record<string, any>;
  scheduled_for?: string; // ISO timestamp
  delivery_method?: NotificationDeliveryMethod;
}

/**
 * Smart Timing Result
 * Result from smart timing calculation
 */
export interface SmartTimingResult {
  should_send: boolean;
  scheduled_time: string | null; // ISO timestamp
  reason: string;
  confidence: number; // 0-100
  pattern_used: UserActivityPattern | null;
}

/**
 * Notification with User Info
 * Extended notification with user details
 */
export interface NotificationWithUser extends Notification {
  user?: UserProfile;
}

// ============================================================================
// Notification Insert/Update Types
// ============================================================================

export type NotificationPreferencesInsert = Omit<NotificationPreferences, 'id' | 'created_at' | 'updated_at'>;
export type NotificationPreferencesUpdate = Partial<Omit<NotificationPreferences, 'id' | 'user_id' | 'created_at' | 'updated_at'>>;

export type NotificationInsert = Omit<Notification, 'id' | 'created_at' | 'updated_at'>;
export type NotificationUpdate = Partial<Omit<Notification, 'id' | 'user_id' | 'created_at' | 'updated_at'>>;

export type UserActivityPatternInsert = Omit<UserActivityPattern, 'id' | 'created_at' | 'updated_at'>;
export type UserActivityPatternUpdate = Partial<Omit<UserActivityPattern, 'id' | 'user_id' | 'created_at' | 'updated_at'>>;

// ============================================================================
// Notification Analytics Types
// ============================================================================

/**
 * Notification Analytics
 * Analytics for notification engagement
 */
export interface NotificationAnalytics {
  total_sent: number;
  total_read: number;
  read_rate: number; // Percentage
  by_type: {
    [key in NotificationType]?: {
      sent: number;
      read: number;
      read_rate: number;
    };
  };
  by_delivery_method: {
    [key in NotificationDeliveryMethod]?: {
      sent: number;
      read: number;
      read_rate: number;
    };
  };
}
