'use client';

/**
 * Meal Logger Component
 *
 * Log meals with food search, serving size adjustment, and quick-add from recent foods
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Food, MealLog } from '@/lib/types';
import { Search, Plus, Trash2, Check, Camera, History } from 'lucide-react';
import { format } from 'date-fns';

interface FoodItem {
  food: Food;
  serving_size_g: number;
  servings: number;
}

interface MealLoggerProps {
  mealType?: string;
  onSuccess?: (meal: MealLog) => void;
  onCancel?: () => void;
}

export default function MealLogger({ mealType = 'breakfast', onSuccess, onCancel }: MealLoggerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Food[]>([]);
  const [recentFoods, setRecentFoods] = useState<Food[]>([]);
  const [selectedFoods, setSelectedFoods] = useState<FoodItem[]>([]);
  const [mealName, setMealName] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedMealType, setSelectedMealType] = useState(mealType);
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showCreateFood, setShowCreateFood] = useState(false);

  useEffect(() => {
    fetchRecentFoods();
  }, []);

  useEffect(() => {
    const delaySearch = setTimeout(() => {
      if (searchQuery.length >= 2) {
        searchFoods();
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(delaySearch);
  }, [searchQuery]);

  const fetchRecentFoods = async () => {
    try {
      const response = await fetch('/api/nutrition/foods?recent=true');
      const data = await response.json();
      setRecentFoods(data.foods || []);
    } catch (error) {
      console.error('Error fetching recent foods:', error);
    }
  };

  const searchFoods = async () => {
    setSearchLoading(true);
    try {
      const response = await fetch(`/api/nutrition/foods?q=${encodeURIComponent(searchQuery)}`);
      const data = await response.json();
      setSearchResults(data.foods || []);
    } catch (error) {
      console.error('Error searching foods:', error);
    } finally {
      setSearchLoading(false);
    }
  };

  const addFood = (food: Food) => {
    setSelectedFoods([
      ...selectedFoods,
      {
        food,
        serving_size_g: food.default_serving_size_g,
        servings: 1,
      },
    ]);
    setSearchQuery('');
    setSearchResults([]);
  };

  const removeFood = (index: number) => {
    setSelectedFoods(selectedFoods.filter((_, i) => i !== index));
  };

  const updateServing = (index: number, field: 'serving_size_g' | 'servings', value: number) => {
    const updated = [...selectedFoods];
    updated[index][field] = value;
    setSelectedFoods(updated);
  };

  const calculateMacros = (item: FoodItem) => {
    const multiplier = (item.serving_size_g / 100) * item.servings;
    return {
      calories: Math.round(item.food.calories_per_100g * multiplier),
      protein: Math.round(item.food.protein_per_100g * multiplier),
      carbs: Math.round(item.food.carbs_per_100g * multiplier),
      fats: Math.round(item.food.fats_per_100g * multiplier),
    };
  };

  const calculateTotals = () => {
    return selectedFoods.reduce(
      (acc, item) => {
        const macros = calculateMacros(item);
        return {
          calories: acc.calories + macros.calories,
          protein: acc.protein + macros.protein,
          carbs: acc.carbs + macros.carbs,
          fats: acc.fats + macros.fats,
        };
      },
      { calories: 0, protein: 0, carbs: 0, fats: 0 }
    );
  };

  const handleSubmit = async () => {
    if (selectedFoods.length === 0) {
      alert('Please add at least one food item');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/nutrition/meals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          meal_type: selectedMealType,
          meal_name: mealName || null,
          notes: notes || null,
          date: format(new Date(), 'yyyy-MM-dd'),
          items: selectedFoods.map(item => ({
            food_id: item.food.id,
            food: item.food,
            serving_size_g: item.serving_size_g,
            servings: item.servings,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to log meal');
      }

      const data = await response.json();

      if (onSuccess) {
        onSuccess(data.meal);
      }

      // Reset form
      setSelectedFoods([]);
      setMealName('');
      setNotes('');
    } catch (error) {
      console.error('Error logging meal:', error);
      alert('Failed to log meal. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const totals = calculateTotals();

  return (
    <div className="space-y-6">
      {/* Meal Type Selection */}
      <div>
        <Label>Meal Type</Label>
        <Select value={selectedMealType} onValueChange={setSelectedMealType}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="breakfast">Breakfast</SelectItem>
            <SelectItem value="lunch">Lunch</SelectItem>
            <SelectItem value="dinner">Dinner</SelectItem>
            <SelectItem value="snack">Snack</SelectItem>
            <SelectItem value="pre_workout">Pre-Workout</SelectItem>
            <SelectItem value="post_workout">Post-Workout</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Meal Name (Optional) */}
      <div>
        <Label>Meal Name (Optional)</Label>
        <Input
          placeholder="e.g., Post-Workout Shake"
          value={mealName}
          onChange={(e) => setMealName(e.target.value)}
        />
      </div>

      {/* Food Search */}
      <div>
        <Label>Search Foods</Label>
        <div className="relative">
          <Input
            placeholder="Search for food..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pr-10"
          />
          <Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
        </div>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <div className="mt-2 rounded-lg border bg-card max-h-64 overflow-y-auto">
            {searchResults.map((food) => (
              <div
                key={food.id}
                className="flex items-center justify-between p-3 hover:bg-muted cursor-pointer border-b last:border-b-0"
                onClick={() => addFood(food)}
              >
                <div className="flex-1">
                  <p className="font-medium">{food.name}</p>
                  {food.brand && (
                    <p className="text-sm text-muted-foreground">{food.brand}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {food.calories_per_100g} cal · {food.protein_per_100g}g protein
                  </p>
                </div>
                <Plus className="h-5 w-5 text-muted-foreground" />
              </div>
            ))}
          </div>
        )}

        {searchLoading && (
          <p className="text-sm text-muted-foreground mt-2">Searching...</p>
        )}
      </div>

      {/* Recent Foods */}
      {recentFoods.length > 0 && selectedFoods.length === 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <History className="h-4 w-4 text-muted-foreground" />
            <Label>Recent Foods</Label>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {recentFoods.slice(0, 6).map((food) => (
              <Button
                key={food.id}
                variant="outline"
                size="sm"
                onClick={() => addFood(food)}
                className="justify-start text-left h-auto py-2"
              >
                <div className="truncate">
                  <p className="font-medium text-sm truncate">{food.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {food.calories_per_100g} cal
                  </p>
                </div>
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Selected Foods */}
      {selectedFoods.length > 0 && (
        <div>
          <Label>Selected Foods</Label>
          <div className="mt-2 space-y-3">
            {selectedFoods.map((item, index) => {
              const macros = calculateMacros(item);
              return (
                <div key={index} className="rounded-lg border bg-card p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-medium">{item.food.name}</p>
                      {item.food.brand && (
                        <p className="text-sm text-muted-foreground">{item.food.brand}</p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFood(index)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">Serving Size (g)</Label>
                      <Input
                        type="number"
                        value={item.serving_size_g}
                        onChange={(e) =>
                          updateServing(index, 'serving_size_g', parseFloat(e.target.value))
                        }
                        min="1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Servings</Label>
                      <Input
                        type="number"
                        value={item.servings}
                        onChange={(e) =>
                          updateServing(index, 'servings', parseFloat(e.target.value))
                        }
                        min="0.1"
                        step="0.1"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-2 text-center pt-2 border-t">
                    <div>
                      <p className="text-xs text-muted-foreground">Cal</p>
                      <p className="font-semibold">{macros.calories}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">P</p>
                      <p className="font-semibold text-red-500">{macros.protein}g</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">C</p>
                      <p className="font-semibold text-blue-500">{macros.carbs}g</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">F</p>
                      <p className="font-semibold text-yellow-500">{macros.fats}g</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Totals */}
          <div className="mt-4 rounded-lg bg-primary/10 p-4">
            <p className="text-sm font-medium mb-2">Meal Totals</p>
            <div className="grid grid-cols-4 gap-2 text-center">
              <div>
                <p className="text-xs text-muted-foreground">Calories</p>
                <p className="text-xl font-bold">{totals.calories}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Protein</p>
                <p className="text-xl font-bold text-red-500">{totals.protein}g</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Carbs</p>
                <p className="text-xl font-bold text-blue-500">{totals.carbs}g</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Fats</p>
                <p className="text-xl font-bold text-yellow-500">{totals.fats}g</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Notes */}
      <div>
        <Label>Notes (Optional)</Label>
        <Input
          placeholder="Add notes about this meal..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <Button onClick={handleSubmit} disabled={loading || selectedFoods.length === 0} className="flex-1">
          <Check className="mr-2 h-4 w-4" />
          {loading ? 'Logging...' : 'Log Meal'}
        </Button>
        {onCancel && (
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>

      {/* Quick Actions */}
      <div className="flex gap-2">
        <Button variant="outline" size="sm" className="flex-1">
          <Camera className="mr-2 h-4 w-4" />
          Scan Barcode
        </Button>
        <Button variant="outline" size="sm" className="flex-1" onClick={() => setShowCreateFood(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Food
        </Button>
      </div>
    </div>
  );
}
