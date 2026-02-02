Gamified Workout Tracker App

A modern, full-stack workout tracking application built with Next.js 14, TypeScript, Tailwind CSS, and Supabase.

## Features

- **User Authentication**: Secure email/password authentication with Supabase
- **Workout Tracking**: Log workouts, exercises, sets, reps, and weight
- **Training Programs**: Create and manage custom workout programs
- **Progress Analytics**: Track your fitness journey with detailed statistics
- **Body Measurements**: Record and monitor body composition changes
- **Achievements**: Unlock milestones and celebrate your progress
- **Responsive Design**: Beautiful UI that works on all devices

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React, TypeScript
- **Styling**: Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Authentication, Row Level Security)
- **State Management**: Zustand
- **Charts**: Recharts
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Date Handling**: date-fns

## Project Structure

```
training-app/
├── app/                    # Next.js app router pages
│   ├── login/             # Login page
│   ├── signup/            # Signup page
│   ├── reset-password/    # Password reset page
│   ├── dashboard/         # Main dashboard
│   └── auth/callback/     # OAuth callback handler
├── components/            # Reusable React components
├── contexts/              # React context providers
├── hooks/                 # Custom React hooks
│   ├── useAuth.ts        # Authentication hook
│   └── useWorkoutSession.ts # Workout session management
├── lib/                   # Utilities and configurations
│   ├── types.ts          # TypeScript type definitions
│   ├── utils.ts          # Utility functions
│   ├── database.ts       # Database helper functions
│   └── supabase/         # Supabase client configurations
│       ├── client.ts     # Client-side Supabase client
│       ├── server.ts     # Server-side Supabase client
│       └── middleware.ts # Middleware Supabase client
├── supabase/
│   └── schema.sql        # Database schema
└── middleware.ts         # Next.js middleware for route protection
```

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- A Supabase account and project

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd training-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Supabase**

   - Create a new project at [supabase.com](https://supabase.com)
   - Go to Project Settings > API
   - Copy your project URL and anon key

4. **Configure environment variables**

   Create a `.env.local` file in the root directory:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your-project-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```

5. **Set up the database**

   - Go to your Supabase project's SQL Editor
   - Copy the contents of `supabase/schema.sql`
   - Paste and run the SQL to create all tables, triggers, and security policies

6. **Run the development server**
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

## Database Schema

The app uses the following main tables:

- **users**: User profiles (extends Supabase auth.users)
- **programs**: Workout programs/training plans
- **workouts**: Individual workouts within programs
- **exercises**: Exercises within workouts
- **workout_sessions**: Instances of completed workouts
- **sets**: Individual set data (reps, weight, RPE)
- **user_achievements**: User achievements and milestones
- **body_measurements**: Body measurement tracking

All tables have Row Level Security (RLS) enabled to ensure users can only access their own data.

## Key Features Implementation

### Authentication

- Email/password authentication via Supabase Auth
- Protected routes using Next.js middleware
- Automatic session management with cookies
- Password reset functionality

### Workout Tracking

- Create custom workout programs
- Log workout sessions in real-time
- Track sets, reps, weight, and RPE
- Calculate total volume and session duration
- View workout history and statistics

### Progress Analytics

- Personal records (PRs) tracking
- Volume over time charts
- Exercise progress tracking
- Muscle group distribution
- Weekly/monthly summaries

### Type Safety

Comprehensive TypeScript types for:
- Database tables and relationships
- API responses
- Form data
- Chart data
- Insert/Update operations

## Custom Hooks

### `useAuth()`

Manages authentication state and user profile:
```typescript
const { user, profile, loading, signOut } = useAuth();
```

### `useWorkoutSession()`

Manages active workout sessions:
```typescript
const {
  session,
  sets,
  loading,
  startSession,
  addSet,
  completeSession,
  cancelSession,
} = useWorkoutSession(userId);
```

## Utility Functions

Common utilities in `lib/utils.ts`:
- `calculateOneRepMax()`: Estimate 1RM using Epley formula
- `formatWeight()`: Format weight with units (kg/lbs)
- `calculateVolume()`: Calculate set volume (weight × reps)
- `formatDuration()`: Format workout duration
- `formatDate()`: Format dates for display
- And more...

## Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Import your repository to [Vercel](https://vercel.com)
3. Add environment variables in Vercel project settings
4. Deploy!

### Environment Variables for Production

Make sure to set these in your deployment platform:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Security

- Row Level Security (RLS) on all database tables
- Secure authentication with Supabase Auth
- Protected routes via middleware
- Input validation and sanitization
- HTTPS enforced in production

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Support

For issues or questions, please open an issue on GitHub.

## Acknowledgments

- [Next.js](https://nextjs.org/)
- [Supabase](https://supabase.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Lucide Icons](https://lucide.dev/)
- [Recharts](https://recharts.org/)
