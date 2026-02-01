'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { UserPreferences, ThemePreferences } from '@/lib/types';
import { Tabs } from '@/components/ui/tabs';
import {
  User, Shield, Bell, Palette, Database,
  Settings as SettingsIcon, Globe, Clock,
  Dumbbell, Eye, EyeOff, Trash2, Download,
  Save, AlertCircle
} from 'lucide-react';
import NotificationPreferences from '@/components/NotificationPreferences';
import PrivacySettings from '@/components/social/PrivacySettings';
import { motion } from 'framer-motion';

const defaultPreferences: Partial<UserPreferences> = {
  unit_system: 'metric',
  weight_unit: 'kg',
  distance_unit: 'cm',
  rest_timer_auto_start: true,
  default_rest_compound: 180,
  default_rest_isolation: 90,
  default_rest_cardio: 60,
  show_warmup_sets: true,
  enable_rpe_tracking: true,
  show_plate_calculator: true,
  available_plate_weights: [2.5, 5, 10, 15, 20, 25],
  barbell_weight_kg: 20,
  auto_start_rest_timer: true,
  vibrate_on_timer_end: true,
  play_sound_on_timer_end: true,
};

const defaultTheme: Partial<ThemePreferences> = {
  theme_mode: 'dark',
  theme_name: 'default',
  accent_color: '#3b82f6',
  font_size: 'medium',
  use_dyslexic_font: false,
  high_contrast: false,
  reduce_animations: false,
};

export default function SettingsPage() {
  const { user, profile } = useAuth();
  const [activeTab, setActiveTab] = useState('account');
  const [loading, setLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Account state
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Preferences state
  const [preferences, setPreferences] = useState<Partial<UserPreferences>>(defaultPreferences);

  // Theme state
  const [theme, setTheme] = useState<Partial<ThemePreferences>>(defaultTheme);

  useEffect(() => {
    if (profile) {
      setEmail(profile.email);
      setFullName(profile.full_name || '');
      loadPreferences();
      loadTheme();
    }
  }, [profile]);

  const loadPreferences = async () => {
    try {
      const response = await fetch('/api/settings/preferences');
      if (response.ok) {
        const data = await response.json();
        setPreferences({ ...defaultPreferences, ...data });
      }
    } catch (error) {
      console.error('Failed to load preferences:', error);
    }
  };

  const loadTheme = async () => {
    try {
      const response = await fetch('/api/settings/theme');
      if (response.ok) {
        const data = await response.json();
        setTheme({ ...defaultTheme, ...data });
      }
    } catch (error) {
      console.error('Failed to load theme:', error);
    }
  };

  const saveAccountSettings = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/settings/account', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, full_name: fullName }),
      });

      if (response.ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (error) {
      console.error('Failed to save account settings:', error);
    }
    setLoading(false);
  };

  const savePreferences = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/settings/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(preferences),
      });

      if (response.ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (error) {
      console.error('Failed to save preferences:', error);
    }
    setLoading(false);
  };

  const saveTheme = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/settings/theme', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(theme),
      });

      if (response.ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (error) {
      console.error('Failed to save theme:', error);
    }
    setLoading(false);
  };

  const handleDeleteAccount = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/settings/account', {
        method: 'DELETE',
      });

      if (response.ok) {
        window.location.href = '/';
      }
    } catch (error) {
      console.error('Failed to delete account:', error);
    }
    setLoading(false);
  };

  const handleDataExport = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/settings/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ export_type: 'full', format: 'zip' }),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `iron-quest-data-${new Date().toISOString().split('T')[0]}.zip`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Failed to export data:', error);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold flex items-center gap-3 mb-2">
            <SettingsIcon className="w-10 h-10" />
            Settings
          </h1>
          <p className="text-gray-400">Customize your Iron Quest experience</p>
        </div>

        {/* Save Success Banner */}
        {saveSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="bg-green-500/20 border border-green-500 rounded-lg p-4 mb-6 flex items-center gap-2"
          >
            <AlertCircle className="w-5 h-5 text-green-500" />
            <span>Settings saved successfully!</span>
          </motion.div>
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="border-b border-gray-800 mb-6">
            <div className="flex gap-4 overflow-x-auto">
              <TabButton
                active={activeTab === 'account'}
                onClick={() => setActiveTab('account')}
                icon={<User className="w-5 h-5" />}
                label="Account"
              />
              <TabButton
                active={activeTab === 'profile'}
                onClick={() => setActiveTab('profile')}
                icon={<User className="w-5 h-5" />}
                label="Profile"
              />
              <TabButton
                active={activeTab === 'units'}
                onClick={() => setActiveTab('units')}
                icon={<Globe className="w-5 h-5" />}
                label="Units"
              />
              <TabButton
                active={activeTab === 'workout'}
                onClick={() => setActiveTab('workout')}
                icon={<Dumbbell className="w-5 h-5" />}
                label="Workout"
              />
              <TabButton
                active={activeTab === 'notifications'}
                onClick={() => setActiveTab('notifications')}
                icon={<Bell className="w-5 h-5" />}
                label="Notifications"
              />
              <TabButton
                active={activeTab === 'privacy'}
                onClick={() => setActiveTab('privacy')}
                icon={<Shield className="w-5 h-5" />}
                label="Privacy"
              />
              <TabButton
                active={activeTab === 'theme'}
                onClick={() => setActiveTab('theme')}
                icon={<Palette className="w-5 h-5" />}
                label="Theme"
              />
              <TabButton
                active={activeTab === 'data'}
                onClick={() => setActiveTab('data')}
                icon={<Database className="w-5 h-5" />}
                label="Data"
              />
            </div>
          </div>

          {/* Account Tab */}
          {activeTab === 'account' && (
            <div className="space-y-6">
              <Section title="Account Information">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Email</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Full Name</label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <button
                    onClick={saveAccountSettings}
                    disabled={loading}
                    className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg font-medium flex items-center gap-2 disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    Save Changes
                  </button>
                </div>
              </Section>

              <Section title="Password">
                <p className="text-sm text-gray-400 mb-4">Change your account password</p>
                <button className="bg-gray-800 hover:bg-gray-700 px-6 py-2 rounded-lg font-medium">
                  Change Password
                </button>
              </Section>

              <Section title="Delete Account" variant="danger">
                <p className="text-sm text-gray-400 mb-4">
                  Permanently delete your account and all associated data. This action cannot be undone.
                </p>
                {!showDeleteConfirm ? (
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="bg-red-600 hover:bg-red-700 px-6 py-2 rounded-lg font-medium flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete Account
                  </button>
                ) : (
                  <div className="space-y-4">
                    <p className="text-red-400 font-medium">Are you absolutely sure?</p>
                    <div className="flex gap-3">
                      <button
                        onClick={handleDeleteAccount}
                        disabled={loading}
                        className="bg-red-600 hover:bg-red-700 px-6 py-2 rounded-lg font-medium disabled:opacity-50"
                      >
                        Yes, Delete My Account
                      </button>
                      <button
                        onClick={() => setShowDeleteConfirm(false)}
                        className="bg-gray-800 hover:bg-gray-700 px-6 py-2 rounded-lg font-medium"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </Section>
            </div>
          )}

          {/* Profile Tab */}
          {activeTab === 'profile' && profile && (
            <div className="space-y-6">
              <Section title="Profile Information">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Age</label>
                    <input
                      type="number"
                      defaultValue={profile.date_of_birth ? new Date().getFullYear() - new Date(profile.date_of_birth).getFullYear() : ''}
                      className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Experience Level</label>
                    <select
                      defaultValue={profile.fitness_level || 'beginner'}
                      className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="beginner">Beginner (0-1 years)</option>
                      <option value="intermediate">Intermediate (1-3 years)</option>
                      <option value="advanced">Advanced (3+ years)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Profile Picture</label>
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center">
                        <User className="w-8 h-8 text-gray-400" />
                      </div>
                      <button className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg font-medium text-sm">
                        Upload Photo
                      </button>
                    </div>
                  </div>
                </div>
              </Section>
            </div>
          )}

          {/* Units Tab */}
          {activeTab === 'units' && (
            <div className="space-y-6">
              <Section title="Unit System">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Weight Unit</label>
                    <select
                      value={preferences.weight_unit}
                      onChange={(e) => setPreferences({ ...preferences, weight_unit: e.target.value as 'kg' | 'lbs' })}
                      className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="kg">Kilograms (kg)</option>
                      <option value="lbs">Pounds (lbs)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Distance Unit</label>
                    <select
                      value={preferences.distance_unit}
                      onChange={(e) => setPreferences({ ...preferences, distance_unit: e.target.value as 'cm' | 'inches' })}
                      className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="cm">Centimeters (cm)</option>
                      <option value="inches">Inches (in)</option>
                    </select>
                  </div>
                  <button
                    onClick={savePreferences}
                    disabled={loading}
                    className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg font-medium flex items-center gap-2 disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    Save Changes
                  </button>
                </div>
              </Section>
            </div>
          )}

          {/* Workout Tab */}
          {activeTab === 'workout' && (
            <div className="space-y-6">
              <Section title="Rest Timer">
                <div className="space-y-4">
                  <Toggle
                    label="Auto-start rest timer"
                    checked={preferences.auto_start_rest_timer || false}
                    onChange={(checked) => setPreferences({ ...preferences, auto_start_rest_timer: checked })}
                  />
                  <div>
                    <label className="block text-sm font-medium mb-2">Default Rest - Compound Exercises</label>
                    <input
                      type="number"
                      value={preferences.default_rest_compound}
                      onChange={(e) => setPreferences({ ...preferences, default_rest_compound: parseInt(e.target.value) })}
                      className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="180"
                    />
                    <p className="text-xs text-gray-500 mt-1">Seconds (e.g., 180 = 3 minutes)</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Default Rest - Isolation Exercises</label>
                    <input
                      type="number"
                      value={preferences.default_rest_isolation}
                      onChange={(e) => setPreferences({ ...preferences, default_rest_isolation: parseInt(e.target.value) })}
                      className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="90"
                    />
                    <p className="text-xs text-gray-500 mt-1">Seconds (e.g., 90 = 1.5 minutes)</p>
                  </div>
                </div>
              </Section>

              <Section title="Display Preferences">
                <div className="space-y-4">
                  <Toggle
                    label="Show warmup sets"
                    checked={preferences.show_warmup_sets || false}
                    onChange={(checked) => setPreferences({ ...preferences, show_warmup_sets: checked })}
                  />
                  <Toggle
                    label="Enable RPE tracking"
                    description="Rate of Perceived Exertion (1-10 scale)"
                    checked={preferences.enable_rpe_tracking || false}
                    onChange={(checked) => setPreferences({ ...preferences, enable_rpe_tracking: checked })}
                  />
                  <Toggle
                    label="Show plate calculator"
                    description="Calculate plates needed for target weight"
                    checked={preferences.show_plate_calculator || false}
                    onChange={(checked) => setPreferences({ ...preferences, show_plate_calculator: checked })}
                  />
                </div>
              </Section>

              <Section title="Equipment">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Barbell Weight</label>
                    <select
                      value={preferences.barbell_weight_kg}
                      onChange={(e) => setPreferences({ ...preferences, barbell_weight_kg: parseFloat(e.target.value) })}
                      className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value={20}>20kg (Standard Men&apos;s)</option>
                      <option value={15}>15kg (Standard Women&apos;s)</option>
                      <option value={10}>10kg (Training Bar)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Available Plate Weights (kg)</label>
                    <p className="text-sm text-gray-400 mb-2">Select which plates are available at your gym</p>
                    <div className="grid grid-cols-3 gap-2">
                      {[1.25, 2.5, 5, 10, 15, 20, 25].map((weight) => (
                        <label key={weight} className="flex items-center gap-2 bg-gray-900 p-3 rounded-lg cursor-pointer hover:bg-gray-800">
                          <input
                            type="checkbox"
                            checked={preferences.available_plate_weights?.includes(weight)}
                            onChange={(e) => {
                              const plates = preferences.available_plate_weights || [];
                              if (e.target.checked) {
                                setPreferences({ ...preferences, available_plate_weights: [...plates, weight].sort((a, b) => a - b) });
                              } else {
                                setPreferences({ ...preferences, available_plate_weights: plates.filter(p => p !== weight) });
                              }
                            }}
                            className="w-4 h-4"
                          />
                          <span>{weight}kg</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </Section>

              <button
                onClick={savePreferences}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg font-medium flex items-center gap-2 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                Save Workout Preferences
              </button>
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <div>
              <NotificationPreferences />
            </div>
          )}

          {/* Privacy Tab */}
          {activeTab === 'privacy' && (
            <div>
              <PrivacySettings />
            </div>
          )}

          {/* Theme Tab */}
          {activeTab === 'theme' && (
            <div className="space-y-6">
              <Section title="Theme Mode">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Color Scheme</label>
                    <select
                      value={theme.theme_mode}
                      onChange={(e) => setTheme({ ...theme, theme_mode: e.target.value as 'light' | 'dark' | 'auto' })}
                      className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="light">Light</option>
                      <option value="dark">Dark</option>
                      <option value="auto">Auto (System)</option>
                    </select>
                  </div>
                </div>
              </Section>

              <Section title="Accent Color">
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <input
                      type="color"
                      value={theme.accent_color}
                      onChange={(e) => setTheme({ ...theme, accent_color: e.target.value })}
                      className="w-16 h-16 rounded-lg cursor-pointer"
                    />
                    <div>
                      <p className="font-medium">{theme.accent_color}</p>
                      <p className="text-sm text-gray-400">Click to change accent color</p>
                    </div>
                  </div>
                </div>
              </Section>

              <Section title="Font Size">
                <div className="space-y-4">
                  <select
                    value={theme.font_size}
                    onChange={(e) => setTheme({ ...theme, font_size: e.target.value as 'small' | 'medium' | 'large' })}
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="small">Small</option>
                    <option value="medium">Medium</option>
                    <option value="large">Large</option>
                  </select>
                </div>
              </Section>

              <Section title="Accessibility">
                <div className="space-y-4">
                  <Toggle
                    label="High contrast mode"
                    checked={theme.high_contrast || false}
                    onChange={(checked) => setTheme({ ...theme, high_contrast: checked })}
                  />
                  <Toggle
                    label="Reduce animations"
                    checked={theme.reduce_animations || false}
                    onChange={(checked) => setTheme({ ...theme, reduce_animations: checked })}
                  />
                </div>
              </Section>

              <button
                onClick={saveTheme}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg font-medium flex items-center gap-2 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                Save Theme
              </button>
            </div>
          )}

          {/* Data Tab */}
          {activeTab === 'data' && (
            <div className="space-y-6">
              <Section title="Export Data">
                <div className="space-y-4">
                  <p className="text-sm text-gray-400">
                    Download all your workout data, body stats, and exercise PRs in a ZIP file.
                    Includes CSV files and any uploaded photos.
                  </p>
                  <button
                    onClick={handleDataExport}
                    disabled={loading}
                    className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg font-medium flex items-center gap-2 disabled:opacity-50"
                  >
                    <Download className="w-4 h-4" />
                    {loading ? 'Generating...' : 'Export All My Data'}
                  </button>
                  <p className="text-xs text-gray-500">
                    Data export complies with GDPR requirements
                  </p>
                </div>
              </Section>
            </div>
          )}
        </Tabs>
      </div>
    </div>
  );
}

// Helper Components
function TabButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors whitespace-nowrap ${
        active
          ? 'border-blue-500 text-blue-500'
          : 'border-transparent text-gray-400 hover:text-white'
      }`}
    >
      {icon}
      <span className="font-medium">{label}</span>
    </button>
  );
}

function Section({ title, children, variant }: { title: string; children: React.ReactNode; variant?: 'default' | 'danger' }) {
  return (
    <div className={`bg-gray-900 rounded-lg p-6 ${variant === 'danger' ? 'border border-red-900' : ''}`}>
      <h2 className={`text-xl font-bold mb-4 ${variant === 'danger' ? 'text-red-500' : ''}`}>{title}</h2>
      {children}
    </div>
  );
}

function Toggle({ label, description, checked, onChange }: { label: string; description?: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="font-medium">{label}</p>
        {description && <p className="text-sm text-gray-400">{description}</p>}
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`relative w-12 h-6 rounded-full transition-colors ${
          checked ? 'bg-blue-600' : 'bg-gray-700'
        }`}
      >
        <div
          className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${
            checked ? 'translate-x-6' : ''
          }`}
        />
      </button>
    </div>
  );
}
