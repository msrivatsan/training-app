/**
 * Password Reset Page
 *
 * Handles password reset via email
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Dumbbell, Mail, Loader2, ArrowLeft } from 'lucide-react';

export default function ResetPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const supabase = createClient();

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback`,
      });

      if (error) {
        setError(error.message);
        return;
      }

      setSuccess(true);
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <div className="w-full max-w-md">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-600 rounded-full mb-4">
            <Dumbbell className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">Iron Quest</h1>
          <p className="text-gray-400">Reset your password</p>
        </div>

        {/* Reset Password Form */}
        <div className="bg-white rounded-lg shadow-xl p-8">
          {/* Back to Login Link */}
          <Link
            href="/login"
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to login
          </Link>

          <h2 className="text-2xl font-semibold text-gray-900 mb-2">
            Forgot your password?
          </h2>
          <p className="text-sm text-gray-600 mb-6">
            Enter your email address and we&apos;ll send you a link to reset
            your password.
          </p>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {success ? (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <h3 className="text-sm font-medium text-green-800 mb-1">
                Check your email
              </h3>
              <p className="text-sm text-green-700">
                We&apos;ve sent a password reset link to{' '}
                <span className="font-medium">{email}</span>. Please check your
                inbox and follow the instructions.
              </p>
            </div>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-4">
              {/* Email Input */}
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="you@example.com"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5" />
                    Sending...
                  </>
                ) : (
                  'Send reset link'
                )}
              </button>
            </form>
          )}

          {/* Sign Up Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Don&apos;t have an account?{' '}
              <Link
                href="/signup"
                className="font-medium text-purple-600 hover:text-purple-700"
              >
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
