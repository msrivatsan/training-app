'use client';

/**
 * Meal Templates Component
 *
 * Save and quick-log frequent meals
 */

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import type { MealTemplateWithItems } from '@/lib/types';
import { Bookmark, Plus, Trash2, Clock } from 'lucide-react';
import { format } from 'date-fns';

interface MealTemplatesProps {
  onLogTemplate?: (template: MealTemplateWithItems) => void;
}

export default function MealTemplates({ onLogTemplate }: MealTemplatesProps) {
  const [templates, setTemplates] = useState<MealTemplateWithItems[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/nutrition/templates');
      const data = await response.json();
      setTemplates(data.templates || []);
    } catch (error) {
      console.error('Error fetching templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteTemplate = async (templateId: string) => {
    if (!confirm('Delete this meal template?')) return;

    try {
      const response = await fetch(`/api/nutrition/templates?id=${templateId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete template');
      }

      setTemplates(templates.filter(t => t.id !== templateId));
    } catch (error) {
      console.error('Error deleting template:', error);
      alert('Failed to delete template');
    }
  };

  const logTemplate = async (template: MealTemplateWithItems) => {
    if (onLogTemplate) {
      onLogTemplate(template);
    } else {
      // Quick log the template as a meal
      try {
        const response = await fetch('/api/nutrition/meals', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            meal_type: template.meal_type || 'snack',
            meal_name: template.name,
            date: format(new Date(), 'yyyy-MM-dd'),
            items: template.items?.map(item => ({
              food_id: item.food_id,
              food: item.food,
              serving_size_g: item.serving_size_g,
              servings: item.servings,
            })),
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to log template');
        }

        alert('Meal logged successfully!');

        // Update use count
        await fetch(`/api/nutrition/templates`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: template.id,
            use_count: template.use_count + 1,
            last_used_at: new Date().toISOString(),
          }),
        });

        fetchTemplates();
      } catch (error) {
        console.error('Error logging template:', error);
        alert('Failed to log meal');
      }
    }
  };

  if (loading) {
    return <div className="text-center py-4">Loading templates...</div>;
  }

  if (templates.length === 0) {
    return (
      <div className="text-center py-8 space-y-4">
        <Bookmark className="h-12 w-12 mx-auto text-muted-foreground" />
        <div>
          <h3 className="text-lg font-semibold">No Meal Templates</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Save your frequent meals as templates for quick logging
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Meal Templates</h3>
        <p className="text-sm text-muted-foreground">{templates.length} templates</p>
      </div>

      <div className="grid gap-4">
        {templates.map((template) => (
          <div key={template.id} className="rounded-lg border bg-card p-4 space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h4 className="font-semibold">{template.name}</h4>
                {template.description && (
                  <p className="text-sm text-muted-foreground mt-1">{template.description}</p>
                )}
                {template.meal_type && (
                  <p className="text-xs text-muted-foreground mt-1 capitalize">
                    {template.meal_type.replace('_', ' ')}
                  </p>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => deleteTemplate(template.id)}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>

            {/* Food Items */}
            <div className="space-y-1">
              {template.items?.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    {item.food?.name} ({item.serving_size_g}g × {item.servings})
                  </span>
                </div>
              ))}
            </div>

            {/* Macros */}
            <div className="grid grid-cols-4 gap-2 pt-3 border-t">
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Cal</p>
                <p className="font-semibold">{Math.round(template.total_calories)}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground">P</p>
                <p className="font-semibold text-red-500">{Math.round(template.total_protein)}g</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground">C</p>
                <p className="font-semibold text-blue-500">{Math.round(template.total_carbs)}g</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground">F</p>
                <p className="font-semibold text-yellow-500">{Math.round(template.total_fats)}g</p>
              </div>
            </div>

            {/* Usage Info & Actions */}
            <div className="flex items-center justify-between pt-3 border-t">
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Used {template.use_count} times
                </span>
              </div>
              <Button size="sm" onClick={() => logTemplate(template)}>
                <Plus className="mr-1 h-4 w-4" />
                Log
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
