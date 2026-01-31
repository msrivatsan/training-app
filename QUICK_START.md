# Quick Start Guide - TL;DR

For experienced developers who just want the commands.

## Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account

## Setup Commands

```bash
# 1. Install dependencies
npm install

# 2. Create environment file
cp .env.example .env.local

# 3. Edit .env.local with your Supabase credentials
# Get these from: https://app.supabase.com → Your Project → Settings → API
```

Edit `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## Database Setup

1. Go to Supabase SQL Editor: https://app.supabase.com → SQL Editor
2. Copy all contents from `supabase/schema.sql`
3. Paste and run in SQL Editor

## Run

```bash
npm run dev
```

Open http://localhost:3000

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend (Next.js)                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Landing    │  │     Auth     │  │   Dashboard  │      │
│  │     Page     │  │    Pages     │  │  (Protected) │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                           │                                  │
│                    middleware.ts                             │
│                    (Route Protection)                        │
│                           │                                  │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              Supabase Client Layer                   │   │
│  │  - client.ts (browser)                               │   │
│  │  - server.ts (server components)                     │   │
│  │  - middleware.ts (auth middleware)                   │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                    Supabase Backend                          │
│  ┌──────────────────┐  ┌──────────────────┐                │
│  │  Authentication  │  │    PostgreSQL    │                │
│  │   - Email/Pass   │  │   - 8 Tables     │                │
│  │   - Sessions     │  │   - RLS Policies │                │
│  │   - Password     │  │   - Triggers     │                │
│  │     Reset        │  │   - Functions    │                │
│  └──────────────────┘  └──────────────────┘                │
└─────────────────────────────────────────────────────────────┘
```

## File Structure

```
app/
├── page.tsx              → Landing page
├── login/                → Login
├── signup/               → Sign up
├── dashboard/            → Main app (protected)
└── auth/callback/        → Auth callback

lib/
├── supabase/            → Supabase clients
├── types.ts             → TypeScript types
├── database.ts          → DB helpers
└── utils.ts             → Utilities

hooks/
├── useAuth.ts           → Auth state
└── useWorkoutSession.ts → Session management
```

## Key Files to Know

| File | Purpose |
|------|---------|
| `middleware.ts` | Protects routes, redirects unauthenticated users |
| `lib/types.ts` | All TypeScript type definitions |
| `lib/supabase/*` | Supabase client configurations |
| `supabase/schema.sql` | Database schema (run this in Supabase!) |
| `.env.local` | Your Supabase credentials (create this!) |

## Common Tasks

### Test Authentication
```bash
# 1. Run app
npm run dev

# 2. Go to http://localhost:3000
# 3. Click "Get Started"
# 4. Create account
# 5. Check Supabase dashboard for user
```

### Check Database
```bash
# Supabase Dashboard → Table Editor → users
# Should see your user profile
```

### Debug Issues
```bash
# Check browser console (F12)
# Check terminal output
# Verify .env.local has correct values
# Restart dev server after .env changes
```

## What's Already Built

✅ Authentication (login, signup, password reset)
✅ Protected routes (middleware)
✅ Database schema (8 tables with RLS)
✅ TypeScript types (complete type safety)
✅ Custom hooks (useAuth, useWorkoutSession)
✅ Landing page + Dashboard
✅ Utility functions (date formatting, calculations, etc.)

## What You Need to Build

🔨 Workout program creation UI
🔨 Exercise library
🔨 Active workout tracking
🔨 Progress charts (Recharts is installed)
🔨 Body measurement tracking
🔨 Achievement system
🔨 User settings

The foundation is complete - ready for features!
