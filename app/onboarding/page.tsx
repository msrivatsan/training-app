'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Dumbbell,
  Target,
  TrendingUp,
  Bell,
  ArrowRight,
  ArrowLeft,
  Check,
  User,
  Weight,
  Calendar,
  Trophy,
  Settings,
} from 'lucide-react';
import { useAuth } from '@/lib/hooks/useAuth';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  component: React.ReactNode;
}

export default function OnboardingPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    weight: '',
    experienceLevel: 'beginner',
    goals: [] as string[],
    programTemplate: 'push_pull_legs',
    availableEquipment: [] as string[],
    notificationsEnabled: true,
  });

  const steps: OnboardingStep[] = [
    {
      id: 'welcome',
      title: 'Welcome to Iron Quest! 🎮',
      description: 'Transform your fitness journey into an epic RPG adventure',
      icon: <Trophy className="w-16 h-16 text-yellow-500" />,
      component: <WelcomeStep />,
    },
    {
      id: 'profile',
      title: 'Set Up Your Profile',
      description: 'Tell us about yourself to personalize your experience',
      icon: <User className="w-16 h-16 text-blue-500" />,
      component: (
        <ProfileStep
          weight={formData.weight}
          experienceLevel={formData.experienceLevel}
          onChange={(data) => setFormData({ ...formData, ...data })}
        />
      ),
    },
    {
      id: 'goals',
      title: 'Choose Your Goals',
      description: 'What do you want to achieve?',
      icon: <Target className="w-16 h-16 text-green-500" />,
      component: (
        <GoalsStep
          selectedGoals={formData.goals}
          onChange={(goals) => setFormData({ ...formData, goals })}
        />
      ),
    },
    {
      id: 'program',
      title: 'Select a Program',
      description: 'Pick a training program that fits your schedule',
      icon: <TrendingUp className="w-16 h-16 text-purple-500" />,
      component: (
        <ProgramStep
          selectedProgram={formData.programTemplate}
          onChange={(program) => setFormData({ ...formData, programTemplate: program })}
        />
      ),
    },
    {
      id: 'equipment',
      title: 'Available Equipment',
      description: 'Select what equipment you have access to',
      icon: <Dumbbell className="w-16 h-16 text-orange-500" />,
      component: (
        <EquipmentStep
          selectedEquipment={formData.availableEquipment}
          onChange={(equipment) => setFormData({ ...formData, availableEquipment: equipment })}
        />
      ),
    },
    {
      id: 'notifications',
      title: 'Stay Motivated',
      description: 'Enable notifications to track your progress',
      icon: <Bell className="w-16 h-16 text-red-500" />,
      component: (
        <NotificationsStep
          enabled={formData.notificationsEnabled}
          onChange={(enabled) => setFormData({ ...formData, notificationsEnabled: enabled })}
        />
      ),
    },
    {
      id: 'tutorial',
      title: 'Quick Tutorial',
      description: 'Learn the basics of Iron Quest',
      icon: <Settings className="w-16 h-16 text-cyan-500" />,
      component: <TutorialStep />,
    },
  ];

  const currentStepData = steps[currentStep];
  const progress = ((currentStep + 1) / steps.length) * 100;

  const handleNext = async () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      await completeOnboarding();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const completeOnboarding = async () => {
    setLoading(true);
    try {
      // Save onboarding data
      await fetch('/api/onboarding/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      // Redirect to dashboard
      router.push('/dashboard');
    } catch (error) {
      console.error('Failed to complete onboarding:', error);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black text-white">
      <div className="max-w-4xl mx-auto p-6 py-12">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-400">
              Step {currentStep + 1} of {steps.length}
            </span>
            <span className="text-sm text-gray-400">{Math.round(progress)}%</span>
          </div>
          <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        {/* Step Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
            className="bg-gray-900 rounded-2xl p-8 shadow-2xl"
          >
            {/* Icon */}
            <div className="flex justify-center mb-6">{currentStepData.icon}</div>

            {/* Title & Description */}
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold mb-3">{currentStepData.title}</h1>
              <p className="text-gray-400 text-lg">{currentStepData.description}</p>
            </div>

            {/* Step Component */}
            <div className="mb-8">{currentStepData.component}</div>

            {/* Navigation Buttons */}
            <div className="flex justify-between gap-4">
              <button
                onClick={handleBack}
                disabled={currentStep === 0}
                className="flex items-center gap-2 px-6 py-3 rounded-lg font-medium bg-gray-800 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                Back
              </button>
              <button
                onClick={handleNext}
                disabled={loading}
                className="flex items-center gap-2 px-6 py-3 rounded-lg font-medium bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 transition-all"
              >
                {currentStep === steps.length - 1 ? (
                  <>
                    <Check className="w-5 h-5" />
                    {loading ? 'Finishing...' : 'Finish'}
                  </>
                ) : (
                  <>
                    Next
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Skip Button */}
        {currentStep > 0 && (
          <div className="text-center mt-6">
            <button
              onClick={() => router.push('/dashboard')}
              className="text-gray-400 hover:text-white text-sm underline"
            >
              Skip onboarding
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// Step Components
function WelcomeStep() {
  return (
    <div className="text-center space-y-6">
      <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-xl p-6">
        <h3 className="text-xl font-bold mb-3">Level up your fitness! 🎮</h3>
        <p className="text-gray-300">
          Iron Quest turns your workouts into an epic adventure. Gain XP, unlock achievements,
          battle bosses, and watch your power rating soar!
        </p>
      </div>
      <div className="grid grid-cols-3 gap-4 text-center">
        <div>
          <div className="text-3xl mb-2">⚡</div>
          <p className="text-sm text-gray-400">Gain XP</p>
        </div>
        <div>
          <div className="text-3xl mb-2">🏆</div>
          <p className="text-sm text-gray-400">Unlock Achievements</p>
        </div>
        <div>
          <div className="text-3xl mb-2">👹</div>
          <p className="text-sm text-gray-400">Battle Bosses</p>
        </div>
      </div>
    </div>
  );
}

function ProfileStep({
  weight,
  experienceLevel,
  onChange,
}: {
  weight: string;
  experienceLevel: string;
  onChange: (data: any) => void;
}) {
  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium mb-2">Current Weight (kg)</label>
        <input
          type="number"
          value={weight}
          onChange={(e) => onChange({ weight: e.target.value })}
          placeholder="75"
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-2">Experience Level</label>
        <div className="grid grid-cols-3 gap-3">
          {[
            { value: 'beginner', label: 'Beginner', desc: '0-1 years' },
            { value: 'intermediate', label: 'Intermediate', desc: '1-3 years' },
            { value: 'advanced', label: 'Advanced', desc: '3+ years' },
          ].map((level) => (
            <button
              key={level.value}
              onClick={() => onChange({ experienceLevel: level.value })}
              className={`p-4 rounded-lg border-2 transition-all ${
                experienceLevel === level.value
                  ? 'border-blue-500 bg-blue-500/10'
                  : 'border-gray-700 hover:border-gray-600'
              }`}
            >
              <p className="font-bold">{level.label}</p>
              <p className="text-xs text-gray-400">{level.desc}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function GoalsStep({
  selectedGoals,
  onChange,
}: {
  selectedGoals: string[];
  onChange: (goals: string[]) => void;
}) {
  const goals = [
    { id: 'strength', label: 'Build Strength', icon: '💪' },
    { id: 'muscle', label: 'Gain Muscle', icon: '🦾' },
    { id: 'lose_weight', label: 'Lose Weight', icon: '⚖️' },
    { id: 'endurance', label: 'Improve Endurance', icon: '🏃' },
    { id: 'flexibility', label: 'Increase Flexibility', icon: '🧘' },
    { id: 'health', label: 'General Health', icon: '❤️' },
  ];

  const toggleGoal = (goalId: string) => {
    if (selectedGoals.includes(goalId)) {
      onChange(selectedGoals.filter((g) => g !== goalId));
    } else {
      onChange([...selectedGoals, goalId]);
    }
  };

  return (
    <div className="grid grid-cols-2 gap-4">
      {goals.map((goal) => (
        <button
          key={goal.id}
          onClick={() => toggleGoal(goal.id)}
          className={`p-4 rounded-lg border-2 transition-all ${
            selectedGoals.includes(goal.id)
              ? 'border-blue-500 bg-blue-500/10'
              : 'border-gray-700 hover:border-gray-600'
          }`}
        >
          <div className="text-3xl mb-2">{goal.icon}</div>
          <p className="font-medium">{goal.label}</p>
        </button>
      ))}
    </div>
  );
}

function ProgramStep({
  selectedProgram,
  onChange,
}: {
  selectedProgram: string;
  onChange: (program: string) => void;
}) {
  const programs = [
    {
      id: 'push_pull_legs',
      name: 'Push/Pull/Legs',
      desc: '6 days/week',
      difficulty: 'Intermediate',
    },
    {
      id: 'upper_lower',
      name: 'Upper/Lower Split',
      desc: '4 days/week',
      difficulty: 'Beginner',
    },
    {
      id: 'full_body',
      name: 'Full Body',
      desc: '3 days/week',
      difficulty: 'Beginner',
    },
    {
      id: 'powerlifting',
      name: 'Powerlifting',
      desc: '4 days/week',
      difficulty: 'Advanced',
    },
  ];

  return (
    <div className="space-y-3">
      {programs.map((program) => (
        <button
          key={program.id}
          onClick={() => onChange(program.id)}
          className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
            selectedProgram === program.id
              ? 'border-blue-500 bg-blue-500/10'
              : 'border-gray-700 hover:border-gray-600'
          }`}
        >
          <div className="flex justify-between items-start">
            <div>
              <h4 className="font-bold text-lg">{program.name}</h4>
              <p className="text-sm text-gray-400">{program.desc}</p>
            </div>
            <span className="text-xs bg-gray-800 px-2 py-1 rounded">{program.difficulty}</span>
          </div>
        </button>
      ))}
    </div>
  );
}

function EquipmentStep({
  selectedEquipment,
  onChange,
}: {
  selectedEquipment: string[];
  onChange: (equipment: string[]) => void;
}) {
  const equipment = [
    { id: 'barbell', label: 'Barbell', icon: '🏋️' },
    { id: 'dumbbells', label: 'Dumbbells', icon: '💪' },
    { id: 'bench', label: 'Bench', icon: '🛏️' },
    { id: 'squat_rack', label: 'Squat Rack', icon: '🏗️' },
    { id: 'pull_up_bar', label: 'Pull-up Bar', icon: '🎯' },
    { id: 'cables', label: 'Cable Machine', icon: '🎪' },
    { id: 'leg_press', label: 'Leg Press', icon: '🦵' },
    { id: 'cardio', label: 'Cardio Equipment', icon: '🏃' },
  ];

  const toggleEquipment = (equipId: string) => {
    if (selectedEquipment.includes(equipId)) {
      onChange(selectedEquipment.filter((e) => e !== equipId));
    } else {
      onChange([...selectedEquipment, equipId]);
    }
  };

  return (
    <div className="grid grid-cols-2 gap-3">
      {equipment.map((equip) => (
        <button
          key={equip.id}
          onClick={() => toggleEquipment(equip.id)}
          className={`p-4 rounded-lg border-2 transition-all ${
            selectedEquipment.includes(equip.id)
              ? 'border-blue-500 bg-blue-500/10'
              : 'border-gray-700 hover:border-gray-600'
          }`}
        >
          <div className="text-2xl mb-2">{equip.icon}</div>
          <p className="text-sm font-medium">{equip.label}</p>
        </button>
      ))}
    </div>
  );
}

function NotificationsStep({
  enabled,
  onChange,
}: {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
}) {
  return (
    <div className="space-y-6">
      <div className="bg-gray-800 rounded-xl p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="font-bold text-lg mb-2">Enable Notifications</h3>
            <p className="text-sm text-gray-400">
              Get reminders for workouts, achievements, and weekly summaries
            </p>
          </div>
          <button
            onClick={() => onChange(!enabled)}
            className={`relative w-14 h-7 rounded-full transition-colors ${
              enabled ? 'bg-blue-600' : 'bg-gray-700'
            }`}
          >
            <div
              className={`absolute top-1 left-1 w-5 h-5 rounded-full bg-white transition-transform ${
                enabled ? 'translate-x-7' : ''
              }`}
            />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm">
        <div className="bg-gray-800 rounded-lg p-4">
          <div className="text-2xl mb-2">🏋️</div>
          <p className="font-medium">Workout Reminders</p>
        </div>
        <div className="bg-gray-800 rounded-lg p-4">
          <div className="text-2xl mb-2">🏆</div>
          <p className="font-medium">Achievement Alerts</p>
        </div>
        <div className="bg-gray-800 rounded-lg p-4">
          <div className="text-2xl mb-2">📊</div>
          <p className="font-medium">Weekly Summaries</p>
        </div>
        <div className="bg-gray-800 rounded-lg p-4">
          <div className="text-2xl mb-2">🔥</div>
          <p className="font-medium">Streak Milestones</p>
        </div>
      </div>
    </div>
  );
}

function TutorialStep() {
  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-xl p-6">
        <h3 className="font-bold text-lg mb-4">Quick Start Guide</h3>
        <div className="space-y-3 text-sm">
          <div className="flex gap-3">
            <div className="text-2xl">1️⃣</div>
            <div>
              <p className="font-medium">Start a Workout</p>
              <p className="text-gray-400">Choose a program and begin your first session</p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="text-2xl">2️⃣</div>
            <div>
              <p className="font-medium">Log Your Sets</p>
              <p className="text-gray-400">Record weight, reps, and RPE for each set</p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="text-2xl">3️⃣</div>
            <div>
              <p className="font-medium">Gain XP</p>
              <p className="text-gray-400">Complete sets and workouts to level up</p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="text-2xl">4️⃣</div>
            <div>
              <p className="font-medium">Track Progress</p>
              <p className="text-gray-400">View analytics and beat your PRs</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
        <p className="text-sm text-yellow-400">
          <strong>Pro Tip:</strong> Consistency is key! Complete workouts regularly to maintain
          your streak and unlock special achievements.
        </p>
      </div>
    </div>
  );
}
