'use client';

/**
 * Nutrition Tracking Page
 *
 * Main nutrition tracking interface with tabs for dashboard, logger, templates, and stats
 */

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import NutritionDashboard from '@/components/nutrition/NutritionDashboard';
import MealLogger from '@/components/nutrition/MealLogger';
import WaterTracker from '@/components/nutrition/WaterTracker';
import MealTemplates from '@/components/nutrition/MealTemplates';
import NutritionStats from '@/components/nutrition/NutritionStats';
import WeightCorrelation from '@/components/nutrition/WeightCorrelation';
import MacroCalculator from '@/components/nutrition/MacroCalculator';
import { Button } from '@/components/ui/button';
import {
  BarChart3,
  Utensils,
  Bookmark,
  TrendingUp,
  Calculator,
  Settings,
} from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function NutritionPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showMealLogger, setShowMealLogger] = useState(false);
  const [selectedMealType, setSelectedMealType] = useState('breakfast');
  const [showCalculator, setShowCalculator] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const handleAddMeal = (mealType: string) => {
    setSelectedMealType(mealType);
    setShowMealLogger(true);
  };

  const handleMealLogged = () => {
    setShowMealLogger(false);
    setActiveTab('dashboard'); // Refresh dashboard
  };

  return (
    <div className="container max-w-6xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Nutrition Tracking</h1>
        <p className="text-muted-foreground">
          Track your meals, macros, and stay on top of your nutrition goals
        </p>
      </div>

      {/* Calculator Modal */}
      {showCalculator && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Macro Calculator</h2>
              <Button variant="ghost" onClick={() => setShowCalculator(false)}>
                Close
              </Button>
            </div>
            <MacroCalculator
              initialValues={{
                weight_kg: profile?.weight_kg || undefined,
                height_cm: profile?.height_cm || undefined,
                age: profile?.date_of_birth
                  ? new Date().getFullYear() - new Date(profile.date_of_birth).getFullYear()
                  : undefined,
                gender: profile?.gender || undefined,
              }}
              onCalculate={() => {
                setShowCalculator(false);
                window.location.reload(); // Refresh to show new goals
              }}
            />
          </div>
        </div>
      )}

      {/* Meal Logger Modal */}
      {showMealLogger && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Log Meal</h2>
              <Button variant="ghost" onClick={() => setShowMealLogger(false)}>
                Close
              </Button>
            </div>
            <MealLogger
              mealType={selectedMealType}
              onSuccess={handleMealLogged}
              onCancel={() => setShowMealLogger(false)}
            />
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="flex gap-3 mb-6">
        <Button onClick={() => handleAddMeal('breakfast')}>
          <Utensils className="mr-2 h-4 w-4" />
          Log Meal
        </Button>
        <Button variant="outline" onClick={() => setShowCalculator(true)}>
          <Calculator className="mr-2 h-4 w-4" />
          Calculate Macros
        </Button>
        <Button variant="outline" onClick={() => router.push('/profile')}>
          <Settings className="mr-2 h-4 w-4" />
          Settings
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5 mb-6">
          <TabsTrigger value="dashboard">
            <BarChart3 className="h-4 w-4 mr-2" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="templates">
            <Bookmark className="h-4 w-4 mr-2" />
            Templates
          </TabsTrigger>
          <TabsTrigger value="stats">
            <TrendingUp className="h-4 w-4 mr-2" />
            Stats
          </TabsTrigger>
          <TabsTrigger value="correlation">
            <TrendingUp className="h-4 w-4 mr-2" />
            Weight
          </TabsTrigger>
          <TabsTrigger value="water">
            Water
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard">
          <NutritionDashboard userId={user.id} onAddMeal={handleAddMeal} />
        </TabsContent>

        <TabsContent value="templates">
          <MealTemplates onLogTemplate={(template) => {
            // Log the template
            handleMealLogged();
          }} />
        </TabsContent>

        <TabsContent value="stats">
          <NutritionStats />
        </TabsContent>

        <TabsContent value="correlation">
          <WeightCorrelation />
        </TabsContent>

        <TabsContent value="water">
          <WaterTracker userId={user.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
