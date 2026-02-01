import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NotificationPreferences, NotificationPreferencesUpdate } from '@/lib/types';

/**
 * GET /api/notifications/preferences
 * Get notification preferences for the authenticated user
 */
export async function GET(request: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies });

  // Check authentication
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;

  try {
    const { data, error } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      // If no preferences exist, create default ones
      if (error.code === 'PGRST116') {
        const { data: newPrefs, error: createError } = await supabase
          .from('notification_preferences')
          .insert({
            user_id: userId,
            workout_reminder_enabled: true,
            rest_day_reminder_enabled: true,
            deload_week_alert_enabled: true,
            streak_milestone_enabled: true,
            achievement_unlocked_enabled: true,
            friend_activity_enabled: false,
            weekly_summary_enabled: true,
            push_notifications_enabled: true,
            email_notifications_enabled: false,
            sms_notifications_enabled: false,
            quiet_hours_start: 22,
            quiet_hours_end: 7,
            reminder_minutes_before: 30,
          })
          .select()
          .single();

        if (createError) {
          console.error('Error creating default preferences:', createError);
          return NextResponse.json(
            { error: 'Failed to create preferences' },
            { status: 500 }
          );
        }

        return NextResponse.json({ preferences: newPrefs as NotificationPreferences });
      }

      console.error('Error fetching preferences:', error);
      return NextResponse.json({ error: 'Failed to fetch preferences' }, { status: 500 });
    }

    return NextResponse.json({ preferences: data as NotificationPreferences });
  } catch (error) {
    console.error('Error in GET /api/notifications/preferences:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PUT /api/notifications/preferences
 * Update notification preferences for the authenticated user
 */
export async function PUT(request: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies });

  // Check authentication
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;

  try {
    const body = await request.json();
    const updates: NotificationPreferencesUpdate = {};

    // Validate and assign allowed fields
    const allowedFields: (keyof NotificationPreferencesUpdate)[] = [
      'workout_reminder_enabled',
      'rest_day_reminder_enabled',
      'deload_week_alert_enabled',
      'streak_milestone_enabled',
      'achievement_unlocked_enabled',
      'friend_activity_enabled',
      'weekly_summary_enabled',
      'push_notifications_enabled',
      'email_notifications_enabled',
      'sms_notifications_enabled',
      'quiet_hours_start',
      'quiet_hours_end',
      'reminder_minutes_before',
    ];

    for (const field of allowedFields) {
      if (field in body) {
        updates[field] = body[field];
      }
    }

    // Validate quiet hours
    if (updates.quiet_hours_start !== undefined) {
      const start = updates.quiet_hours_start;
      if (typeof start !== 'number' || start < 0 || start > 23) {
        return NextResponse.json(
          { error: 'quiet_hours_start must be between 0 and 23' },
          { status: 400 }
        );
      }
    }

    if (updates.quiet_hours_end !== undefined) {
      const end = updates.quiet_hours_end;
      if (typeof end !== 'number' || end < 0 || end > 23) {
        return NextResponse.json(
          { error: 'quiet_hours_end must be between 0 and 23' },
          { status: 400 }
        );
      }
    }

    // Validate reminder_minutes_before
    if (updates.reminder_minutes_before !== undefined) {
      const minutes = updates.reminder_minutes_before;
      if (typeof minutes !== 'number' || minutes < 0 || minutes > 120) {
        return NextResponse.json(
          { error: 'reminder_minutes_before must be between 0 and 120' },
          { status: 400 }
        );
      }
    }

    const { data, error } = await supabase
      .from('notification_preferences')
      .update(updates)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating preferences:', error);
      return NextResponse.json({ error: 'Failed to update preferences' }, { status: 500 });
    }

    return NextResponse.json({ preferences: data as NotificationPreferences });
  } catch (error) {
    console.error('Error in PUT /api/notifications/preferences:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
