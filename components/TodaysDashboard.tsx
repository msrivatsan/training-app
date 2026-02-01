/**
 * TodaysDashboard Component
 *
 * Main screen showing today's workout overview and user stats
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, Zap, Flame, TrendingUp, Play } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import type { Workout, Exercise } from '@/lib/types';
import ProgressionInsights from './ProgressionInsights';
import DeloadBadge from './DeloadBadge';

interface TodaysDashboardProps {
  onStartWorkout?: (workoutId: string, programId: string) => void;
}

interface TodaysWorkout extends Workout {
  exercises: Exercise[];
  program_id: string;
  program_name: string;
}

interface DailyStats {
  currentStreak: number;
  xpEarnedToday: number;
  exercisesCompleted: number;
  totalExercises: number;
}

export default function TodaysDashboard({ onStartWorkout }: TodaysDashboardProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [todaysWorkout, setTodaysWorkout] = useState<TodaysWorkout | null>(null);
  const [dailyStats, setDailyStats] = useState<DailyStats>({
    currentStreak: 0,
    xpEarnedToday: 0,
    exercisesCompleted: 0,
    totalExercises: 0,
  });
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    if (!user) return;

    const fetchTodaysWorkout = async () => {
      setLoading(true);

      // Get active program
      const { data: program } = await supabase
        .from('programs')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .single();

      if (!program) {
        setLoading(false);
        return;
      }

      // Get today's day of week (0 = Sunday, 6 = Saturday)
      const today = new Date().getDay();

      // Get workout for today
      const { data: workout } = await supabase
        .from('workouts')
        .select('*, exercises(*)')
        .eq('program_id', program.id)
        .eq('day_of_week', today)
        .order('order_index', { ascending: true })
        .single();

      if (workout && workout.exercises) {
        setTodaysWorkout({
          ...workout,
          program_id: program.id,
          program_name: program.name,
        });

        // Calculate completed exercises for today
        const { data: todaysSessions } = await supabase
          .from('workout_sessions')
          .select('*, sets(*)')
          .eq('user_id', user.id)
          .eq('workout_id', workout.id)
          .gte('started_at', new Date().toISOString().split('T')[0])
          .eq('status', 'completed');

        if (todaysSessions && todaysSessions.length > 0) {
          const completedExerciseIds = new Set(
            todaysSessions.flatMap((s) => (s.sets as { exercise_id: string }[] | undefined)?.map((set) => set.exercise_id) || [])
          );
          setDailyStats(prev => ({
            ...prev,
            exercisesCompleted: completedExerciseIds.size,
            totalExercises: workout.exercises?.length || 0,
          }));
        } else {
          setDailyStats(prev => ({
            ...prev,
            totalExercises: workout.exercises?.length || 0,
          }));
        }
      }

      // Calculate streak
      await calculateStreak();

      // Calculate today's XP
      await calculateTodaysXP();

      setLoading(false);
    };

    const calculateStreak = async () => {
      const { data: sessions } = await supabase
        .from('workout_sessions')
        .select('completed_at')
        .eq('user_id', user.id)
        .eq('status', 'completed')
        .order('completed_at', { ascending: false })
        .limit(100);

      if (!sessions || sessions.length === 0) {
        return;
      }

      let streak = 0;
      const currentDate = new Date();
      currentDate.setHours(0, 0, 0, 0);

      for (const session of sessions) {
        const sessionDate = new Date(session.completed_at!);
        sessionDate.setHours(0, 0, 0, 0);

        const diffDays = Math.floor((currentDate.getTime() - sessionDate.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDays === streak) {
          streak++;
        } else if (diffDays > streak) {
          break;
        }
      }

      setDailyStats(prev => ({ ...prev, currentStreak: streak }));
    };

    const calculateTodaysXP = async () => {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const { data: todaysSessions } = await supabase
        .from('workout_sessions')
        .select('*, sets(*)')
        .eq('user_id', user.id)
        .eq('status', 'completed')
        .gte('completed_at', todayStart.toISOString());

      if (!todaysSessions || todaysSessions.length === 0) {
        return;
      }

      // Calculate XP: 10 XP per completed set + bonus for workout completion
      let totalXP = 0;
      todaysSessions.forEach((session) => {
        const setsCount = session.sets?.length || 0;
        totalXP += setsCount * 10; // 10 XP per set
        totalXP += 100; // 100 XP bonus for completing workout
      });

      setDailyStats(prev => ({ ...prev, xpEarnedToday: totalXP }));
    };

    fetchTodaysWorkout();
  }, [user, supabase]);

  const handleStartWorkout = () => {
    if (!todaysWorkout) return;

    if (onStartWorkout) {
      onStartWorkout(todaysWorkout.id, todaysWorkout.program_id);
    } else {
      router.push(`/workout/${todaysWorkout.id}`);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!todaysWorkout) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-8 text-center">
        <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-400" />
        <h2 className="text-2xl font-bold text-gray-800 mb-2">No Workout Scheduled</h2>
        <p className="text-gray-600">
          You don&apos;t have a workout scheduled for today. Create or activate a program to get started!
        </p>
      </div>
    );
  }

  const workoutTypeLabel = todaysWorkout.workout_type === 'strength' ? 'Strength' :
                           todaysWorkout.workout_type === 'hypertrophy' ? 'Hypertrophy' :
                           todaysWorkout.workout_type === 'deload' ? 'Deload' : 'Mixed';

  const progressPercentage = dailyStats.totalExercises > 0
    ? Math.round((dailyStats.exercisesCompleted / dailyStats.totalExercises) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Deload Badge */}
      {user && todaysWorkout && (
        <DeloadBadge userId={user.id} programId={todaysWorkout.program_id} />
      )}

      {/* Today's Workout Card */}
      <div className="bg-gradient-to-br from-purple-600 to-purple-800 rounded-xl shadow-lg p-8 text-white">
        <div className="flex items-start justify-between mb-6">
          <div>
            <p className="text-purple-200 text-sm font-medium mb-1">{todaysWorkout.program_name}</p>
            <h1 className="text-3xl font-bold mb-2">{todaysWorkout.name}</h1>
            <div className="inline-block bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-medium">
              {workoutTypeLabel}
            </div>
          </div>
          <Calendar className="w-8 h-8 text-purple-300" />
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-purple-200">Workout Progress</span>
            <span className="font-semibold">{dailyStats.exercisesCompleted}/{dailyStats.totalExercises} exercises</span>
          </div>
          <div className="w-full bg-purple-900/50 rounded-full h-3 overflow-hidden">
            <div
              className="bg-white h-full rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>

        {/* Start Workout Button */}
        <button
          onClick={handleStartWorkout}
          className="w-full bg-white text-purple-700 font-bold py-4 px-6 rounded-xl hover:bg-purple-50 transition-colors duration-200 flex items-center justify-center gap-3 shadow-lg"
        >
          <Play className="w-6 h-6" fill="currentColor" />
          <span className="text-lg">
            {progressPercentage > 0 ? 'Continue Workout' : 'Start Workout'}
          </span>
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Streak Card */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Flame className="w-6 h-6 text-orange-500" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Current Streak</p>
              <p className="text-2xl font-bold text-gray-900">{dailyStats.currentStreak} days</p>
            </div>
          </div>
        </div>

        {/* XP Card */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Zap className="w-6 h-6 text-yellow-500" />
            </div>
            <div>
              <p className="text-sm text-gray-600">XP Earned Today</p>
              <p className="text-2xl font-bold text-gray-900">{dailyStats.xpEarnedToday} XP</p>
            </div>
          </div>
        </div>

        {/* Volume Card */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-green-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-green-500" />
            </div>
            <div>
              <p className="text-sm text-gray-600">This Week</p>
              <p className="text-2xl font-bold text-gray-900">{dailyStats.exercisesCompleted}/{dailyStats.totalExercises * 7}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Progression Insights */}
      {user && <ProgressionInsights userId={user.id} limit={3} />}

      {/* Exercise List Preview */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Today&apos;s Exercises</h3>
        <div className="space-y-2">
          {todaysWorkout.exercises.slice(0, 5).map((exercise, index) => (
            <div
              key={exercise.id}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center text-purple-700 font-semibold text-sm">
                  {index + 1}
                </div>
                <div>
                  <p className="font-medium text-gray-900">{exercise.name}</p>
                  <p className="text-sm text-gray-600">
                    {exercise.target_sets} sets × {exercise.target_reps} reps
                    {exercise.target_weight_kg && ` @ ${exercise.target_weight_kg}kg`}
                  </p>
                </div>
              </div>
            </div>
          ))}
          {todaysWorkout.exercises.length > 5 && (
            <p className="text-center text-sm text-gray-500 mt-2">
              +{todaysWorkout.exercises.length - 5} more exercises
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
