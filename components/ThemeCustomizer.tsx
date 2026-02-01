'use client';

import { useState, useEffect } from 'react';
import { Palette, Check, Lock } from 'lucide-react';
import { motion } from 'framer-motion';
import { AvailableTheme } from '@/lib/types';

const predefinedThemes: AvailableTheme[] = [
  {
    id: '1',
    name: 'default',
    display_name: 'Default',
    description: 'Classic Iron Quest theme',
    preview_url: '/themes/default.png',
    colors: {
      primary: '#3b82f6',
      secondary: '#8b5cf6',
      accent: '#3b82f6',
      background: '#000000',
    },
    unlock_requirement: 'default',
    is_premium: false,
  },
  {
    id: '2',
    name: 'ocean',
    display_name: 'Ocean',
    description: 'Deep blue waters',
    preview_url: '/themes/ocean.png',
    colors: {
      primary: '#0ea5e9',
      secondary: '#06b6d4',
      accent: '#0ea5e9',
      background: '#082f49',
    },
    unlock_requirement: 'level',
    unlock_value: 10,
    is_premium: false,
  },
  {
    id: '3',
    name: 'sunset',
    display_name: 'Sunset',
    description: 'Warm orange and red tones',
    preview_url: '/themes/sunset.png',
    colors: {
      primary: '#f97316',
      secondary: '#dc2626',
      accent: '#f97316',
      background: '#451a03',
    },
    unlock_requirement: 'level',
    unlock_value: 20,
    is_premium: false,
  },
  {
    id: '4',
    name: 'forest',
    display_name: 'Forest',
    description: 'Natural green hues',
    preview_url: '/themes/forest.png',
    colors: {
      primary: '#22c55e',
      secondary: '#16a34a',
      accent: '#22c55e',
      background: '#14532d',
    },
    unlock_requirement: 'achievement',
    achievement_id: 'nature_warrior',
    is_premium: false,
  },
  {
    id: '5',
    name: 'midnight',
    display_name: 'Midnight',
    description: 'Pure black with purple accents',
    preview_url: '/themes/midnight.png',
    colors: {
      primary: '#8b5cf6',
      secondary: '#a78bfa',
      accent: '#8b5cf6',
      background: '#000000',
    },
    unlock_requirement: 'level',
    unlock_value: 30,
    is_premium: false,
  },
  {
    id: '6',
    name: 'gold',
    display_name: 'Gold Rush',
    description: 'Luxurious gold theme',
    preview_url: '/themes/gold.png',
    colors: {
      primary: '#fbbf24',
      secondary: '#f59e0b',
      accent: '#fbbf24',
      background: '#451a03',
    },
    unlock_requirement: 'achievement',
    achievement_id: 'golden_warrior',
    is_premium: true,
  },
  {
    id: '7',
    name: 'blood',
    display_name: 'Blood Moon',
    description: 'Dark red warrior theme',
    preview_url: '/themes/blood.png',
    colors: {
      primary: '#dc2626',
      secondary: '#991b1b',
      accent: '#dc2626',
      background: '#450a0a',
    },
    unlock_requirement: 'achievement',
    achievement_id: 'blood_warrior',
    is_premium: true,
  },
];

interface ThemeCustomizerProps {
  currentLevel?: number;
  unlockedAchievements?: string[];
  onThemeChange?: (theme: AvailableTheme) => void;
}

export default function ThemeCustomizer({
  currentLevel = 1,
  unlockedAchievements = [],
  onThemeChange,
}: ThemeCustomizerProps) {
  const [selectedTheme, setSelectedTheme] = useState<AvailableTheme>(predefinedThemes[0]);
  const [customAccentColor, setCustomAccentColor] = useState('#3b82f6');

  const isThemeUnlocked = (theme: AvailableTheme): boolean => {
    if (theme.unlock_requirement === 'default') return true;
    if (theme.unlock_requirement === 'level') {
      return currentLevel >= (theme.unlock_value || 0);
    }
    if (theme.unlock_requirement === 'achievement') {
      return unlockedAchievements.includes(theme.achievement_id || '');
    }
    return false;
  };

  const handleThemeSelect = (theme: AvailableTheme) => {
    if (!isThemeUnlocked(theme)) return;
    setSelectedTheme(theme);
    setCustomAccentColor(theme.colors.accent);
    onThemeChange?.(theme);
  };

  const handleCustomColorChange = (color: string) => {
    setCustomAccentColor(color);
    const customTheme = {
      ...selectedTheme,
      colors: {
        ...selectedTheme.colors,
        accent: color,
      },
    };
    onThemeChange?.(customTheme);
  };

  return (
    <div className="space-y-6">
      {/* Theme Grid */}
      <div>
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Palette className="w-5 h-5" />
          Available Themes
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {predefinedThemes.map((theme) => {
            const unlocked = isThemeUnlocked(theme);
            const selected = selectedTheme.id === theme.id;

            return (
              <motion.button
                key={theme.id}
                onClick={() => handleThemeSelect(theme)}
                disabled={!unlocked}
                whileHover={unlocked ? { scale: 1.05 } : {}}
                whileTap={unlocked ? { scale: 0.95 } : {}}
                className={`
                  relative p-4 rounded-xl border-2 transition-all
                  ${selected ? 'border-blue-500 bg-blue-500/10' : 'border-gray-700'}
                  ${!unlocked ? 'opacity-50 cursor-not-allowed' : 'hover:border-gray-500 cursor-pointer'}
                `}
              >
                {/* Theme Preview */}
                <div
                  className="w-full h-24 rounded-lg mb-3 flex items-center justify-center"
                  style={{
                    background: `linear-gradient(135deg, ${theme.colors.primary} 0%, ${theme.colors.secondary} 100%)`,
                  }}
                >
                  {selected && (
                    <div className="bg-white rounded-full p-2">
                      <Check className="w-6 h-6 text-green-600" />
                    </div>
                  )}
                </div>

                {/* Theme Info */}
                <div className="text-left">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-bold text-white">{theme.display_name}</h4>
                    {theme.is_premium && (
                      <span className="text-xs bg-yellow-600 text-white px-2 py-1 rounded">
                        Premium
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-400">{theme.description}</p>

                  {/* Unlock Status */}
                  {!unlocked && (
                    <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
                      <Lock className="w-3 h-3" />
                      {theme.unlock_requirement === 'level' && (
                        <span>Unlock at level {theme.unlock_value}</span>
                      )}
                      {theme.unlock_requirement === 'achievement' && (
                        <span>Unlock via achievement</span>
                      )}
                    </div>
                  )}
                </div>

                {/* Lock Overlay */}
                {!unlocked && (
                  <div className="absolute inset-0 bg-black/50 rounded-xl flex items-center justify-center">
                    <Lock className="w-8 h-8 text-gray-400" />
                  </div>
                )}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Custom Accent Color */}
      <div className="bg-gray-900 rounded-xl p-6">
        <h3 className="text-xl font-bold mb-4">Custom Accent Color</h3>
        <div className="flex items-center gap-4">
          <input
            type="color"
            value={customAccentColor}
            onChange={(e) => handleCustomColorChange(e.target.value)}
            className="w-20 h-20 rounded-lg cursor-pointer border-2 border-gray-700"
          />
          <div>
            <p className="font-medium text-white">{customAccentColor}</p>
            <p className="text-sm text-gray-400">
              Choose a custom accent color for your theme
            </p>
          </div>
        </div>

        {/* Color Presets */}
        <div className="mt-4">
          <p className="text-sm text-gray-400 mb-2">Quick presets:</p>
          <div className="flex gap-2">
            {[
              '#3b82f6', // Blue
              '#8b5cf6', // Purple
              '#ec4899', // Pink
              '#f97316', // Orange
              '#22c55e', // Green
              '#0ea5e9', // Cyan
              '#dc2626', // Red
              '#fbbf24', // Yellow
            ].map((color) => (
              <button
                key={color}
                onClick={() => handleCustomColorChange(color)}
                className="w-10 h-10 rounded-lg border-2 border-gray-700 hover:border-white transition-colors"
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Theme Info */}
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
        <p className="text-sm text-blue-400">
          <strong>Tip:</strong> Unlock more themes by leveling up and completing achievements!
        </p>
      </div>
    </div>
  );
}
