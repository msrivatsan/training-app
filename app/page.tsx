/**
 * Home Page / Landing Page
 *
 * Main entry point - redirects to login or dashboard based on auth state
 */

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { Dumbbell, TrendingUp, Award, Users } from 'lucide-react';

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // If user is logged in, redirect to dashboard
  if (user) {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <header className="flex items-center justify-between mb-20">
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-12 h-12 bg-purple-600 rounded-full">
              <Dumbbell className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white">Iron Quest</h1>
          </div>
          <div className="flex items-center space-x-4">
            <Link
              href="/login"
              className="text-white hover:text-purple-200 font-medium"
            >
              Sign In
            </Link>
            <Link
              href="/signup"
              className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium"
            >
              Get Started
            </Link>
          </div>
        </header>

        {/* Hero Content */}
        <div className="text-center mb-20">
          <h2 className="text-5xl md:text-6xl font-bold text-white mb-6">
            Track Your Fitness Journey
          </h2>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Iron Quest is your all-in-one workout tracker. Plan programs,
            log workouts, track progress, and achieve your fitness goals.
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center px-8 py-4 bg-purple-600 text-white text-lg rounded-lg hover:bg-purple-700 font-semibold"
          >
            Start Your Quest
          </Link>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-20">
          {/* Feature 1 */}
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 text-center">
            <div className="flex items-center justify-center w-16 h-16 bg-purple-600 rounded-full mx-auto mb-4">
              <Dumbbell className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">
              Workout Tracking
            </h3>
            <p className="text-gray-300">
              Log every rep, set, and weight with our intuitive interface.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 text-center">
            <div className="flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mx-auto mb-4">
              <TrendingUp className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">
              Progress Analytics
            </h3>
            <p className="text-gray-300">
              Visualize your gains with detailed charts and statistics.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 text-center">
            <div className="flex items-center justify-center w-16 h-16 bg-green-600 rounded-full mx-auto mb-4">
              <Award className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">
              Achievements
            </h3>
            <p className="text-gray-300">
              Unlock achievements and celebrate your milestones.
            </p>
          </div>

          {/* Feature 4 */}
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 text-center">
            <div className="flex items-center justify-center w-16 h-16 bg-yellow-600 rounded-full mx-auto mb-4">
              <Users className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">
              Custom Programs
            </h3>
            <p className="text-gray-300">
              Create and follow personalized training programs.
            </p>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center bg-white/10 backdrop-blur-sm rounded-lg p-12">
          <h3 className="text-3xl font-bold text-white mb-4">
            Ready to Level Up?
          </h3>
          <p className="text-xl text-gray-300 mb-6">
            Join Iron Quest today and start tracking your fitness journey.
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center px-8 py-4 bg-purple-600 text-white text-lg rounded-lg hover:bg-purple-700 font-semibold"
          >
            Create Free Account
          </Link>
        </div>
      </div>
    </div>
  );
}
