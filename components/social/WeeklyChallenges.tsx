'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ChallengeWithProgress } from '@/lib/types/social';

export default function WeeklyChallenges() {
  const [challenges, setChallenges] = useState<ChallengeWithProgress[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchChallenges();
  }, []);

  const fetchChallenges = async () => {
    try {
      const response = await fetch('/api/social/challenges');
      const data = await response.json();
      setChallenges(data);
    } catch (error) {
      console.error('Error fetching challenges:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinChallenge = async (challengeId: string) => {
    try {
      const response = await fetch('/api/social/challenges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ challenge_id: challengeId }),
      });

      if (response.ok) {
        fetchChallenges();
      }
    } catch (error) {
      console.error('Error joining challenge:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getChallengeIcon = (type: string) => {
    switch (type) {
      case 'volume': return '💪';
      case 'pr_count': return '🏆';
      case 'workout_count': return '📅';
      case 'consistency': return '🔥';
      default: return '⭐';
    }
  };

  if (loading) return <div>Loading challenges...</div>;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold mb-2">Guild Quests</h2>
        <p className="text-gray-600">
          Join community challenges to earn bonus XP and compete with lifters worldwide!
        </p>
      </div>

      {challenges.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No active challenges right now. Check back soon!
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {challenges.map((challenge) => (
            <div key={challenge.id} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <span className="text-3xl">{getChallengeIcon(challenge.challenge_type)}</span>
                  <div>
                    <h3 className="font-bold text-lg">{challenge.title}</h3>
                    <p className="text-sm text-gray-500">
                      {formatDate(challenge.start_date)} - {formatDate(challenge.end_date)}
                    </p>
                  </div>
                </div>
              </div>

              <p className="text-gray-700 mb-4">{challenge.description}</p>

              <div className="bg-gray-100 rounded p-3 mb-4">
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium">Target</span>
                  <span className="font-bold">
                    {challenge.target_value} {challenge.target_unit}
                  </span>
                </div>
                {challenge.user_progress && (
                  <>
                    <div className="w-full bg-gray-300 rounded-full h-2 mb-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full transition-all"
                        style={{ width: `${Math.min(100, challenge.progress_percentage)}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">
                        {challenge.user_progress.current_value.toFixed(0)} / {challenge.target_value}
                      </span>
                      <span className="font-semibold text-blue-600">
                        {challenge.progress_percentage.toFixed(0)}%
                      </span>
                    </div>
                    {challenge.user_progress.completed && (
                      <div className="mt-2 text-green-600 font-semibold text-center">
                        ✅ Completed! +{challenge.bonus_xp} XP
                      </div>
                    )}
                  </>
                )}
              </div>

              <div className="flex items-center justify-between">
                <div className="text-sm">
                  <div className="text-gray-600">
                    {challenge.participants_count.toLocaleString()} lifters joined
                  </div>
                  <div className="text-green-600 font-medium">
                    {challenge.completions_count.toLocaleString()} completed
                  </div>
                </div>
                {!challenge.user_progress ? (
                  <Button onClick={() => handleJoinChallenge(challenge.id)}>
                    Join Quest
                  </Button>
                ) : (
                  <div className="text-sm">
                    <div className="text-purple-600 font-semibold">
                      {challenge.xp_multiplier}x XP Multiplier
                    </div>
                    <div className="text-gray-600">
                      +{challenge.bonus_xp} bonus XP
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
