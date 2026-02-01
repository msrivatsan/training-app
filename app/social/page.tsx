'use client';

import { useState } from 'react';
import { Tabs } from '@/components/ui/tabs';
import PrivacySettings from '@/components/social/PrivacySettings';
import FriendsManager from '@/components/social/FriendsManager';
import SocialFeed from '@/components/social/SocialFeed';
import WeeklyChallenges from '@/components/social/WeeklyChallenges';
import Leaderboard from '@/components/social/Leaderboard';
import TrainingPartnerFinder from '@/components/social/TrainingPartnerFinder';
import CommunityTemplates from '@/components/social/CommunityTemplates';

export default function SocialPage() {
  const [activeTab, setActiveTab] = useState('feed');

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Social & Community</h1>
        <p className="text-gray-600">
          Connect with other lifters, share your progress, and crush challenges together!
        </p>
      </div>

      <div className="mb-6 flex flex-wrap gap-2 border-b pb-2">
        <button
          onClick={() => setActiveTab('feed')}
          className={`px-6 py-3 rounded-t-lg font-semibold transition ${
            activeTab === 'feed'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-100 hover:bg-gray-200'
          }`}
        >
          Feed
        </button>
        <button
          onClick={() => setActiveTab('friends')}
          className={`px-6 py-3 rounded-t-lg font-semibold transition ${
            activeTab === 'friends'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-100 hover:bg-gray-200'
          }`}
        >
          Friends
        </button>
        <button
          onClick={() => setActiveTab('challenges')}
          className={`px-6 py-3 rounded-t-lg font-semibold transition ${
            activeTab === 'challenges'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-100 hover:bg-gray-200'
          }`}
        >
          Guild Quests
        </button>
        <button
          onClick={() => setActiveTab('leaderboards')}
          className={`px-6 py-3 rounded-t-lg font-semibold transition ${
            activeTab === 'leaderboards'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-100 hover:bg-gray-200'
          }`}
        >
          Leaderboards
        </button>
        <button
          onClick={() => setActiveTab('partners')}
          className={`px-6 py-3 rounded-t-lg font-semibold transition ${
            activeTab === 'partners'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-100 hover:bg-gray-200'
          }`}
        >
          Training Partners
        </button>
        <button
          onClick={() => setActiveTab('templates')}
          className={`px-6 py-3 rounded-t-lg font-semibold transition ${
            activeTab === 'templates'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-100 hover:bg-gray-200'
          }`}
        >
          Community Programs
        </button>
        <button
          onClick={() => setActiveTab('privacy')}
          className={`px-6 py-3 rounded-t-lg font-semibold transition ${
            activeTab === 'privacy'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-100 hover:bg-gray-200'
          }`}
        >
          Privacy
        </button>
      </div>

      <div className="bg-gray-50 rounded-lg p-6 min-h-[600px]">
        {activeTab === 'feed' && <SocialFeed />}
        {activeTab === 'friends' && <FriendsManager />}
        {activeTab === 'challenges' && <WeeklyChallenges />}
        {activeTab === 'leaderboards' && <Leaderboard />}
        {activeTab === 'partners' && <TrainingPartnerFinder />}
        {activeTab === 'templates' && <CommunityTemplates />}
        {activeTab === 'privacy' && <PrivacySettings />}
      </div>

      <div className="mt-8 bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200 rounded-lg p-6">
        <h3 className="text-xl font-bold text-blue-900 mb-3 flex items-center">
          <span className="mr-2">🔒</span>
          Privacy First Design
        </h3>
        <div className="text-blue-800 space-y-2">
          <p>
            <strong>All social features are OPT-IN by default.</strong> Your workout data stays private
            unless you explicitly choose to share it.
          </p>
          <ul className="list-disc list-inside space-y-1 ml-4">
            <li>Profile visibility: Private by default</li>
            <li>Workout sharing: Private by default</li>
            <li>Leaderboards: Opt-in only</li>
            <li>Partner matching: Requires explicit activation</li>
            <li>Location sharing: Optional and controlled</li>
          </ul>
          <p className="mt-3">
            You have complete control over who sees your data. Visit the Privacy tab to customize your settings.
          </p>
        </div>
      </div>
    </div>
  );
}
