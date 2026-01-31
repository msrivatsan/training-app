# Program Management System Setup Guide

This guide will help you set up the new Program Management System for Iron Quest.

## Overview

The Program Management System includes:
- ✅ **ProgramBuilder Component** - Create custom programs with drag-and-drop exercises
- ✅ **ProgramCard Component** - Display program information
- ✅ **4 Pre-built Templates**:
  - 6-Day Push/Pull/Legs Strength & Hypertrophy
  - 4-Week Beginner Full Body
  - 8-Week Upper/Lower Split
  - 12-Week Powerlifting Peaking
- ✅ **Warm-up Protocol Generator** - Automatic warm-up sets for exercises
- ✅ **A/B Day System** - Strength days (80-87% 1RM) vs Hypertrophy days (70-80% 1RM)
- ✅ **Intensity Tracking** - Set exercises as % of 1RM
- ✅ **Rest Time Recommendations** - Auto-calculated based on workout type

## Database Migration

### Step 1: Apply the Migration

Run the migration SQL script in your Supabase SQL Editor:

```sql
-- Navigate to: Supabase Dashboard > SQL Editor > New Query
-- Copy and paste the contents of: supabase/migrations/002_program_templates.sql
```

**Or** run via command line:

```bash
# If using Supabase CLI
supabase migration up
```

### Step 2: Verify the Migration

Check that the following columns were added:

**programs table:**
- `goals` (text[])
- `days_per_week` (integer)
- `is_template` (boolean)
- `template_category` (text)

**workouts table:**
- `workout_type` (text) - 'strength', 'hypertrophy', 'mixed', or 'deload'

**exercises table:**
- `intensity_percentage` (decimal)
- `warmup_protocol` (jsonb)

## Usage

### For End Users

1. **Navigate to Programs Page**
   - Go to `/programs` or click "View Programs" on the dashboard

2. **Import Templates**
   - Click "Import Templates" button (only needed once)
   - This will import all 4 pre-built programs

3. **Start a Program**
   - Click "Start Program" on any program card
   - Only one program can be active at a time

4. **Create Custom Program**
   - Click "Create Program" button
   - Fill in program details (name, duration, difficulty)
   - Add workouts and assign them to specific days
   - Choose workout type (Strength A Day, Hypertrophy B Day, etc.)
   - Add exercises from the library
   - Set parameters: sets, reps, rest time, intensity (% 1RM)
   - Warm-up protocol is automatically generated

### For Developers

#### Import Templates Programmatically

```typescript
import { importAllTemplatesForUser } from '@/lib/import-templates';

const result = await importAllTemplatesForUser(userId);
console.log(`Imported ${result.imported} templates`);
```

#### Create Custom Template

```typescript
import { ProgramTemplate } from '@/lib/program-templates';

const myTemplate: ProgramTemplate = {
  name: 'My Custom Program',
  description: '...',
  difficulty: 'intermediate',
  durationWeeks: 8,
  daysPerWeek: 4,
  goals: ['Strength', 'Hypertrophy'],
  category: 'custom',
  workouts: [
    {
      name: 'Upper Body',
      day: 1, // Monday
      type: 'strength',
      exercises: [
        {
          name: 'Barbell Bench Press',
          sets: 4,
          reps: 6,
          intensity: 85,
          rest: 240,
          isCompound: true,
          isPriority: true,
        },
        // ... more exercises
      ],
    },
    // ... more workouts
  ],
};
```

#### Use Warm-up Generator

```typescript
import {
  generateWarmupProtocol,
  calculateWarmupWeights,
  calculateOneRepMax,
  calculateWorkingWeight,
} from '@/lib/warmup';

// Generate warm-up protocol
const warmup = generateWarmupProtocol(true, true); // compound, priority
// Result: [
//   { sets: 1, reps: 10, intensity: 0 },    // Empty bar
//   { sets: 1, reps: 8, intensity: 50 },   // 50%
//   { sets: 1, reps: 5, intensity: 70 },   // 70%
//   { sets: 1, reps: 3, intensity: 85 },   // 85%
// ]

// Calculate actual weights
const workingWeight = 100; // kg
const warmupWeights = calculateWarmupWeights(workingWeight, warmup);
// Result: [
//   { sets: 1, reps: 10, weight: 20 },
//   { sets: 1, reps: 8, weight: 50 },
//   { sets: 1, reps: 5, weight: 70 },
//   { sets: 1, reps: 3, weight: 85 },
// ]

// Calculate 1RM
const oneRepMax = calculateOneRepMax(100, 5); // 100kg for 5 reps
// Result: ~116.7kg

// Calculate working weight from 1RM
const workWeight = calculateWorkingWeight(120, 85); // 85% of 120kg 1RM
// Result: 102.5kg (rounded to nearest 2.5kg)
```

## File Structure

```
/home/user/training-app/
├── app/
│   └── programs/
│       └── page.tsx                    # Programs listing page
├── components/
│   ├── ProgramBuilder.tsx              # Program creation/editing
│   └── ProgramCard.tsx                 # Program display card
├── lib/
│   ├── warmup.ts                       # Warm-up protocol utilities
│   ├── program-templates.ts            # Pre-built templates data
│   ├── import-templates.ts             # Template import utilities
│   └── types.ts                        # Updated TypeScript types
└── supabase/
    └── migrations/
        └── 002_program_templates.sql   # Database migration
```

## Features Explained

### A Day vs B Day System

- **A Day (Strength)**: 80-87% 1RM, 6-8 reps, 3-4 min rest
  - Focus: Maximum strength development
  - Lower volume, higher intensity
  - Compound lifts emphasized

- **B Day (Hypertrophy)**: 70-80% 1RM, 8-12 reps, 2-3 min rest
  - Focus: Muscle growth
  - Higher volume, moderate intensity
  - More accessory work

### 6-Day Push/Pull/Legs Program Details

**Schedule**: Mon/Tue/Wed/Fri/Sat/Sun (Rest Thursday)

**Monday** - Push A (Strength)
- Barbell Bench Press: 4x6 @ 85% 1RM
- Overhead Press: 4x6 @ 85% 1RM
- Weighted Dips: 3x8 @ 80% 1RM
- + accessories

**Tuesday** - Pull A (Strength)
- Conventional Deadlift: 4x5 @ 87% 1RM
- Weighted Pull-ups: 4x6 @ 85% 1RM
- Barbell Row: 4x8 @ 80% 1RM
- + accessories

**Wednesday** - Legs A (Strength)
- Barbell Squat: 4x5 @ 87% 1RM
- Romanian Deadlift: 4x6 @ 85% 1RM
- Bulgarian Split Squat: 3x8 @ 80% 1RM
- + accessories

**Friday** - Push B (Hypertrophy)
- Incline Barbell Bench: 4x10 @ 75% 1RM
- DB Shoulder Press: 4x10 @ 75% 1RM
- + volume work

**Saturday** - Pull B (Hypertrophy)
- Barbell Row: 4x10 @ 75% 1RM
- Lat Pulldown: 4x12 @ 75% 1RM
- + volume work

**Sunday** - Legs B (Hypertrophy)
- Front Squat: 4x10 @ 75% 1RM
- Romanian Deadlift: 3x10 @ 75% 1RM
- + volume work

## Testing Checklist

- [ ] Database migration applied successfully
- [ ] Programs page loads without errors
- [ ] Import templates button works
- [ ] All 4 templates import correctly
- [ ] Create new program button opens ProgramBuilder
- [ ] Can add workouts to program
- [ ] Can add exercises to workouts
- [ ] Exercise parameters (sets, reps, rest, intensity) save correctly
- [ ] Warm-up protocol generates automatically
- [ ] Start program activates it (deactivates others)
- [ ] Dashboard "View Programs" button navigates correctly

## Troubleshooting

### Migration Fails
- Ensure you're running the migration on the correct database
- Check that the base schema is already applied
- Verify Supabase connection

### Templates Don't Import
- Check browser console for errors
- Verify all exercise names in templates match exercise_library
- Ensure user is authenticated

### Warm-up Protocol Not Showing
- Check that warmup_protocol field is JSONB in database
- Verify generateWarmupProtocol() is being called
- Check browser console for JSON parsing errors

## Next Steps

1. **Test the system** with a test user account
2. **Import templates** for the first time
3. **Create a custom program** to verify ProgramBuilder works
4. **Start a program** to test the activation system
5. **Implement workout session integration** (future feature)

## Support

For issues or questions:
- Check the browser console for errors
- Review Supabase logs in the dashboard
- Verify database schema matches migration
