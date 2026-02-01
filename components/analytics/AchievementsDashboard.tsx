'use client';

import { useEffect, useState } from 'react';
import { Trophy, Lock, Star, Target, Zap } from 'lucide-react';

interface Achievement {
  id: string;
  title: string;
  description: string;
  category: string;
  date_earned: string | null;
  icon: string | null;
  progress?: number;
  target?: number;
}

export default function AchievementsDashboard() {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    fetchAchievements();
  }, []);

  const fetchAchievements = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/achievements');
      if (response.ok) {
        const data = await response.json();
        setAchievements(data.achievements || []);
      }
    } catch (error) {
      console.error('Error fetching achievements:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading achievements...</p>
        </div>
      </div>
    );
  }

  const unlockedAchievements = achievements.filter(a => a.date_earned);
  const lockedAchievements = achievements.filter(a => !a.date_earned);

  const filteredAchievements =
    filter === 'unlocked'
      ? unlockedAchievements
      : filter === 'locked'
      ? lockedAchievements
      : achievements;

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'strength':
        return <Zap className="h-5 w-5" />;
      case 'consistency':
        return <Target className="h-5 w-5" />;
      case 'volume':
        return <Star className="h-5 w-5" />;
      default:
        return <Trophy className="h-5 w-5" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'strength':
        return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'consistency':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'volume':
        return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
      case 'progression':
        return 'bg-green-500/10 text-green-500 border-green-500/20';
      default:
        return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">Achievements</h2>
        <p className="text-muted-foreground">Unlock achievements by reaching milestones and staying consistent</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="bg-card border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Trophy className="h-4 w-4 text-yellow-500" />
            <p className="text-sm text-muted-foreground">Unlocked</p>
          </div>
          <p className="text-2xl font-bold">{unlockedAchievements.length}</p>
        </div>
        <div className="bg-card border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Lock className="h-4 w-4 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Locked</p>
          </div>
          <p className="text-2xl font-bold">{lockedAchievements.length}</p>
        </div>
        <div className="bg-card border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Star className="h-4 w-4 text-primary" />
            <p className="text-sm text-muted-foreground">Completion</p>
          </div>
          <p className="text-2xl font-bold">
            {achievements.length > 0
              ? Math.round((unlockedAchievements.length / achievements.length) * 100)
              : 0}
            %
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg text-sm font-medium ${
            filter === 'all' ? 'bg-primary text-primary-foreground' : 'bg-muted'
          }`}
        >
          All ({achievements.length})
        </button>
        <button
          onClick={() => setFilter('unlocked')}
          className={`px-4 py-2 rounded-lg text-sm font-medium ${
            filter === 'unlocked' ? 'bg-primary text-primary-foreground' : 'bg-muted'
          }`}
        >
          Unlocked ({unlockedAchievements.length})
        </button>
        <button
          onClick={() => setFilter('locked')}
          className={`px-4 py-2 rounded-lg text-sm font-medium ${
            filter === 'locked' ? 'bg-primary text-primary-foreground' : 'bg-muted'
          }`}
        >
          Locked ({lockedAchievements.length})
        </button>
      </div>

      {/* Achievement Grid */}
      {filteredAchievements.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAchievements.map(achievement => (
            <div
              key={achievement.id}
              className={`rounded-lg border-2 p-6 transition-all ${
                achievement.date_earned
                  ? 'bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border-yellow-500/20'
                  : 'bg-card border-muted opacity-60'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div
                  className={`p-3 rounded-lg border-2 ${getCategoryColor(achievement.category)}`}
                >
                  {getCategoryIcon(achievement.category)}
                </div>
                {achievement.date_earned ? (
                  <Trophy className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                ) : (
                  <Lock className="h-5 w-5 text-muted-foreground" />
                )}
              </div>

              <h3 className="font-semibold mb-2">{achievement.title}</h3>
              <p className="text-sm text-muted-foreground mb-3">{achievement.description}</p>

              {achievement.progress !== undefined && achievement.target && !achievement.date_earned && (
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Progress</span>
                    <span>
                      {achievement.progress} / {achievement.target}
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-primary rounded-full h-2 transition-all"
                      style={{
                        width: `${Math.min((achievement.progress / achievement.target) * 100, 100)}%`,
                      }}
                    />
                  </div>
                </div>
              )}

              {achievement.date_earned && (
                <p className="text-xs text-muted-foreground mt-3">
                  Unlocked {new Date(achievement.date_earned).toLocaleDateString()}
                </p>
              )}

              <div className="mt-3">
                <span
                  className={`text-xs px-2 py-1 rounded-full capitalize ${getCategoryColor(
                    achievement.category
                  )}`}
                >
                  {achievement.category}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex items-center justify-center h-64 bg-muted/20 rounded-lg border-2 border-dashed">
          <div className="text-center">
            <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Achievements Yet</h3>
            <p className="text-muted-foreground">
              Complete workouts and hit milestones to unlock achievements
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
