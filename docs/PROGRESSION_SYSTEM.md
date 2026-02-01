# Intelligent Progression System

## Overview

The Intelligent Progression System automatically adjusts weights, programs deloads, and provides personalized insights to optimize training results. This system combines evidence-based training principles with data-driven algorithms to help users progress safely and effectively.

## Features

### 1. Automatic Weight Progression

**Algorithm:**
- Tracks if user hit top of rep range on all sets
- If yes (A Day): adds 2.5kg next session
- If no: maintains same weight to build consistency
- B Day workouts: automatically 10-15% lighter than corresponding A Day exercises

**Implementation:**
- Located in `lib/progression.ts`
- Functions: `calculateWeightSuggestion()`, `shouldProgress()`, `calculateBDayWeight()`
- Integration: Automatic suggestions displayed in `SetCard` component

### 2. Deload Scheduler

**Features:**
- Automatically schedules deloads every 4-5 weeks
- Notifies users 1 week in advance
- Shows "Deload Week" badge in workout view
- 40% volume reduction (fewer sets), same weights

**Triggers:**
- Scheduled: Standard 4-5 week cycle
- RPE-based: Average RPE > 9.0 for 2+ weeks
- Manual: User can request deload anytime

**Implementation:**
- Utility functions: `lib/deload.ts`
- Database table: `deload_schedules`
- Components: `DeloadBadge` (shown on dashboard and workout views)
- API: `/api/deload/active`

### 3. Periodization Generator

**Creates structured training phases:**

**4-Week Program:**
- Weeks 1-3: Primary phase (hypertrophy or strength)
- Week 4: Deload

**8-Week Program:**
- Weeks 1-4: Hypertrophy (8-12 reps, 70-75% 1RM)
- Weeks 5-7: Strength (5-8 reps, 80-85% 1RM)
- Week 8: Deload

**12-Week Program:**
- Weeks 1-4: Hypertrophy (8-12 reps, 70-75% 1RM)
- Weeks 5-8: Strength (5-8 reps, 80-85% 1RM)
- Weeks 9-11: Peak (3-6 reps, 85-90% 1RM)
- Week 12: Deload + Testing

**16-Week Program:**
- Weeks 1-5: Hypertrophy
- Weeks 6-10: Strength
- Weeks 11-15: Peak
- Week 16: Deload + Testing

**Implementation:**
- Generator: `lib/periodization.ts`
- Function: `generatePeriodizationPlan()`
- Database table: `periodization_phases`

### 4. Progression Insights

**Displays personalized insights:**
- "You're on track to add X kg to [lift] this month"
- "Strength score increased by Y% this week"
- "Next milestone: 140kg squat (3 weeks away)"

**Insight Types:**
- `weight_gain`: Predicted weight increases
- `strength_increase`: Percentage strength gains
- `milestone_upcoming`: Close to achieving goals
- `pr_potential`: Ready for personal record
- `consistency`: Training frequency achievements

**Implementation:**
- Component: `components/ProgressionInsights.tsx`
- API: `/api/progression/insights`
- Location: Dashboard, workout summary

### 5. Auto-Regulation (RPE Tracking)

**Rate of Perceived Exertion (RPE) tracking:**
- Users rate difficulty of each set (6-10 scale)
- System tracks weekly average RPE
- Provides automatic recommendations

**Recommendations:**
- RPE > 9 for 2+ weeks → suggest deload
- RPE < 7 for 2+ weeks → suggest weight increase
- RPE 7-8.5 → optimal training zone (maintain)

**Implementation:**
- Utility functions: `lib/auto-regulation.ts`
- Component: `AutoRegulation` (integrated in `SetCard`)
- Database tables: `sets.rpe`, `rpe_weekly_averages`

**RPE Scale:**
- 10: Max effort - complete failure
- 9-9.5: Extremely hard - 1-2 reps left
- 8-8.5: Hard - 3-4 reps left
- 7-7.5: Moderate - 5-6 reps left
- 6: Easy - many reps left

### 6. Performance Predictor

**1RM Estimation:**
- Uses multiple formulas (Epley, Brzycki, Lombardi)
- Weighted average for accuracy
- Confidence scoring based on data quality

**Milestone Tracking:**
- Set weight goals for specific exercises
- Predicts achievement date
- Calculates probability of success
- Shows weekly progression

**Strength Curve Visualization:**
- Historical 1RM estimates over time
- Trend analysis (increasing, stable, decreasing)
- 12-week projection

**Implementation:**
- Predictor: `lib/performance-predictor.ts`
- Component: `PerformancePredictor`
- API routes: `/api/progression/predict-1rm`, `/api/progression/strength-curve`, `/api/progression/milestones`
- Database tables: `performance_predictions`, `milestone_tracking`

## Database Schema

### New Tables

#### `progression_history`
Tracks weight changes over time.
```sql
- id (UUID)
- user_id (UUID)
- exercise_library_id (UUID)
- session_id (UUID, nullable)
- previous_weight_kg (DECIMAL)
- new_weight_kg (DECIMAL)
- weight_change_kg (DECIMAL)
- progression_reason (ENUM: hit_top_range, consistency, deload, fatigue, form_breakdown, manual)
- notes (TEXT)
- created_at (TIMESTAMP)
```

#### `deload_schedules`
Manages deload week scheduling.
```sql
- id (UUID)
- user_id (UUID)
- program_id (UUID, nullable)
- scheduled_week_start (DATE)
- scheduled_week_end (DATE)
- status (ENUM: upcoming, notified, active, completed, skipped)
- volume_reduction_percent (INTEGER, 20-60)
- trigger_reason (ENUM: scheduled, high_rpe, fatigue, manual)
- notified_at, started_at, completed_at (TIMESTAMP)
- notes (TEXT)
- created_at, updated_at (TIMESTAMP)
```

#### `periodization_phases`
Defines training mesocycles.
```sql
- id (UUID)
- program_id (UUID)
- phase_type (ENUM: hypertrophy, strength, peak, deload)
- phase_order (INTEGER)
- start_week, end_week (INTEGER)
- target_rep_min, target_rep_max (INTEGER)
- intensity_percent_min, intensity_percent_max (DECIMAL)
- target_sets_per_exercise (INTEGER)
- rest_seconds_compounds, rest_seconds_accessories (INTEGER)
- description (TEXT)
- is_active (BOOLEAN)
- created_at, updated_at (TIMESTAMP)
```

#### `performance_predictions`
Stores 1RM predictions.
```sql
- id (UUID)
- user_id (UUID)
- exercise_library_id (UUID)
- predicted_1rm_kg (DECIMAL)
- confidence_score (DECIMAL, 0-1)
- based_on_sessions (INTEGER)
- prediction_method (ENUM: epley, brzycki, lombardi, weighted_average)
- created_at (TIMESTAMP)
- valid_until (TIMESTAMP)
```

#### `milestone_tracking`
Tracks weight milestones and predictions.
```sql
- id (UUID)
- user_id (UUID)
- exercise_library_id (UUID)
- target_weight_kg (DECIMAL)
- target_reps (INTEGER)
- current_estimated_1rm_kg (DECIMAL)
- predicted_achievement_date (DATE)
- weeks_to_achievement (INTEGER)
- achievement_probability (DECIMAL, 0-1)
- status (ENUM: in_progress, achieved, abandoned)
- achieved_at (TIMESTAMP)
- created_at, updated_at (TIMESTAMP)
```

#### `rpe_weekly_averages`
Aggregate RPE data for auto-regulation.
```sql
- id (UUID)
- user_id (UUID)
- week_start_date, week_end_date (DATE)
- average_rpe (DECIMAL)
- sessions_count, sets_count (INTEGER)
- auto_regulation_recommendation (ENUM: maintain, increase_weight, deload_suggested, take_rest)
- created_at (TIMESTAMP)
```

## Setup Instructions

### 1. Run Database Migration

Execute the migration SQL in your Supabase SQL Editor:

```bash
# Location: supabase/migrations/progression_system.sql
```

This will create all necessary tables, indexes, RLS policies, and helper functions.

### 2. Enable Row Level Security (RLS)

All tables have RLS enabled with policies ensuring users can only access their own data.

### 3. Auto-Schedule Deloads (Optional)

The database includes a trigger that automatically schedules deloads when a new program is created:

```sql
CREATE TRIGGER auto_schedule_deloads
  AFTER INSERT ON public.programs
  FOR EACH ROW
  EXECUTE FUNCTION schedule_program_deloads();
```

To manually schedule deloads for existing programs, run:

```sql
SELECT schedule_program_deloads()
FROM programs
WHERE duration_weeks > 4;
```

## Usage Examples

### Creating a Periodized Program

```typescript
import { generatePeriodizationPlan } from '@/lib/periodization';

const plan = generatePeriodizationPlan(programId, {
  program_length_weeks: 12,
  program_type: 'strength',
  include_deload: true
});

// Insert phases into database
for (const phase of plan.phases) {
  await supabase.from('periodization_phases').insert(phase);
}
```

### Predicting 1RM

```typescript
import { predict1RM, generateStrengthCurve } from '@/lib/performance-predictor';

// Predict from single set
const oneRM = predict1RM(100, 5); // 100kg x 5 reps

// Generate strength curve from historical data
const curve = generateStrengthCurve(recentSets);
const latest = curve[curve.length - 1];
console.log(`Estimated 1RM: ${latest.estimated_1rm_kg}kg`);
```

### Checking Deload Status

```typescript
import { shouldScheduleDeload } from '@/lib/deload';

const result = shouldScheduleDeload({
  weeksSinceLastDeload: 5,
  averageRpe: 9.2,
  consecutiveHighRpeWeeks: 2,
  userFatigueLevel: 'high'
});

if (result.needed) {
  console.log(result.reason); // "RPE consistently above 9 for 2+ weeks"
}
```

### Using Components

```tsx
// Dashboard
import ProgressionInsights from '@/components/ProgressionInsights';
import DeloadBadge from '@/components/DeloadBadge';

<ProgressionInsights userId={user.id} limit={3} />
<DeloadBadge userId={user.id} programId={program.id} />

// Workout view
import PerformancePredictor from '@/components/PerformancePredictor';

<PerformancePredictor
  userId={user.id}
  exerciseLibraryId={exercise.id}
  exerciseName={exercise.name}
/>

// Set logging with RPE
<SetCard
  setNumber={1}
  targetReps={8}
  enableRpe={true}
  onComplete={(weight, reps, rpe) => {
    // Save set with RPE
    await supabase.from('sets').insert({
      weight_kg: weight,
      reps,
      rpe
    });
  }}
/>
```

## API Endpoints

### Progression Insights
`GET /api/progression/insights?userId={userId}&limit={limit}`

Returns personalized progression insights.

### 1RM Prediction
`GET /api/progression/predict-1rm?userId={userId}&exerciseId={exerciseId}`

Returns predicted 1RM and confidence score.

### Strength Curve
`GET /api/progression/strength-curve?userId={userId}&exerciseId={exerciseId}&projection=true`

Returns historical strength curve and optional 12-week projection.

### Milestones
`GET /api/progression/milestones?userId={userId}&exerciseId={exerciseId}`
`POST /api/progression/milestones`

Get or create milestone tracking.

### Active Deload
`GET /api/deload/active?userId={userId}&programId={programId}`

Returns active or upcoming deload schedule.

## Best Practices

### For Users

1. **Track RPE consistently**: Rate every working set for best auto-regulation
2. **Follow deload recommendations**: Don't skip scheduled deloads
3. **Trust the progression**: Add weight when system suggests, not arbitrarily
4. **Set realistic milestones**: Use predictor to choose achievable goals

### For Developers

1. **Update predictions regularly**: Recalculate after each workout
2. **Monitor confidence scores**: Low confidence (<0.5) means more data needed
3. **Respect RLS policies**: All queries scoped to user_id
4. **Handle null values**: Not all users will have predictions/milestones

## Troubleshooting

### Issue: Predictions Not Appearing

**Solution:**
- Ensure user has completed at least 3 working sets for the exercise
- Check that sets are marked as `is_warmup: false`
- Verify workout sessions are marked as `status: 'completed'`

### Issue: Deload Not Scheduling

**Solution:**
- Check program has `duration_weeks` set and is > 4
- Verify trigger is installed: `SELECT * FROM pg_trigger WHERE tgname = 'auto_schedule_deloads'`
- Manually insert deload schedule if needed

### Issue: RPE Recommendations Not Accurate

**Solution:**
- Need at least 2 weeks of RPE data
- Ensure weekly average is being calculated (check `rpe_weekly_averages` table)
- Run calculation function manually if needed:
  ```sql
  SELECT calculate_weekly_rpe_average(
    'user_id'::UUID,
    '2024-01-01'::DATE,
    '2024-01-07'::DATE
  );
  ```

## Future Enhancements

Potential improvements to the progression system:

1. **Machine Learning Integration**: Use historical data to improve predictions
2. **Injury Prevention**: Track pain/discomfort and suggest exercise modifications
3. **Volume Tracking**: Monitor total weekly volume and suggest adjustments
4. **Competition Peaking**: Specialized periodization for meets/competitions
5. **Social Features**: Compare progress with training partners
6. **Advanced Analytics**: Detailed charts and graphs for progression visualization

## References

- Epley Formula: Epley, B. (1985). "Poundage Chart"
- Brzycki Formula: Brzycki, M. (1993). "Strength Testing—Predicting a One-Rep Max from Reps-to-Fatigue"
- RPE Scale: Zourdos, M. C., et al. (2016). "Novel Resistance Training–Specific Rating of Perceived Exertion Scale"
- Periodization: Bompa, T. O., & Haff, G. G. (2009). "Periodization: Theory and Methodology of Training"
