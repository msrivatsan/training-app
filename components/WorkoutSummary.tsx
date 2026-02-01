/**
 * WorkoutSummary Component
 *
 * Modal shown after workout completion with stats, achievements, and PRs
 */

'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { X, Trophy, TrendingUp, Zap, Award, Calendar, Target } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import type { Workout } from '@/lib/types';
import {
  awardXp,
  updateWorkoutStreak,
  getAllAchievements,
  getUserAchievementProgress,
  updateAchievementProgress,
} from '@/lib/gamification/service';
import {
  calculateSetXp,
  calculateWorkoutXp,
  calculatePrXp,
} from '@/lib/gamification/xp-utils';
import {
  checkSessionAchievements,
  AchievementCheckResult,
} from '@/lib/gamification/achievement-utils';
import { Achievement as GamificationAchievement } from '@/lib/gamification/types';
import AchievementToast from './AchievementToast';
import LevelUpModal from './LevelUpModal';

interface SetWithExercise {
  exercise_id: string;
  weight_kg: number;
  reps: number;
  exercise?: {
    name: string;
  };
}

interface SessionWithWorkout {
  user_id: string;
  started_at: string;
  completed_at: string | null;
  workout?: {
    order_index: number;
  };
  program_id: string | null;
}

interface WorkoutSummaryProps {
  sessionId: string;
  onClose: () => void;
  onViewNextWorkout?: () => void;
}

interface SummaryStats {
  totalVolume: number;
  totalSets: number;
  totalReps: number;
  duration: number;
  xpEarned: number;
}

interface PersonalRecord {
  exerciseName: string;
  weight: number;
  reps: number;
  isNew: boolean;
}

interface Achievement {
  title: string;
  description: string;
  icon: string;
}

export default function WorkoutSummary({
  sessionId,
  onClose,
  onViewNextWorkout,
}: WorkoutSummaryProps) {
  const [stats, setStats] = useState<SummaryStats>({
    totalVolume: 0,
    totalSets: 0,
    totalReps: 0,
    duration: 0,
    xpEarned: 0,
  });
  const [prs, setPRs] = useState<PersonalRecord[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [nextWorkout, setNextWorkout] = useState<Workout | null>(null);
  const [loading, setLoading] = useState(true);
  const [showConfetti, setShowConfetti] = useState(true);
  const supabase = createClient();

  // Gamification state
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [levelUpData, setLevelUpData] = useState<{
    previousLevel: number;
    newLevel: number;
    title: string;
    totalXp: number;
  } | null>(null);
  const [newAchievements, setNewAchievements] = useState<
    GamificationAchievement[]
  >([]);
  const [currentAchievementIndex, setCurrentAchievementIndex] = useState(0);

  useEffect(() => {
    const fetchSummaryData = async () => {
      setLoading(true);

      // Get session data
      const { data: session } = await supabase
        .from('workout_sessions')
        .select('*, workout:workouts(*)')
        .eq('id', sessionId)
        .single() as { data: SessionWithWorkout | null };

      if (!session) {
        setLoading(false);
        return;
      }

      // Get all sets for this session
      const { data: sets } = await supabase
        .from('sets')
        .select('*, exercise:exercises(name, exercise_library_id)')
        .eq('session_id', sessionId);

      if (sets) {
        // Calculate stats
        const totalVolume = sets.reduce((sum, set) => sum + set.weight_kg * set.reps, 0);
        const totalReps = sets.reduce((sum, set) => sum + set.reps, 0);
        const totalSets = sets.length;

        // Calculate duration
        const startTime = new Date(session.started_at);
        const endTime = session.completed_at ? new Date(session.completed_at) : new Date();
        const durationMinutes = Math.round((endTime.getTime() - startTime.getTime()) / 60000);

        // Check for PRs
        const prsFound = await checkForPRs(sets);

        // Calculate XP using new gamification system
        const exerciseNames = Array.from(new Set(sets.map(s => s.exercise?.name).filter(Boolean))) as string[];
        let totalXp = 0;

        // XP for sets
        const setXp = sets.reduce((sum, set) => {
          const exerciseName = set.exercise?.name || '';
          return sum + calculateSetXp(exerciseName);
        }, 0);
        totalXp += setXp;

        // XP for workout completion
        const workoutXp = calculateWorkoutXp(totalSets, exerciseNames);
        totalXp += workoutXp;

        // XP for PRs
        const prXp = prsFound.reduce((sum, pr) => {
          const improvement = 5; // Simplified, could calculate actual improvement
          return sum + calculatePrXp(pr.exerciseName, improvement);
        }, 0);
        totalXp += prXp;

        // Award XP and check for level up
        const xpResult = await awardXp(
          session.user_id,
          totalXp,
          'workout_complete',
          `Completed workout with ${totalSets} sets and ${Math.round(totalVolume)}kg volume`,
          sessionId,
          { totalSets, totalVolume, totalReps }
        );

        if (xpResult && xpResult.leveled_up) {
          // Show level up modal
          setLevelUpData({
            previousLevel: xpResult.previous_level,
            newLevel: xpResult.new_level,
            title: 'Novice Lifter', // Will be updated from user_levels
            totalXp: xpResult.new_total_xp,
          });
          setTimeout(() => setShowLevelUp(true), 1000);
        }

        // Update workout streak
        const streakResult = await updateWorkoutStreak(session.user_id);

        setStats({
          totalVolume,
          totalSets,
          totalReps,
          duration: durationMinutes,
          xpEarned: totalXp,
        });

        // Update session with calculated stats
        await supabase
          .from('workout_sessions')
          .update({
            total_volume_kg: totalVolume,
            duration_minutes: durationMinutes,
          })
          .eq('id', sessionId);

        // Check for new achievements using gamification system
        await checkForGamificationAchievements(session.user_id, sets, totalVolume, totalSets, totalReps, prsFound.length);
      }

      // Get next workout
      if (session.workout && session.program_id) {
        const { data: nextWorkoutData } = await supabase
          .from('workouts')
          .select('*')
          .eq('program_id', session.program_id)
          .gt('order_index', session.workout.order_index)
          .order('order_index', { ascending: true })
          .limit(1)
          .single();

        if (nextWorkoutData) {
          setNextWorkout(nextWorkoutData);
        }
      }

      setLoading(false);

      // Hide confetti after animation
      setTimeout(() => setShowConfetti(false), 3000);
    };

    const checkForPRs = async (sets: SetWithExercise[]): Promise<PersonalRecord[]> => {
      const exerciseMap = new Map<string, { weight: number; reps: number; name: string }>();

      // Find best set for each exercise in this session
      sets.forEach((set) => {
        const exerciseId = set.exercise_id;
        const score = set.weight_kg * set.reps;
        const existing = exerciseMap.get(exerciseId);

        if (!existing || score > existing.weight * existing.reps) {
          exerciseMap.set(exerciseId, {
            weight: set.weight_kg,
            reps: set.reps,
            name: set.exercise?.name || 'Unknown',
          });
        }
      });

      // Check against historical data for each exercise
      const newPRs: PersonalRecord[] = [];

      for (const [exerciseId, current] of Array.from(exerciseMap.entries())) {
        const { data: historicalSets } = await supabase
          .from('sets')
          .select('weight_kg, reps')
          .eq('exercise_id', exerciseId)
          .neq('session_id', sessionId)
          .order('created_at', { ascending: false })
          .limit(100);

        let isNewPR = true;
        if (historicalSets && historicalSets.length > 0) {
          const currentScore = current.weight * current.reps;
          const historicalBest = Math.max(
            ...historicalSets.map((s) => s.weight_kg * s.reps)
          );
          isNewPR = currentScore > historicalBest;
        }

        if (isNewPR && historicalSets && historicalSets.length > 0) {
          newPRs.push({
            exerciseName: current.name,
            weight: current.weight,
            reps: current.reps,
            isNew: true,
          });

          // Award XP for PR
          await awardXp(
            session.user_id,
            calculatePrXp(current.name, 5),
            'pr_broken',
            `New PR: ${current.name} - ${current.reps} reps @ ${current.weight}kg`,
            sessionId,
            { exercise: current.name, weight: current.weight, reps: current.reps }
          );
        }
      }

      setPRs(newPRs);
      return newPRs;
    };

    const checkForGamificationAchievements = async (
      userId: string,
      sets: SetWithExercise[],
      totalVolume: number,
      totalSets: number,
      totalReps: number,
      prCount: number
    ) => {
      try {
        // Get all achievements and user's progress
        const [allAchievements, userProgress, completedSessions, streakData] = await Promise.all([
          getAllAchievements(),
          getUserAchievementProgress(userId),
          supabase
            .from('workout_sessions')
            .select('id')
            .eq('user_id', userId)
            .eq('status', 'completed'),
          supabase
            .from('workout_streaks')
            .select('current_streak')
            .eq('user_id', userId)
            .single()
        ]);

        const sessionCount = completedSessions?.data?.length || 0;
        const currentStreak = streakData?.data?.current_streak || 0;

        // Get workout hour
        const workoutHour = new Date().getHours();

        // Prepare session data for achievement checking
        const exercises = Array.from(
          new Map(
            sets.map((set) => [
              set.exercise?.name || '',
              {
                name: set.exercise?.name || '',
                maxWeight: set.weight_kg,
              },
            ])
          ).values()
        );

        const sessionData = {
          exercises,
          totalVolume,
          setCount: sessionCount,
          repCount: totalReps,
          currentStreak,
          workoutHour,
          prCount,
        };

        // Check for newly unlocked achievements
        const achievementResults = checkSessionAchievements(
          allAchievements,
          userProgress,
          sessionData
        );

        const unlockedAchievements: GamificationAchievement[] = [];

        // Update progress and award XP for unlocked achievements
        for (const result of achievementResults) {
          await updateAchievementProgress(
            userId,
            result.achievement.id,
            result.progress,
            result.unlocked
          );

          if (result.unlocked && !userProgress.find(p => p.achievement_id === result.achievement.id && p.is_unlocked)) {
            unlockedAchievements.push(result.achievement);

            // Award achievement XP
            await awardXp(
              userId,
              result.achievement.xp_reward,
              'achievement',
              `Achievement unlocked: ${result.achievement.name}`,
              sessionId,
              { achievement_id: result.achievement.id, achievement_code: result.achievement.code }
            );
          }
        }

        setNewAchievements(unlockedAchievements);

        // Also set legacy achievements for display
        const legacyAchievements: Achievement[] = unlockedAchievements.map(a => ({
          title: a.name,
          description: a.description,
          icon: a.icon || '🏆',
        }));
        setAchievements(legacyAchievements);
      } catch (error) {
        console.error('Error checking achievements:', error);
      }
    };

    fetchSummaryData();
  }, [sessionId, supabase]);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      {/* Confetti Animation */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none">
          {Array.from({ length: 50 }).map((_, i) => (
            <motion.div
              key={i}
              initial={{
                x: '50vw',
                y: '50vh',
                opacity: 1,
                scale: Math.random() * 0.5 + 0.5,
              }}
              animate={{
                x: Math.random() * window.innerWidth,
                y: Math.random() * window.innerHeight,
                opacity: 0,
                rotate: Math.random() * 360,
              }}
              transition={{
                duration: Math.random() * 2 + 1,
                ease: 'easeOut',
              }}
              className="absolute w-3 h-3 rounded-full"
              style={{
                backgroundColor: ['#8B5CF6', '#EC4899', '#F59E0B', '#10B981'][
                  Math.floor(Math.random() * 4)
                ],
              }}
            />
          ))}
        </div>
      )}

      {/* Summary Card */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="bg-gradient-to-br from-purple-600 to-purple-800 text-white p-8 rounded-t-2xl relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-full transition-colors"
          >
            <X className="w-6 h-6" />
          </button>

          <div className="text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring' }}
              className="inline-block p-4 bg-white/20 rounded-full mb-4"
            >
              <Trophy className="w-16 h-16" />
            </motion.div>
            <h2 className="text-3xl font-bold mb-2">Workout Complete!</h2>
            <p className="text-purple-200">Outstanding effort today</p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="p-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-purple-50 rounded-xl p-4 text-center">
              <TrendingUp className="w-8 h-8 text-purple-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900">
                {stats.totalVolume.toLocaleString()}kg
              </p>
              <p className="text-sm text-gray-600">Total Volume</p>
            </div>

            <div className="bg-blue-50 rounded-xl p-4 text-center">
              <Target className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900">{stats.totalSets}</p>
              <p className="text-sm text-gray-600">Sets</p>
            </div>

            <div className="bg-green-50 rounded-xl p-4 text-center">
              <Zap className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900">{stats.xpEarned}</p>
              <p className="text-sm text-gray-600">XP Earned</p>
            </div>

            <div className="bg-orange-50 rounded-xl p-4 text-center">
              <Calendar className="w-8 h-8 text-orange-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900">{stats.duration}m</p>
              <p className="text-sm text-gray-600">Duration</p>
            </div>
          </div>

          {/* Personal Records */}
          {prs.length > 0 && (
            <div className="mb-8">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Trophy className="w-6 h-6 text-yellow-500" />
                New Personal Records!
              </h3>
              <div className="space-y-3">
                {prs.map((pr, index) => (
                  <motion.div
                    key={index}
                    initial={{ x: -50, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-500 rounded-lg p-4"
                  >
                    <p className="font-bold text-gray-900">{pr.exerciseName}</p>
                    <p className="text-sm text-gray-700">
                      {pr.reps} reps @ {pr.weight}kg
                    </p>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Achievements */}
          {achievements.length > 0 && (
            <div className="mb-8">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Award className="w-6 h-6 text-purple-500" />
                Achievements Unlocked!
              </h3>
              <div className="space-y-3">
                {achievements.map((achievement, index) => (
                  <motion.div
                    key={index}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: index * 0.2, type: 'spring' }}
                    className="bg-purple-50 border-2 border-purple-500 rounded-lg p-4 flex items-center gap-4"
                  >
                    <div className="text-4xl">{achievement.icon}</div>
                    <div>
                      <p className="font-bold text-gray-900">{achievement.title}</p>
                      <p className="text-sm text-gray-700">{achievement.description}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Next Workout Preview */}
          {nextWorkout && (
            <div className="bg-gray-50 rounded-xl p-6 mb-6">
              <h3 className="text-lg font-bold text-gray-900 mb-3">Up Next</h3>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-gray-900">{nextWorkout.name}</p>
                  <p className="text-sm text-gray-600 capitalize">
                    {nextWorkout.workout_type} Day
                  </p>
                </div>
                {onViewNextWorkout && (
                  <button
                    onClick={onViewNextWorkout}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors"
                  >
                    Preview
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-4">
            <button
              onClick={onClose}
              className="flex-1 py-3 px-6 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      </motion.div>

      {/* Level Up Modal */}
      {levelUpData && (
        <LevelUpModal
          show={showLevelUp}
          onClose={() => setShowLevelUp(false)}
          previousLevel={levelUpData.previousLevel}
          newLevel={levelUpData.newLevel}
          title={levelUpData.title as any}
          totalXp={levelUpData.totalXp}
        />
      )}

      {/* Achievement Toasts */}
      {newAchievements[currentAchievementIndex] && (
        <AchievementToast
          achievement={newAchievements[currentAchievementIndex]}
          show={currentAchievementIndex < newAchievements.length}
          onClose={() => {
            if (currentAchievementIndex < newAchievements.length - 1) {
              // Show next achievement after a delay
              setTimeout(() => {
                setCurrentAchievementIndex(currentAchievementIndex + 1);
              }, 500);
            }
          }}
          xpEarned={newAchievements[currentAchievementIndex].xp_reward}
        />
      )}
    </div>
  );
}
