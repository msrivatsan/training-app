'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Trophy,
  Award,
  Zap,
  TrendingUp,
  Calendar,
  Target,
  Lock,
  Sparkles,
  Flame,
  Sword,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import LevelBadge from '@/components/LevelBadge';
import PowerRatingGauge from '@/components/PowerRatingGauge';
import BossBattleCard from '@/components/BossBattleCard';
import {
  getUserLevel,
  getUserAchievementProgress,
  getAllAchievements,
  getWorkoutStreak,
  getLatestStrengthScore,
  getStrengthScoreHistory,
  getActiveBossBattles,
  getUserBossProgress,
  getRecentXpTransactions,
} from '@/lib/gamification/service';
import {
  UserLevel,
  Achievement,
  UserAchievementProgress,
  WorkoutStreak,
  StrengthScore,
  BossBattle,
  UserBossProgress,
  XpTransaction,
} from '@/lib/gamification/types';
import {
  getAchievementTierColor,
  getCategoryIcon,
  groupAchievementsByCategory,
} from '@/lib/gamification/achievement-utils';
import * as LucideIcons from 'lucide-react';

export default function ProfileStatsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);

  // State
  const [userLevel, setUserLevel] = useState<UserLevel | null>(null);
  const [streak, setStreak] = useState<WorkoutStreak | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [userAchievements, setUserAchievements] = useState<
    UserAchievementProgress[]
  >([]);
  const [powerRating, setPowerRating] = useState<StrengthScore | null>(null);
  const [powerRatingHistory, setPowerRatingHistory] = useState<StrengthScore[]>(
    []
  );
  const [bossBattles, setBossBattles] = useState<BossBattle[]>([]);
  const [bossProgress, setBossProgress] = useState<UserBossProgress[]>([]);
  const [recentXp, setRecentXp] = useState<XpTransaction[]>([]);

  // Tab state
  const [activeTab, setActiveTab] = useState<
    'overview' | 'achievements' | 'bosses' | 'stats'
  >('overview');

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  async function loadData() {
    if (!user) return;

    setLoading(true);
    try {
      const [
        levelData,
        streakData,
        achievementsData,
        userAchievementsData,
        powerRatingData,
        powerHistoryData,
        bossesData,
        bossProgressData,
        xpData,
      ] = await Promise.all([
        getUserLevel(user.id),
        getWorkoutStreak(user.id),
        getAllAchievements(),
        getUserAchievementProgress(user.id),
        getLatestStrengthScore(user.id),
        getStrengthScoreHistory(user.id, 10),
        getActiveBossBattles(),
        getUserBossProgress(user.id),
        getRecentXpTransactions(user.id, 10),
      ]);

      setUserLevel(levelData);
      setStreak(streakData);
      setAchievements(achievementsData);
      setUserAchievements(userAchievementsData);
      setPowerRating(powerRatingData);
      setPowerRatingHistory(powerHistoryData);
      setBossBattles(bossesData);
      setBossProgress(bossProgressData);
      setRecentXp(xpData);
    } catch (error) {
      console.error('Error loading profile data:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading || !userLevel) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your profile...</p>
        </div>
      </div>
    );
  }

  // Calculate stats
  const unlockedCount = userAchievements.filter((a) => a.is_unlocked).length;
  const totalAchievements = achievements.length;
  const achievementProgress = (unlockedCount / totalAchievements) * 100;

  const previousPowerRating =
    powerRatingHistory.length > 1 ? powerRatingHistory[1].power_rating : undefined;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-purple-50 dark:from-gray-900 dark:to-purple-900/20">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold mb-2 text-gray-900 dark:text-white">
            Your RPG Profile
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Track your journey to legendary strength
          </p>
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto">
          {[
            { id: 'overview', label: 'Overview', icon: Sparkles },
            { id: 'achievements', label: 'Achievements', icon: Trophy },
            { id: 'bosses', label: 'Boss Battles', icon: Sword },
            { id: 'stats', label: 'Stats', icon: TrendingUp },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`
                flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all
                ${
                  activeTab === tab.id
                    ? 'bg-purple-600 text-white shadow-lg'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }
              `}
            >
              <tab.icon className="w-5 h-5" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Level Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg"
            >
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <Zap className="w-6 h-6 text-purple-600" />
                Level & Experience
              </h2>

              <div className="flex justify-center mb-6">
                <LevelBadge
                  level={userLevel.current_level}
                  title={userLevel.title}
                  currentXp={userLevel.total_xp}
                  xpToNext={userLevel.xp_to_next_level}
                  showProgress={true}
                  size="lg"
                />
              </div>

              {/* Recent XP */}
              <div className="mt-6">
                <h3 className="text-sm font-bold text-gray-600 dark:text-gray-400 mb-3">
                  Recent XP Gains
                </h3>
                <div className="space-y-2">
                  {recentXp.slice(0, 5).map((xp) => (
                    <div
                      key={xp.id}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="text-gray-700 dark:text-gray-300">
                        {xp.description || xp.xp_type}
                      </span>
                      <span className="font-bold text-purple-600">
                        +{xp.xp_amount} XP
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Power Rating Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg"
            >
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <Flame className="w-6 h-6 text-orange-600" />
                Power Rating
              </h2>

              <div className="flex justify-center">
                {powerRating ? (
                  <PowerRatingGauge
                    powerRating={powerRating.power_rating}
                    previousRating={previousPowerRating}
                    size="lg"
                    showDetails={true}
                  />
                ) : (
                  <div className="text-center text-gray-500 py-8">
                    <p>Complete workouts to calculate your Power Rating</p>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Streak Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg"
            >
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <Calendar className="w-6 h-6 text-green-600" />
                Workout Streak
              </h2>

              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg">
                  <div className="text-4xl font-bold text-green-600 mb-1">
                    {streak?.current_streak || 0}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Current Streak
                  </div>
                </div>

                <div className="text-center p-4 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 rounded-lg">
                  <div className="text-4xl font-bold text-orange-600 mb-1">
                    {streak?.longest_streak || 0}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Longest Streak
                  </div>
                </div>
              </div>

              {/* Milestones */}
              {streak && streak.streak_milestones.length > 0 && (
                <div className="mt-4">
                  <h3 className="text-sm font-bold text-gray-600 dark:text-gray-400 mb-2">
                    Milestones Reached
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {streak.streak_milestones.map((milestone) => (
                      <span
                        key={milestone}
                        className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-sm font-bold"
                      >
                        {milestone} days
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>

            {/* Achievement Summary */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg"
            >
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <Trophy className="w-6 h-6 text-yellow-600" />
                Achievements
              </h2>

              <div className="mb-4">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600 dark:text-gray-400">
                    Progress
                  </span>
                  <span className="font-bold">
                    {unlockedCount} / {totalAchievements}
                  </span>
                </div>

                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${achievementProgress}%` }}
                    transition={{ duration: 1, delay: 0.5 }}
                    className="h-full bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-full"
                  />
                </div>
              </div>

              {/* Recent Achievements */}
              <div className="space-y-2">
                <h3 className="text-sm font-bold text-gray-600 dark:text-gray-400 mb-2">
                  Recently Unlocked
                </h3>
                {userAchievements
                  .filter((a) => a.is_unlocked)
                  .sort(
                    (a, b) =>
                      new Date(b.unlocked_at!).getTime() -
                      new Date(a.unlocked_at!).getTime()
                  )
                  .slice(0, 3)
                  .map((ua) => {
                    const achievement = ua.achievement!;
                    const IconComponent = achievement.icon
                      ? (LucideIcons[
                          achievement.icon as keyof typeof LucideIcons
                        ] as any)
                      : Award;

                    return (
                      <div
                        key={ua.id}
                        className="flex items-center gap-3 p-2 rounded-lg bg-gray-50 dark:bg-gray-700/50"
                      >
                        {IconComponent && (
                          <IconComponent className="w-6 h-6 text-yellow-600" />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-sm truncate">
                            {achievement.name}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {achievement.tier} • {achievement.xp_reward} XP
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </motion.div>
          </div>
        )}

        {/* Achievements Tab */}
        {activeTab === 'achievements' && (
          <div className="space-y-6">
            {Object.entries(groupAchievementsByCategory(achievements)).map(
              ([category, categoryAchievements]) => (
                <motion.div
                  key={category}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg"
                >
                  <h2 className="text-2xl font-bold mb-4 capitalize flex items-center gap-2">
                    {React.createElement(
                      LucideIcons[
                        getCategoryIcon(category) as keyof typeof LucideIcons
                      ] as any,
                      { className: 'w-6 h-6' }
                    )}
                    {category}
                  </h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {categoryAchievements.map((achievement) => {
                      const userAchievement = userAchievements.find(
                        (ua) => ua.achievement_id === achievement.id
                      );
                      const isUnlocked = userAchievement?.is_unlocked || false;
                      const isSecret = achievement.is_secret && !isUnlocked;

                      const IconComponent = achievement.icon
                        ? (LucideIcons[
                            achievement.icon as keyof typeof LucideIcons
                          ] as any)
                        : Award;

                      return (
                        <div
                          key={achievement.id}
                          className={`
                            p-4 rounded-lg border-2
                            ${
                              isUnlocked
                                ? getAchievementTierColor(achievement.tier)
                                : 'bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 opacity-60'
                            }
                          `}
                        >
                          <div className="flex items-start gap-3">
                            <div
                              className={`flex-shrink-0 ${
                                isSecret ? 'opacity-40' : ''
                              }`}
                            >
                              {isSecret ? (
                                <Lock className="w-8 h-8" />
                              ) : IconComponent ? (
                                <IconComponent className="w-8 h-8" />
                              ) : null}
                            </div>

                            <div className="flex-1 min-w-0">
                              <h3 className="font-bold mb-1">
                                {isSecret ? '???' : achievement.name}
                              </h3>
                              <p className="text-sm opacity-90 mb-2">
                                {isSecret
                                  ? 'Secret achievement'
                                  : achievement.description}
                              </p>

                              <div className="flex items-center justify-between text-xs">
                                <span className="uppercase font-bold">
                                  {achievement.tier}
                                </span>
                                <span className="font-bold">
                                  {achievement.xp_reward} XP
                                </span>
                              </div>

                              {/* Progress bar for unlocked achievements */}
                              {userAchievement &&
                                !isUnlocked &&
                                userAchievement.current_progress > 0 && (
                                  <div className="mt-2">
                                    <div className="h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                                      <div
                                        className="h-full bg-purple-600 rounded-full"
                                        style={{
                                          width: `${Math.min(
                                            100,
                                            userAchievement.current_progress
                                          )}%`,
                                        }}
                                      />
                                    </div>
                                  </div>
                                )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              )
            )}
          </div>
        )}

        {/* Boss Battles Tab */}
        {activeTab === 'bosses' && (
          <div className="space-y-6">
            {bossBattles.length > 0 ? (
              bossBattles.map((boss) => {
                const progress = bossProgress.find(
                  (p) => p.boss_id === boss.id
                );
                return (
                  <BossBattleCard
                    key={boss.id}
                    boss={boss}
                    userProgress={progress}
                  />
                );
              })
            ) : (
              <div className="text-center py-12 text-gray-500">
                <Sword className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg">No active boss battles</p>
                <p className="text-sm">Check back next month for new challenges!</p>
              </div>
            )}
          </div>
        )}

        {/* Stats Tab */}
        {activeTab === 'stats' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg"
            >
              <h2 className="text-2xl font-bold mb-4">Power Rating History</h2>
              {powerRatingHistory.length > 0 ? (
                <div className="space-y-2">
                  {powerRatingHistory.map((score, index) => (
                    <div
                      key={score.id}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                    >
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {new Date(score.recorded_at).toLocaleDateString()}
                      </span>
                      <span className="font-bold text-lg">
                        {score.power_rating.toFixed(1)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">
                  No power rating history yet
                </p>
              )}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg"
            >
              <h2 className="text-2xl font-bold mb-4">XP Transaction History</h2>
              <div className="space-y-2">
                {recentXp.map((xp) => (
                  <div
                    key={xp.id}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="font-medium text-sm">
                        {xp.description || xp.xp_type}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(xp.created_at).toLocaleString()}
                      </div>
                    </div>
                    <span className="font-bold text-purple-600">
                      +{xp.xp_amount} XP
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}
