/**
 * Program Templates
 *
 * Pre-built program templates for Iron Quest
 */

// Program template type definitions and data

interface TemplateExercise {
  name: string;
  sets: number;
  reps: number;
  intensity: number; // % of 1RM
  rest: number; // seconds
  isCompound: boolean;
  isPriority: boolean;
}

interface TemplateWorkout {
  name: string;
  day: number; // 0-6 (Sunday-Saturday)
  type: 'strength' | 'hypertrophy' | 'mixed' | 'deload';
  exercises: TemplateExercise[];
}

interface ProgramTemplate {
  name: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  durationWeeks: number;
  daysPerWeek: number;
  goals: string[];
  category: string;
  workouts: TemplateWorkout[];
}

/**
 * 6-Day Push/Pull/Legs Strength & Hypertrophy Program
 *
 * Schedule: Mon/Tue/Wed/Fri/Sat/Sun (Rest Thursday)
 * A Days (Strength): 80-87% 1RM, 6-8 reps, 3-4min rest
 * B Days (Hypertrophy): 70-80% 1RM, 8-12 reps, 2-3min rest
 */
export const SIX_DAY_PPL: ProgramTemplate = {
  name: '6-Day Push/Pull/Legs Strength & Hypertrophy',
  description: 'Advanced 6-day split combining strength and hypertrophy training with push/pull/legs methodology. Alternates between strength-focused A days (80-87% 1RM) and volume-focused B days (70-80% 1RM). Designed for experienced lifters seeking maximum muscle growth and strength gains.',
  difficulty: 'advanced',
  durationWeeks: 12,
  daysPerWeek: 6,
  goals: ['Strength', 'Hypertrophy', 'Muscle Growth'],
  category: 'push-pull-legs',
  workouts: [
    // MONDAY - Push A (Strength)
    {
      name: 'Push A - Strength',
      day: 1,
      type: 'strength',
      exercises: [
        { name: 'Barbell Bench Press', sets: 4, reps: 6, intensity: 85, rest: 240, isCompound: true, isPriority: true },
        { name: 'Overhead Press (OHP)', sets: 4, reps: 6, intensity: 85, rest: 240, isCompound: true, isPriority: true },
        { name: 'Weighted Dips', sets: 3, reps: 8, intensity: 80, rest: 180, isCompound: true, isPriority: true },
        { name: 'Incline Dumbbell Press', sets: 3, reps: 8, intensity: 80, rest: 180, isCompound: true, isPriority: false },
        { name: 'Lateral Raise', sets: 3, reps: 12, intensity: 70, rest: 120, isCompound: false, isPriority: false },
        { name: 'Tricep Extension', sets: 3, reps: 12, intensity: 70, rest: 120, isCompound: false, isPriority: false },
      ],
    },
    // TUESDAY - Pull A (Strength)
    {
      name: 'Pull A - Strength',
      day: 2,
      type: 'strength',
      exercises: [
        { name: 'Conventional Deadlift', sets: 4, reps: 5, intensity: 87, rest: 240, isCompound: true, isPriority: true },
        { name: 'Weighted Pull-ups', sets: 4, reps: 6, intensity: 85, rest: 240, isCompound: true, isPriority: true },
        { name: 'Barbell Row', sets: 4, reps: 8, intensity: 80, rest: 180, isCompound: true, isPriority: false },
        { name: 'Chest-Supported Dumbbell Row', sets: 3, reps: 8, intensity: 80, rest: 180, isCompound: true, isPriority: false },
        { name: 'Face Pulls', sets: 3, reps: 15, intensity: 70, rest: 120, isCompound: false, isPriority: false },
        { name: 'Incline Dumbbell Curl', sets: 3, reps: 10, intensity: 75, rest: 120, isCompound: false, isPriority: false },
      ],
    },
    // WEDNESDAY - Legs A (Strength)
    {
      name: 'Legs A - Strength',
      day: 3,
      type: 'strength',
      exercises: [
        { name: 'Barbell Squat', sets: 4, reps: 5, intensity: 87, rest: 240, isCompound: true, isPriority: true },
        { name: 'Romanian Deadlift', sets: 4, reps: 6, intensity: 85, rest: 240, isCompound: true, isPriority: true },
        { name: 'Bulgarian Split Squat', sets: 3, reps: 8, intensity: 80, rest: 180, isCompound: true, isPriority: false },
        { name: 'Leg Extension', sets: 3, reps: 12, intensity: 75, rest: 120, isCompound: false, isPriority: false },
        { name: 'Hamstring Curl', sets: 3, reps: 12, intensity: 75, rest: 120, isCompound: false, isPriority: false },
        { name: 'Calf Raise', sets: 4, reps: 15, intensity: 75, rest: 90, isCompound: false, isPriority: false },
      ],
    },
    // FRIDAY - Push B (Hypertrophy)
    {
      name: 'Push B - Hypertrophy',
      day: 5,
      type: 'hypertrophy',
      exercises: [
        { name: 'Incline Barbell Bench Press', sets: 4, reps: 10, intensity: 75, rest: 180, isCompound: true, isPriority: false },
        { name: 'Dumbbell Shoulder Press', sets: 4, reps: 10, intensity: 75, rest: 180, isCompound: true, isPriority: false },
        { name: 'Chest Dips', sets: 3, reps: 12, intensity: 70, rest: 150, isCompound: true, isPriority: false },
        { name: 'Cable Flyes', sets: 3, reps: 12, intensity: 70, rest: 120, isCompound: false, isPriority: false },
        { name: 'Lateral Raise', sets: 4, reps: 15, intensity: 70, rest: 120, isCompound: false, isPriority: false },
        { name: 'Cable Crossover', sets: 3, reps: 12, intensity: 70, rest: 120, isCompound: false, isPriority: false },
        { name: 'Skull Crushers', sets: 3, reps: 12, intensity: 70, rest: 120, isCompound: false, isPriority: false },
      ],
    },
    // SATURDAY - Pull B (Hypertrophy)
    {
      name: 'Pull B - Hypertrophy',
      day: 6,
      type: 'hypertrophy',
      exercises: [
        { name: 'Barbell Row', sets: 4, reps: 10, intensity: 75, rest: 180, isCompound: true, isPriority: false },
        { name: 'Lat Pulldown', sets: 4, reps: 12, intensity: 75, rest: 150, isCompound: true, isPriority: false },
        { name: 'Seated Cable Row', sets: 3, reps: 12, intensity: 75, rest: 150, isCompound: true, isPriority: false },
        { name: 'Single-Arm Dumbbell Row', sets: 3, reps: 12, intensity: 75, rest: 120, isCompound: true, isPriority: false },
        { name: 'Rear Delt Fly', sets: 3, reps: 15, intensity: 70, rest: 120, isCompound: false, isPriority: false },
        { name: 'Hammer Curl', sets: 3, reps: 12, intensity: 75, rest: 120, isCompound: false, isPriority: false },
        { name: 'Cable Curl', sets: 3, reps: 12, intensity: 75, rest: 120, isCompound: false, isPriority: false },
      ],
    },
    // SUNDAY - Legs B (Hypertrophy)
    {
      name: 'Legs B - Hypertrophy',
      day: 0,
      type: 'hypertrophy',
      exercises: [
        { name: 'Front Squat', sets: 4, reps: 10, intensity: 75, rest: 180, isCompound: true, isPriority: false },
        { name: 'Romanian Deadlift', sets: 3, reps: 10, intensity: 75, rest: 180, isCompound: true, isPriority: false },
        { name: 'Walking Lunges', sets: 3, reps: 12, intensity: 70, rest: 150, isCompound: true, isPriority: false },
        { name: 'Leg Extension', sets: 4, reps: 15, intensity: 70, rest: 120, isCompound: false, isPriority: false },
        { name: 'Hamstring Curl', sets: 4, reps: 15, intensity: 70, rest: 120, isCompound: false, isPriority: false },
        { name: 'Hip Thrust', sets: 3, reps: 12, intensity: 75, rest: 120, isCompound: false, isPriority: false },
        { name: 'Calf Raise', sets: 4, reps: 20, intensity: 70, rest: 90, isCompound: false, isPriority: false },
      ],
    },
  ],
};

/**
 * 4-Week Beginner Full Body Program
 */
export const BEGINNER_FULL_BODY: ProgramTemplate = {
  name: '4-Week Beginner Full Body',
  description: 'Perfect starting point for beginners. Train 3x per week with full-body workouts focusing on mastering fundamental movement patterns and building a solid strength foundation.',
  difficulty: 'beginner',
  durationWeeks: 4,
  daysPerWeek: 3,
  goals: ['Strength', 'Learning Proper Form', 'Building Foundation'],
  category: 'full-body',
  workouts: [
    {
      name: 'Full Body A',
      day: 1,
      type: 'mixed',
      exercises: [
        { name: 'Barbell Squat', sets: 3, reps: 10, intensity: 65, rest: 180, isCompound: true, isPriority: true },
        { name: 'Barbell Bench Press', sets: 3, reps: 10, intensity: 65, rest: 180, isCompound: true, isPriority: true },
        { name: 'Lat Pulldown', sets: 3, reps: 10, intensity: 65, rest: 150, isCompound: true, isPriority: false },
        { name: 'Dumbbell Shoulder Press', sets: 3, reps: 10, intensity: 65, rest: 150, isCompound: true, isPriority: false },
        { name: 'Planks', sets: 3, reps: 30, intensity: 0, rest: 90, isCompound: false, isPriority: false },
      ],
    },
    {
      name: 'Full Body B',
      day: 3,
      type: 'mixed',
      exercises: [
        { name: 'Romanian Deadlift', sets: 3, reps: 10, intensity: 65, rest: 180, isCompound: true, isPriority: true },
        { name: 'Incline Dumbbell Press', sets: 3, reps: 10, intensity: 65, rest: 150, isCompound: true, isPriority: false },
        { name: 'Dumbbell Row', sets: 3, reps: 10, intensity: 65, rest: 150, isCompound: true, isPriority: false },
        { name: 'Goblet Squat', sets: 3, reps: 12, intensity: 65, rest: 120, isCompound: true, isPriority: false },
        { name: 'Bicycle Crunches', sets: 3, reps: 15, intensity: 0, rest: 90, isCompound: false, isPriority: false },
      ],
    },
    {
      name: 'Full Body C',
      day: 5,
      type: 'mixed',
      exercises: [
        { name: 'Conventional Deadlift', sets: 3, reps: 8, intensity: 70, rest: 240, isCompound: true, isPriority: true },
        { name: 'Overhead Press (OHP)', sets: 3, reps: 10, intensity: 65, rest: 180, isCompound: true, isPriority: true },
        { name: 'Chin-ups', sets: 3, reps: 8, intensity: 0, rest: 150, isCompound: true, isPriority: false },
        { name: 'Leg Press', sets: 3, reps: 12, intensity: 65, rest: 150, isCompound: true, isPriority: false },
        { name: 'Russian Twist', sets: 3, reps: 20, intensity: 0, rest: 90, isCompound: false, isPriority: false },
      ],
    },
  ],
};

/**
 * 8-Week Upper/Lower Split
 */
export const UPPER_LOWER_SPLIT: ProgramTemplate = {
  name: '8-Week Upper/Lower Split',
  description: 'Intermediate 4-day split alternating between upper and lower body training. Ideal for balanced muscle development and recovery. Great for building strength and size simultaneously.',
  difficulty: 'intermediate',
  durationWeeks: 8,
  daysPerWeek: 4,
  goals: ['Strength', 'Hypertrophy', 'Balanced Development'],
  category: 'upper-lower',
  workouts: [
    {
      name: 'Upper Power',
      day: 1,
      type: 'strength',
      exercises: [
        { name: 'Barbell Bench Press', sets: 4, reps: 5, intensity: 85, rest: 240, isCompound: true, isPriority: true },
        { name: 'Barbell Row', sets: 4, reps: 5, intensity: 85, rest: 240, isCompound: true, isPriority: false },
        { name: 'Overhead Press (OHP)', sets: 3, reps: 6, intensity: 85, rest: 180, isCompound: true, isPriority: true },
        { name: 'Weighted Pull-ups', sets: 3, reps: 6, intensity: 85, rest: 180, isCompound: true, isPriority: true },
        { name: 'Barbell Curl', sets: 3, reps: 8, intensity: 75, rest: 120, isCompound: false, isPriority: false },
        { name: 'Skull Crushers', sets: 3, reps: 8, intensity: 75, rest: 120, isCompound: false, isPriority: false },
      ],
    },
    {
      name: 'Lower Power',
      day: 2,
      type: 'strength',
      exercises: [
        { name: 'Barbell Squat', sets: 4, reps: 5, intensity: 87, rest: 240, isCompound: true, isPriority: true },
        { name: 'Conventional Deadlift', sets: 3, reps: 5, intensity: 87, rest: 240, isCompound: true, isPriority: true },
        { name: 'Front Squat', sets: 3, reps: 6, intensity: 80, rest: 180, isCompound: true, isPriority: false },
        { name: 'Romanian Deadlift', sets: 3, reps: 8, intensity: 80, rest: 180, isCompound: true, isPriority: true },
        { name: 'Calf Raise', sets: 4, reps: 12, intensity: 75, rest: 120, isCompound: false, isPriority: false },
      ],
    },
    {
      name: 'Upper Hypertrophy',
      day: 4,
      type: 'hypertrophy',
      exercises: [
        { name: 'Incline Dumbbell Press', sets: 4, reps: 10, intensity: 75, rest: 150, isCompound: true, isPriority: false },
        { name: 'Seated Cable Row', sets: 4, reps: 10, intensity: 75, rest: 150, isCompound: true, isPriority: false },
        { name: 'Dumbbell Shoulder Press', sets: 3, reps: 12, intensity: 75, rest: 120, isCompound: true, isPriority: false },
        { name: 'Lat Pulldown', sets: 3, reps: 12, intensity: 75, rest: 120, isCompound: true, isPriority: false },
        { name: 'Cable Flyes', sets: 3, reps: 12, intensity: 70, rest: 120, isCompound: false, isPriority: false },
        { name: 'Face Pulls', sets: 3, reps: 15, intensity: 70, rest: 90, isCompound: false, isPriority: false },
        { name: 'Hammer Curl', sets: 3, reps: 12, intensity: 75, rest: 90, isCompound: false, isPriority: false },
        { name: 'Tricep Extension', sets: 3, reps: 12, intensity: 75, rest: 90, isCompound: false, isPriority: false },
      ],
    },
    {
      name: 'Lower Hypertrophy',
      day: 5,
      type: 'hypertrophy',
      exercises: [
        { name: 'Front Squat', sets: 4, reps: 10, intensity: 75, rest: 180, isCompound: true, isPriority: false },
        { name: 'Romanian Deadlift', sets: 4, reps: 10, intensity: 75, rest: 180, isCompound: true, isPriority: true },
        { name: 'Bulgarian Split Squat', sets: 3, reps: 12, intensity: 75, rest: 150, isCompound: true, isPriority: false },
        { name: 'Leg Extension', sets: 3, reps: 15, intensity: 75, rest: 120, isCompound: false, isPriority: false },
        { name: 'Hamstring Curl', sets: 3, reps: 15, intensity: 75, rest: 120, isCompound: false, isPriority: false },
        { name: 'Hip Thrust', sets: 3, reps: 12, intensity: 75, rest: 120, isCompound: false, isPriority: false },
        { name: 'Calf Raise', sets: 4, reps: 20, intensity: 75, rest: 90, isCompound: false, isPriority: false },
      ],
    },
  ],
};

/**
 * 12-Week Powerlifting Peaking Program
 */
export const POWERLIFTING_PEAK: ProgramTemplate = {
  name: '12-Week Powerlifting Peaking',
  description: 'Advanced powerlifting program designed to peak your squat, bench press, and deadlift for competition. Progressively increases intensity while managing volume to maximize 1RM strength.',
  difficulty: 'advanced',
  durationWeeks: 12,
  daysPerWeek: 4,
  goals: ['Maximum Strength', 'Powerlifting', 'Competition Prep'],
  category: 'powerlifting',
  workouts: [
    {
      name: 'Squat Day',
      day: 1,
      type: 'strength',
      exercises: [
        { name: 'Barbell Squat', sets: 5, reps: 3, intensity: 87, rest: 300, isCompound: true, isPriority: true },
        { name: 'Pause Squats', sets: 3, reps: 5, intensity: 80, rest: 240, isCompound: true, isPriority: false },
        { name: 'Front Squat', sets: 3, reps: 6, intensity: 75, rest: 180, isCompound: true, isPriority: false },
        { name: 'Bulgarian Split Squat', sets: 3, reps: 8, intensity: 75, rest: 150, isCompound: true, isPriority: false },
        { name: 'Leg Extension', sets: 3, reps: 12, intensity: 70, rest: 120, isCompound: false, isPriority: false },
      ],
    },
    {
      name: 'Bench Day',
      day: 2,
      type: 'strength',
      exercises: [
        { name: 'Barbell Bench Press', sets: 5, reps: 3, intensity: 87, rest: 300, isCompound: true, isPriority: true },
        { name: 'Close-Grip Bench Press', sets: 4, reps: 5, intensity: 82, rest: 240, isCompound: true, isPriority: false },
        { name: 'Incline Barbell Bench Press', sets: 3, reps: 6, intensity: 80, rest: 180, isCompound: true, isPriority: false },
        { name: 'Overhead Press (OHP)', sets: 3, reps: 6, intensity: 80, rest: 180, isCompound: true, isPriority: true },
        { name: 'Tricep Extension', sets: 3, reps: 10, intensity: 75, rest: 120, isCompound: false, isPriority: false },
      ],
    },
    {
      name: 'Deadlift Day',
      day: 4,
      type: 'strength',
      exercises: [
        { name: 'Conventional Deadlift', sets: 5, reps: 3, intensity: 87, rest: 300, isCompound: true, isPriority: true },
        { name: 'Romanian Deadlift', sets: 4, reps: 6, intensity: 80, rest: 240, isCompound: true, isPriority: true },
        { name: 'Barbell Row', sets: 4, reps: 8, intensity: 80, rest: 180, isCompound: true, isPriority: false },
        { name: 'Weighted Pull-ups', sets: 3, reps: 6, intensity: 85, rest: 180, isCompound: true, isPriority: true },
        { name: 'Shrugs', sets: 3, reps: 12, intensity: 75, rest: 120, isCompound: false, isPriority: false },
      ],
    },
    {
      name: 'Accessory Day',
      day: 5,
      type: 'hypertrophy',
      exercises: [
        { name: 'Pause Squats', sets: 3, reps: 8, intensity: 70, rest: 180, isCompound: true, isPriority: false },
        { name: 'Incline Dumbbell Press', sets: 4, reps: 10, intensity: 75, rest: 150, isCompound: true, isPriority: false },
        { name: 'Seated Cable Row', sets: 4, reps: 10, intensity: 75, rest: 150, isCompound: true, isPriority: false },
        { name: 'Leg Press', sets: 3, reps: 12, intensity: 75, rest: 150, isCompound: true, isPriority: false },
        { name: 'Face Pulls', sets: 4, reps: 15, intensity: 70, rest: 120, isCompound: false, isPriority: false },
        { name: 'Ab Wheel Rollout', sets: 3, reps: 12, intensity: 0, rest: 120, isCompound: false, isPriority: false },
      ],
    },
  ],
};

export const ALL_TEMPLATES = [
  SIX_DAY_PPL,
  BEGINNER_FULL_BODY,
  UPPER_LOWER_SPLIT,
  POWERLIFTING_PEAK,
];
