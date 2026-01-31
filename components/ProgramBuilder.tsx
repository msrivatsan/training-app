'use client';

import { useState, useEffect } from 'react';
import {
  Program,
  Workout,
  Exercise,
  ExerciseLibrary as ExerciseLibraryType,
  ProgramInsert,
  WorkoutInsert,
  ExerciseInsert,
} from '@/lib/types';
import { exerciseLibrary as exerciseLibraryDb } from '@/lib/database';
import { createClient } from '@/lib/supabase/client';
import {
  Plus,
  Trash2,
  Save,
  X,
  GripVertical,
  Calendar,
  Target,
  Dumbbell,
  Search,
} from 'lucide-react';
import { generateWarmupProtocol, getRestTimeForWorkout } from '@/lib/warmup';

interface ProgramBuilderProps {
  program?: Program;
  onSave?: () => void;
  onCancel?: () => void;
}

interface WorkoutForm extends Partial<Workout> {
  tempId: string;
  exercises: ExerciseForm[];
}

interface ExerciseForm extends Partial<Exercise> {
  tempId: string;
}

const DAYS_OF_WEEK = [
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
  { value: 0, label: 'Sunday' },
];

export default function ProgramBuilder({ program, onSave, onCancel }: ProgramBuilderProps) {
  const supabase = createClient();

  // Program form state
  const [programName, setProgramName] = useState(program?.name || '');
  const [programDescription, setProgramDescription] = useState(program?.description || '');
  const [durationWeeks, setDurationWeeks] = useState<number>(program?.duration_weeks || 8);
  const [difficultyLevel, setDifficultyLevel] = useState<'beginner' | 'intermediate' | 'advanced'>(
    program?.difficulty_level || 'intermediate'
  );
  const [goals] = useState<string[]>(program?.goals || []);
  const [daysPerWeek, setDaysPerWeek] = useState<number>(program?.days_per_week || 3);

  // Workouts state
  const [workouts, setWorkouts] = useState<WorkoutForm[]>([]);

  // UI state
  const [loading, setLoading] = useState(false);
  const [showExercisePicker, setShowExercisePicker] = useState(false);
  const [selectedWorkoutId, setSelectedWorkoutId] = useState<string | null>(null);
  const [availableExercises, setAvailableExercises] = useState<ExerciseLibraryType[]>([]);
  const [exerciseSearch, setExerciseSearch] = useState('');

  // Load exercises
  useEffect(() => {
    loadExercises();
  }, []);

  const loadExercises = async () => {
    try {
      const exercises = await exerciseLibraryDb.list();
      setAvailableExercises(exercises);
    } catch (error) {
      console.error('Failed to load exercises:', error);
    }
  };

  // Add new workout
  const addWorkout = () => {
    const newWorkout: WorkoutForm = {
      tempId: `temp-${Date.now()}`,
      name: `Workout ${workouts.length + 1}`,
      description: '',
      day_of_week: null,
      order_index: workouts.length,
      workout_type: 'mixed',
      exercises: [],
    };
    setWorkouts([...workouts, newWorkout]);
  };

  // Remove workout
  const removeWorkout = (tempId: string) => {
    setWorkouts(workouts.filter(w => w.tempId !== tempId));
  };

  // Update workout
  const updateWorkout = (tempId: string, updates: Partial<WorkoutForm>) => {
    setWorkouts(workouts.map(w => (w.tempId === tempId ? { ...w, ...updates } : w)));
  };

  // Add exercise to workout
  const addExerciseToWorkout = (workoutTempId: string, libraryExercise: ExerciseLibraryType) => {
    const workout = workouts.find(w => w.tempId === workoutTempId);
    if (!workout) return;

    // Determine default parameters based on workout type
    const isCompound = libraryExercise.is_compound;
    const workoutType = workout.workout_type || 'mixed';

    let defaultSets = 3;
    let defaultReps = 10;
    let defaultIntensity = 75;
    const defaultRest = getRestTimeForWorkout(workoutType, isCompound);

    if (workoutType === 'strength') {
      // A Day (Strength): 80-87% 1RM, 6-8 reps, 3-4min rest
      defaultSets = 4;
      defaultReps = 6;
      defaultIntensity = 85;
    } else if (workoutType === 'hypertrophy') {
      // B Day (Volume): 70-80% 1RM, 8-12 reps, 2-3min rest
      defaultSets = 3;
      defaultReps = 10;
      defaultIntensity = 75;
    }

    const newExercise: ExerciseForm = {
      tempId: `temp-ex-${Date.now()}`,
      exercise_library_id: libraryExercise.id,
      name: libraryExercise.name,
      description: libraryExercise.description,
      muscle_groups: [
        libraryExercise.primary_muscle_group,
        ...libraryExercise.secondary_muscle_groups,
      ],
      equipment: libraryExercise.equipment_needed,
      video_url: libraryExercise.video_url,
      order_index: workout.exercises.length,
      target_sets: defaultSets,
      target_reps: defaultReps,
      target_weight_kg: null,
      rest_seconds: defaultRest,
      intensity_percentage: defaultIntensity,
      warmup_protocol: generateWarmupProtocol(
        libraryExercise.is_compound,
        libraryExercise.is_priority
      ),
      notes: null,
    };

    updateWorkout(workoutTempId, {
      exercises: [...workout.exercises, newExercise],
    });

    setShowExercisePicker(false);
    setSelectedWorkoutId(null);
    setExerciseSearch('');
  };

  // Remove exercise from workout
  const removeExercise = (workoutTempId: string, exerciseTempId: string) => {
    const workout = workouts.find(w => w.tempId === workoutTempId);
    if (!workout) return;

    updateWorkout(workoutTempId, {
      exercises: workout.exercises.filter(e => e.tempId !== exerciseTempId),
    });
  };

  // Update exercise
  const updateExercise = (
    workoutTempId: string,
    exerciseTempId: string,
    updates: Partial<ExerciseForm>
  ) => {
    const workout = workouts.find(w => w.tempId === workoutTempId);
    if (!workout) return;

    updateWorkout(workoutTempId, {
      exercises: workout.exercises.map(e => (e.tempId === exerciseTempId ? { ...e, ...updates } : e)),
    });
  };

  // Save program
  const saveProgram = async () => {
    if (!programName.trim()) {
      alert('Please enter a program name');
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Create program
      const programData: ProgramInsert = {
        user_id: user.id,
        name: programName,
        description: programDescription,
        duration_weeks: durationWeeks,
        difficulty_level: difficultyLevel,
        is_active: false,
        goals: goals,
        days_per_week: daysPerWeek,
        is_template: false,
        template_category: null,
      };

      const { data: newProgram, error: programError } = await supabase
        .from('programs')
        .insert(programData)
        .select()
        .single();

      if (programError) throw programError;

      // Create workouts
      for (const workout of workouts) {
        const workoutData: WorkoutInsert = {
          program_id: newProgram.id,
          name: workout.name!,
          description: workout.description || null,
          day_of_week: workout.day_of_week ?? null,
          order_index: workout.order_index!,
          workout_type: workout.workout_type!,
        };

        const { data: newWorkout, error: workoutError } = await supabase
          .from('workouts')
          .insert(workoutData)
          .select()
          .single();

        if (workoutError) throw workoutError;

        // Create exercises
        for (const exercise of workout.exercises) {
          const exerciseData: ExerciseInsert = {
            workout_id: newWorkout.id,
            exercise_library_id: exercise.exercise_library_id!,
            name: exercise.name!,
            description: exercise.description || null,
            muscle_groups: exercise.muscle_groups!,
            equipment: exercise.equipment!,
            video_url: exercise.video_url || null,
            image_url: exercise.image_url || null,
            order_index: exercise.order_index!,
            target_sets: exercise.target_sets ?? null,
            target_reps: exercise.target_reps ?? null,
            target_weight_kg: exercise.target_weight_kg ?? null,
            rest_seconds: exercise.rest_seconds ?? null,
            intensity_percentage: exercise.intensity_percentage ?? null,
            warmup_protocol: exercise.warmup_protocol || [],
            notes: exercise.notes || null,
          };

          const { error: exerciseError } = await supabase.from('exercises').insert(exerciseData);

          if (exerciseError) throw exerciseError;
        }
      }

      if (onSave) {
        onSave();
      }
    } catch (error) {
      console.error('Failed to save program:', error);
      alert('Failed to save program. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Filter exercises
  const filteredExercises = availableExercises.filter(exercise =>
    exercise.name.toLowerCase().includes(exerciseSearch.toLowerCase()) ||
    exercise.primary_muscle_group.toLowerCase().includes(exerciseSearch.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-white">Program Builder</h1>
          <div className="flex gap-3">
            {onCancel && (
              <button
                onClick={onCancel}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
            )}
            <button
              onClick={saveProgram}
              disabled={loading}
              className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {loading ? 'Saving...' : 'Save Program'}
            </button>
          </div>
        </div>

        {/* Program Details */}
        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6 mb-6">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Target className="w-5 h-5 text-blue-400" />
            Program Details
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                Program Name *
              </label>
              <input
                type="text"
                value={programName}
                onChange={(e) => setProgramName(e.target.value)}
                className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                placeholder="e.g., 6-Day Push/Pull/Legs"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                Difficulty Level
              </label>
              <select
                value={difficultyLevel}
                onChange={(e) => setDifficultyLevel(e.target.value as 'beginner' | 'intermediate' | 'advanced')}
                className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                Duration (weeks)
              </label>
              <input
                type="number"
                value={durationWeeks}
                onChange={(e) => setDurationWeeks(parseInt(e.target.value))}
                className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                min="1"
                max="52"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                Days Per Week
              </label>
              <input
                type="number"
                value={daysPerWeek}
                onChange={(e) => setDaysPerWeek(parseInt(e.target.value))}
                className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                min="1"
                max="7"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                Description
              </label>
              <textarea
                value={programDescription}
                onChange={(e) => setProgramDescription(e.target.value)}
                className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 h-24 resize-none"
                placeholder="Describe your program..."
              />
            </div>
          </div>
        </div>

        {/* Workouts */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-400" />
              Workouts ({workouts.length})
            </h2>
            <button
              onClick={addWorkout}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Workout
            </button>
          </div>

          {workouts.length === 0 ? (
            <div className="bg-gray-800/30 border border-gray-700/50 rounded-xl p-12 text-center">
              <Dumbbell className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">No workouts added yet. Click &quot;Add Workout&quot; to start building your program.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {workouts.map((workout) => (
                <div
                  key={workout.tempId}
                  className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6"
                >
                  {/* Workout Header */}
                  <div className="flex items-start gap-4 mb-4">
                    <GripVertical className="w-5 h-5 text-gray-500 mt-2 cursor-move" />
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-gray-400 mb-1">
                          Workout Name
                        </label>
                        <input
                          type="text"
                          value={workout.name}
                          onChange={(e) =>
                            updateWorkout(workout.tempId, { name: e.target.value })
                          }
                          className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-400 mb-1">
                          Day of Week
                        </label>
                        <select
                          value={workout.day_of_week ?? ''}
                          onChange={(e) =>
                            updateWorkout(workout.tempId, {
                              day_of_week: e.target.value ? parseInt(e.target.value) : null,
                            })
                          }
                          className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
                        >
                          <option value="">Select Day</option>
                          {DAYS_OF_WEEK.map((day) => (
                            <option key={day.value} value={day.value}>
                              {day.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-400 mb-1">
                          Workout Type
                        </label>
                        <select
                          value={workout.workout_type}
                          onChange={(e) =>
                            updateWorkout(workout.tempId, { workout_type: e.target.value as 'strength' | 'hypertrophy' | 'mixed' | 'deload' })
                          }
                          className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
                        >
                          <option value="strength">Strength (A Day)</option>
                          <option value="hypertrophy">Hypertrophy (B Day)</option>
                          <option value="mixed">Mixed</option>
                          <option value="deload">Deload</option>
                        </select>
                      </div>
                      <div className="flex items-end">
                        <button
                          onClick={() => removeWorkout(workout.tempId)}
                          className="w-full px-3 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm"
                        >
                          <Trash2 className="w-4 h-4" />
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Exercises */}
                  <div className="ml-9">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-semibold text-gray-300">
                        Exercises ({workout.exercises.length})
                      </h3>
                      <button
                        onClick={() => {
                          setSelectedWorkoutId(workout.tempId);
                          setShowExercisePicker(true);
                        }}
                        className="px-3 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-lg transition-colors flex items-center gap-2 text-sm"
                      >
                        <Plus className="w-3 h-3" />
                        Add Exercise
                      </button>
                    </div>

                    {workout.exercises.length === 0 ? (
                      <div className="bg-gray-700/30 border border-gray-600/50 rounded-lg p-6 text-center">
                        <p className="text-gray-500 text-sm">No exercises added</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {workout.exercises.map((exercise, index) => (
                          <div
                            key={exercise.tempId}
                            className="bg-gray-700/30 border border-gray-600/50 rounded-lg p-4"
                          >
                            <div className="flex items-start gap-3">
                              <span className="text-gray-500 font-semibold text-sm mt-1">
                                {index + 1}.
                              </span>
                              <div className="flex-1">
                                <div className="flex items-center justify-between mb-3">
                                  <div>
                                    <h4 className="font-semibold text-white text-sm">
                                      {exercise.name}
                                    </h4>
                                    <p className="text-xs text-gray-400">
                                      {exercise.muscle_groups?.join(', ')}
                                    </p>
                                  </div>
                                  <button
                                    onClick={() => removeExercise(workout.tempId, exercise.tempId)}
                                    className="text-red-400 hover:text-red-300 transition-colors"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                                  <div>
                                    <label className="block text-xs text-gray-400 mb-1">Sets</label>
                                    <input
                                      type="number"
                                      value={exercise.target_sets ?? ''}
                                      onChange={(e) =>
                                        updateExercise(workout.tempId, exercise.tempId, {
                                          target_sets: parseInt(e.target.value) || null,
                                        })
                                      }
                                      className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white text-sm focus:outline-none focus:border-blue-500"
                                      min="1"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs text-gray-400 mb-1">Reps</label>
                                    <input
                                      type="number"
                                      value={exercise.target_reps ?? ''}
                                      onChange={(e) =>
                                        updateExercise(workout.tempId, exercise.tempId, {
                                          target_reps: parseInt(e.target.value) || null,
                                        })
                                      }
                                      className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white text-sm focus:outline-none focus:border-blue-500"
                                      min="1"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs text-gray-400 mb-1">
                                      Rest (s)
                                    </label>
                                    <input
                                      type="number"
                                      value={exercise.rest_seconds ?? ''}
                                      onChange={(e) =>
                                        updateExercise(workout.tempId, exercise.tempId, {
                                          rest_seconds: parseInt(e.target.value) || null,
                                        })
                                      }
                                      className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white text-sm focus:outline-none focus:border-blue-500"
                                      min="0"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs text-gray-400 mb-1">
                                      % 1RM
                                    </label>
                                    <input
                                      type="number"
                                      value={exercise.intensity_percentage ?? ''}
                                      onChange={(e) =>
                                        updateExercise(workout.tempId, exercise.tempId, {
                                          intensity_percentage: parseFloat(e.target.value) || null,
                                        })
                                      }
                                      className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white text-sm focus:outline-none focus:border-blue-500"
                                      min="0"
                                      max="100"
                                      step="5"
                                    />
                                  </div>
                                  <div className="flex items-end">
                                    <span className="text-xs text-gray-400">
                                      {exercise.warmup_protocol?.length || 0} warm-up sets
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Exercise Picker Modal */}
      {showExercisePicker && selectedWorkoutId && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-gray-800 border border-gray-700 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-2xl font-bold text-white">Add Exercise</h3>
                <button
                  onClick={() => {
                    setShowExercisePicker(false);
                    setSelectedWorkoutId(null);
                    setExerciseSearch('');
                  }}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={exerciseSearch}
                  onChange={(e) => setExerciseSearch(e.target.value)}
                  placeholder="Search exercises..."
                  className="w-full bg-gray-700/50 border border-gray-600 rounded-lg pl-10 pr-4 py-3 text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredExercises.map((exercise) => (
                  <button
                    key={exercise.id}
                    onClick={() => addExerciseToWorkout(selectedWorkoutId, exercise)}
                    className="bg-gray-700/50 hover:bg-gray-700 border border-gray-600 rounded-lg p-4 text-left transition-colors"
                  >
                    <h4 className="font-semibold text-white mb-1">{exercise.name}</h4>
                    <p className="text-sm text-gray-400 mb-2">{exercise.primary_muscle_group}</p>
                    <div className="flex flex-wrap gap-2">
                      {exercise.is_compound && (
                        <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 text-xs rounded">
                          Compound
                        </span>
                      )}
                      {exercise.is_priority && (
                        <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 text-xs rounded">
                          Priority
                        </span>
                      )}
                      <span className="px-2 py-0.5 bg-gray-600 text-gray-300 text-xs rounded">
                        {exercise.difficulty_level}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
