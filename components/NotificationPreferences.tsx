'use client';

import { useState, useEffect } from 'react';
import { NotificationPreferences } from '@/lib/types';
import { Bell, BellOff, Mail, MessageSquare, Moon } from 'lucide-react';

export default function NotificationPreferencesComponent() {
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Fetch preferences on mount
  useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/notifications/preferences');

      if (!response.ok) {
        throw new Error('Failed to fetch preferences');
      }

      const data = await response.json();
      setPreferences(data.preferences);
    } catch (err) {
      setError('Failed to load notification preferences');
      console.error('Error fetching preferences:', err);
    } finally {
      setLoading(false);
    }
  };

  const updatePreferences = async (updates: Partial<NotificationPreferences>) => {
    try {
      setSaving(true);
      setError(null);
      setSuccessMessage(null);

      const response = await fetch('/api/notifications/preferences', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error('Failed to update preferences');
      }

      const data = await response.json();
      setPreferences(data.preferences);
      setSuccessMessage('Preferences updated successfully!');

      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError('Failed to update preferences');
      console.error('Error updating preferences:', err);
    } finally {
      setSaving(false);
    }
  };

  const togglePreference = (field: keyof NotificationPreferences) => {
    if (!preferences) return;

    const currentValue = preferences[field];
    if (typeof currentValue === 'boolean') {
      updatePreferences({ [field]: !currentValue });
    }
  };

  const updateQuietHours = (field: 'quiet_hours_start' | 'quiet_hours_end', value: number) => {
    updatePreferences({ [field]: value });
  };

  const updateReminderMinutes = (value: number) => {
    updatePreferences({ reminder_minutes_before: value });
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="space-y-3">
            <div className="h-12 bg-gray-200 rounded"></div>
            <div className="h-12 bg-gray-200 rounded"></div>
            <div className="h-12 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!preferences) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="text-center text-red-600">
          <p>Failed to load notification preferences</p>
          <button
            onClick={fetchPreferences}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
      {/* Header */}
      <div className="border-b pb-4">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Bell className="w-6 h-6 text-blue-600" />
          Notification Preferences
        </h2>
        <p className="text-sm text-gray-600 mt-1">
          Customize how and when you receive notifications
        </p>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-md">
          {successMessage}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      {/* Notification Types */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-gray-600" />
          Notification Types
        </h3>

        <div className="space-y-3">
          <ToggleOption
            label="Workout Reminders"
            description="Get notified before your scheduled workouts"
            enabled={preferences.workout_reminder_enabled}
            onChange={() => togglePreference('workout_reminder_enabled')}
            disabled={saving}
          />

          <ToggleOption
            label="Rest Day Reminders"
            description="Motivational messages on your rest days"
            enabled={preferences.rest_day_reminder_enabled}
            onChange={() => togglePreference('rest_day_reminder_enabled')}
            disabled={saving}
          />

          <ToggleOption
            label="Deload Week Alerts"
            description="Get notified 7 days before deload weeks"
            enabled={preferences.deload_week_alert_enabled}
            onChange={() => togglePreference('deload_week_alert_enabled')}
            disabled={saving}
          />

          <ToggleOption
            label="Streak Milestones"
            description="Celebrate your workout streaks"
            enabled={preferences.streak_milestone_enabled}
            onChange={() => togglePreference('streak_milestone_enabled')}
            disabled={saving}
          />

          <ToggleOption
            label="Achievement Unlocked"
            description="Get notified when you earn achievements"
            enabled={preferences.achievement_unlocked_enabled}
            onChange={() => togglePreference('achievement_unlocked_enabled')}
            disabled={saving}
          />

          <ToggleOption
            label="Friend Activity"
            description="See when your friends complete workouts"
            enabled={preferences.friend_activity_enabled}
            onChange={() => togglePreference('friend_activity_enabled')}
            disabled={saving}
          />

          <ToggleOption
            label="Weekly Summary"
            description="Weekly progress reports via email"
            enabled={preferences.weekly_summary_enabled}
            onChange={() => togglePreference('weekly_summary_enabled')}
            disabled={saving}
          />
        </div>
      </div>

      {/* Delivery Methods */}
      <div className="space-y-4 pt-6 border-t">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Mail className="w-5 h-5 text-gray-600" />
          Delivery Methods
        </h3>

        <div className="space-y-3">
          <ToggleOption
            label="Push Notifications"
            description="In-app notifications"
            enabled={preferences.push_notifications_enabled}
            onChange={() => togglePreference('push_notifications_enabled')}
            disabled={saving}
          />

          <ToggleOption
            label="Email Notifications"
            description="Receive notifications via email"
            enabled={preferences.email_notifications_enabled}
            onChange={() => togglePreference('email_notifications_enabled')}
            disabled={saving}
          />

          <ToggleOption
            label="SMS Notifications"
            description="Text messages for critical reminders (coming soon)"
            enabled={preferences.sms_notifications_enabled}
            onChange={() => togglePreference('sms_notifications_enabled')}
            disabled={true}
          />
        </div>
      </div>

      {/* Quiet Hours */}
      <div className="space-y-4 pt-6 border-t">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Moon className="w-5 h-5 text-gray-600" />
          Quiet Hours
        </h3>
        <p className="text-sm text-gray-600">
          Don't send notifications during these hours (24-hour format)
        </p>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Start Time
            </label>
            <select
              value={preferences.quiet_hours_start}
              onChange={(e) => updateQuietHours('quiet_hours_start', parseInt(e.target.value))}
              disabled={saving}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            >
              {Array.from({ length: 24 }, (_, i) => (
                <option key={i} value={i}>
                  {i.toString().padStart(2, '0')}:00
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              End Time
            </label>
            <select
              value={preferences.quiet_hours_end}
              onChange={(e) => updateQuietHours('quiet_hours_end', parseInt(e.target.value))}
              disabled={saving}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            >
              {Array.from({ length: 24 }, (_, i) => (
                <option key={i} value={i}>
                  {i.toString().padStart(2, '0')}:00
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Reminder Timing */}
      <div className="space-y-4 pt-6 border-t">
        <h3 className="text-lg font-semibold text-gray-900">Reminder Timing</h3>
        <p className="text-sm text-gray-600">
          How many minutes before your workout should we remind you?
        </p>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Minutes Before Workout: {preferences.reminder_minutes_before}
          </label>
          <input
            type="range"
            min="5"
            max="120"
            step="5"
            value={preferences.reminder_minutes_before}
            onChange={(e) => updateReminderMinutes(parseInt(e.target.value))}
            disabled={saving}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>5 min</span>
            <span>30 min</span>
            <span>60 min</span>
            <span>120 min</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Toggle Option Component
interface ToggleOptionProps {
  label: string;
  description: string;
  enabled: boolean;
  onChange: () => void;
  disabled?: boolean;
}

function ToggleOption({ label, description, enabled, onChange, disabled }: ToggleOptionProps) {
  return (
    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
      <div className="flex-1">
        <h4 className="font-medium text-gray-900">{label}</h4>
        <p className="text-sm text-gray-600">{description}</p>
      </div>
      <button
        onClick={onChange}
        disabled={disabled}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${
          enabled ? 'bg-blue-600' : 'bg-gray-300'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            enabled ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );
}
