'use client';

import { useState, useEffect, useMemo } from 'react';
import { ExerciseLibrary as ExerciseLibraryType, ExerciseLibraryWithMovementPattern, MovementPatternType } from '@/lib/types';
import { exerciseLibrary } from '@/lib/database';
import ExerciseCard from './ExerciseCard';
import { getMovementPatternLabel } from '@/lib/exerciseSwap';
import {
  Search,
  Grid3x3,
  List,
  Filter,
  X,
  Loader2,
} from 'lucide-react';

interface ExerciseLibraryProps {
  onSelectExercise?: (exercise: ExerciseLibraryType) => void;
  showAnalytics?: boolean;
}

type ViewMode = 'grid' | 'list';

export default function ExerciseLibrary({
  onSelectExercise,
  showAnalytics = false,
}: ExerciseLibraryProps) {
  const [exercises, setExercises] = useState<ExerciseLibraryType[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [showFilters, setShowFilters] = useState(false);

  // Filter states
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState<string>('');
  const [selectedEquipment, setSelectedEquipment] = useState<string>('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('');
  const [selectedMovementPattern, setSelectedMovementPattern] = useState<string>('');
  const [showCompoundOnly, setShowCompoundOnly] = useState(false);
  const [showPriorityOnly, setShowPriorityOnly] = useState(false);

  // Load exercises
  useEffect(() => {
    loadExercises();
  }, []);

  const loadExercises = async () => {
    setLoading(true);
    try {
      const data = await exerciseLibrary.list();
      setExercises(data);
    } catch (error) {
      console.error('Error loading exercises:', error);
    } finally {
      setLoading(false);
    }
  };

  // Get unique values for filters
  const muscleGroups = useMemo(() => {
    const groups = new Set<string>();
    exercises.forEach(ex => {
      groups.add(ex.primary_muscle_group);
      ex.secondary_muscle_groups.forEach(g => groups.add(g));
    });
    return Array.from(groups).sort();
  }, [exercises]);

  const equipmentTypes = useMemo(() => {
    const equipment = new Set<string>();
    exercises.forEach(ex => {
      ex.equipment_needed.forEach(e => equipment.add(e));
    });
    return Array.from(equipment).sort();
  }, [exercises]);

  // Filter exercises
  const filteredExercises = useMemo(() => {
    return exercises.filter(exercise => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesName = exercise.name.toLowerCase().includes(query);
        const matchesMuscle = exercise.primary_muscle_group.toLowerCase().includes(query) ||
          exercise.secondary_muscle_groups.some(m => m.toLowerCase().includes(query));
        const matchesEquipment = exercise.equipment_needed.some(e => e.toLowerCase().includes(query));

        if (!matchesName && !matchesMuscle && !matchesEquipment) {
          return false;
        }
      }

      // Muscle group filter
      if (selectedMuscleGroup) {
        const hasMuscle = exercise.primary_muscle_group === selectedMuscleGroup ||
          exercise.secondary_muscle_groups.includes(selectedMuscleGroup);
        if (!hasMuscle) return false;
      }

      // Equipment filter
      if (selectedEquipment) {
        if (!exercise.equipment_needed.includes(selectedEquipment)) {
          return false;
        }
      }

      // Difficulty filter
      if (selectedDifficulty) {
        if (exercise.difficulty_level !== selectedDifficulty) {
          return false;
        }
      }

      // Movement pattern filter
      if (selectedMovementPattern) {
        const exerciseWithPattern = exercise as ExerciseLibraryWithMovementPattern;
        if (exerciseWithPattern.movement_pattern !== selectedMovementPattern) {
          return false;
        }
      }

      // Compound filter
      if (showCompoundOnly && !exercise.is_compound) {
        return false;
      }

      // Priority filter
      if (showPriorityOnly && !exercise.is_priority) {
        return false;
      }

      return true;
    });
  }, [exercises, searchQuery, selectedMuscleGroup, selectedEquipment, selectedDifficulty, selectedMovementPattern, showCompoundOnly, showPriorityOnly]);

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedMuscleGroup('');
    setSelectedEquipment('');
    setSelectedDifficulty('');
    setSelectedMovementPattern('');
    setShowCompoundOnly(false);
    setShowPriorityOnly(false);
  };

  const hasActiveFilters = searchQuery || selectedMuscleGroup || selectedEquipment || selectedDifficulty || selectedMovementPattern || showCompoundOnly || showPriorityOnly;

  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Exercise Library
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Browse {exercises.length} exercises to build your perfect workout
        </p>
      </div>

      {/* Search and View Controls */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        {/* Search Bar */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search exercises, muscles, or equipment..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>

        {/* View Mode Toggle */}
        <div className="flex gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`
              px-4 py-2 rounded-lg border transition-colors
              ${showFilters
                ? 'bg-purple-500 text-white border-purple-500'
                : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
              }
            `}
          >
            <Filter className="w-5 h-5" />
          </button>

          <div className="flex border border-gray-300 dark:border-gray-700 rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode('grid')}
              className={`
                px-3 py-2 transition-colors
                ${viewMode === 'grid'
                  ? 'bg-purple-500 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }
              `}
            >
              <Grid3x3 className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`
                px-3 py-2 transition-colors
                ${viewMode === 'list'
                  ? 'bg-purple-500 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }
              `}
            >
              <List className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 dark:text-white">Filters</h3>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="text-sm text-purple-500 hover:text-purple-600 flex items-center gap-1"
              >
                <X className="w-4 h-4" />
                Clear all
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Muscle Group */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Muscle Group
              </label>
              <select
                value={selectedMuscleGroup}
                onChange={(e) => setSelectedMuscleGroup(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500"
              >
                <option value="">All</option>
                {muscleGroups.map(group => (
                  <option key={group} value={group} className="capitalize">
                    {group}
                  </option>
                ))}
              </select>
            </div>

            {/* Movement Pattern */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Movement Pattern
              </label>
              <select
                value={selectedMovementPattern}
                onChange={(e) => setSelectedMovementPattern(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500"
              >
                <option value="">All</option>
                <option value="horizontal_push">Horizontal Push</option>
                <option value="vertical_push">Vertical Push</option>
                <option value="horizontal_pull">Horizontal Pull</option>
                <option value="vertical_pull">Vertical Pull</option>
                <option value="squat_pattern">Squat Pattern</option>
                <option value="hinge_pattern">Hinge Pattern</option>
                <option value="lunge_pattern">Lunge Pattern</option>
                <option value="isolation_upper">Upper Isolation</option>
                <option value="isolation_lower">Lower Isolation</option>
                <option value="core_rotation">Core Rotation</option>
                <option value="core_stability">Core Stability</option>
                <option value="core_flexion">Core Flexion</option>
                <option value="carry">Loaded Carry</option>
                <option value="explosive">Explosive</option>
                <option value="olympic">Olympic Lift</option>
              </select>
            </div>

            {/* Equipment */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Equipment
              </label>
              <select
                value={selectedEquipment}
                onChange={(e) => setSelectedEquipment(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500"
              >
                <option value="">All</option>
                {equipmentTypes.map(equipment => (
                  <option key={equipment} value={equipment} className="capitalize">
                    {equipment}
                  </option>
                ))}
              </select>
            </div>

            {/* Difficulty */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Difficulty
              </label>
              <select
                value={selectedDifficulty}
                onChange={(e) => setSelectedDifficulty(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500"
              >
                <option value="">All</option>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>

            {/* Quick Filters */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Quick Filters
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showCompoundOnly}
                  onChange={(e) => setShowCompoundOnly(e.target.checked)}
                  className="w-4 h-4 text-purple-500 border-gray-300 rounded focus:ring-purple-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Compound only</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showPriorityOnly}
                  onChange={(e) => setShowPriorityOnly(e.target.checked)}
                  className="w-4 h-4 text-purple-500 border-gray-300 rounded focus:ring-purple-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Priority lifts</span>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Results Count */}
      <div className="mb-4 text-sm text-gray-600 dark:text-gray-400">
        Showing {filteredExercises.length} of {exercises.length} exercises
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredExercises.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            No exercises found matching your criteria
          </p>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
            >
              Clear filters
            </button>
          )}
        </div>
      )}

      {/* Exercise Grid/List */}
      {!loading && filteredExercises.length > 0 && (
        <div className={
          viewMode === 'grid'
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'
            : 'flex flex-col gap-3'
        }>
          {filteredExercises.map(exercise => (
            <ExerciseCard
              key={exercise.id}
              exercise={exercise}
              onSelect={onSelectExercise}
              showAnalytics={showAnalytics}
              className={viewMode === 'list' ? 'w-full' : ''}
            />
          ))}
        </div>
      )}
    </div>
  );
}
