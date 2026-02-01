/**
 * Macro Calculator
 *
 * Calculates BMR, TDEE, and macro targets based on user stats and goals
 */

import type { MacroCalculatorInput, MacroCalculatorResult } from '@/lib/types';

/**
 * Calculate Basal Metabolic Rate using Mifflin-St Jeor Equation
 */
function calculateBMR(
  weight_kg: number,
  height_cm: number,
  age: number,
  gender: 'male' | 'female' | 'other'
): number {
  // Mifflin-St Jeor Equation
  // Men: BMR = (10 × weight in kg) + (6.25 × height in cm) - (5 × age in years) + 5
  // Women: BMR = (10 × weight in kg) + (6.25 × height in cm) - (5 × age in years) - 161

  const baseCalc = 10 * weight_kg + 6.25 * height_cm - 5 * age;

  if (gender === 'male') {
    return baseCalc + 5;
  } else {
    // Use female formula for 'female' and 'other'
    return baseCalc - 161;
  }
}

/**
 * Calculate Total Daily Energy Expenditure
 */
function calculateTDEE(
  bmr: number,
  activity_level: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active'
): number {
  const activityMultipliers = {
    sedentary: 1.2, // Little or no exercise
    light: 1.375, // Exercise 1-3 times/week
    moderate: 1.55, // Exercise 4-5 times/week
    active: 1.725, // Daily exercise or intense exercise 3-4 times/week
    very_active: 1.9, // Intense exercise 6-7 times a week
  };

  return bmr * activityMultipliers[activity_level];
}

/**
 * Calculate target calories based on goal
 */
function calculateTargetCalories(
  tdee: number,
  goal_type: 'cut' | 'maintain' | 'bulk'
): number {
  if (goal_type === 'cut') {
    // Deficit of 300-500 calories
    return Math.round(tdee - 400);
  } else if (goal_type === 'bulk') {
    // Surplus of 300-500 calories
    return Math.round(tdee + 400);
  } else {
    // Maintain
    return Math.round(tdee);
  }
}

/**
 * Calculate macro split
 */
function calculateMacros(
  targetCalories: number,
  weight_kg: number,
  goal_type: 'cut' | 'maintain' | 'bulk'
) {
  // Protein: High for all goals (muscle building/retention)
  // Cut: 2.2g/kg, Maintain: 2.0g/kg, Bulk: 2.0g/kg
  const proteinPerKg = goal_type === 'cut' ? 2.2 : 2.0;
  const protein_g = Math.round(weight_kg * proteinPerKg);
  const proteinCalories = protein_g * 4;

  // Fats: 20-30% of total calories
  const fatPercentage = goal_type === 'cut' ? 0.25 : 0.3;
  const fatCalories = targetCalories * fatPercentage;
  const fats_g = Math.round(fatCalories / 9);

  // Carbs: Remaining calories
  const remainingCalories = targetCalories - proteinCalories - fatCalories;
  const carbs_g = Math.round(remainingCalories / 4);

  return {
    protein_g,
    carbs_g,
    fats_g,
    protein_per_kg: proteinPerKg,
  };
}

/**
 * Calculate daily water target
 */
function calculateWaterTarget(weight_kg: number, activity_level: string): number {
  // Base: 35ml per kg of body weight
  // Add more for active individuals
  const baseWater = weight_kg * 35;

  const activityBonus = {
    sedentary: 0,
    light: 250,
    moderate: 500,
    active: 750,
    very_active: 1000,
  }[activity_level] || 0;

  return Math.round(baseWater + activityBonus);
}

/**
 * Generate explanation
 */
function generateExplanation(
  goal_type: 'cut' | 'maintain' | 'bulk',
  bmr: number,
  tdee: number,
  targetCalories: number,
  proteinPerKg: number
): string {
  const goalDescriptions = {
    cut: `Your goal is to lose fat while preserving muscle. We've set a 400-calorie deficit from your TDEE.`,
    maintain: `Your goal is to maintain your current weight. Calories are set at your TDEE.`,
    bulk: `Your goal is to build muscle. We've set a 400-calorie surplus from your TDEE for lean gains.`,
  };

  return `${goalDescriptions[goal_type]} Your BMR (calories burned at rest) is ${Math.round(bmr)} cal/day. With your activity level, your TDEE is ${Math.round(tdee)} cal/day. Protein is set high at ${proteinPerKg}g/kg to ${goal_type === 'cut' ? 'preserve muscle during fat loss' : 'support muscle growth'}.`;
}

/**
 * Main macro calculator function
 */
export function calculateMacros(input: MacroCalculatorInput): MacroCalculatorResult {
  const { weight_kg, height_cm, age, gender, activity_level, goal_type } = input;

  // Validate inputs
  if (weight_kg <= 0 || height_cm <= 0 || age <= 0) {
    throw new Error('Invalid input values');
  }

  // Calculate BMR and TDEE
  const bmr = calculateBMR(weight_kg, height_cm, age, gender);
  const tdee = calculateTDEE(bmr, activity_level);

  // Calculate target calories
  const daily_calories = calculateTargetCalories(tdee, goal_type);

  // Calculate macros
  const { protein_g, carbs_g, fats_g, protein_per_kg } = calculateMacros(
    daily_calories,
    weight_kg,
    goal_type
  );

  // Calculate water target
  const daily_water_ml = calculateWaterTarget(weight_kg, activity_level);

  // Generate explanation
  const explanation = generateExplanation(
    goal_type,
    bmr,
    tdee,
    daily_calories,
    protein_per_kg
  );

  return {
    bmr: Math.round(bmr),
    tdee: Math.round(tdee),
    daily_calories,
    daily_protein_g: protein_g,
    daily_carbs_g: carbs_g,
    daily_fats_g: fats_g,
    daily_water_ml,
    protein_per_kg,
    explanation,
  };
}
