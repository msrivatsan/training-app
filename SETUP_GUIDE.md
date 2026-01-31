# Iron Quest - Complete Setup Guide

This guide will walk you through setting up the Iron Quest workout tracker from scratch.

## Overview

What we'll be setting up:
1. ✅ The Next.js application (already initialized)
2. 🔧 Supabase backend (database + authentication)
3. 🔑 Environment variables
4. 📊 Database schema
5. 🚀 Running the app

## Step 1: Verify Installation

First, let's make sure you have everything installed:

```bash
# Check Node.js version (should be 18 or higher)
node --version

# Check npm
npm --version

# Install dependencies if you haven't already
npm install
```

## Step 2: Create Supabase Project

### 2.1 Sign Up for Supabase

1. Go to [https://supabase.com](https://supabase.com)
2. Click "Start your project" or "Sign in"
3. Sign in with GitHub (recommended) or email

### 2.2 Create a New Project

1. Click "New Project" in your Supabase dashboard
2. Fill in the project details:
   - **Name**: `iron-quest` (or any name you prefer)
   - **Database Password**: Choose a strong password (save this!)
   - **Region**: Choose the closest region to you
   - **Pricing Plan**: Free tier is fine for development
3. Click "Create new project"
4. Wait 2-3 minutes for your project to be set up

### 2.3 Get Your API Credentials

Once your project is ready:

1. In your Supabase project dashboard, click on the **Settings** icon (gear icon) in the left sidebar
2. Click on **API** under the Project Settings section
3. You'll see two important values:

   ```
   Project URL: https://xxxxxxxxxxxxx.supabase.co
   anon/public key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

4. Keep this tab open - you'll need these values in the next step

## Step 3: Configure Environment Variables

### 3.1 Create .env.local File

In your project root directory, create a file named `.env.local`:

```bash
# Create the file
touch .env.local
```

### 3.2 Add Your Supabase Credentials

Open `.env.local` and add your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

**Replace** `your-project-id.supabase.co` and `your-anon-key-here` with the actual values from Step 2.3.

**Example:**
```env
NEXT_PUBLIC_SUPABASE_URL=https://abcdefghijklmn.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1uIiwicm9sZSI6ImFub24iLCJpYXQiOjE2ODk1MjE2MDAsImV4cCI6MjAwNTA5NzYwMH0.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

⚠️ **Important**: `.env.local` is already in `.gitignore`, so your credentials won't be committed to git.

## Step 4: Set Up the Database

Now we need to create all the database tables and security policies.

### 4.1 Open SQL Editor

1. In your Supabase dashboard, click on the **SQL Editor** icon (looks like a document) in the left sidebar
2. Click "New query" to create a new SQL query

### 4.2 Run the Schema

1. Open the file `supabase/schema.sql` in your code editor
2. **Copy the entire contents** of this file (all ~700 lines)
3. **Paste** it into the SQL Editor in Supabase
4. Click the **"Run"** button (or press Ctrl+Enter / Cmd+Enter)

You should see a success message: "Success. No rows returned"

### 4.3 Verify Tables Were Created

1. Click on the **Table Editor** icon (grid icon) in the left sidebar
2. You should see these tables:
   - `users`
   - `programs`
   - `workouts`
   - `exercises`
   - `workout_sessions`
   - `sets`
   - `user_achievements`
   - `body_measurements`

If you see all 8 tables, you're good to go! ✅

## Step 5: Run the Application

### 5.1 Start the Development Server

```bash
npm run dev
```

You should see output like:

```
  ▲ Next.js 14.x.x
  - Local:        http://localhost:3000
  - Ready in xxxms
```

### 5.2 Open the App

Open your browser and go to:
```
http://localhost:3000
```

You should see the Iron Quest landing page! 🎉

## Step 6: Test the Authentication

### 6.1 Create an Account

1. Click "Get Started" or "Sign up"
2. Fill in the form:
   - Full Name: Your name
   - Email: Your email address
   - Password: At least 6 characters
   - Confirm Password: Same password
3. Click "Create account"

### 6.2 Check Email Confirmation (if enabled)

- By default, Supabase requires email confirmation
- Check your email for a confirmation link
- Click the link to verify your email

**To disable email confirmation for development:**
1. Go to Supabase Dashboard → Authentication → Settings
2. Under "Email Auth", turn OFF "Confirm email"
3. Save changes

### 6.3 Access Dashboard

After signing up (and confirming email if required), you should be redirected to:
```
http://localhost:3000/dashboard
```

You should see your personalized dashboard! 🏋️

## Step 7: Verify Everything Works

### 7.1 Check User Profile

1. Go to Supabase Dashboard → Authentication → Users
2. You should see your user account listed
3. Go to Table Editor → `users` table
4. Your profile should be there with your email and name

### 7.2 Test Sign Out

1. Click "Sign Out" in the dashboard
2. You should be redirected to the login page
3. Try signing back in with your credentials

## Common Issues & Solutions

### Issue: "Invalid API key" error

**Solution:**
- Double-check your `.env.local` file
- Make sure there are no extra spaces or quotes
- Restart the dev server: Stop (Ctrl+C) and run `npm run dev` again

### Issue: "relation 'users' does not exist"

**Solution:**
- The database schema wasn't created properly
- Go back to Step 4.2 and run the SQL schema again
- Make sure you copied the ENTIRE `schema.sql` file

### Issue: Email confirmation stuck

**Solution:**
- Disable email confirmation in Supabase:
  - Dashboard → Authentication → Settings
  - Turn OFF "Confirm email"
  - Try signing up again with a different email

### Issue: "Error: connect ECONNREFUSED"

**Solution:**
- Your Supabase URL might be wrong
- Check `.env.local` and verify the URL matches your project
- Make sure you have internet connection (Supabase is cloud-based)

### Issue: Changes to .env.local not taking effect

**Solution:**
- Restart the Next.js dev server
- Environment variables are only loaded on server start

## Project Structure Quick Reference

```
training-app/
├── .env.local              # 🔑 Your Supabase credentials (create this!)
├── .env.example            # Template for environment variables
│
├── app/                    # Next.js pages
│   ├── page.tsx           # Landing page (/)
│   ├── login/             # Login page
│   ├── signup/            # Sign up page
│   ├── reset-password/    # Password reset
│   ├── dashboard/         # Main dashboard (protected)
│   └── auth/callback/     # Auth callback handler
│
├── lib/
│   ├── supabase/
│   │   ├── client.ts      # Client-side Supabase
│   │   ├── server.ts      # Server-side Supabase
│   │   └── middleware.ts  # Middleware Supabase
│   ├── types.ts           # TypeScript types
│   ├── database.ts        # Database helpers
│   └── utils.ts           # Utility functions
│
├── hooks/
│   ├── useAuth.ts         # Authentication hook
│   └── useWorkoutSession.ts # Workout session hook
│
├── supabase/
│   └── schema.sql         # 📊 Database schema (run this in Supabase!)
│
└── middleware.ts          # Route protection
```

## Next Steps

Now that your app is set up, you can:

1. **Explore the codebase** - All files have detailed comments
2. **Add workout features** - The foundation is ready for building
3. **Customize the design** - Tailwind CSS makes it easy
4. **Add more pages** - Programs, exercises, progress tracking, etc.

## Getting Help

If you run into issues:

1. Check the error message carefully
2. Look at the browser console (F12 → Console tab)
3. Check the terminal where `npm run dev` is running
4. Review the Common Issues section above

## Summary Checklist

- [ ] Node.js 18+ installed
- [ ] Dependencies installed (`npm install`)
- [ ] Supabase project created
- [ ] `.env.local` file created with correct credentials
- [ ] Database schema executed in Supabase SQL Editor
- [ ] 8 tables visible in Supabase Table Editor
- [ ] Dev server running (`npm run dev`)
- [ ] App accessible at http://localhost:3000
- [ ] Successfully created a test account
- [ ] Can log in and access dashboard

Once all checkboxes are complete, you're ready to start building! 🚀
