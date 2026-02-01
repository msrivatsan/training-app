/**
 * Notification System
 *
 * Handles notification creation, scheduling, and delivery logic.
 * Integrates with user preferences and activity patterns for smart timing.
 */

import { createClient } from '@/lib/supabase/server';
import {
  Notification,
  NotificationInsert,
  NotificationPreferences,
  NotificationType,
  NotificationDeliveryMethod,
  UserActivityPattern,
  SmartTimingResult,
  NotificationScheduleRequest,
  WeeklySummaryData,
  PersonalRecord,
  Achievement,
  MilestoneWithExercise,
} from './types';

// ============================================================================
// Notification Templates
// ============================================================================

/**
 * Generate notification content based on type
 */
export function generateNotificationTemplate(
  type: NotificationType,
  data: Record<string, any>
): { title: string; message: string; link?: string } {
  switch (type) {
    case 'workout_reminder':
      return {
        title: '💪 Time to Train!',
        message: `Your ${data.workoutName || 'workout'} starts in ${data.minutesBefore || 30} minutes. Get ready to crush it!`,
        link: '/dashboard',
      };

    case 'rest_day_reminder':
      return {
        title: '😌 Recovery Day',
        message: `Great work this week! Today is a rest day - your muscles need time to grow. Stay hydrated and get quality sleep.`,
        link: '/dashboard',
      };

    case 'deload_week_alert':
      return {
        title: '📉 Deload Week Coming Up',
        message: `Your deload week starts in 7 days. Time to reduce intensity and let your body recover for your next training block!`,
        link: '/dashboard',
      };

    case 'streak_milestone':
      return {
        title: `🔥 ${data.streakDays}-Day Streak!`,
        message: `You're on fire! ${data.streakDays} consecutive days of training. Don't break the chain!`,
        link: '/analytics',
      };

    case 'achievement_unlocked':
      return {
        title: `🏆 Achievement Unlocked!`,
        message: `${data.achievementTitle}: ${data.achievementDescription}`,
        link: '/profile',
      };

    case 'friend_activity':
      return {
        title: `👥 ${data.friendName} just worked out`,
        message: `${data.friendName} completed ${data.workoutName}. Keep the motivation going!`,
        link: '/social',
      };

    case 'weekly_summary':
      return {
        title: `📊 Weekly Progress Report`,
        message: `You completed ${data.workoutsCompleted} workouts and lifted ${data.totalVolume}kg this week. Check out your full summary!`,
        link: '/analytics',
      };

    case 'friend_request':
      return {
        title: `👋 New Friend Request`,
        message: `${data.senderName} wants to connect with you!`,
        link: '/social/friends',
      };

    case 'friend_accepted':
      return {
        title: `✅ Friend Request Accepted`,
        message: `${data.friendName} accepted your friend request. You're now training buddies!`,
        link: '/social/friends',
      };

    case 'post_like':
      return {
        title: `❤️ Someone liked your post`,
        message: `${data.likerName} liked your workout post!`,
        link: `/social/posts/${data.postId}`,
      };

    case 'post_comment':
      return {
        title: `💬 New comment on your post`,
        message: `${data.commenterName}: "${data.commentPreview}"`,
        link: `/social/posts/${data.postId}`,
      };

    case 'partner_request':
      return {
        title: `🤝 Training Partner Request`,
        message: `${data.requesterName} wants to be your training partner!`,
        link: '/social/partners',
      };

    case 'workout_invite':
      return {
        title: `🏋️ Workout Invitation`,
        message: `${data.inviterName} invited you to join their ${data.workoutName} workout!`,
        link: '/social',
      };

    case 'challenge_complete':
      return {
        title: `🎉 Challenge Completed!`,
        message: `Congratulations! You completed the "${data.challengeName}" challenge!`,
        link: '/social/challenges',
      };

    default:
      return {
        title: 'Notification',
        message: 'You have a new notification',
        link: '/dashboard',
      };
  }
}

// ============================================================================
// Smart Timing Logic
// ============================================================================

/**
 * Calculate the best time to send a notification based on user activity patterns
 */
export async function calculateSmartTiming(
  userId: string,
  notificationType: NotificationType
): Promise<SmartTimingResult> {
  const supabase = await createClient();

  // Get user's activity patterns
  const { data: patterns, error: patternsError } = await supabase
    .from('user_activity_patterns')
    .select('*')
    .eq('user_id', userId)
    .order('confidence_score', { ascending: false });

  if (patternsError || !patterns || patterns.length === 0) {
    return {
      should_send: false,
      scheduled_time: null,
      reason: 'No activity patterns found - user is new or inactive',
      confidence: 0,
      pattern_used: null,
    };
  }

  // Get today's day of week (0 = Sunday, 6 = Saturday)
  const now = new Date();
  const today = now.getDay();

  // Find pattern for today
  const todayPattern = patterns.find((p: UserActivityPattern) => p.day_of_week === today);

  if (!todayPattern || !todayPattern.typical_hour) {
    // Find the most confident pattern as fallback
    const bestPattern = patterns[0] as UserActivityPattern;

    return {
      should_send: true,
      scheduled_time: null, // Send immediately
      reason: `No pattern for today, using best available pattern (confidence: ${bestPattern.confidence_score})`,
      confidence: bestPattern.confidence_score,
      pattern_used: bestPattern,
    };
  }

  // Check if user already worked out today
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);

  const { data: todayWorkouts, error: workoutsError } = await supabase
    .from('workout_sessions')
    .select('id')
    .eq('user_id', userId)
    .eq('status', 'completed')
    .gte('completed_at', startOfDay.toISOString())
    .limit(1);

  if (!workoutsError && todayWorkouts && todayWorkouts.length > 0) {
    return {
      should_send: false,
      scheduled_time: null,
      reason: 'User already worked out today - skip reminder',
      confidence: 100,
      pattern_used: todayPattern,
    };
  }

  // Get user preferences for reminder timing
  const { data: prefs } = await supabase
    .from('notification_preferences')
    .select('reminder_minutes_before')
    .eq('user_id', userId)
    .single();

  const minutesBefore = prefs?.reminder_minutes_before || 30;

  // Calculate scheduled time (typical hour minus reminder minutes)
  const scheduledTime = new Date(now);
  scheduledTime.setHours(todayPattern.typical_hour, 0, 0, 0);
  scheduledTime.setMinutes(scheduledTime.getMinutes() - minutesBefore);

  // Check if scheduled time is in the past
  if (scheduledTime < now) {
    return {
      should_send: false,
      scheduled_time: null,
      reason: 'Scheduled time has passed for today',
      confidence: todayPattern.confidence_score,
      pattern_used: todayPattern,
    };
  }

  return {
    should_send: true,
    scheduled_time: scheduledTime.toISOString(),
    reason: `Scheduled based on user's typical ${getDayName(today)} workout time`,
    confidence: todayPattern.confidence_score,
    pattern_used: todayPattern,
  };
}

/**
 * Check if current time is within user's quiet hours
 */
export async function isInQuietHours(userId: string, checkTime?: Date): Promise<boolean> {
  const supabase = await createClient();

  const { data: prefs, error } = await supabase
    .from('notification_preferences')
    .select('quiet_hours_start, quiet_hours_end')
    .eq('user_id', userId)
    .single();

  if (error || !prefs) {
    return false; // No preferences found, not in quiet hours
  }

  const time = checkTime || new Date();
  const currentHour = time.getHours();
  const { quiet_hours_start, quiet_hours_end } = prefs;

  // Handle wrap-around (e.g., 22:00 to 07:00)
  if (quiet_hours_start <= quiet_hours_end) {
    return currentHour >= quiet_hours_start && currentHour < quiet_hours_end;
  } else {
    return currentHour >= quiet_hours_start || currentHour < quiet_hours_end;
  }
}

/**
 * Check if notification type is enabled for user
 */
export async function isNotificationTypeEnabled(
  userId: string,
  notificationType: NotificationType
): Promise<boolean> {
  const supabase = await createClient();

  const { data: prefs, error } = await supabase
    .from('notification_preferences')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error || !prefs) {
    return true; // Default to enabled if no preferences found
  }

  const prefField = getPreferenceFieldForType(notificationType);
  return prefs[prefField] !== false;
}

/**
 * Get the preference field name for a notification type
 */
function getPreferenceFieldForType(type: NotificationType): keyof NotificationPreferences {
  const mapping: Record<string, keyof NotificationPreferences> = {
    'workout_reminder': 'workout_reminder_enabled',
    'rest_day_reminder': 'rest_day_reminder_enabled',
    'deload_week_alert': 'deload_week_alert_enabled',
    'streak_milestone': 'streak_milestone_enabled',
    'achievement_unlocked': 'achievement_unlocked_enabled',
    'friend_activity': 'friend_activity_enabled',
    'weekly_summary': 'weekly_summary_enabled',
  };

  return mapping[type] || 'workout_reminder_enabled';
}

// ============================================================================
// Notification Creation
// ============================================================================

/**
 * Create and schedule a notification
 */
export async function scheduleNotification(
  request: NotificationScheduleRequest
): Promise<Notification | null> {
  const supabase = await createClient();

  // Check if notification type is enabled
  const isEnabled = await isNotificationTypeEnabled(request.user_id, request.type);
  if (!isEnabled) {
    console.log(`Notification type ${request.type} is disabled for user ${request.user_id}`);
    return null;
  }

  // Check quiet hours if scheduled for now
  if (!request.scheduled_for) {
    const inQuietHours = await isInQuietHours(request.user_id);
    if (inQuietHours) {
      console.log(`User ${request.user_id} is in quiet hours, skipping notification`);
      return null;
    }
  }

  // Create notification record
  const notificationData: NotificationInsert = {
    user_id: request.user_id,
    type: request.type,
    title: request.title,
    message: request.message,
    link: request.link || null,
    metadata: request.metadata || null,
    read: false,
    sent: !request.scheduled_for, // Mark as sent if not scheduled
    sent_at: !request.scheduled_for ? new Date().toISOString() : null,
    delivery_method: request.delivery_method || 'in_app',
    scheduled_for: request.scheduled_for || null,
  };

  const { data, error } = await supabase
    .from('notifications')
    .insert(notificationData)
    .select()
    .single();

  if (error) {
    console.error('Error creating notification:', error);
    return null;
  }

  return data as Notification;
}

/**
 * Create a workout reminder notification
 */
export async function createWorkoutReminder(
  userId: string,
  workoutName: string,
  minutesBefore: number = 30
): Promise<Notification | null> {
  const template = generateNotificationTemplate('workout_reminder', {
    workoutName,
    minutesBefore,
  });

  const smartTiming = await calculateSmartTiming(userId, 'workout_reminder');

  if (!smartTiming.should_send) {
    console.log(`Not sending workout reminder: ${smartTiming.reason}`);
    return null;
  }

  return scheduleNotification({
    user_id: userId,
    type: 'workout_reminder',
    title: template.title,
    message: template.message,
    link: template.link,
    scheduled_for: smartTiming.scheduled_time || undefined,
    metadata: {
      workoutName,
      minutesBefore,
      confidence: smartTiming.confidence,
    },
  });
}

/**
 * Create a streak milestone notification
 */
export async function createStreakMilestone(
  userId: string,
  streakDays: number
): Promise<Notification | null> {
  const template = generateNotificationTemplate('streak_milestone', { streakDays });

  return scheduleNotification({
    user_id: userId,
    type: 'streak_milestone',
    title: template.title,
    message: template.message,
    link: template.link,
    metadata: { streakDays },
  });
}

/**
 * Create an achievement notification
 */
export async function createAchievementNotification(
  userId: string,
  achievementTitle: string,
  achievementDescription: string
): Promise<Notification | null> {
  const template = generateNotificationTemplate('achievement_unlocked', {
    achievementTitle,
    achievementDescription,
  });

  return scheduleNotification({
    user_id: userId,
    type: 'achievement_unlocked',
    title: template.title,
    message: template.message,
    link: template.link,
    metadata: {
      achievementTitle,
      achievementDescription,
    },
  });
}

/**
 * Create a deload week alert notification
 */
export async function createDeloadAlert(
  userId: string,
  deloadStartDate: string
): Promise<Notification | null> {
  const template = generateNotificationTemplate('deload_week_alert', {
    deloadStartDate,
  });

  return scheduleNotification({
    user_id: userId,
    type: 'deload_week_alert',
    title: template.title,
    message: template.message,
    link: template.link,
    metadata: { deloadStartDate },
  });
}

/**
 * Create a rest day reminder notification
 */
export async function createRestDayReminder(userId: string): Promise<Notification | null> {
  const template = generateNotificationTemplate('rest_day_reminder', {});

  return scheduleNotification({
    user_id: userId,
    type: 'rest_day_reminder',
    title: template.title,
    message: template.message,
    link: template.link,
  });
}

// ============================================================================
// Notification Queries
// ============================================================================

/**
 * Get unread notifications for a user
 */
export async function getUnreadNotifications(userId: string): Promise<Notification[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .eq('read', false)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    console.error('Error fetching unread notifications:', error);
    return [];
  }

  return (data as Notification[]) || [];
}

/**
 * Mark notification as read
 */
export async function markNotificationAsRead(notificationId: string): Promise<boolean> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('id', notificationId);

  if (error) {
    console.error('Error marking notification as read:', error);
    return false;
  }

  return true;
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllNotificationsAsRead(userId: string): Promise<boolean> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('user_id', userId)
    .eq('read', false);

  if (error) {
    console.error('Error marking all notifications as read:', error);
    return false;
  }

  return true;
}

/**
 * Delete a notification
 */
export async function deleteNotification(notificationId: string): Promise<boolean> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('notifications')
    .delete()
    .eq('id', notificationId);

  if (error) {
    console.error('Error deleting notification:', error);
    return false;
  }

  return true;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get day name from day number
 */
function getDayName(dayNumber: number): string {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[dayNumber] || 'Unknown';
}

/**
 * Format number with commas
 */
function formatNumber(num: number): string {
  return num.toLocaleString();
}
