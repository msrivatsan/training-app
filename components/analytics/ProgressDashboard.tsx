'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, Scale, Dumbbell, Trophy } from 'lucide-react';
import StrengthGraphs from './StrengthGraphs';
import BodyTracking from './BodyTracking';
import VolumeAnalytics from './VolumeAnalytics';
import AchievementsDashboard from './AchievementsDashboard';

export default function ProgressDashboard() {
  const [activeTab, setActiveTab] = useState('strength');

  return (
    <div className="w-full max-w-7xl mx-auto p-4 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Progress Analytics</h1>
          <p className="text-muted-foreground">
            Track your strength, body composition, and training volume
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 lg:w-[600px]">
          <TabsTrigger value="strength" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            <span className="hidden sm:inline">Strength</span>
          </TabsTrigger>
          <TabsTrigger value="body" className="flex items-center gap-2">
            <Scale className="h-4 w-4" />
            <span className="hidden sm:inline">Body</span>
          </TabsTrigger>
          <TabsTrigger value="volume" className="flex items-center gap-2">
            <Dumbbell className="h-4 w-4" />
            <span className="hidden sm:inline">Volume</span>
          </TabsTrigger>
          <TabsTrigger value="achievements" className="flex items-center gap-2">
            <Trophy className="h-4 w-4" />
            <span className="hidden sm:inline">Achievements</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="strength" className="mt-6">
          <StrengthGraphs />
        </TabsContent>

        <TabsContent value="body" className="mt-6">
          <BodyTracking />
        </TabsContent>

        <TabsContent value="volume" className="mt-6">
          <VolumeAnalytics />
        </TabsContent>

        <TabsContent value="achievements" className="mt-6">
          <AchievementsDashboard />
        </TabsContent>
      </Tabs>
    </div>
  );
}
