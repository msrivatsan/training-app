# 🚀 Iron Quest - Complete Setup Guide (From Scratch)

This guide walks you through setting up Iron Quest on your PC, assuming you have **nothing set up yet**.

---

## ⏱️ Time Required: 20-30 minutes

---

## 📋 **STEP 1: Install Node.js**

1. Go to **https://nodejs.org**
2. Download the **LTS version** (green button - "Recommended for Most Users")
3. Run the installer, click "Next" through everything (use defaults)
4. Verify it worked:
   ```bash
   node --version
   ```
   Should show `v18.x.x` or higher

---

## 📦 **STEP 2: Install Project Dependencies**

1. Open terminal/command prompt
2. Navigate to the project folder:
   ```bash
   cd /home/user/training-app
   ```
3. Install all dependencies:
   ```bash
   npm install
   ```
   ⏳ This takes 2-3 minutes. Wait for it to complete.

---

## ☁️ **STEP 3: Create Supabase Account & Project**

### 3.1 Sign Up
1. Go to **https://supabase.com**
2. Click **"Start your project"**
3. Sign up with GitHub (recommended) or email

### 3.2 Create New Project
1. Click **"New Project"**
2. Fill in:
   - **Name**: `iron-quest` (or anything you like)
   - **Database Password**: Pick a strong password (**SAVE THIS!**)
   - **Region**: Choose closest to you (e.g., US East, EU West)
   - **Pricing Plan**: Free tier is perfect
3. Click **"Create new project"**
4. ⏳ Wait 2-3 minutes while it sets up

---

## 🔑 **STEP 4: Get Your API Keys**

1. Once project is ready, look at **left sidebar**
2. Click ⚙️ **Settings** (gear icon at bottom)
3. Click **"API"** in the menu
4. You'll see:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public key**: Long string starting with `eyJhbGci...`
5. **Keep this tab open** - you'll copy these next

---

## 📝 **STEP 5: Create Environment File**

1. In your project folder, create a file named `.env.local`
2. Add this content:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=paste-your-project-url-here
   NEXT_PUBLIC_SUPABASE_ANON_KEY=paste-your-anon-key-here
   ```
3. **Replace** with your actual values from Step 4
4. **Save** the file

**Example:**
```env
NEXT_PUBLIC_SUPABASE_URL=https://abcdefg.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOi...
```

---

## 🗄️ **STEP 6: Set Up Database (IMPORTANT!)**

This is where you run ALL the SQL scripts. Follow carefully!

### 6.1 Open SQL Editor
1. Go to Supabase dashboard
2. Click **SQL Editor** icon (looks like `</>`) in left sidebar
3. Click **"+ New query"**

### 6.2 Run Base Schema (REQUIRED)
1. Open `supabase/schema.sql` in your code editor
2. **Select all** (Ctrl+A / Cmd+A) and **copy**
3. **Paste** into Supabase SQL Editor
4. Click **RUN** button (or Ctrl+Enter / Cmd+Enter)
5. Should see: ✅ **"Success. No rows returned"**

### 6.3 Run Migration Scripts (OPTIONAL but RECOMMENDED)

Now run each migration in order. For each one:
- Click **"+ New query"** to start fresh
- Copy the migration file contents
- Paste into SQL Editor
- Click **RUN**
- Wait for success message

**Run in this order:**

#### 1️⃣ Program Templates (RECOMMENDED)
- **File**: `supabase/migrations/002_program_templates.sql`
- **Adds**: Workout templates, A/B day designation, intensity tracking

#### 2️⃣ RPG Gamification (OPTIONAL - Fun!)
- **File**: `supabase/migrations/003_rpg_gamification.sql`
- **Adds**: XP system, levels, achievements, boss battles, rewards
- **Note**: Makes working out feel like a video game!

#### 3️⃣ Nutrition Tracking (OPTIONAL)
- **File**: `supabase/migrations/004_nutrition_tracking.sql`
- **Adds**: Calorie tracking, macros, meal logging, food database
- **Note**: Skip if you only want workout tracking

#### 4️⃣ Progression System (RECOMMENDED)
- **File**: `supabase/migrations/progression_system.sql`
- **Adds**: Progressive overload tracking, deloads, periodization
- **Note**: Helps you track strength gains over time

#### 5️⃣ Social Features (OPTIONAL)
- **File**: `supabase/migrations/20260201000000_add_social_features.sql`
- **Adds**: Friends, challenges, leaderboards, workout sharing
- **Note**: Skip if you want privacy/solo tracking

#### 6️⃣ Exercise Swap (RECOMMENDED)
- **File**: `supabase/migrations/20260201000001_add_exercise_swap_features.sql`
- **Adds**: Exercise substitutions, movement patterns, equipment profiles

#### 7️⃣ Social Helper Functions (only if you ran #5)
- **File**: `supabase/migrations/20260201000001_add_social_helper_functions.sql`
- **Adds**: Helper functions for social features
- **Note**: Only needed if you ran migration #5

---

### 6.4 Verify Database Setup

1. Click **Table Editor** (grid icon) in left sidebar
2. You should see at least these 8 tables:
   - ✅ `users`
   - ✅ `programs`
   - ✅ `workouts`
   - ✅ `exercises`
   - ✅ `workout_sessions`
   - ✅ `sets`
   - ✅ `user_achievements`
   - ✅ `body_measurements`

If you ran all migrations, you'll see many more tables (nutrition, social, etc.)

---

## 📧 **STEP 7: Disable Email Confirmation (Easier for Testing)**

1. In Supabase, click **Authentication** (left sidebar)
2. Click **Settings** tab
3. Find **"Confirm email"** and toggle it **OFF**
4. Click **Save**

**Why?** Makes testing easier - you won't need to verify emails during development.

---

## 🏃 **STEP 8: Run the App**

1. In terminal, make sure you're in `training-app` folder
2. Run:
   ```bash
   npm run dev
   ```
3. Wait for: `✓ Ready in X ms`
4. You'll see: `Local: http://localhost:3000`

---

## 🌐 **STEP 9: Open in Browser**

1. Open your browser
2. Go to: **http://localhost:3000**
3. 🎉 You should see the Iron Quest landing page!

---

## 👤 **STEP 10: Create Your First Account**

1. Click **"Get Started"** or **"Sign up"**
2. Fill in:
   - **Full Name**: Your name
   - **Email**: Any email (doesn't need to be real if you disabled confirmation)
   - **Password**: At least 6 characters
   - **Confirm Password**: Same password
3. Click **"Create account"**
4. 🏋️ You should be taken to the dashboard!

---

## ✅ **You're Done!**

Your Iron Quest app is now fully set up with:
- ✅ Basic workout tracking
- ✅ Program templates (if you ran migration #1)
- ✅ RPG gamification (if you ran migration #2)
- ✅ Nutrition tracking (if you ran migration #3)
- ✅ Progressive overload (if you ran migration #4)
- ✅ Social features (if you ran migration #5)
- ✅ Exercise swaps (if you ran migration #6)

---

## 🆘 **Troubleshooting**

### "Invalid API key" error
- Check `.env.local` - no extra spaces
- Restart server: Ctrl+C, then `npm run dev`

### "relation 'users' does not exist"
- Database schema didn't run properly
- Go back to Step 6.2 and re-run `schema.sql`

### "relation 'user_levels' does not exist"
- You're using gamification features but didn't run migration #2
- Run `003_rpg_gamification.sql` in SQL Editor

### Migration fails with "already exists"
- That migration was already run
- Skip to the next one
- Or ignore the error (it's harmless)

### Nothing happens when signing up
- Open browser console (F12 → Console)
- Check terminal where `npm run dev` is running
- Look for error messages

### Changes to `.env.local` not working
- Restart dev server (Ctrl+C, then `npm run dev`)
- Environment variables load on startup only

---

## 📊 **What Features Should I Enable?**

**Minimal Setup (Just Workouts):**
- ✅ Base schema only
- Skip all migrations
- Perfect for simple workout tracking

**Recommended Setup:**
- ✅ Base schema
- ✅ Migration #1 (Program Templates)
- ✅ Migration #4 (Progression System)
- ✅ Migration #6 (Exercise Swap)
- Great for serious lifters who want progress tracking

**Full Experience:**
- ✅ Run ALL migrations
- Get every feature including gamification, nutrition, and social
- Best for comprehensive fitness tracking

---

## 🎯 **Quick Summary Checklist**

- [ ] Node.js 18+ installed
- [ ] `npm install` completed
- [ ] Supabase project created
- [ ] `.env.local` file created with API keys
- [ ] Base `schema.sql` executed successfully
- [ ] Migrations executed (at least the recommended ones)
- [ ] Tables visible in Supabase Table Editor
- [ ] Email confirmation disabled (optional but helpful)
- [ ] `npm run dev` running
- [ ] App opens at http://localhost:3000
- [ ] Successfully created test account
- [ ] Can access dashboard

---

## 🚀 **Next Steps**

Now that your app is running:

1. **Explore the dashboard** - Click around and see what's there
2. **Create a program** - Set up your first workout program
3. **Log a workout** - Try tracking a session
4. **Check out the code** - All files have detailed comments
5. **Customize it** - Make it your own!

---

**Need help?** Open an issue on GitHub or check the browser console for error messages.

**Happy lifting! 💪**
