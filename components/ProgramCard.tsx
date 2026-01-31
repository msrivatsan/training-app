'use client';

import { Program } from '@/lib/types';
import { Calendar, Target, TrendingUp, Dumbbell } from 'lucide-react';

interface ProgramCardProps {
  program: Program;
  onStartProgram: (program: Program) => void;
  onCustomize: (program: Program) => void;
}

export function ProgramCard({ program, onStartProgram, onCustomize }: ProgramCardProps) {
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'intermediate':
        return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'advanced':
        return 'bg-red-500/10 text-red-500 border-red-500/20';
      default:
        return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6 hover:border-blue-500/50 transition-all duration-200 group">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-xl font-bold text-white mb-2 group-hover:text-blue-400 transition-colors">
            {program.name}
          </h3>
          {program.description && (
            <p className="text-gray-400 text-sm line-clamp-2">{program.description}</p>
          )}
        </div>
        <span
          className={`px-3 py-1 rounded-full text-xs font-semibold border ${getDifficultyColor(
            program.difficulty_level
          )}`}
        >
          {program.difficulty_level.charAt(0).toUpperCase() + program.difficulty_level.slice(1)}
        </span>
      </div>

      {/* Program Details */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {program.duration_weeks && (
          <div className="flex items-center gap-2 text-gray-300">
            <Calendar className="w-4 h-4 text-blue-400" />
            <span className="text-sm">{program.duration_weeks} weeks</span>
          </div>
        )}
        {program.days_per_week && (
          <div className="flex items-center gap-2 text-gray-300">
            <Dumbbell className="w-4 h-4 text-blue-400" />
            <span className="text-sm">{program.days_per_week}x per week</span>
          </div>
        )}
      </div>

      {/* Goals */}
      {program.goals && program.goals.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-4 h-4 text-blue-400" />
            <span className="text-sm font-semibold text-gray-300">Primary Goals</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {program.goals.map((goal, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-lg text-xs"
              >
                {goal}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Template Badge */}
      {program.is_template && (
        <div className="mb-6 flex items-center gap-2 text-purple-400">
          <TrendingUp className="w-4 h-4" />
          <span className="text-xs font-semibold">Pre-Built Template</span>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3 mt-6">
        <button
          onClick={() => onStartProgram(program)}
          className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2.5 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
        >
          <Dumbbell className="w-4 h-4" />
          Start Program
        </button>
        <button
          onClick={() => onCustomize(program)}
          className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2.5 px-4 rounded-lg transition-colors duration-200"
        >
          Customize
        </button>
      </div>
    </div>
  );
}
