-- ============================================================================
-- NUTRITION TRACKING SYSTEM
-- ============================================================================
-- This migration adds comprehensive nutrition tracking capabilities including:
-- - Nutrition goals and macro targets
-- - Food database and meal logging
-- - Meal templates for quick logging
-- - Water tracking
-- - Weight correlation analytics
-- ============================================================================

-- ============================================================================
-- NUTRITION GOALS
-- ============================================================================
-- Stores user's nutrition goals and calculated macro targets
CREATE TABLE nutrition_goals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Goal settings
  goal_type TEXT NOT NULL CHECK (goal_type IN ('cut', 'maintain', 'bulk')),
  activity_level TEXT NOT NULL CHECK (activity_level IN ('sedentary', 'light', 'moderate', 'active', 'very_active')),

  -- User stats for calculation
  current_weight_kg DECIMAL(5,2) NOT NULL,
  target_weight_kg DECIMAL(5,2),
  height_cm INTEGER NOT NULL,
  age INTEGER NOT NULL,
  gender TEXT NOT NULL CHECK (gender IN ('male', 'female', 'other')),

  -- Calculated targets
  daily_calories INTEGER NOT NULL,
  daily_protein_g INTEGER NOT NULL,
  daily_carbs_g INTEGER NOT NULL,
  daily_fats_g INTEGER NOT NULL,
  daily_water_ml INTEGER NOT NULL,

  -- Tracking settings
  is_active BOOLEAN DEFAULT true,
  auto_adjust BOOLEAN DEFAULT true, -- Auto-adjust based on weight trends

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT positive_values CHECK (
    daily_calories > 0 AND
    daily_protein_g > 0 AND
    daily_carbs_g > 0 AND
    daily_fats_g > 0 AND
    daily_water_ml > 0
  )
);

CREATE INDEX idx_nutrition_goals_user ON nutrition_goals(user_id);
CREATE INDEX idx_nutrition_goals_active ON nutrition_goals(user_id, is_active);

-- ============================================================================
-- FOOD DATABASE
-- ============================================================================
-- Local food database for quick search and logging
CREATE TABLE foods (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Food identification
  name TEXT NOT NULL,
  brand TEXT,
  barcode TEXT, -- For barcode scanner

  -- Nutritional info per 100g/100ml
  calories_per_100g DECIMAL(8,2) NOT NULL,
  protein_per_100g DECIMAL(6,2) NOT NULL,
  carbs_per_100g DECIMAL(6,2) NOT NULL,
  fats_per_100g DECIMAL(6,2) NOT NULL,
  fiber_per_100g DECIMAL(6,2) DEFAULT 0,
  sugar_per_100g DECIMAL(6,2) DEFAULT 0,
  sodium_mg_per_100g DECIMAL(8,2) DEFAULT 0,

  -- Serving info
  default_serving_size_g DECIMAL(8,2) DEFAULT 100,
  serving_unit TEXT DEFAULT 'g', -- g, ml, cup, tbsp, etc.

  -- Categorization
  category TEXT, -- protein, carb, fat, vegetable, fruit, snack, beverage, etc.
  tags TEXT[], -- quick filters: vegan, high-protein, low-carb, etc.

  -- Source tracking
  source TEXT NOT NULL DEFAULT 'user', -- user, openfoodfacts, usda, custom
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- NULL for global foods
  is_verified BOOLEAN DEFAULT false, -- Admin-verified foods

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_foods_name ON foods USING gin(to_tsvector('english', name));
CREATE INDEX idx_foods_barcode ON foods(barcode) WHERE barcode IS NOT NULL;
CREATE INDEX idx_foods_user ON foods(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_foods_category ON foods(category);

-- ============================================================================
-- MEAL LOGS
-- ============================================================================
-- Daily meal logging
CREATE TABLE meal_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Meal info
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  meal_type TEXT NOT NULL CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack', 'pre_workout', 'post_workout')),
  meal_name TEXT, -- Optional: "Post-Workout Shake", "Chicken & Rice", etc.

  -- Time tracking
  logged_at TIMESTAMPTZ DEFAULT NOW(),

  -- Quick totals (denormalized for performance)
  total_calories DECIMAL(8,2) NOT NULL DEFAULT 0,
  total_protein DECIMAL(6,2) NOT NULL DEFAULT 0,
  total_carbs DECIMAL(6,2) NOT NULL DEFAULT 0,
  total_fats DECIMAL(6,2) NOT NULL DEFAULT 0,

  -- Metadata
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_meal_logs_user_date ON meal_logs(user_id, date DESC);
CREATE INDEX idx_meal_logs_user_type ON meal_logs(user_id, meal_type);

-- ============================================================================
-- MEAL LOG ITEMS
-- ============================================================================
-- Individual food items within a meal
CREATE TABLE meal_log_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  meal_log_id UUID NOT NULL REFERENCES meal_logs(id) ON DELETE CASCADE,
  food_id UUID NOT NULL REFERENCES foods(id) ON DELETE RESTRICT,

  -- Serving info
  serving_size_g DECIMAL(8,2) NOT NULL,
  servings DECIMAL(6,2) NOT NULL DEFAULT 1, -- Multiplier: 1.5 servings, 2 servings, etc.

  -- Calculated macros (for this specific serving)
  calories DECIMAL(8,2) NOT NULL,
  protein DECIMAL(6,2) NOT NULL,
  carbs DECIMAL(6,2) NOT NULL,
  fats DECIMAL(6,2) NOT NULL,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_meal_log_items_meal ON meal_log_items(meal_log_id);
CREATE INDEX idx_meal_log_items_food ON meal_log_items(food_id);

-- ============================================================================
-- MEAL TEMPLATES
-- ============================================================================
-- Saved meal templates for quick logging
CREATE TABLE meal_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Template info
  name TEXT NOT NULL, -- "Post-Workout Shake", "Breakfast Bowl", etc.
  description TEXT,
  meal_type TEXT CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack', 'pre_workout', 'post_workout')),

  -- Quick totals
  total_calories DECIMAL(8,2) NOT NULL DEFAULT 0,
  total_protein DECIMAL(6,2) NOT NULL DEFAULT 0,
  total_carbs DECIMAL(6,2) NOT NULL DEFAULT 0,
  total_fats DECIMAL(6,2) NOT NULL DEFAULT 0,

  -- Usage tracking
  use_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMPTZ,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_meal_templates_user ON meal_templates(user_id);
CREATE INDEX idx_meal_templates_use_count ON meal_templates(user_id, use_count DESC);

-- ============================================================================
-- MEAL TEMPLATE ITEMS
-- ============================================================================
-- Foods within a meal template
CREATE TABLE meal_template_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_id UUID NOT NULL REFERENCES meal_templates(id) ON DELETE CASCADE,
  food_id UUID NOT NULL REFERENCES foods(id) ON DELETE RESTRICT,

  -- Serving info
  serving_size_g DECIMAL(8,2) NOT NULL,
  servings DECIMAL(6,2) NOT NULL DEFAULT 1,

  -- Order for display
  order_index INTEGER DEFAULT 0,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_meal_template_items_template ON meal_template_items(template_id);

-- ============================================================================
-- WATER TRACKING
-- ============================================================================
-- Daily water intake tracking
CREATE TABLE water_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Tracking
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  amount_ml INTEGER NOT NULL,

  -- Metadata
  logged_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT positive_amount CHECK (amount_ml > 0)
);

CREATE INDEX idx_water_logs_user_date ON water_logs(user_id, date DESC);

-- ============================================================================
-- DAILY NUTRITION SUMMARY
-- ============================================================================
-- Aggregated daily stats for performance
CREATE TABLE daily_nutrition_summary (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,

  -- Totals
  total_calories INTEGER NOT NULL DEFAULT 0,
  total_protein DECIMAL(6,2) NOT NULL DEFAULT 0,
  total_carbs DECIMAL(6,2) NOT NULL DEFAULT 0,
  total_fats DECIMAL(6,2) NOT NULL DEFAULT 0,
  total_water_ml INTEGER NOT NULL DEFAULT 0,

  -- Goals (snapshot for historical accuracy)
  goal_calories INTEGER,
  goal_protein DECIMAL(6,2),
  goal_carbs DECIMAL(6,2),
  goal_fats DECIMAL(6,2),
  goal_water_ml INTEGER,

  -- Compliance
  hit_protein_target BOOLEAN DEFAULT false,
  hit_calorie_target BOOLEAN DEFAULT false,
  hit_water_target BOOLEAN DEFAULT false,

  -- Meal breakdown
  meals_logged INTEGER DEFAULT 0,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, date)
);

CREATE INDEX idx_daily_nutrition_user_date ON daily_nutrition_summary(user_id, date DESC);

-- ============================================================================
-- RECENT FOODS
-- ============================================================================
-- Track recently used foods for quick-add
CREATE TABLE recent_foods (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  food_id UUID NOT NULL REFERENCES foods(id) ON DELETE CASCADE,

  -- Usage tracking
  last_used_at TIMESTAMPTZ DEFAULT NOW(),
  use_count INTEGER DEFAULT 1,

  UNIQUE(user_id, food_id)
);

CREATE INDEX idx_recent_foods_user ON recent_foods(user_id, last_used_at DESC);

-- ============================================================================
-- NUTRITION ACHIEVEMENTS
-- ============================================================================
-- Track nutrition-specific milestones
CREATE TABLE nutrition_achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Achievement info
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL, -- emoji or icon name
  category TEXT NOT NULL DEFAULT 'nutrition',
  tier TEXT NOT NULL CHECK (tier IN ('bronze', 'silver', 'gold', 'platinum', 'legendary')),

  -- Unlock criteria
  requirement_type TEXT NOT NULL, -- protein_streak, calorie_accuracy, water_streak, etc.
  requirement_value INTEGER NOT NULL,

  -- Rewards
  xp_reward INTEGER NOT NULL DEFAULT 100,

  -- Visibility
  is_secret BOOLEAN DEFAULT false,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_nutrition_achievements_category ON nutrition_achievements(category);

-- ============================================================================
-- USER NUTRITION ACHIEVEMENT PROGRESS
-- ============================================================================
CREATE TABLE user_nutrition_achievement_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES nutrition_achievements(id) ON DELETE CASCADE,

  -- Progress tracking
  current_progress INTEGER DEFAULT 0,
  is_unlocked BOOLEAN DEFAULT false,
  unlocked_at TIMESTAMPTZ,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, achievement_id)
);

CREATE INDEX idx_user_nutrition_achievement_user ON user_nutrition_achievement_progress(user_id);
CREATE INDEX idx_user_nutrition_achievement_unlocked ON user_nutrition_achievement_progress(user_id, is_unlocked);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE nutrition_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE foods ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_log_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_template_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE water_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_nutrition_summary ENABLE ROW LEVEL SECURITY;
ALTER TABLE recent_foods ENABLE ROW LEVEL SECURITY;
ALTER TABLE nutrition_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_nutrition_achievement_progress ENABLE ROW LEVEL SECURITY;

-- Nutrition Goals Policies
CREATE POLICY "Users can view their own nutrition goals"
  ON nutrition_goals FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own nutrition goals"
  ON nutrition_goals FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own nutrition goals"
  ON nutrition_goals FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own nutrition goals"
  ON nutrition_goals FOR DELETE
  USING (auth.uid() = user_id);

-- Foods Policies
CREATE POLICY "Users can view all foods"
  ON foods FOR SELECT
  USING (user_id IS NULL OR auth.uid() = user_id);

CREATE POLICY "Users can insert their own custom foods"
  ON foods FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own custom foods"
  ON foods FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own custom foods"
  ON foods FOR DELETE
  USING (auth.uid() = user_id);

-- Meal Logs Policies
CREATE POLICY "Users can view their own meal logs"
  ON meal_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own meal logs"
  ON meal_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own meal logs"
  ON meal_logs FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own meal logs"
  ON meal_logs FOR DELETE
  USING (auth.uid() = user_id);

-- Meal Log Items Policies
CREATE POLICY "Users can view meal log items for their meals"
  ON meal_log_items FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM meal_logs
    WHERE meal_logs.id = meal_log_items.meal_log_id
    AND meal_logs.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert meal log items for their meals"
  ON meal_log_items FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM meal_logs
    WHERE meal_logs.id = meal_log_items.meal_log_id
    AND meal_logs.user_id = auth.uid()
  ));

CREATE POLICY "Users can update meal log items for their meals"
  ON meal_log_items FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM meal_logs
    WHERE meal_logs.id = meal_log_items.meal_log_id
    AND meal_logs.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete meal log items for their meals"
  ON meal_log_items FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM meal_logs
    WHERE meal_logs.id = meal_log_items.meal_log_id
    AND meal_logs.user_id = auth.uid()
  ));

-- Meal Templates Policies
CREATE POLICY "Users can view their own meal templates"
  ON meal_templates FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own meal templates"
  ON meal_templates FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own meal templates"
  ON meal_templates FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own meal templates"
  ON meal_templates FOR DELETE
  USING (auth.uid() = user_id);

-- Meal Template Items Policies
CREATE POLICY "Users can view meal template items for their templates"
  ON meal_template_items FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM meal_templates
    WHERE meal_templates.id = meal_template_items.template_id
    AND meal_templates.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert meal template items for their templates"
  ON meal_template_items FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM meal_templates
    WHERE meal_templates.id = meal_template_items.template_id
    AND meal_templates.user_id = auth.uid()
  ));

CREATE POLICY "Users can update meal template items for their templates"
  ON meal_template_items FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM meal_templates
    WHERE meal_templates.id = meal_template_items.template_id
    AND meal_templates.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete meal template items for their templates"
  ON meal_template_items FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM meal_templates
    WHERE meal_templates.id = meal_template_items.template_id
    AND meal_templates.user_id = auth.uid()
  ));

-- Water Logs Policies
CREATE POLICY "Users can view their own water logs"
  ON water_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own water logs"
  ON water_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own water logs"
  ON water_logs FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own water logs"
  ON water_logs FOR DELETE
  USING (auth.uid() = user_id);

-- Daily Nutrition Summary Policies
CREATE POLICY "Users can view their own nutrition summaries"
  ON daily_nutrition_summary FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own nutrition summaries"
  ON daily_nutrition_summary FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own nutrition summaries"
  ON daily_nutrition_summary FOR UPDATE
  USING (auth.uid() = user_id);

-- Recent Foods Policies
CREATE POLICY "Users can view their own recent foods"
  ON recent_foods FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own recent foods"
  ON recent_foods FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own recent foods"
  ON recent_foods FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own recent foods"
  ON recent_foods FOR DELETE
  USING (auth.uid() = user_id);

-- Nutrition Achievements Policies (public read)
CREATE POLICY "Anyone can view nutrition achievements"
  ON nutrition_achievements FOR SELECT
  USING (true);

-- User Nutrition Achievement Progress Policies
CREATE POLICY "Users can view their own nutrition achievement progress"
  ON user_nutrition_achievement_progress FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own nutrition achievement progress"
  ON user_nutrition_achievement_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own nutrition achievement progress"
  ON user_nutrition_achievement_progress FOR UPDATE
  USING (auth.uid() = user_id);

-- ============================================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================================

-- Function: Update meal log totals when items are added/updated/deleted
CREATE OR REPLACE FUNCTION update_meal_log_totals()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE meal_logs
  SET
    total_calories = (
      SELECT COALESCE(SUM(calories), 0)
      FROM meal_log_items
      WHERE meal_log_id = COALESCE(NEW.meal_log_id, OLD.meal_log_id)
    ),
    total_protein = (
      SELECT COALESCE(SUM(protein), 0)
      FROM meal_log_items
      WHERE meal_log_id = COALESCE(NEW.meal_log_id, OLD.meal_log_id)
    ),
    total_carbs = (
      SELECT COALESCE(SUM(carbs), 0)
      FROM meal_log_items
      WHERE meal_log_id = COALESCE(NEW.meal_log_id, OLD.meal_log_id)
    ),
    total_fats = (
      SELECT COALESCE(SUM(fats), 0)
      FROM meal_log_items
      WHERE meal_log_id = COALESCE(NEW.meal_log_id, OLD.meal_log_id)
    ),
    updated_at = NOW()
  WHERE id = COALESCE(NEW.meal_log_id, OLD.meal_log_id);

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER meal_log_items_totals_trigger
AFTER INSERT OR UPDATE OR DELETE ON meal_log_items
FOR EACH ROW
EXECUTE FUNCTION update_meal_log_totals();

-- Function: Update daily nutrition summary when meal logs change
CREATE OR REPLACE FUNCTION update_daily_nutrition_summary()
RETURNS TRIGGER AS $$
DECLARE
  v_user_id UUID;
  v_date DATE;
  v_goal RECORD;
BEGIN
  -- Get user_id and date from the meal log
  IF TG_OP = 'DELETE' THEN
    v_user_id := OLD.user_id;
    v_date := OLD.date;
  ELSE
    v_user_id := NEW.user_id;
    v_date := NEW.date;
  END IF;

  -- Get active nutrition goal
  SELECT * INTO v_goal
  FROM nutrition_goals
  WHERE user_id = v_user_id AND is_active = true
  ORDER BY created_at DESC
  LIMIT 1;

  -- Upsert daily summary
  INSERT INTO daily_nutrition_summary (
    user_id,
    date,
    total_calories,
    total_protein,
    total_carbs,
    total_fats,
    total_water_ml,
    goal_calories,
    goal_protein,
    goal_carbs,
    goal_fats,
    goal_water_ml,
    meals_logged
  )
  SELECT
    v_user_id,
    v_date,
    COALESCE(SUM(ml.total_calories), 0),
    COALESCE(SUM(ml.total_protein), 0),
    COALESCE(SUM(ml.total_carbs), 0),
    COALESCE(SUM(ml.total_fats), 0),
    COALESCE((
      SELECT SUM(amount_ml)
      FROM water_logs
      WHERE user_id = v_user_id AND date = v_date
    ), 0),
    v_goal.daily_calories,
    v_goal.daily_protein_g,
    v_goal.daily_carbs_g,
    v_goal.daily_fats_g,
    v_goal.daily_water_ml,
    COUNT(ml.id)
  FROM meal_logs ml
  WHERE ml.user_id = v_user_id AND ml.date = v_date
  GROUP BY ml.user_id, ml.date
  ON CONFLICT (user_id, date) DO UPDATE
  SET
    total_calories = EXCLUDED.total_calories,
    total_protein = EXCLUDED.total_protein,
    total_carbs = EXCLUDED.total_carbs,
    total_fats = EXCLUDED.total_fats,
    meals_logged = EXCLUDED.meals_logged,
    hit_protein_target = EXCLUDED.total_protein >= EXCLUDED.goal_protein,
    hit_calorie_target = ABS(EXCLUDED.total_calories - EXCLUDED.goal_calories) <= (EXCLUDED.goal_calories * 0.1), -- Within 10%
    updated_at = NOW();

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER daily_nutrition_summary_trigger
AFTER INSERT OR UPDATE OR DELETE ON meal_logs
FOR EACH ROW
EXECUTE FUNCTION update_daily_nutrition_summary();

-- Function: Update daily water totals
CREATE OR REPLACE FUNCTION update_daily_water_summary()
RETURNS TRIGGER AS $$
DECLARE
  v_user_id UUID;
  v_date DATE;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_user_id := OLD.user_id;
    v_date := OLD.date;
  ELSE
    v_user_id := NEW.user_id;
    v_date := NEW.date;
  END IF;

  UPDATE daily_nutrition_summary
  SET
    total_water_ml = (
      SELECT COALESCE(SUM(amount_ml), 0)
      FROM water_logs
      WHERE user_id = v_user_id AND date = v_date
    ),
    hit_water_target = (
      SELECT COALESCE(SUM(amount_ml), 0) >= goal_water_ml
      FROM water_logs
      WHERE user_id = v_user_id AND date = v_date
    ),
    updated_at = NOW()
  WHERE user_id = v_user_id AND date = v_date;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER water_logs_summary_trigger
AFTER INSERT OR UPDATE OR DELETE ON water_logs
FOR EACH ROW
EXECUTE FUNCTION update_daily_water_summary();

-- Function: Track recent foods
CREATE OR REPLACE FUNCTION track_recent_food()
RETURNS TRIGGER AS $$
DECLARE
  v_user_id UUID;
  v_food_id UUID;
BEGIN
  -- Get user_id from meal log
  SELECT user_id INTO v_user_id
  FROM meal_logs
  WHERE id = NEW.meal_log_id;

  v_food_id := NEW.food_id;

  -- Upsert recent food
  INSERT INTO recent_foods (user_id, food_id, last_used_at, use_count)
  VALUES (v_user_id, v_food_id, NOW(), 1)
  ON CONFLICT (user_id, food_id) DO UPDATE
  SET
    last_used_at = NOW(),
    use_count = recent_foods.use_count + 1;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER track_recent_food_trigger
AFTER INSERT ON meal_log_items
FOR EACH ROW
EXECUTE FUNCTION track_recent_food();

-- ============================================================================
-- SEED DATA: Common Foods
-- ============================================================================

INSERT INTO foods (name, brand, calories_per_100g, protein_per_100g, carbs_per_100g, fats_per_100g, fiber_per_100g, category, tags, source, is_verified) VALUES
-- Proteins
('Chicken Breast (cooked)', NULL, 165, 31, 0, 3.6, 0, 'protein', ARRAY['high-protein', 'low-carb', 'lean'], 'usda', true),
('Salmon (cooked)', NULL, 206, 22, 0, 12, 0, 'protein', ARRAY['high-protein', 'omega-3', 'fatty-fish'], 'usda', true),
('Eggs (whole)', NULL, 155, 13, 1.1, 11, 0, 'protein', ARRAY['high-protein', 'versatile'], 'usda', true),
('Greek Yogurt (plain)', NULL, 59, 10, 3.6, 0.4, 0, 'protein', ARRAY['high-protein', 'low-fat', 'probiotic'], 'usda', true),
('Whey Protein Powder', NULL, 400, 80, 8, 6, 0, 'protein', ARRAY['high-protein', 'supplement', 'post-workout'], 'usda', true),
('Ground Beef (90% lean)', NULL, 176, 20, 0, 10, 0, 'protein', ARRAY['high-protein', 'red-meat'], 'usda', true),
('Tuna (canned in water)', NULL, 116, 26, 0, 0.8, 0, 'protein', ARRAY['high-protein', 'low-fat', 'convenient'], 'usda', true),

-- Carbs
('White Rice (cooked)', NULL, 130, 2.7, 28, 0.3, 0.4, 'carb', ARRAY['high-carb', 'staple', 'easy-digest'], 'usda', true),
('Sweet Potato (baked)', NULL, 90, 2, 21, 0.2, 3.3, 'carb', ARRAY['complex-carb', 'high-fiber', 'nutrient-dense'], 'usda', true),
('Oats (dry)', NULL, 389, 17, 66, 7, 10.6, 'carb', ARRAY['complex-carb', 'high-fiber', 'breakfast'], 'usda', true),
('Whole Wheat Bread', NULL, 247, 13, 41, 3.4, 7, 'carb', ARRAY['complex-carb', 'fiber', 'staple'], 'usda', true),
('Banana', NULL, 89, 1.1, 23, 0.3, 2.6, 'fruit', ARRAY['quick-carb', 'potassium', 'pre-workout'], 'usda', true),
('Pasta (cooked)', NULL, 158, 5.8, 31, 0.9, 1.8, 'carb', ARRAY['high-carb', 'staple', 'versatile'], 'usda', true),

-- Fats
('Almonds', NULL, 579, 21, 22, 50, 12.5, 'fat', ARRAY['healthy-fat', 'high-protein', 'snack'], 'usda', true),
('Peanut Butter', NULL, 588, 25, 20, 50, 6, 'fat', ARRAY['healthy-fat', 'high-protein', 'spread'], 'usda', true),
('Avocado', NULL, 160, 2, 8.5, 15, 6.7, 'fat', ARRAY['healthy-fat', 'nutrient-dense', 'versatile'], 'usda', true),
('Olive Oil', NULL, 884, 0, 0, 100, 0, 'fat', ARRAY['healthy-fat', 'cooking', 'monounsaturated'], 'usda', true),

-- Vegetables
('Broccoli (cooked)', NULL, 35, 2.4, 7, 0.4, 3.3, 'vegetable', ARRAY['low-calorie', 'high-fiber', 'nutrient-dense'], 'usda', true),
('Spinach (raw)', NULL, 23, 2.9, 3.6, 0.4, 2.2, 'vegetable', ARRAY['low-calorie', 'high-iron', 'leafy-green'], 'usda', true),

-- Beverages
('Milk (whole)', NULL, 61, 3.2, 4.8, 3.3, 0, 'beverage', ARRAY['protein', 'calcium', 'dairy'], 'usda', true),
('Water', NULL, 0, 0, 0, 0, 0, 'beverage', ARRAY['hydration', 'zero-calorie'], 'usda', true);

-- ============================================================================
-- SEED DATA: Nutrition Achievements
-- ============================================================================

INSERT INTO nutrition_achievements (title, description, icon, tier, requirement_type, requirement_value, xp_reward) VALUES
-- Protein Streaks
('Protein Apprentice', 'Hit your protein target for 7 consecutive days', '🥩', 'bronze', 'protein_streak', 7, 100),
('Protein Master', 'Hit your protein target for 30 consecutive days', '💪', 'silver', 'protein_streak', 30, 250),
('Protein Legend', 'Hit your protein target for 90 consecutive days', '👑', 'gold', 'protein_streak', 90, 500),

-- Calorie Accuracy
('Balanced Beginner', 'Track within 10% of calorie goal for 7 days', '⚖️', 'bronze', 'calorie_accuracy_streak', 7, 100),
('Balanced Expert', 'Track within 10% of calorie goal for 30 days', '🎯', 'silver', 'calorie_accuracy_streak', 30, 250),
('Macro Master', 'Track within 10% of calorie goal for 90 days', '🏆', 'gold', 'calorie_accuracy_streak', 90, 500),

-- Water Tracking
('Hydration Hero', 'Hit your water goal for 7 consecutive days', '💧', 'bronze', 'water_streak', 7, 100),
('Hydration Champion', 'Hit your water goal for 30 consecutive days', '🌊', 'silver', 'water_streak', 30, 250),
('Hydration Legend', 'Hit your water goal for 90 consecutive days', '🏅', 'gold', 'water_streak', 90, 500),

-- Consistency
('Nutrition Tracker', 'Log meals for 7 consecutive days', '📝', 'bronze', 'logging_streak', 7, 100),
('Dedicated Logger', 'Log meals for 30 consecutive days', '📊', 'silver', 'logging_streak', 30, 250),
('Nutrition Guru', 'Log meals for 100 consecutive days', '🧙', 'gold', 'logging_streak', 100, 500),

-- Special Achievements
('Template Creator', 'Create 5 meal templates', '🍽️', 'bronze', 'templates_created', 5, 100),
('Meal Prep Pro', 'Create 10 meal templates', '👨‍🍳', 'silver', 'templates_created', 10, 250),
('Custom Food Database', 'Add 20 custom foods', '📚', 'silver', 'custom_foods_created', 20, 250),
('Lean Machine', 'Maintain a cut for 30 days', '🔥', 'gold', 'cut_streak', 30, 500),
('Bulk Beast', 'Maintain a bulk for 30 days', '💪', 'gold', 'bulk_streak', 30, 500);

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE nutrition_goals IS 'User nutrition targets and macro calculations';
COMMENT ON TABLE foods IS 'Global and user-created food database';
COMMENT ON TABLE meal_logs IS 'Daily meal tracking entries';
COMMENT ON TABLE meal_log_items IS 'Individual food items within meals';
COMMENT ON TABLE meal_templates IS 'Saved meal templates for quick logging';
COMMENT ON TABLE meal_template_items IS 'Foods within meal templates';
COMMENT ON TABLE water_logs IS 'Daily water intake tracking';
COMMENT ON TABLE daily_nutrition_summary IS 'Aggregated daily nutrition stats';
COMMENT ON TABLE recent_foods IS 'Recently used foods for quick-add';
COMMENT ON TABLE nutrition_achievements IS 'Nutrition-specific achievement definitions';
COMMENT ON TABLE user_nutrition_achievement_progress IS 'User progress towards nutrition achievements';
