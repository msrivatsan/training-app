/**
 * Utility Functions
 *
 * Common helper functions used throughout the application
 */

import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge Tailwind CSS classes
 * Combines clsx and tailwind-merge for better className handling
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format date to readable string
 */
export function formatDate(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Format time duration in minutes to readable string
 */
export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}m`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

/**
 * Calculate estimated 1 rep max using Epley formula
 */
export function calculateOneRepMax(weight: number, reps: number): number {
  if (reps === 1) return weight;
  return Math.round(weight * (1 + reps / 30));
}

/**
 * Format weight with unit
 */
export function formatWeight(kg: number, unit: 'kg' | 'lbs' = 'kg'): string {
  if (unit === 'lbs') {
    const lbs = Math.round(kg * 2.20462);
    return `${lbs} lbs`;
  }
  return `${kg} kg`;
}

/**
 * Calculate total volume (weight × reps)
 */
export function calculateVolume(weight: number, reps: number): number {
  return weight * reps;
}

/**
 * Format large numbers with K, M suffixes
 */
export function formatNumber(num: number): string {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toString();
}

/**
 * Get greeting based on time of day
 */
export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

/**
 * Calculate days between two dates
 */
export function daysBetween(date1: string | Date, date2: string | Date): number {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const diffTime = Math.abs(d2.getTime() - d1.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Get muscle group emoji
 */
export function getMuscleGroupEmoji(muscleGroup: string): string {
  const emojiMap: Record<string, string> = {
    chest: '💪',
    back: '🦾',
    legs: '🦵',
    shoulders: '🏋️',
    arms: '💪',
    core: '🎯',
    cardio: '❤️',
  };
  return emojiMap[muscleGroup.toLowerCase()] || '💪';
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Generate random ID (for temporary use)
 */
export function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Sleep utility for delays
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
