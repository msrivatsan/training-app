'use client';

import { useEffect, useState } from 'react';
import { Trophy, Star, TrendingUp, Target } from 'lucide-react';
import { format } from 'date-fns';

interface PersonalRecord {
  exercise_id: string;
  exercise_name: string;
  muscle_group: string;
  weight_kg: number;
  reps: number;
  estimated_1rm: number;
  date: string;
}

interface PRPrediction {
  exercise_id: string;
  exercise_name: string;
  muscle_group: string;
  current_1rm: number;
  predicted_next_pr: number | null;
  confidence: string;
  message: string;
}

interface PRData {
  all_time_prs: PersonalRecord[];
  recent_prs: PersonalRecord[];
  predictions: PRPrediction[];
  summary: {
    total_exercises: number;
    recent_pr_count: number;
    strongest_muscle_group: string | null;
  };
}

export default function PersonalRecordsPage() {
  const [data, setData] = useState<PRData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/analytics/personal-records');
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error('Error fetching personal records:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading personal records...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-96 bg-muted/20 rounded-lg border-2 border-dashed">
        <div className="text-center">
          <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Personal Records</h3>
          <p className="text-muted-foreground">
            Complete workouts to start tracking your PRs
          </p>
        </div>
      </div>
    );
  }

  const muscleGroups = Array.from(
    new Set(data.all_time_prs.map((pr) => pr.muscle_group))
  ).sort();

  const filteredPRs = selectedMuscleGroup
    ? data.all_time_prs.filter((pr) => pr.muscle_group === selectedMuscleGroup)
    : data.all_time_prs;

  const getConfidenceColor = (confidence: string) => {
    switch (confidence) {
      case 'high':
        return 'text-green-500 bg-green-500/10';
      case 'medium':
        return 'text-yellow-500 bg-yellow-500/10';
      case 'low':
        return 'text-red-500 bg-red-500/10';
      default:
        return 'text-muted-foreground bg-muted';
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-4 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Personal Records</h1>
        <p className="text-muted-foreground">
          Track your all-time bests and upcoming PR predictions
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border-2 border-yellow-500/20 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-2">
            <Trophy className="h-6 w-6 text-yellow-500" />
            <p className="text-sm text-muted-foreground">Total PRs</p>
          </div>
          <p className="text-3xl font-bold">{data.summary.total_exercises}</p>
        </div>

        <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-2 border-green-500/20 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-2">
            <Star className="h-6 w-6 text-green-500" />
            <p className="text-sm text-muted-foreground">Recent PRs (30d)</p>
          </div>
          <p className="text-3xl font-bold">{data.summary.recent_pr_count}</p>
        </div>

        <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border-2 border-blue-500/20 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="h-6 w-6 text-blue-500" />
            <p className="text-sm text-muted-foreground">Strongest Group</p>
          </div>
          <p className="text-3xl font-bold capitalize">
            {data.summary.strongest_muscle_group || 'N/A'}
          </p>
        </div>
      </div>

      {/* Recent PRs */}
      {data.recent_prs.length > 0 && (
        <div className="bg-card border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Star className="h-5 w-5 text-green-500" />
            Recent PRs (Last 30 Days)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {data.recent_prs.slice(0, 6).map((pr, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-4 bg-green-500/5 border border-green-500/20 rounded-lg"
              >
                <div>
                  <p className="font-medium">{pr.exercise_name}</p>
                  <p className="text-sm text-muted-foreground">
                    {pr.weight_kg}kg × {pr.reps}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(pr.date), 'MMM d')}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold">{pr.estimated_1rm}kg</p>
                  <p className="text-xs text-muted-foreground">1RM</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Next PR Predictions */}
      <div className="bg-card border rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Target className="h-5 w-5 text-primary" />
          Next PR Predictions
        </h2>
        <div className="space-y-3">
          {data.predictions
            .filter((p) => p.predicted_next_pr !== null)
            .slice(0, 10)
            .map((prediction, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-4 bg-muted/50 rounded-lg"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <p className="font-medium">{prediction.exercise_name}</p>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${getConfidenceColor(
                        prediction.confidence
                      )}`}
                    >
                      {prediction.confidence} confidence
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground capitalize">
                    {prediction.muscle_group}
                  </p>
                  <p className="text-sm mt-1">{prediction.message}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Current</p>
                  <p className="text-xl font-bold">{prediction.current_1rm}kg</p>
                  {prediction.predicted_next_pr && (
                    <>
                      <p className="text-sm text-muted-foreground mt-2">Target</p>
                      <p className="text-2xl font-bold text-primary">
                        {prediction.predicted_next_pr}kg
                      </p>
                    </>
                  )}
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* All-Time PRs */}
      <div className="bg-card border rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            All-Time Personal Records
          </h2>

          {/* Muscle Group Filter */}
          <select
            value={selectedMuscleGroup || ''}
            onChange={(e) => setSelectedMuscleGroup(e.target.value || null)}
            className="px-3 py-2 rounded-lg border bg-background"
          >
            <option value="">All Muscle Groups</option>
            {muscleGroups.map((group) => (
              <option key={group} value={group}>
                {group}
              </option>
            ))}
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left p-3">Rank</th>
                <th className="text-left p-3">Exercise</th>
                <th className="text-left p-3">Muscle Group</th>
                <th className="text-right p-3">Weight</th>
                <th className="text-right p-3">Reps</th>
                <th className="text-right p-3">Est. 1RM</th>
                <th className="text-right p-3">Date</th>
              </tr>
            </thead>
            <tbody>
              {filteredPRs.map((pr, idx) => (
                <tr key={idx} className="border-b hover:bg-muted/50">
                  <td className="p-3">
                    {idx < 3 ? (
                      <span className="flex items-center gap-1">
                        <Trophy
                          className={`h-4 w-4 ${
                            idx === 0
                              ? 'text-yellow-500 fill-yellow-500'
                              : idx === 1
                              ? 'text-gray-400 fill-gray-400'
                              : 'text-orange-700 fill-orange-700'
                          }`}
                        />
                        {idx + 1}
                      </span>
                    ) : (
                      idx + 1
                    )}
                  </td>
                  <td className="p-3 font-medium">{pr.exercise_name}</td>
                  <td className="p-3 capitalize">{pr.muscle_group}</td>
                  <td className="text-right p-3">{pr.weight_kg}kg</td>
                  <td className="text-right p-3">{pr.reps}</td>
                  <td className="text-right p-3 font-bold">{pr.estimated_1rm}kg</td>
                  <td className="text-right p-3 text-sm text-muted-foreground">
                    {format(new Date(pr.date), 'MMM d, yyyy')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
