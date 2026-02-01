'use client';

import { useState, useEffect, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import type {
  ExerciseLibraryWithMovementPattern,
  ExerciseAlternative,
  EquipmentProfile,
  ExerciseSwapFilter,
  ExerciseNote,
} from '@/lib/types';
import {
  findAlternativeExercises,
  getMovementPatternLabel,
  getMovementPatternIcon,
  getMissingEquipment,
} from '@/lib/exerciseSwap';

interface ExerciseSwapModalProps {
  exercise: ExerciseLibraryWithMovementPattern;
  currentWeight?: number;
  isOpen: boolean;
  onClose: () => void;
  onSwap: (newExercise: ExerciseLibraryWithMovementPattern) => void;
}

export default function ExerciseSwapModal({
  exercise,
  currentWeight,
  isOpen,
  onClose,
  onSwap,
}: ExerciseSwapModalProps) {
  const [allExercises, setAllExercises] = useState<ExerciseLibraryWithMovementPattern[]>([]);
  const [equipmentProfile, setEquipmentProfile] = useState<EquipmentProfile | null>(null);
  const [exerciseNotes, setExerciseNotes] = useState<Record<string, ExerciseNote>>({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Filters
  const [filters, setFilters] = useState<ExerciseSwapFilter>({
    same_movement_pattern: true,
    same_muscle_group: true,
    same_difficulty: false,
    available_equipment_only: true,
    compound_only: false,
    max_results: 20,
  });

  const supabase = createClient();

  // Load data
  useEffect(() => {
    if (!isOpen) return;

    async function loadData() {
      setLoading(true);

      try {
        // Load all exercises
        const { data: exercisesData } = await supabase
          .from('exercise_library')
          .select('*')
          .order('name');

        if (exercisesData) {
          setAllExercises(exercisesData as ExerciseLibraryWithMovementPattern[]);
        }

        // Load user's equipment profile
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profileData } = await supabase
            .from('equipment_profiles')
            .select('*')
            .eq('user_id', user.id)
            .eq('is_active', true)
            .single();

          if (profileData) {
            setEquipmentProfile(profileData as EquipmentProfile);
          }

          // Load exercise notes
          const { data: notesData } = await supabase
            .from('exercise_notes')
            .select('*')
            .eq('user_id', user.id);

          if (notesData) {
            const notesMap: Record<string, ExerciseNote> = {};
            notesData.forEach((note) => {
              notesMap[note.exercise_library_id] = note as ExerciseNote;
            });
            setExerciseNotes(notesMap);
          }
        }
      } catch (error) {
        console.error('Error loading swap data:', error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [isOpen, supabase]);

  // Calculate alternatives
  const alternatives = useMemo(() => {
    if (!allExercises.length) return [];

    const alts = findAlternativeExercises(
      exercise,
      allExercises,
      filters,
      equipmentProfile
    );

    // Filter by search query
    if (searchQuery) {
      return alts.filter((alt) =>
        alt.exercise_name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return alts;
  }, [exercise, allExercises, filters, equipmentProfile, searchQuery]);

  // Handle swap
  const handleSwap = async (alternative: ExerciseAlternative) => {
    const selectedExercise = allExercises.find((ex) => ex.id === alternative.exercise_id);
    if (!selectedExercise) return;

    // Record swap history
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('exercise_swap_history').insert({
          user_id: user.id,
          original_exercise_id: exercise.id,
          swapped_exercise_id: selectedExercise.id,
          reason: null,
        });
      }
    } catch (error) {
      console.error('Error recording swap history:', error);
    }

    onSwap(selectedExercise);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900">Swap Exercise</h2>
              <div className="mt-2 space-y-1">
                <p className="text-lg text-gray-700">
                  <span className="font-semibold">{exercise.name}</span>
                </p>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <span className="flex items-center gap-1">
                    {getMovementPatternIcon(exercise.movement_pattern)}
                    {getMovementPatternLabel(exercise.movement_pattern)}
                  </span>
                  <span className="capitalize">{exercise.primary_muscle_group}</span>
                  <span className="capitalize">{exercise.difficulty_level}</span>
                  {exercise.is_compound && (
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                      Compound
                    </span>
                  )}
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl font-semibold"
            >
              ×
            </button>
          </div>

          {/* Search and Filters */}
          <div className="mt-4 space-y-3">
            <input
              type="text"
              placeholder="Search alternatives..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />

            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setFilters({ ...filters, same_movement_pattern: !filters.same_movement_pattern })}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  filters.same_movement_pattern
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Same Movement Pattern
              </button>
              <button
                onClick={() => setFilters({ ...filters, same_muscle_group: !filters.same_muscle_group })}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  filters.same_muscle_group
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Same Muscle Group
              </button>
              <button
                onClick={() => setFilters({ ...filters, same_difficulty: !filters.same_difficulty })}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  filters.same_difficulty
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Same Difficulty
              </button>
              <button
                onClick={() => setFilters({ ...filters, compound_only: !filters.compound_only })}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  filters.compound_only
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Compound Only
              </button>
              <button
                onClick={() => setFilters({ ...filters, available_equipment_only: !filters.available_equipment_only })}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  filters.available_equipment_only
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Available Equipment Only
              </button>
            </div>
          </div>
        </div>

        {/* Alternatives List */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : alternatives.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No alternative exercises found.</p>
              <p className="text-gray-400 text-sm mt-2">Try adjusting your filters.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {alternatives.map((alt) => {
                const missingEquipment = getMissingEquipment(
                  allExercises.find((ex) => ex.id === alt.exercise_id)!,
                  equipmentProfile
                );
                const note = exerciseNotes[alt.exercise_id];

                return (
                  <div
                    key={alt.exercise_id}
                    className="border rounded-lg p-4 hover:border-blue-500 hover:bg-blue-50 transition-all cursor-pointer"
                    onClick={() => handleSwap(alt)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-lg text-gray-900">
                            {alt.exercise_name}
                          </h3>
                          <span className="px-2 py-0.5 bg-green-100 text-green-800 rounded text-xs font-medium">
                            {alt.compatibility_score}% match
                          </span>
                          {alt.is_compound && (
                            <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                              Compound
                            </span>
                          )}
                        </div>

                        <div className="mt-1 flex items-center gap-3 text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            {getMovementPatternIcon(alt.movement_pattern)}
                            {getMovementPatternLabel(alt.movement_pattern)}
                          </span>
                          <span className="capitalize">{alt.primary_muscle_group}</span>
                          <span className="capitalize">{alt.difficulty_level}</span>
                        </div>

                        {alt.equipment_needed.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {alt.equipment_needed.map((eq) => (
                              <span
                                key={eq}
                                className={`px-2 py-0.5 rounded text-xs font-medium ${
                                  missingEquipment.includes(eq)
                                    ? 'bg-red-100 text-red-800'
                                    : 'bg-gray-100 text-gray-700'
                                }`}
                              >
                                {eq}
                                {missingEquipment.includes(eq) && ' ⚠️'}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Smart Suggestion */}
                        {alt.swap_suggestion && alt.swap_suggestion.type !== 'none' && (
                          <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <p className="text-sm text-yellow-900">
                              <strong className="font-semibold">💡 Tip:</strong>{' '}
                              {alt.swap_suggestion.message}
                            </p>
                            {alt.swap_suggestion.suggested_exercises && alt.swap_suggestion.suggested_exercises.length > 0 && (
                              <p className="text-xs text-yellow-800 mt-1">
                                Consider adding: {alt.swap_suggestion.suggested_exercises.join(', ')}
                              </p>
                            )}
                          </div>
                        )}

                        {/* User Note */}
                        {note && (
                          <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-sm text-blue-900">
                            <strong>Your note:</strong> {note.note_text}
                          </div>
                        )}
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSwap(alt);
                        }}
                        className="ml-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                      >
                        Select
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-gray-50">
          <p className="text-sm text-gray-600 text-center">
            Showing {alternatives.length} alternative{alternatives.length !== 1 ? 's' : ''} for {exercise.name}
          </p>
        </div>
      </div>
    </div>
  );
}
