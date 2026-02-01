/**
 * Weekly Summary Generator
 *
 * Generates weekly progress summaries for email notifications.
 * Includes workout stats, PRs, achievements, and motivational messages.
 */

import { createClient } from '@/lib/supabase/server';
import {
  WeeklySummaryData,
  PersonalRecord,
  Achievement,
  MilestoneWithExercise,
  WorkoutSession,
} from './types';
import { scheduleNotification, generateNotificationTemplate } from './notifications';

// ============================================================================
// Weekly Summary Generation
// ============================================================================

/**
 * Generate weekly summary data for a user
 */
export async function generateWeeklySummary(userId: string): Promise<WeeklySummaryData | null> {
  const supabase = await createClient();

  // Calculate week start and end (Monday to Sunday)
  const now = new Date();
  const dayOfWeek = now.getDay();
  const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Adjust for Monday start

  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - diff);
  weekStart.setHours(0, 0, 0, 0);

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);

  // Fetch workout sessions for the week
  const { data: sessions, error: sessionsError } = await supabase
    .from('workout_sessions')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'completed')
    .gte('completed_at', weekStart.toISOString())
    .lte('completed_at', weekEnd.toISOString());

  if (sessionsError) {
    console.error('Error fetching workout sessions:', sessionsError);
    return null;
  }

  const workoutSessions = (sessions as WorkoutSession[]) || [];

  // Calculate stats
  const workoutsCompleted = workoutSessions.length;
  const totalVolume = workoutSessions.reduce(
    (sum, session) => sum + (session.total_volume_kg || 0),
    0
  );
  const totalDuration = workoutSessions.reduce(
    (sum, session) => sum + (session.duration_minutes || 0),
    0
  );

  // Get PRs broken this week
  const personalRecords = await getWeeklyPRs(userId, weekStart, weekEnd);

  // Get new achievements this week
  const newAchievements = await getWeeklyAchievements(userId, weekStart, weekEnd);

  // Get current streak
  const currentStreak = await getCurrentStreak(userId);

  // Check for scheduled deload
  const scheduledDeload = await hasUpcomingDeload(userId);

  // Get upcoming milestones
  const upcomingMilestones = await getUpcomingMilestones(userId);

  // Generate motivational message
  const motivationalMessage = generateMotivationalMessage({
    workoutsCompleted,
    personalRecords,
    currentStreak,
  });

  return {
    user_id: userId,
    week_start: weekStart.toISOString().split('T')[0],
    week_end: weekEnd.toISOString().split('T')[0],
    workouts_completed: workoutsCompleted,
    total_volume_kg: totalVolume,
    total_duration_minutes: totalDuration,
    personal_records: personalRecords,
    new_achievements: newAchievements,
    current_streak_days: currentStreak,
    scheduled_deload: scheduledDeload,
    upcoming_milestones: upcomingMilestones,
    motivational_message: motivationalMessage,
  };
}

/**
 * Get personal records broken this week
 */
async function getWeeklyPRs(
  userId: string,
  weekStart: Date,
  weekEnd: Date
): Promise<PersonalRecord[]> {
  const supabase = await createClient();

  // Get all sets from this week
  const { data: sets, error } = await supabase
    .from('sets')
    .select(`
      *,
      exercise:exercises!inner(
        id,
        name,
        exercise_library_id
      ),
      session:workout_sessions!inner(
        user_id,
        completed_at
      )
    `)
    .eq('session.user_id', userId)
    .gte('session.completed_at', weekStart.toISOString())
    .lte('session.completed_at', weekEnd.toISOString())
    .eq('is_warmup', false)
    .order('weight_kg', { ascending: false });

  if (error || !sets) {
    return [];
  }

  // Group by exercise and find max weight for each
  const exercisePRs = new Map<string, any>();

  for (const set of sets) {
    const exerciseId = set.exercise?.id;
    const exerciseName = set.exercise?.name;

    if (!exerciseId || !exerciseName) continue;

    const estimated1RM = calculate1RM(set.weight_kg, set.reps);

    if (!exercisePRs.has(exerciseId) || estimated1RM > exercisePRs.get(exerciseId).one_rep_max) {
      exercisePRs.set(exerciseId, {
        exercise_id: exerciseId,
        exercise_name: exerciseName,
        weight_kg: set.weight_kg,
        reps: set.reps,
        date: set.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
        one_rep_max: estimated1RM,
      });
    }
  }

  return Array.from(exercisePRs.values()).slice(0, 5); // Return top 5 PRs
}

/**
 * Get achievements earned this week
 */
async function getWeeklyAchievements(
  userId: string,
  weekStart: Date,
  weekEnd: Date
): Promise<Achievement[]> {
  const supabase = await createClient();

  const { data: achievements, error } = await supabase
    .from('user_achievements')
    .select('*')
    .eq('user_id', userId)
    .gte('date_earned', weekStart.toISOString())
    .lte('date_earned', weekEnd.toISOString())
    .order('date_earned', { ascending: false });

  if (error) {
    return [];
  }

  return (achievements as Achievement[]) || [];
}

/**
 * Get current workout streak
 */
async function getCurrentStreak(userId: string): Promise<number> {
  const supabase = await createClient();

  // Get all completed workouts ordered by date
  const { data: sessions, error } = await supabase
    .from('workout_sessions')
    .select('completed_at')
    .eq('user_id', userId)
    .eq('status', 'completed')
    .order('completed_at', { ascending: false })
    .limit(365); // Look back up to a year

  if (error || !sessions || sessions.length === 0) {
    return 0;
  }

  let streak = 0;
  let currentDate = new Date();
  currentDate.setHours(0, 0, 0, 0);

  const workoutDates = new Set(
    sessions.map((s: any) => new Date(s.completed_at).toISOString().split('T')[0])
  );

  // Count consecutive days backwards from today
  while (true) {
    const dateStr = currentDate.toISOString().split('T')[0];

    if (workoutDates.has(dateStr)) {
      streak++;
      currentDate.setDate(currentDate.getDate() - 1);
    } else if (streak > 0) {
      // If we've started counting and hit a gap, stop
      break;
    } else {
      // Haven't started counting yet, keep looking
      currentDate.setDate(currentDate.getDate() - 1);
      if (currentDate < new Date(sessions[sessions.length - 1].completed_at)) {
        // Reached the oldest workout
        break;
      }
    }
  }

  return streak;
}

/**
 * Check if user has an upcoming deload week
 */
async function hasUpcomingDeload(userId: string): Promise<boolean> {
  const supabase = await createClient();

  const now = new Date();
  const twoWeeksFromNow = new Date(now);
  twoWeeksFromNow.setDate(now.getDate() + 14);

  const { data: deloads, error } = await supabase
    .from('deload_schedules')
    .select('id')
    .eq('user_id', userId)
    .in('status', ['upcoming', 'notified'])
    .gte('scheduled_week_start', now.toISOString().split('T')[0])
    .lte('scheduled_week_start', twoWeeksFromNow.toISOString().split('T')[0])
    .limit(1);

  if (error) {
    return false;
  }

  return (deloads && deloads.length > 0) || false;
}

/**
 * Get upcoming milestones
 */
async function getUpcomingMilestones(userId: string): Promise<MilestoneWithExercise[]> {
  const supabase = await createClient();

  const { data: milestones, error } = await supabase
    .from('milestone_tracking')
    .select(`
      *,
      exercise:exercise_library(*)
    `)
    .eq('user_id', userId)
    .eq('status', 'in_progress')
    .not('predicted_achievement_date', 'is', null)
    .order('weeks_to_achievement', { ascending: true })
    .limit(3);

  if (error) {
    return [];
  }

  return (milestones as MilestoneWithExercise[]) || [];
}

/**
 * Generate motivational message based on weekly performance
 */
function generateMotivationalMessage(data: {
  workoutsCompleted: number;
  personalRecords: PersonalRecord[];
  currentStreak: number;
}): string {
  const messages = {
    excellent: [
      "Outstanding week! You're crushing your goals! 💪",
      "Incredible consistency! Keep this momentum going! 🔥",
      "You're a machine! This is what dedication looks like! 🏆",
      "Amazing work this week! Your future self will thank you! ⭐",
    ],
    good: [
      "Solid week of training! Stay consistent! 💪",
      "Great progress! You're building momentum! 🚀",
      "Nice work! Every workout counts! 💯",
      "Keep it up! You're on the right track! ✨",
    ],
    moderate: [
      "Good effort this week! Let's aim higher next week! 💪",
      "You showed up - that's what matters! Keep going! 🌟",
      "Progress is progress! Stay committed! 💪",
      "You're building the habit! Consistency is key! 🔑",
    ],
    needsWork: [
      "Life happens! Let's bounce back stronger this week! 💪",
      "Every champion has off weeks. Time to get back on track! 🎯",
      "Don't let one week define you. You've got this! 💪",
      "Reset and refocus. Your goals are still waiting! 🔥",
    ],
  };

  let category: keyof typeof messages;

  if (data.workoutsCompleted >= 5 || data.personalRecords.length >= 2) {
    category = 'excellent';
  } else if (data.workoutsCompleted >= 3 || data.personalRecords.length >= 1) {
    category = 'good';
  } else if (data.workoutsCompleted >= 1) {
    category = 'moderate';
  } else {
    category = 'needsWork';
  }

  const categoryMessages = messages[category];
  return categoryMessages[Math.floor(Math.random() * categoryMessages.length)];
}

/**
 * Calculate estimated 1RM using Epley formula
 */
function calculate1RM(weight: number, reps: number): number {
  if (reps === 1) return weight;
  return weight * (1 + reps / 30);
}

// ============================================================================
// Email Formatting
// ============================================================================

/**
 * Generate HTML email for weekly summary
 */
export function formatWeeklySummaryEmail(summary: WeeklySummaryData): string {
  const {
    week_start,
    week_end,
    workouts_completed,
    total_volume_kg,
    total_duration_minutes,
    personal_records,
    new_achievements,
    current_streak_days,
    scheduled_deload,
    upcoming_milestones,
    motivational_message,
  } = summary;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Weekly Progress Report</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f5f5f5;
    }
    .container {
      background-color: #ffffff;
      border-radius: 8px;
      padding: 30px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
      padding-bottom: 20px;
      border-bottom: 2px solid #3b82f6;
    }
    .header h1 {
      color: #1f2937;
      margin: 0;
      font-size: 28px;
    }
    .date-range {
      color: #6b7280;
      font-size: 14px;
      margin-top: 5px;
    }
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 15px;
      margin: 25px 0;
    }
    .stat-card {
      background-color: #f9fafb;
      padding: 20px;
      border-radius: 6px;
      text-align: center;
      border: 1px solid #e5e7eb;
    }
    .stat-value {
      font-size: 32px;
      font-weight: bold;
      color: #3b82f6;
      margin: 0;
    }
    .stat-label {
      font-size: 13px;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-top: 5px;
    }
    .section {
      margin: 25px 0;
    }
    .section-title {
      color: #1f2937;
      font-size: 18px;
      font-weight: 600;
      margin-bottom: 15px;
      padding-bottom: 8px;
      border-bottom: 1px solid #e5e7eb;
    }
    .pr-list, .achievement-list, .milestone-list {
      list-style: none;
      padding: 0;
      margin: 0;
    }
    .pr-item, .achievement-item, .milestone-item {
      padding: 12px;
      margin: 8px 0;
      background-color: #f9fafb;
      border-left: 3px solid #10b981;
      border-radius: 4px;
    }
    .pr-exercise {
      font-weight: 600;
      color: #1f2937;
    }
    .pr-details {
      color: #6b7280;
      font-size: 14px;
    }
    .motivation {
      background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
      color: white;
      padding: 20px;
      border-radius: 8px;
      text-align: center;
      font-size: 18px;
      font-weight: 500;
      margin: 25px 0;
    }
    .streak-badge {
      display: inline-block;
      background-color: #ef4444;
      color: white;
      padding: 8px 16px;
      border-radius: 20px;
      font-weight: 600;
      margin: 10px 0;
    }
    .deload-alert {
      background-color: #fef3c7;
      border-left: 3px solid #f59e0b;
      padding: 15px;
      border-radius: 4px;
      margin: 15px 0;
    }
    .footer {
      text-align: center;
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
      color: #6b7280;
      font-size: 13px;
    }
    .cta-button {
      display: inline-block;
      background-color: #3b82f6;
      color: white;
      padding: 12px 24px;
      border-radius: 6px;
      text-decoration: none;
      font-weight: 600;
      margin: 15px 0;
    }
    @media only screen and (max-width: 600px) {
      .stats-grid {
        grid-template-columns: 1fr;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📊 Your Weekly Progress Report</h1>
      <div class="date-range">${formatDate(week_start)} - ${formatDate(week_end)}</div>
    </div>

    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-value">${workouts_completed}</div>
        <div class="stat-label">Workouts Completed</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${formatNumber(total_volume_kg)}</div>
        <div class="stat-label">Total Volume (kg)</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${Math.round(total_duration_minutes)}</div>
        <div class="stat-label">Minutes Trained</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${personal_records.length}</div>
        <div class="stat-label">Personal Records</div>
      </div>
    </div>

    ${current_streak_days > 0 ? `
    <div style="text-align: center;">
      <div class="streak-badge">🔥 ${current_streak_days}-Day Streak!</div>
    </div>
    ` : ''}

    <div class="motivation">
      ${motivational_message}
    </div>

    ${personal_records.length > 0 ? `
    <div class="section">
      <div class="section-title">🏆 Personal Records Broken</div>
      <ul class="pr-list">
        ${personal_records.map(pr => `
          <li class="pr-item">
            <div class="pr-exercise">${pr.exercise_name}</div>
            <div class="pr-details">${pr.weight_kg}kg × ${pr.reps} reps (Est. 1RM: ${Math.round(pr.one_rep_max)}kg)</div>
          </li>
        `).join('')}
      </ul>
    </div>
    ` : ''}

    ${new_achievements.length > 0 ? `
    <div class="section">
      <div class="section-title">✨ New Achievements</div>
      <ul class="achievement-list">
        ${new_achievements.map(achievement => `
          <li class="achievement-item">
            <div class="pr-exercise">${achievement.icon || '🏅'} ${achievement.title}</div>
            <div class="pr-details">${achievement.description}</div>
          </li>
        `).join('')}
      </ul>
    </div>
    ` : ''}

    ${scheduled_deload ? `
    <div class="deload-alert">
      <strong>📉 Deload Week Coming Up!</strong><br>
      Your next deload week is scheduled soon. Time to reduce intensity and let your body recover for the next training block!
    </div>
    ` : ''}

    ${upcoming_milestones.length > 0 ? `
    <div class="section">
      <div class="section-title">🎯 Upcoming Milestones</div>
      <ul class="milestone-list">
        ${upcoming_milestones.map(milestone => `
          <li class="milestone-item">
            <div class="pr-exercise">${milestone.exercise?.name || 'Exercise'}</div>
            <div class="pr-details">
              Target: ${milestone.target_weight_kg}kg × ${milestone.target_reps} reps
              ${milestone.weeks_to_achievement ? ` - ${milestone.weeks_to_achievement} weeks away` : ''}
            </div>
          </li>
        `).join('')}
      </ul>
    </div>
    ` : ''}

    <div style="text-align: center; margin-top: 30px;">
      <a href="https://yourapp.com/analytics" class="cta-button">View Detailed Analytics</a>
    </div>

    <div class="footer">
      Keep up the great work! See you in the gym! 💪<br>
      <small>You're receiving this because you have weekly summaries enabled in your notification preferences.</small>
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * Format date for display
 */
function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Format number with commas
 */
function formatNumber(num: number): string {
  return Math.round(num).toLocaleString();
}

// ============================================================================
// Send Weekly Summary
// ============================================================================

/**
 * Generate and send weekly summary notification
 */
export async function sendWeeklySummary(userId: string): Promise<boolean> {
  const summary = await generateWeeklySummary(userId);

  if (!summary) {
    console.error('Failed to generate weekly summary');
    return false;
  }

  const template = generateNotificationTemplate('weekly_summary', {
    workoutsCompleted: summary.workouts_completed,
    totalVolume: formatNumber(summary.total_volume_kg),
  });

  const notification = await scheduleNotification({
    user_id: userId,
    type: 'weekly_summary',
    title: template.title,
    message: template.message,
    link: template.link,
    metadata: {
      week_start: summary.week_start,
      week_end: summary.week_end,
      workouts_completed: summary.workouts_completed,
      personal_records_count: summary.personal_records.length,
    },
  });

  return notification !== null;
}

/**
 * Send weekly summaries to all users (to be called by a cron job)
 */
export async function sendWeeklySummariesToAllUsers(): Promise<void> {
  const supabase = await createClient();

  // Get all users with weekly summary enabled
  const { data: preferences, error } = await supabase
    .from('notification_preferences')
    .select('user_id')
    .eq('weekly_summary_enabled', true);

  if (error || !preferences) {
    console.error('Error fetching notification preferences:', error);
    return;
  }

  console.log(`Sending weekly summaries to ${preferences.length} users...`);

  for (const pref of preferences) {
    try {
      await sendWeeklySummary(pref.user_id);
      console.log(`Sent weekly summary to user ${pref.user_id}`);
    } catch (error) {
      console.error(`Failed to send weekly summary to user ${pref.user_id}:`, error);
    }
  }

  console.log('Finished sending weekly summaries');
}
