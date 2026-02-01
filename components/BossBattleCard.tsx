'use client';

import { motion } from 'framer-motion';
import {
  Sword,
  Skull,
  Shield,
  Calendar,
  Target,
  Zap,
  TrendingUp,
} from 'lucide-react';
import { BossBattle, UserBossProgress } from '@/lib/gamification/types';

interface BossBattleCardProps {
  boss: BossBattle;
  userProgress?: UserBossProgress;
}

export default function BossBattleCard({
  boss,
  userProgress,
}: BossBattleCardProps) {
  // Calculate progress percentage
  const progressPercentage = userProgress
    ? Math.min(100, (userProgress.current_progress / boss.target_value) * 100)
    : 0;

  // Calculate days remaining
  const endDate = new Date(boss.end_date);
  const today = new Date();
  const daysRemaining = Math.ceil(
    (endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );

  // Difficulty colors
  const difficultyColors = {
    normal: 'from-blue-600 to-blue-800',
    hard: 'from-orange-600 to-orange-800',
    nightmare: 'from-red-600 to-red-900',
  };

  const difficultyBorder = {
    normal: 'border-blue-400',
    hard: 'border-orange-400',
    nightmare: 'border-red-400',
  };

  const isCompleted = userProgress?.is_completed || false;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`
        bg-gradient-to-br ${difficultyColors[boss.difficulty]}
        border-2 ${difficultyBorder[boss.difficulty]}
        rounded-xl p-6 text-white shadow-xl
        ${isCompleted ? 'opacity-60' : ''}
      `}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          {/* Boss icon */}
          <div className="p-3 rounded-full bg-white/20 backdrop-blur-sm">
            {boss.difficulty === 'nightmare' ? (
              <Skull className="w-8 h-8" />
            ) : boss.difficulty === 'hard' ? (
              <Sword className="w-8 h-8" />
            ) : (
              <Shield className="w-8 h-8" />
            )}
          </div>

          <div>
            <h3 className="text-2xl font-bold">{boss.title}</h3>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-full">
                {boss.difficulty}
              </span>
              {isCompleted && (
                <span className="text-xs bg-green-500/80 px-2 py-0.5 rounded-full flex items-center gap-1">
                  ✓ Defeated
                </span>
              )}
            </div>
          </div>
        </div>

        {/* XP Reward */}
        <div className="text-right">
          <div className="flex items-center gap-1 text-yellow-300 font-bold">
            <Zap className="w-5 h-5" fill="currentColor" />
            {Math.floor(boss.xp_base_reward * boss.xp_multiplier)} XP
          </div>
          <div className="text-xs opacity-80">{boss.xp_multiplier}x multiplier</div>
        </div>
      </div>

      {/* Description */}
      <p className="text-sm opacity-90 mb-4">{boss.description}</p>

      {/* Challenge details */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
          <div className="flex items-center gap-2 text-xs opacity-80 mb-1">
            <Target className="w-4 h-4" />
            Target
          </div>
          <div className="font-bold">
            {boss.target_value}
            {boss.challenge_type === 'weight_target' && 'kg'}
            {boss.challenge_type === 'volume_target' && 'kg volume'}
            {boss.challenge_type === 'streak_target' && ' days'}
            {boss.challenge_type === 'pr_count' && ' PRs'}
          </div>
          {boss.exercise_name && (
            <div className="text-xs opacity-70 mt-1">{boss.exercise_name}</div>
          )}
        </div>

        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
          <div className="flex items-center gap-2 text-xs opacity-80 mb-1">
            <Calendar className="w-4 h-4" />
            Time Left
          </div>
          <div className="font-bold">
            {daysRemaining} {daysRemaining === 1 ? 'day' : 'days'}
          </div>
          <div className="text-xs opacity-70 mt-1">
            Until {new Date(boss.end_date).toLocaleDateString()}
          </div>
        </div>
      </div>

      {/* Progress bar */}
      {userProgress && !isCompleted && (
        <div className="mb-4">
          <div className="flex justify-between text-sm mb-2">
            <span>Your Progress</span>
            <span className="font-bold">
              {userProgress.current_progress.toFixed(1)} /{' '}
              {boss.target_value}
            </span>
          </div>

          <div className="h-3 bg-black/30 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progressPercentage}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
              className="h-full bg-gradient-to-r from-yellow-400 to-yellow-200 rounded-full flex items-center justify-end pr-1"
            >
              {progressPercentage >= 10 && (
                <span className="text-xs font-bold text-yellow-900">
                  {progressPercentage.toFixed(0)}%
                </span>
              )}
            </motion.div>
          </div>
        </div>
      )}

      {/* Call to action */}
      {!isCompleted && (
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="bg-white/20 backdrop-blur-sm rounded-lg p-3 flex items-center gap-2 cursor-pointer"
        >
          <TrendingUp className="w-5 h-5" />
          <span className="font-bold">Keep training to defeat this boss!</span>
        </motion.div>
      )}

      {isCompleted && userProgress && (
        <div className="bg-green-500/30 backdrop-blur-sm rounded-lg p-3 flex items-center gap-2">
          <span className="text-2xl">🏆</span>
          <div>
            <div className="font-bold">Boss Defeated!</div>
            <div className="text-sm opacity-80">
              Earned {userProgress.xp_earned} XP
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
