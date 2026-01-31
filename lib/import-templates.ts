/**
 * Template Importer
 *
 * Utility functions to import program templates into the database
 */

import { createClient } from '@/lib/supabase/client';
import { ALL_TEMPLATES } from './program-templates';
import { generateWarmupProtocol } from './warmup';

/**
 * Import a program template for a specific user
 */
export async function importTemplateForUser(
  userId: string,
  templateIndex: number
): Promise<{ success: boolean; programId?: string; error?: string }> {
  const supabase = createClient();
  const template = ALL_TEMPLATES[templateIndex];

  if (!template) {
    return { success: false, error: 'Template not found' };
  }

  try {
    // Create program
    const { data: program, error: programError } = await supabase
      .from('programs')
      .insert({
        user_id: userId,
        name: template.name,
        description: template.description,
        duration_weeks: template.durationWeeks,
        difficulty_level: template.difficulty,
        is_active: false,
        goals: template.goals,
        days_per_week: template.daysPerWeek,
        is_template: true,
        template_category: template.category,
      })
      .select()
      .single();

    if (programError) throw programError;

    // Get exercise library to map exercise names to IDs
    const { data: exerciseLibrary, error: libraryError } = await supabase
      .from('exercise_library')
      .select('id, name, is_compound, is_priority');

    if (libraryError) throw libraryError;

    // Create a map for quick lookup
    const exerciseMap = new Map(
      exerciseLibrary.map((ex) => [ex.name, { id: ex.id, isCompound: ex.is_compound, isPriority: ex.is_priority }])
    );

    // Create workouts
    for (const workoutTemplate of template.workouts) {
      const { data: workout, error: workoutError } = await supabase
        .from('workouts')
        .insert({
          program_id: program.id,
          name: workoutTemplate.name,
          description: null,
          day_of_week: workoutTemplate.day,
          order_index: template.workouts.indexOf(workoutTemplate),
          workout_type: workoutTemplate.type,
        })
        .select()
        .single();

      if (workoutError) throw workoutError;

      // Create exercises
      for (let i = 0; i < workoutTemplate.exercises.length; i++) {
        const exerciseTemplate = workoutTemplate.exercises[i];
        const libraryExercise = exerciseMap.get(exerciseTemplate.name);

        if (!libraryExercise) {
          console.warn(`Exercise not found in library: ${exerciseTemplate.name}`);
          continue;
        }

        // Get exercise details from library
        const { data: exerciseDetails, error: detailsError } = await supabase
          .from('exercise_library')
          .select('*')
          .eq('id', libraryExercise.id)
          .single();

        if (detailsError) throw detailsError;

        const { error: exerciseError } = await supabase.from('exercises').insert({
          workout_id: workout.id,
          exercise_library_id: libraryExercise.id,
          name: exerciseTemplate.name,
          description: exerciseDetails.description,
          muscle_groups: [
            exerciseDetails.primary_muscle_group,
            ...exerciseDetails.secondary_muscle_groups,
          ],
          equipment: exerciseDetails.equipment_needed,
          video_url: exerciseDetails.video_url,
          image_url: null,
          order_index: i,
          target_sets: exerciseTemplate.sets,
          target_reps: exerciseTemplate.reps,
          target_weight_kg: null,
          rest_seconds: exerciseTemplate.rest,
          intensity_percentage: exerciseTemplate.intensity,
          warmup_protocol: generateWarmupProtocol(
            exerciseTemplate.isCompound,
            exerciseTemplate.isPriority
          ),
          notes: null,
        });

        if (exerciseError) throw exerciseError;
      }
    }

    return { success: true, programId: program.id };
  } catch (error) {
    console.error('Failed to import template:', error);
    return { success: false, error: String(error) };
  }
}

/**
 * Import all templates for a user
 */
export async function importAllTemplatesForUser(
  userId: string
): Promise<{ success: boolean; imported: number; errors: string[] }> {
  const errors: string[] = [];
  let imported = 0;

  for (let i = 0; i < ALL_TEMPLATES.length; i++) {
    const result = await importTemplateForUser(userId, i);
    if (result.success) {
      imported++;
    } else {
      errors.push(`${ALL_TEMPLATES[i].name}: ${result.error}`);
    }
  }

  return { success: errors.length === 0, imported, errors };
}

/**
 * Check if templates already exist for user
 */
export async function checkTemplatesExist(userId: string): Promise<boolean> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('programs')
    .select('id')
    .eq('user_id', userId)
    .eq('is_template', true)
    .limit(1);

  if (error) {
    console.error('Failed to check templates:', error);
    return false;
  }

  return data && data.length > 0;
}
