'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import type {
  Workout,
  Exercise,
  ExerciseLibraryWithMovementPattern,
} from '@/lib/types';
import ExerciseSwapModal from './ExerciseSwapModal';
import ExerciseNoteInput from './ExerciseNoteInput';
import { getMovementPatternLabel, getMovementPatternIcon } from '@/lib/exerciseSwap';

interface ProgramCustomizerProps {
  workoutId: string;
  onSave?: () => void;
}

export default function ProgramCustomizer({ workoutId, onSave }: ProgramCustomizerProps) {
  const [workout, setWorkout] = useState<Workout | null>(null);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [exerciseLibrary, setExerciseLibrary] = useState<Record<string, ExerciseLibraryWithMovementPattern>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [swapModalOpen, setSwapModalOpen] = useState(false);
  const [selectedExerciseForSwap, setSelectedExerciseForSwap] = useState<Exercise | null>(null);

  const supabase = createClient();

  // Load workout and exercises
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        // Load workout
        const { data: workoutData } = await supabase
          .from('workouts')
          .select('*')
          .eq('id', workoutId)
          .single();

        if (workoutData) {
          setWorkout(workoutData as Workout);
        }

        // Load exercises
        const { data: exercisesData } = await supabase
          .from('exercises')
          .select('*')
          .eq('workout_id', workoutId)
          .order('order_index');

        if (exercisesData) {
          setExercises(exercisesData as Exercise[]);
        }

        // Load exercise library
        const { data: libraryData } = await supabase
          .from('exercise_library')
          .select('*');

        if (libraryData) {
          const libraryMap: Record<string, ExerciseLibraryWithMovementPattern> = {};
          libraryData.forEach((ex) => {
            libraryMap[ex.id] = ex as ExerciseLibraryWithMovementPattern;
          });
          setExerciseLibrary(libraryMap);
        }
      } catch (error) {
        console.error('Error loading workout data:', error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [workoutId, supabase]);

  // Handle drag start
  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  // Handle drag over
  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newExercises = [...exercises];
    const draggedExercise = newExercises[draggedIndex];
    newExercises.splice(draggedIndex, 1);
    newExercises.splice(index, 0, draggedExercise);

    // Update order_index
    newExercises.forEach((ex, i) => {
      ex.order_index = i;
    });

    setExercises(newExercises);
    setDraggedIndex(index);
  };

  // Handle drag end
  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  // Update exercise field
  const updateExercise = (index: number, field: keyof Exercise, value: any) => {
    const newExercises = [...exercises];
    newExercises[index] = { ...newExercises[index], [field]: value };
    setExercises(newExercises);
  };

  // Remove exercise
  const removeExercise = async (index: number) => {
    if (!confirm('Are you sure you want to remove this exercise?')) return;

    const exerciseToRemove = exercises[index];

    // Remove from UI
    const newExercises = exercises.filter((_, i) => i !== index);
    newExercises.forEach((ex, i) => {
      ex.order_index = i;
    });
    setExercises(newExercises);

    // Remove from database
    try {
      await supabase.from('exercises').delete().eq('id', exerciseToRemove.id);
    } catch (error) {
      console.error('Error removing exercise:', error);
    }
  };

  // Open swap modal
  const openSwapModal = (exercise: Exercise) => {
    setSelectedExerciseForSwap(exercise);
    setSwapModalOpen(true);
  };

  // Handle exercise swap
  const handleExerciseSwap = async (newExerciseLibrary: ExerciseLibraryWithMovementPattern) => {
    if (!selectedExerciseForSwap) return;

    const index = exercises.findIndex((ex) => ex.id === selectedExerciseForSwap.id);
    if (index === -1) return;

    // Update exercise with new library reference
    const updatedExercise = {
      ...selectedExerciseForSwap,
      exercise_library_id: newExerciseLibrary.id,
      name: newExerciseLibrary.name,
      muscle_groups: [
        newExerciseLibrary.primary_muscle_group,
        ...(newExerciseLibrary.secondary_muscle_groups || []),
      ],
      equipment: newExerciseLibrary.equipment_needed,
      video_url: newExerciseLibrary.video_url,
    };

    const newExercises = [...exercises];
    newExercises[index] = updatedExercise;
    setExercises(newExercises);

    // Update in database
    try {
      await supabase
        .from('exercises')
        .update({
          exercise_library_id: newExerciseLibrary.id,
          name: newExerciseLibrary.name,
          muscle_groups: updatedExercise.muscle_groups,
          equipment: updatedExercise.equipment,
          video_url: updatedExercise.video_url,
        })
        .eq('id', selectedExerciseForSwap.id);
    } catch (error) {
      console.error('Error updating exercise:', error);
    }

    setSelectedExerciseForSwap(null);
    setSwapModalOpen(false);
  };

  // Save all changes
  const handleSave = async () => {
    setSaving(true);
    try {
      // Update all exercises
      for (const exercise of exercises) {
        await supabase
          .from('exercises')
          .update({
            order_index: exercise.order_index,
            target_sets: exercise.target_sets,
            target_reps: exercise.target_reps,
            target_weight_kg: exercise.target_weight_kg,
            rest_seconds: exercise.rest_seconds,
            notes: exercise.notes,
          })
          .eq('id', exercise.id);
      }

      alert('Workout customization saved successfully!');
      onSave?.();
    } catch (error) {
      console.error('Error saving customization:', error);
      alert('Failed to save changes. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!workout) {
    return <div className="text-center py-12 text-gray-500">Workout not found</div>;
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">{workout.name}</h2>
          <p className="text-gray-600 mt-1">Customize your workout by reordering exercises, adjusting sets/reps, or swapping exercises.</p>
        </div>

        {/* Exercise List */}
        <div className="space-y-4">
          {exercises.map((exercise, index) => {
            const libraryExercise = exercise.exercise_library_id
              ? exerciseLibrary[exercise.exercise_library_id]
              : null;

            return (
              <div
                key={exercise.id}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
                className={`border rounded-lg p-4 cursor-move transition-all ${
                  draggedIndex === index ? 'opacity-50 border-blue-500' : 'hover:border-gray-400'
                }`}
              >
                <div className="flex items-start gap-4">
                  {/* Drag Handle */}
                  <div className="flex flex-col items-center pt-2">
                    <span className="text-2xl text-gray-400">⋮⋮</span>
                    <span className="text-xs text-gray-500 font-medium mt-1">#{index + 1}</span>
                  </div>

                  {/* Exercise Details */}
                  <div className="flex-1 space-y-3">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg text-gray-900">{exercise.name}</h3>
                        {libraryExercise && (
                          <div className="flex items-center gap-3 text-sm text-gray-600 mt-1">
                            <span className="flex items-center gap-1">
                              {getMovementPatternIcon(libraryExercise.movement_pattern)}
                              {getMovementPatternLabel(libraryExercise.movement_pattern)}
                            </span>
                            <span className="capitalize">{libraryExercise.primary_muscle_group}</span>
                            {libraryExercise.is_compound && (
                              <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                                Compound
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => openSwapModal(exercise)}
                          className="px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 text-sm font-medium"
                        >
                          Swap
                        </button>
                        <button
                          onClick={() => removeExercise(index)}
                          className="px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 text-sm font-medium"
                        >
                          Remove
                        </button>
                      </div>
                    </div>

                    {/* Parameters */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Sets</label>
                        <input
                          type="number"
                          value={exercise.target_sets || ''}
                          onChange={(e) => updateExercise(index, 'target_sets', parseInt(e.target.value) || null)}
                          className="w-full px-3 py-1.5 border rounded text-sm"
                          placeholder="3"
                          min="1"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Reps</label>
                        <input
                          type="number"
                          value={exercise.target_reps || ''}
                          onChange={(e) => updateExercise(index, 'target_reps', parseInt(e.target.value) || null)}
                          className="w-full px-3 py-1.5 border rounded text-sm"
                          placeholder="10"
                          min="1"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Weight (kg)</label>
                        <input
                          type="number"
                          value={exercise.target_weight_kg || ''}
                          onChange={(e) => updateExercise(index, 'target_weight_kg', parseFloat(e.target.value) || null)}
                          className="w-full px-3 py-1.5 border rounded text-sm"
                          placeholder="20"
                          step="0.5"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Rest (sec)</label>
                        <input
                          type="number"
                          value={exercise.rest_seconds || ''}
                          onChange={(e) => updateExercise(index, 'rest_seconds', parseInt(e.target.value) || null)}
                          className="w-full px-3 py-1.5 border rounded text-sm"
                          placeholder="90"
                          step="15"
                        />
                      </div>
                    </div>

                    {/* Notes */}
                    {libraryExercise && (
                      <ExerciseNoteInput
                        exerciseLibraryId={libraryExercise.id}
                        exerciseName={libraryExercise.name}
                      />
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {exercises.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No exercises in this workout yet.
          </div>
        )}

        {/* Save Button */}
        <div className="mt-6 flex items-center justify-between pt-6 border-t">
          <p className="text-sm text-gray-600">
            {exercises.length} exercise{exercises.length !== 1 ? 's' : ''} in workout
          </p>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* Swap Modal */}
      {selectedExerciseForSwap && selectedExerciseForSwap.exercise_library_id && (
        <ExerciseSwapModal
          exercise={exerciseLibrary[selectedExerciseForSwap.exercise_library_id]}
          currentWeight={selectedExerciseForSwap.target_weight_kg || undefined}
          isOpen={swapModalOpen}
          onClose={() => {
            setSwapModalOpen(false);
            setSelectedExerciseForSwap(null);
          }}
          onSwap={handleExerciseSwap}
        />
      )}
    </div>
  );
}
