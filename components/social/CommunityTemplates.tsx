'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { CommunityProgramTemplate } from '@/lib/types/social';

export default function CommunityTemplates() {
  const [templates, setTemplates] = useState<CommunityProgramTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState<'rating' | 'uses' | 'recent'>('rating');
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

  useEffect(() => {
    fetchTemplates();
  }, [sort]);

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/social/templates?sort=${sort}&limit=12`);
      const data = await response.json();
      setTemplates(data);
    } catch (error) {
      console.error('Error fetching templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRateTemplate = async (templateId: string, rating: number) => {
    try {
      await fetch(`/api/social/templates/${templateId}/ratings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating }),
      });
      fetchTemplates();
    } catch (error) {
      console.error('Error rating template:', error);
    }
  };

  const handleUseTemplate = async (templateId: string) => {
    try {
      await fetch(`/api/social/templates/${templateId}/use`, {
        method: 'POST',
      });
      alert('Template added to your programs! Check the Programs page.');
    } catch (error) {
      console.error('Error using template:', error);
    }
  };

  const renderStars = (rating: number, templateId?: string) => {
    return (
      <div className="flex space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onClick={() => templateId && handleRateTemplate(templateId, star)}
            className={`text-xl ${star <= rating ? 'text-yellow-500' : 'text-gray-300'}`}
          >
            ★
          </button>
        ))}
      </div>
    );
  };

  const getDifficultyColor = (difficulty?: string) => {
    switch (difficulty) {
      case 'beginner': return 'text-green-600 bg-green-100';
      case 'intermediate': return 'text-yellow-600 bg-yellow-100';
      case 'advanced': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold mb-2">Community Programs</h2>
          <p className="text-gray-600">
            Discover and use programs shared by other lifters
          </p>
        </div>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as any)}
          className="px-4 py-2 border rounded-lg"
        >
          <option value="rating">Top Rated</option>
          <option value="uses">Most Popular</option>
          <option value="recent">Recently Added</option>
        </select>
      </div>

      {loading ? (
        <div className="text-center py-8">Loading templates...</div>
      ) : templates.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No templates available yet. Be the first to share one!
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {templates.map((template) => (
            <div key={template.id} className="bg-white rounded-lg shadow p-5">
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-bold text-lg flex-1">{template.title}</h3>
                {template.is_featured && (
                  <span className="text-xl">⭐</span>
                )}
              </div>

              {template.description && (
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                  {template.description}
                </p>
              )}

              <div className="flex flex-wrap gap-2 mb-3">
                {template.difficulty_level && (
                  <span className={`text-xs px-2 py-1 rounded ${getDifficultyColor(template.difficulty_level)}`}>
                    {template.difficulty_level}
                  </span>
                )}
                {template.category && (
                  <span className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-600">
                    {template.category}
                  </span>
                )}
                {template.duration_weeks && (
                  <span className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-600">
                    {template.duration_weeks} weeks
                  </span>
                )}
              </div>

              {template.tags && template.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-3">
                  {template.tags.slice(0, 3).map((tag, idx) => (
                    <span key={idx} className="text-xs text-gray-500">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              <div className="border-t pt-3 mb-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm text-gray-600">
                    by {template.creator_name}
                  </div>
                </div>
                <div className="flex items-center space-x-1 mb-2">
                  {renderStars(template.user_rating || 0, template.id)}
                  <span className="text-sm text-gray-600 ml-2">
                    ({template.rating_count} ratings)
                  </span>
                </div>
                <div className="text-sm text-gray-600">
                  Used by {template.uses_count.toLocaleString()} lifters
                </div>
              </div>

              <Button
                onClick={() => handleUseTemplate(template.id)}
                className="w-full"
              >
                Use This Program
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
