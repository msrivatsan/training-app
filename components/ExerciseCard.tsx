'use client';

import { ExerciseLibrary } from '@/lib/types';
import {
  Dumbbell,
  Heart,
  Zap,
  Target,
  Star,
  PlayCircle,
} from 'lucide-react';

interface ExerciseCardProps {
  exercise: ExerciseLibrary;
  onSelect?: (exercise: ExerciseLibrary) => void;
  showAnalytics?: boolean;
  className?: string;
}

// Muscle group icon mapping
const getMuscleGroupIcon = (muscleGroup: string) => {
  const iconMap: Record<string, string> = {
    chest: '💪',
    back: '🦾',
    shoulders: '🔝',
    biceps: '💪',
    triceps: '💪',
    quads: '🦵',
    hamstrings: '🦵',
    glutes: '🍑',
    calves: '🦵',
    abs: '🔥',
    core: '⚡',
    forearms: '✊',
    traps: '🔺',
    cardio: '❤️',
  };
  return iconMap[muscleGroup.toLowerCase()] || '💪';
};

// Difficulty badge colors
const getDifficultyColor = (difficulty: string) => {
  switch (difficulty) {
    case 'beginner':
      return 'bg-green-500/10 text-green-400 border-green-500/20';
    case 'intermediate':
      return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
    case 'advanced':
      return 'bg-red-500/10 text-red-400 border-red-500/20';
    default:
      return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
  }
};

export default function ExerciseCard({
  exercise,
  onSelect,
  showAnalytics = false,
  className = ''
}: ExerciseCardProps) {
  return (
    <div
      onClick={() => onSelect?.(exercise)}
      className={`
        relative bg-white dark:bg-gray-800 rounded-lg border border-gray-200
        dark:border-gray-700 p-4 transition-all duration-200
        ${onSelect ? 'cursor-pointer hover:shadow-lg hover:border-purple-500' : ''}
        ${className}
      `}
    >
      {/* Priority Badge */}
      {exercise.is_priority && (
        <div className="absolute top-2 right-2">
          <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
        </div>
      )}

      {/* Exercise Header */}
      <div className="flex items-start gap-3 mb-3">
        <div className="flex-shrink-0 w-10 h-10 bg-purple-500/10 rounded-lg flex items-center justify-center">
          <span className="text-2xl">
            {getMuscleGroupIcon(exercise.primary_muscle_group)}
          </span>
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 dark:text-white truncate">
            {exercise.name}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">
            {exercise.primary_muscle_group}
            {exercise.secondary_muscle_groups.length > 0 && (
              <span className="text-gray-400 dark:text-gray-500">
                {' '}• {exercise.secondary_muscle_groups.slice(0, 2).join(', ')}
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Description */}
      {exercise.description && (
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
          {exercise.description}
        </p>
      )}

      {/* Badges */}
      <div className="flex flex-wrap gap-2 mb-3">
        {/* Difficulty Badge */}
        <span className={`
          inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium border
          ${getDifficultyColor(exercise.difficulty_level)}
        `}>
          <Target className="w-3 h-3" />
          {exercise.difficulty_level}
        </span>

        {/* Compound Badge */}
        {exercise.is_compound && (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Zap className="w-3 h-3" />
            Compound
          </span>
        )}

        {/* Video Badge */}
        {exercise.video_url && (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <PlayCircle className="w-3 h-3" />
            Video
          </span>
        )}
      </div>

      {/* Equipment */}
      {exercise.equipment_needed.length > 0 && (
        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
          <Dumbbell className="w-3 h-3" />
          <span className="truncate">
            {exercise.equipment_needed.slice(0, 3).join(', ')}
            {exercise.equipment_needed.length > 3 && ` +${exercise.equipment_needed.length - 3}`}
          </span>
        </div>
      )}

      {/* Analytics Preview (if provided) */}
      {showAnalytics && (
        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <p className="text-gray-500 dark:text-gray-400">Last performed</p>
              <p className="font-medium text-gray-900 dark:text-white">Never</p>
            </div>
            <div>
              <p className="text-gray-500 dark:text-gray-400">PR</p>
              <p className="font-medium text-gray-900 dark:text-white">-</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
