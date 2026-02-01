'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { TrainingPartnerProfile, PartnerRequest } from '@/lib/types/social';

export default function TrainingPartnerFinder() {
  const [profile, setProfile] = useState<TrainingPartnerProfile | null>(null);
  const [matches, setMatches] = useState<TrainingPartnerProfile[]>([]);
  const [requests, setRequests] = useState<PartnerRequest[]>([]);
  const [activeTab, setActiveTab] = useState<'profile' | 'matches' | 'requests'>('profile');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
    fetchMatches();
    fetchRequests();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/social/partners/profile');
      const data = await response.json();
      setProfile(data);
    } catch (error) {
      console.error('Error fetching partner profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMatches = async () => {
    try {
      const response = await fetch('/api/social/partners/search');
      const data = await response.json();
      setMatches(data);
    } catch (error) {
      console.error('Error fetching matches:', error);
    }
  };

  const fetchRequests = async () => {
    try {
      const response = await fetch('/api/social/partners/requests');
      const data = await response.json();
      setRequests(data);
    } catch (error) {
      console.error('Error fetching partner requests:', error);
    }
  };

  const handleSaveProfile = async () => {
    if (!profile) return;

    try {
      const response = await fetch('/api/social/partners/profile', {
        method: profile.user_id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          goals: profile.goals,
          available_days: profile.available_days,
          preferred_time: profile.preferred_time,
          bio: profile.bio,
        }),
      });

      if (response.ok) {
        alert('Partner profile saved!');
        fetchProfile();
        fetchMatches();
      }
    } catch (error) {
      console.error('Error saving profile:', error);
    }
  };

  const handleSendRequest = async (receiverId: string) => {
    try {
      const response = await fetch('/api/social/partners/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          receiver_id: receiverId,
          message: 'Hey! Want to be training partners?',
        }),
      });

      if (response.ok) {
        alert('Partner request sent!');
        fetchRequests();
      }
    } catch (error) {
      console.error('Error sending request:', error);
    }
  };

  const getMatchColor = (score: number) => {
    if (score >= 70) return 'text-green-600 bg-green-100';
    if (score >= 40) return 'text-yellow-600 bg-yellow-100';
    return 'text-gray-600 bg-gray-100';
  };

  return (
    <div className="space-y-4">
      <div className="flex space-x-2 border-b pb-2">
        <button
          onClick={() => setActiveTab('profile')}
          className={`px-4 py-2 ${activeTab === 'profile' ? 'border-b-2 border-blue-500 font-semibold' : ''}`}
        >
          My Profile
        </button>
        <button
          onClick={() => setActiveTab('matches')}
          className={`px-4 py-2 ${activeTab === 'matches' ? 'border-b-2 border-blue-500 font-semibold' : ''}`}
        >
          Find Partners ({matches.length})
        </button>
        <button
          onClick={() => setActiveTab('requests')}
          className={`px-4 py-2 ${activeTab === 'requests' ? 'border-b-2 border-blue-500 font-semibold' : ''}`}
        >
          Requests ({requests.filter(r => r.status === 'pending').length})
        </button>
      </div>

      {activeTab === 'profile' && (
        <div className="space-y-4 bg-white p-6 rounded-lg shadow">
          <div>
            <h3 className="text-xl font-bold mb-4">Training Partner Profile</h3>
            <p className="text-gray-600 mb-4">
              Set up your profile to find compatible training partners!
            </p>
          </div>

          <div>
            <Label>Training Goals (select all that apply)</Label>
            <div className="space-y-2 mt-2">
              {['strength', 'hypertrophy', 'weight_loss', 'athletic_performance', 'general_fitness'].map((goal) => (
                <label key={goal} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={profile?.goals?.includes(goal) || false}
                    onChange={(e) => {
                      const goals = profile?.goals || [];
                      setProfile({
                        ...profile!,
                        goals: e.target.checked
                          ? [...goals, goal]
                          : goals.filter(g => g !== goal),
                      });
                    }}
                    className="rounded"
                  />
                  <span className="capitalize">{goal.replace('_', ' ')}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <Label>Available Days</Label>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((day) => (
                <label key={day} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={profile?.available_days?.includes(day) || false}
                    onChange={(e) => {
                      const days = profile?.available_days || [];
                      setProfile({
                        ...profile!,
                        available_days: e.target.checked
                          ? [...days, day]
                          : days.filter(d => d !== day),
                      });
                    }}
                    className="rounded"
                  />
                  <span className="capitalize">{day}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <Label htmlFor="preferred_time">Preferred Time</Label>
            <select
              id="preferred_time"
              value={profile?.preferred_time || ''}
              onChange={(e) => setProfile({ ...profile!, preferred_time: e.target.value as any })}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
            >
              <option value="">Select preferred time...</option>
              <option value="early_morning">Early Morning (5-8am)</option>
              <option value="morning">Morning (8-11am)</option>
              <option value="afternoon">Afternoon (12-5pm)</option>
              <option value="evening">Evening (5-8pm)</option>
              <option value="late_night">Late Night (8pm+)</option>
            </select>
          </div>

          <div>
            <Label htmlFor="bio">Bio (Optional)</Label>
            <textarea
              id="bio"
              value={profile?.bio || ''}
              onChange={(e) => setProfile({ ...profile!, bio: e.target.value })}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
              rows={3}
              placeholder="Tell potential partners about yourself..."
            />
          </div>

          <Button onClick={handleSaveProfile} className="w-full">
            Save Profile & Start Matching
          </Button>
        </div>
      )}

      {activeTab === 'matches' && (
        <div className="space-y-3">
          {matches.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No matches found. Complete your profile to find training partners!
            </div>
          ) : (
            matches.map((match) => (
              <div key={match.user_id} className="bg-white rounded-lg shadow p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
                      {match.user_avatar ? (
                        <img src={match.user_avatar} alt={match.user_name} className="w-12 h-12 rounded-full" />
                      ) : (
                        <span className="text-xl">{match.user_name?.[0]}</span>
                      )}
                    </div>
                    <div>
                      <p className="font-semibold">{match.user_name}</p>
                      <p className="text-sm text-gray-600">
                        {match.fitness_level || 'Lifter'}
                        {match.location_city && ` • ${match.location_city}`}
                      </p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getMatchColor(match.match_score || 0)}`}>
                    {match.match_score}% Match
                  </span>
                </div>

                {match.bio && (
                  <p className="text-sm text-gray-700 mb-3">{match.bio}</p>
                )}

                <div className="flex flex-wrap gap-2 mb-3">
                  {match.goals?.map((goal, idx) => (
                    <span key={idx} className="text-xs px-2 py-1 bg-blue-100 text-blue-600 rounded">
                      {goal.replace('_', ' ')}
                    </span>
                  ))}
                </div>

                <div className="text-sm text-gray-600 mb-3">
                  <strong>Available:</strong> {match.available_days?.join(', ')}
                  {match.preferred_time && (
                    <span className="ml-2">• {match.preferred_time.replace('_', ' ')}</span>
                  )}
                </div>

                <Button onClick={() => handleSendRequest(match.user_id)} className="w-full">
                  Send Partner Request
                </Button>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'requests' && (
        <div className="space-y-3">
          {requests.filter(r => r.status === 'pending').length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No pending requests
            </div>
          ) : (
            requests
              .filter(r => r.status === 'pending')
              .map((request) => (
                <div key={request.id} className="bg-white rounded-lg shadow p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                        <span className="text-lg">{request.sender_name?.[0]}</span>
                      </div>
                      <div>
                        <p className="font-semibold">{request.sender_name}</p>
                        <p className="text-sm text-gray-600">Wants to be training partners</p>
                        {request.message && (
                          <p className="text-sm text-gray-700 mt-1">{request.message}</p>
                        )}
                      </div>
                    </div>
                    <div className="space-x-2">
                      <Button size="sm">Accept</Button>
                      <Button variant="outline" size="sm">Decline</Button>
                    </div>
                  </div>
                </div>
              ))
          )}
        </div>
      )}
    </div>
  );
}
