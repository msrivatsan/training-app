'use client';

import { useState } from 'react';
import ExerciseLibrary from '@/components/ExerciseLibrary';
import { ExerciseLibrary as ExerciseLibraryType } from '@/lib/types';
import { X, PlayCircle, Dumbbell, Target } from 'lucide-react';

export default function ExercisesPage() {
  const [selectedExercise, setSelectedExercise] = useState<ExerciseLibraryType | null>(null);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ExerciseLibrary
          onSelectExercise={setSelectedExercise}
          showAnalytics={true}
        />
      </div>

      {/* Exercise Detail Modal */}
      {selectedExercise && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedExercise(null)}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                    {selectedExercise.name}
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400 capitalize">
                    {selectedExercise.primary_muscle_group}
                    {selectedExercise.secondary_muscle_groups.length > 0 && (
                      <span> • {selectedExercise.secondary_muscle_groups.join(', ')}</span>
                    )}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedExercise(null)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6 text-gray-500" />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Video */}
              {selectedExercise.video_url && (
                <div className="aspect-video bg-gray-100 dark:bg-gray-900 rounded-lg overflow-hidden">
                  <iframe
                    src={selectedExercise.video_url.replace('watch?v=', 'embed/')}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              )}

              {/* Description */}
              {selectedExercise.description && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Description
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {selectedExercise.description}
                  </p>
                </div>
              )}

              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-4">
                {/* Difficulty */}
                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-1">
                    <Target className="w-4 h-4" />
                    <span className="text-sm">Difficulty</span>
                  </div>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white capitalize">
                    {selectedExercise.difficulty_level}
                  </p>
                </div>

                {/* Type */}
                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-1">
                    <Dumbbell className="w-4 h-4" />
                    <span className="text-sm">Type</span>
                  </div>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {selectedExercise.is_compound ? 'Compound' : 'Isolation'}
                  </p>
                </div>
              </div>

              {/* Equipment */}
              {selectedExercise.equipment_needed.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Equipment Needed
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedExercise.equipment_needed.map((equipment, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded-full text-sm capitalize"
                      >
                        {equipment}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Secondary Muscles */}
              {selectedExercise.secondary_muscle_groups.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Secondary Muscles
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedExercise.secondary_muscle_groups.map((muscle, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full text-sm capitalize"
                      >
                        {muscle}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <button className="flex-1 px-4 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors font-medium">
                  Add to Workout
                </button>
                <button className="px-4 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                  Substitute
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
