/**
 * Workout Page
 *
 * Main workout experience page integrating dashboard and active workout
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useWorkoutSession } from '@/hooks/useWorkoutSession';
import TodaysDashboard from '@/components/TodaysDashboard';
import ActiveWorkout from '@/components/ActiveWorkout';
import WorkoutSummary from '@/components/WorkoutSummary';

export default function WorkoutPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { session, startSession, completeSession } = useWorkoutSession(user?.id);
  const [showSummary, setShowSummary] = useState(false);
  const [completedSessionId, setCompletedSessionId] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  const handleStartWorkout = async (workoutId: string, programId: string) => {
    try {
      await startSession(workoutId, programId);
    } catch (error) {
      console.error('Error starting workout:', error);
      alert('Failed to start workout. Please try again.');
    }
  };

  const handleCompleteWorkout = async () => {
    if (!session) return;

    try {
      const completed = await completeSession();
      if (completed) {
        setCompletedSessionId(completed.id);
        setShowSummary(true);
      }
    } catch (error) {
      console.error('Error completing workout:', error);
      alert('Failed to complete workout. Please try again.');
    }
  };

  const handleCancelWorkout = async () => {
    if (!session) return;

    const confirmed = confirm(
      'Are you sure you want to cancel this workout? Your progress will be saved but the session will be marked as cancelled.'
    );

    if (confirmed) {
      try {
        await completeSession();
        router.push('/dashboard');
      } catch (error) {
        console.error('Error cancelling workout:', error);
      }
    }
  };

  const handleCloseSummary = () => {
    setShowSummary(false);
    setCompletedSessionId(null);
    router.push('/dashboard');
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Show Active Workout if session exists, otherwise show Dashboard */}
      {session ? (
        <ActiveWorkout
          sessionId={session.id}
          workoutId={session.workout_id}
          onComplete={handleCompleteWorkout}
          onCancel={handleCancelWorkout}
        />
      ) : (
        <div className="max-w-4xl mx-auto px-4 py-8">
          <TodaysDashboard onStartWorkout={handleStartWorkout} />
        </div>
      )}

      {/* Workout Summary Modal */}
      {showSummary && completedSessionId && (
        <WorkoutSummary
          sessionId={completedSessionId}
          onClose={handleCloseSummary}
        />
      )}
    </div>
  );
}
