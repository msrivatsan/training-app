'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { UserPrivacySettings, UpdatePrivacySettingsPayload } from '@/lib/types/social';

export default function PrivacySettings() {
  const [settings, setSettings] = useState<UserPrivacySettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/social/privacy');
      const data = await response.json();
      setSettings(data);
    } catch (error) {
      console.error('Error fetching privacy settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!settings) return;

    setSaving(true);
    try {
      const payload: UpdatePrivacySettingsPayload = {
        profile_visibility: settings.profile_visibility,
        workout_sharing: settings.workout_sharing,
        show_on_leaderboards: settings.show_on_leaderboards,
        allow_friend_requests: settings.allow_friend_requests,
        allow_partner_matching: settings.allow_partner_matching,
        show_strength_scores: settings.show_strength_scores,
        show_location: settings.show_location,
        location_city: settings.location_city,
        location_country: settings.location_country,
        gym_name: settings.gym_name,
        age_group: settings.age_group,
        experience_level: settings.experience_level,
      };

      const response = await fetch('/api/social/privacy', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        alert('Privacy settings saved successfully!');
      }
    } catch (error) {
      console.error('Error saving privacy settings:', error);
      alert('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div>Loading privacy settings...</div>;
  if (!settings) return <div>Error loading settings</div>;

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-2xl font-bold mb-2">Privacy & Social Settings</h2>
        <p className="text-gray-600">
          Control how others can see and interact with you. All social features are OPT-IN by default.
        </p>
      </div>

      <div className="space-y-4 bg-white p-6 rounded-lg shadow">
        <div>
          <Label htmlFor="profile_visibility">Profile Visibility</Label>
          <select
            id="profile_visibility"
            value={settings.profile_visibility}
            onChange={(e) => setSettings({ ...settings, profile_visibility: e.target.value as any })}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
          >
            <option value="private">Private - Only me</option>
            <option value="friends">Friends - Only my friends can see</option>
            <option value="public">Public - Anyone can see</option>
          </select>
        </div>

        <div>
          <Label htmlFor="workout_sharing">Workout Sharing</Label>
          <select
            id="workout_sharing"
            value={settings.workout_sharing}
            onChange={(e) => setSettings({ ...settings, workout_sharing: e.target.value as any })}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
          >
            <option value="private">Private - Don't share workouts</option>
            <option value="friends">Friends - Share with friends only</option>
            <option value="public">Public - Share with everyone</option>
          </select>
        </div>

        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="show_on_leaderboards"
            checked={settings.show_on_leaderboards}
            onChange={(e) => setSettings({ ...settings, show_on_leaderboards: e.target.checked })}
            className="rounded"
          />
          <Label htmlFor="show_on_leaderboards">Show me on leaderboards</Label>
        </div>

        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="allow_friend_requests"
            checked={settings.allow_friend_requests}
            onChange={(e) => setSettings({ ...settings, allow_friend_requests: e.target.checked })}
            className="rounded"
          />
          <Label htmlFor="allow_friend_requests">Allow friend requests</Label>
        </div>

        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="allow_partner_matching"
            checked={settings.allow_partner_matching}
            onChange={(e) => setSettings({ ...settings, allow_partner_matching: e.target.checked })}
            className="rounded"
          />
          <Label htmlFor="allow_partner_matching">Enable training partner matching</Label>
        </div>

        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="show_strength_scores"
            checked={settings.show_strength_scores}
            onChange={(e) => setSettings({ ...settings, show_strength_scores: e.target.checked })}
            className="rounded"
          />
          <Label htmlFor="show_strength_scores">Show my strength scores publicly</Label>
        </div>

        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="show_location"
            checked={settings.show_location}
            onChange={(e) => setSettings({ ...settings, show_location: e.target.checked })}
            className="rounded"
          />
          <Label htmlFor="show_location">Share my location (for local leaderboards)</Label>
        </div>

        {settings.show_location && (
          <div className="ml-6 space-y-3">
            <div>
              <Label htmlFor="location_city">City</Label>
              <Input
                id="location_city"
                value={settings.location_city || ''}
                onChange={(e) => setSettings({ ...settings, location_city: e.target.value })}
                placeholder="e.g., San Francisco"
              />
            </div>
            <div>
              <Label htmlFor="location_country">Country</Label>
              <Input
                id="location_country"
                value={settings.location_country || ''}
                onChange={(e) => setSettings({ ...settings, location_country: e.target.value })}
                placeholder="e.g., USA"
              />
            </div>
            <div>
              <Label htmlFor="gym_name">Gym Name (Optional)</Label>
              <Input
                id="gym_name"
                value={settings.gym_name || ''}
                onChange={(e) => setSettings({ ...settings, gym_name: e.target.value })}
                placeholder="e.g., Gold's Gym"
              />
            </div>
          </div>
        )}

        <div>
          <Label htmlFor="age_group">Age Group (for filtered leaderboards)</Label>
          <select
            id="age_group"
            value={settings.age_group || ''}
            onChange={(e) => setSettings({ ...settings, age_group: e.target.value as any })}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
          >
            <option value="">Not specified</option>
            <option value="under_18">Under 18</option>
            <option value="18_29">18-29</option>
            <option value="30_39">30-39</option>
            <option value="40_49">40-49</option>
            <option value="50_plus">50+</option>
          </select>
        </div>

        <div>
          <Label htmlFor="experience_level">Experience Level</Label>
          <select
            id="experience_level"
            value={settings.experience_level || ''}
            onChange={(e) => setSettings({ ...settings, experience_level: e.target.value as any })}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
          >
            <option value="">Not specified</option>
            <option value="beginner">Beginner (0-1 years)</option>
            <option value="intermediate">Intermediate (1-3 years)</option>
            <option value="advanced">Advanced (3-5 years)</option>
            <option value="elite">Elite (5+ years)</option>
          </select>
        </div>

        <Button
          onClick={handleSave}
          disabled={saving}
          className="w-full"
        >
          {saving ? 'Saving...' : 'Save Privacy Settings'}
        </Button>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">Privacy First</h3>
        <p className="text-sm text-blue-800">
          All social features are opt-in by default. Your workout data remains private unless you explicitly
          choose to share it. You can change these settings at any time.
        </p>
      </div>
    </div>
  );
}
