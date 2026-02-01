'use client';

import { useEffect, useState } from 'react';
import { Lightbulb, AlertTriangle, CheckCircle, Info, ArrowRight } from 'lucide-react';

interface Insight {
  type: 'warning' | 'success' | 'info' | 'suggestion';
  category: 'progression' | 'balance' | 'recovery' | 'volume';
  message: string;
  action?: string;
}

interface InsightsData {
  insights: Insight[];
  generated_at: string;
}

export default function InsightsPanel() {
  const [data, setData] = useState<InsightsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInsights();
  }, []);

  const fetchInsights = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/analytics/insights');
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error('Error fetching insights:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Analyzing your training data...</p>
        </div>
      </div>
    );
  }

  if (!data || data.insights.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-muted/20 rounded-lg border-2 border-dashed">
        <div className="text-center">
          <Lightbulb className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Insights Available</h3>
          <p className="text-muted-foreground">
            Complete more workouts to receive personalized insights
          </p>
        </div>
      </div>
    );
  }

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'warning':
        return <AlertTriangle className="h-5 w-5" />;
      case 'success':
        return <CheckCircle className="h-5 w-5" />;
      case 'suggestion':
        return <Lightbulb className="h-5 w-5" />;
      default:
        return <Info className="h-5 w-5" />;
    }
  };

  const getInsightStyle = (type: string) => {
    switch (type) {
      case 'warning':
        return 'bg-orange-500/10 border-orange-500/20 text-orange-500';
      case 'success':
        return 'bg-green-500/10 border-green-500/20 text-green-500';
      case 'suggestion':
        return 'bg-blue-500/10 border-blue-500/20 text-blue-500';
      default:
        return 'bg-muted border-muted-foreground/20 text-muted-foreground';
    }
  };

  const getCategoryBadge = (category: string) => {
    const colors: Record<string, string> = {
      progression: 'bg-purple-500/10 text-purple-500',
      balance: 'bg-blue-500/10 text-blue-500',
      recovery: 'bg-green-500/10 text-green-500',
      volume: 'bg-orange-500/10 text-orange-500',
    };

    return (
      <span className={`text-xs px-2 py-0.5 rounded-full ${colors[category] || 'bg-muted text-muted-foreground'}`}>
        {category}
      </span>
    );
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Lightbulb className="h-6 w-6 text-primary" />
            Training Insights
          </h2>
          <p className="text-sm text-muted-foreground">
            AI-powered recommendations based on your training data
          </p>
        </div>
        <button
          onClick={fetchInsights}
          className="px-4 py-2 rounded-lg border hover:bg-muted text-sm"
        >
          Refresh
        </button>
      </div>

      {/* Insights Grid */}
      <div className="space-y-3">
        {data.insights.map((insight, idx) => (
          <div
            key={idx}
            className={`border-2 rounded-lg p-4 ${getInsightStyle(insight.type)}`}
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5">{getInsightIcon(insight.type)}</div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  {getCategoryBadge(insight.category)}
                </div>
                <p className="text-foreground font-medium mb-1">{insight.message}</p>
                {insight.action && (
                  <div className="flex items-center gap-2 mt-2 text-sm">
                    <ArrowRight className="h-4 w-4" />
                    <p className="text-foreground/80">{insight.action}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Generated Timestamp */}
      <p className="text-xs text-muted-foreground text-center">
        Last updated: {new Date(data.generated_at).toLocaleString()}
      </p>
    </div>
  );
}
