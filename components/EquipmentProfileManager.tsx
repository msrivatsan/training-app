'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { EquipmentProfile } from '@/lib/types';
import { EQUIPMENT_PRESETS } from '@/lib/exerciseSwap';

const ALL_EQUIPMENT = [
  'barbell',
  'dumbbells',
  'cable',
  'machine',
  'bench',
  'squat rack',
  'pull-up bar',
  'dip bars',
  'kettlebell',
  'resistance band',
  't-bar',
  'ab wheel',
  'battle ropes',
  'sled',
  'medicine ball',
  'box',
  'bodyweight',
  'ez-bar',
  'trap bar',
  'smith machine',
  'leg press',
  'lat pulldown',
  'rowing machine',
  'treadmill',
  'bike',
];

interface EquipmentProfileManagerProps {
  onSave?: (profile: EquipmentProfile) => void;
}

export default function EquipmentProfileManager({ onSave }: EquipmentProfileManagerProps) {
  const [profile, setProfile] = useState<EquipmentProfile | null>(null);
  const [selectedEquipment, setSelectedEquipment] = useState<string[]>([]);
  const [profileName, setProfileName] = useState('Default');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const supabase = createClient();

  // Load existing profile
  useEffect(() => {
    async function loadProfile() {
      setLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data } = await supabase
          .from('equipment_profiles')
          .select('*')
          .eq('user_id', user.id)
          .eq('is_active', true)
          .single();

        if (data) {
          setProfile(data as EquipmentProfile);
          setSelectedEquipment(data.available_equipment || []);
          setProfileName(data.profile_name);
        }
      } catch (error) {
        console.error('Error loading equipment profile:', error);
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, [supabase]);

  // Toggle equipment
  const toggleEquipment = (equipment: string) => {
    setSelectedEquipment((prev) =>
      prev.includes(equipment)
        ? prev.filter((eq) => eq !== equipment)
        : [...prev, equipment]
    );
  };

  // Apply preset
  const applyPreset = (presetName: string) => {
    const equipment = EQUIPMENT_PRESETS[presetName] || [];
    setSelectedEquipment(equipment);
    setProfileName(presetName);
  };

  // Save profile
  const handleSave = async () => {
    setSaving(true);
    setMessage(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      if (profile) {
        // Update existing profile
        const { data, error } = await supabase
          .from('equipment_profiles')
          .update({
            profile_name: profileName,
            available_equipment: selectedEquipment,
          })
          .eq('id', profile.id)
          .select()
          .single();

        if (error) throw error;

        setProfile(data as EquipmentProfile);
        setMessage({ type: 'success', text: 'Equipment profile updated successfully!' });
        onSave?.(data as EquipmentProfile);
      } else {
        // Create new profile
        const { data, error } = await supabase
          .from('equipment_profiles')
          .insert({
            user_id: user.id,
            profile_name: profileName,
            available_equipment: selectedEquipment,
            is_active: true,
          })
          .select()
          .single();

        if (error) throw error;

        setProfile(data as EquipmentProfile);
        setMessage({ type: 'success', text: 'Equipment profile created successfully!' });
        onSave?.(data as EquipmentProfile);
      }
    } catch (error) {
      console.error('Error saving equipment profile:', error);
      setMessage({ type: 'error', text: 'Failed to save equipment profile. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Equipment Profile</h2>
        <p className="text-gray-600 mb-6">
          Select the equipment you have access to. This will filter exercise suggestions to match your available equipment.
        </p>

        {/* Profile Name */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Profile Name
          </label>
          <input
            type="text"
            value={profileName}
            onChange={(e) => setProfileName(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="e.g., Home Gym, Commercial Gym"
          />
        </div>

        {/* Quick Presets */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Quick Presets
          </label>
          <div className="flex flex-wrap gap-2">
            {Object.keys(EQUIPMENT_PRESETS).map((presetName) => (
              <button
                key={presetName}
                onClick={() => applyPreset(presetName)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
              >
                {presetName}
              </button>
            ))}
          </div>
        </div>

        {/* Equipment Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Available Equipment ({selectedEquipment.length} selected)
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {ALL_EQUIPMENT.map((equipment) => (
              <button
                key={equipment}
                onClick={() => toggleEquipment(equipment)}
                className={`px-3 py-2 rounded-lg font-medium text-sm transition-colors ${
                  selectedEquipment.includes(equipment)
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {equipment}
              </button>
            ))}
          </div>
        </div>

        {/* Message */}
        {message && (
          <div
            className={`mb-4 p-4 rounded-lg ${
              message.type === 'success'
                ? 'bg-green-50 border border-green-200 text-green-800'
                : 'bg-red-50 border border-red-200 text-red-800'
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Save Button */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">
            {selectedEquipment.length === 0
              ? 'Select at least one piece of equipment'
              : `${selectedEquipment.length} piece${selectedEquipment.length !== 1 ? 's' : ''} of equipment selected`}
          </p>
          <button
            onClick={handleSave}
            disabled={saving || selectedEquipment.length === 0}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {saving ? 'Saving...' : 'Save Profile'}
          </button>
        </div>

        {/* Info */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-semibold text-blue-900 mb-2">How this works:</h3>
          <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
            <li>Exercise suggestions will be filtered to match your available equipment</li>
            <li>You'll see warnings when selecting exercises that require unavailable equipment</li>
            <li>Alternative exercises will prioritize equipment you have access to</li>
            <li>You can update this profile anytime as your gym setup changes</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
