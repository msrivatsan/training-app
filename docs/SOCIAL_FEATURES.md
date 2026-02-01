# Social Features Documentation

## Overview

The Iron Quest training app now includes a comprehensive social layer designed to provide motivation, accountability, and community engagement while maintaining user privacy. All social features are **OPT-IN by default** to ensure users have complete control over their data.

## Features

### 1. Friend System

**Location:** `/app/social` → Friends Tab

- **Add friends by username**: Search for other users and send friend requests
- **See friends' recent workouts**: View workout posts from accepted friends (if they've opted to share)
- **Compare strength scores**: See how your lifts compare with friends who have opted in
- **Friendly leaderboards**: Monthly rankings showing most consistent friends

**API Endpoints:**
- `GET /api/social/friends` - List all friends and requests
- `POST /api/social/friends` - Send friend request
- `PUT /api/social/friends/[id]` - Accept/reject request
- `DELETE /api/social/friends/[id]` - Remove friend
- `GET /api/social/friends/search?q={username}` - Search users

### 2. Weekly Challenges (Guild Quests)

**Location:** `/app/social` → Guild Quests Tab

- **Community challenges**: Challenges everyone can participate in
- **Example challenges**:
  - "Total 50km volume this week"
  - "Hit 5 PRs"
  - "Complete 4 workouts this week"
- **Rewards**: Bonus XP multiplier + bonus XP upon completion
- **Community progress**: See how many lifters have joined and completed each quest
- **Auto-tracking**: Progress is automatically updated when you complete workouts

**API Endpoints:**
- `GET /api/social/challenges` - List active challenges with user progress
- `POST /api/social/challenges` - Join a challenge
- `PUT /api/social/challenges/[id]/progress` - Update progress

**Database Triggers:**
- Automatically updates challenge progress when workouts are completed
- Tracks participants and completion counts

### 3. Workout Sharing

**Location:** `/app/social` → Feed Tab

- **Share completed workouts**: Post to your feed after finishing a session
- **Add photos and notes**: Attach images and captions to your posts
- **Reactions**: React with emojis (like, fire, strong, clap, heart)
- **Comments**: Encourage and support your friends
- **Privacy settings**: Choose who can see each post (public, friends-only, private)

**API Endpoints:**
- `GET /api/social/posts?filter={all|friends|own}` - Get social feed
- `POST /api/social/posts` - Create a workout post
- `POST /api/social/posts/[id]/reactions` - Add reaction
- `DELETE /api/social/posts/[id]/reactions` - Remove reaction
- `GET /api/social/posts/[id]/comments` - Get comments
- `POST /api/social/posts/[id]/comments` - Add comment

### 4. Leaderboards

**Location:** `/app/social` → Leaderboards Tab

- **Global leaderboards**: Top strength scores (weight class adjusted available via filters)
- **Friends leaderboards**: See who's most consistent among your friends
- **Local leaderboards**: Lifters in your gym (requires location opt-in)
- **Filters**:
  - Age group (under 18, 18-29, 30-39, 40-49, 50+)
  - Experience level (beginner, intermediate, advanced, elite)
  - Location (city-based)
- **Leaderboard types**:
  - Most Consistent (workout count)
  - Total Volume
  - Total XP Earned
  - Strength Score

**API Endpoints:**
- `GET /api/social/leaderboards?type={workouts|volume|xp|strength}&scope={global|friends|local}` - Get leaderboard

**Privacy:**
- Only users who have opted in to `show_on_leaderboards` appear
- Filters respect user privacy settings

### 5. Training Partner Matching

**Location:** `/app/social` → Training Partners Tab

- **Find compatible partners**: Algorithm matches based on goals, schedule, and location
- **Matching criteria**:
  - Training goals (strength, hypertrophy, weight loss, etc.)
  - Available days
  - Preferred time (early morning, morning, afternoon, evening, late night)
  - Location proximity
- **Match score**: 0-100% compatibility rating
- **Send workout invites**: Invite partners to join your workouts
- **Accountability check-ins**: Track consistency with your partner

**API Endpoints:**
- `GET /api/social/partners/profile` - Get user's partner profile
- `POST /api/social/partners/profile` - Create partner profile
- `PUT /api/social/partners/profile` - Update partner profile
- `GET /api/social/partners/search` - Find compatible partners
- `GET /api/social/partners/requests` - Get partner requests
- `POST /api/social/partners/requests` - Send partner request

**Privacy:**
- Requires `allow_partner_matching` to be enabled
- Only active profiles are shown in search results

### 6. Community Program Templates

**Location:** `/app/social` → Community Programs Tab

- **Share custom programs**: Make your training programs available to the community
- **Rate and review**: Rate programs 1-5 stars and leave reviews
- **Top-rated featured**: Best programs highlighted
- **Browse by**:
  - Category (strength, hypertrophy, powerlifting, bodybuilding, etc.)
  - Difficulty (beginner, intermediate, advanced)
  - Duration (weeks)
  - Tags
- **Sort by**:
  - Top Rated
  - Most Popular (uses count)
  - Recently Added

**API Endpoints:**
- `GET /api/social/templates?category={}&difficulty={}&sort={rating|uses|recent}` - Browse templates
- `POST /api/social/templates` - Share a program template
- `GET /api/social/templates/[id]/ratings` - Get ratings
- `POST /api/social/templates/[id]/ratings` - Rate a template
- `POST /api/social/templates/[id]/use` - Use a template (increments count)

## Privacy Settings

**Location:** `/app/social` → Privacy Tab

All social features respect user privacy settings. Users have granular control over:

### Privacy Controls

```typescript
{
  profile_visibility: 'private' | 'friends' | 'public', // Default: 'private'
  workout_sharing: 'private' | 'friends' | 'public',    // Default: 'private'
  show_on_leaderboards: boolean,                        // Default: false
  allow_friend_requests: boolean,                       // Default: true
  allow_partner_matching: boolean,                      // Default: false
  show_strength_scores: boolean,                        // Default: false
  show_location: boolean,                               // Default: false
  location_city?: string,
  location_country?: string,
  gym_name?: string,
  age_group?: 'under_18' | '18_29' | '30_39' | '40_49' | '50_plus',
  experience_level?: 'beginner' | 'intermediate' | 'advanced' | 'elite'
}
```

**API Endpoints:**
- `GET /api/social/privacy` - Get privacy settings
- `PUT /api/social/privacy` - Update privacy settings

## Database Schema

### Tables Created

1. **user_privacy_settings** - Privacy and opt-in controls
2. **friendships** - Friend connections and requests
3. **workout_posts** - Shared workouts
4. **post_reactions** - Likes and reactions on posts
5. **post_comments** - Comments on posts
6. **weekly_challenges** - Guild quests
7. **user_challenge_progress** - Individual challenge progress
8. **monthly_leaderboard_stats** - Monthly statistics for leaderboards
9. **training_partner_profiles** - Partner matching profiles
10. **partner_requests** - Training partner connection requests
11. **workout_invites** - Invitations to workout together
12. **accountability_checkins** - Daily check-ins for partners
13. **community_program_templates** - Shared training programs
14. **template_ratings** - Ratings and reviews

### Row Level Security (RLS)

All tables have RLS policies that:
- Enforce privacy settings
- Ensure users can only modify their own data
- Allow viewing based on friendship status and visibility settings
- Protect sensitive information

### Database Triggers

1. **Update post likes/comments count** - Automatically updates counts when reactions/comments are added
2. **Update challenge counts** - Tracks participants and completions
3. **Update template ratings** - Recalculates average ratings
4. **Update monthly leaderboard stats** - Auto-updates when workouts are completed
5. **Update challenge progress** - Auto-tracks progress when workouts are completed

## Components

### React Components

- `PrivacySettings.tsx` - Privacy configuration interface
- `FriendsManager.tsx` - Friend management (add, accept, remove)
- `SocialFeed.tsx` - Workout feed with reactions and comments
- `WeeklyChallenges.tsx` - Guild quests display and tracking
- `Leaderboard.tsx` - Leaderboard display with filters
- `TrainingPartnerFinder.tsx` - Partner matching and requests
- `CommunityTemplates.tsx` - Program template browser
- `ShareWorkoutModal.tsx` - Modal for sharing workouts

### Main Page

- `/app/social/page.tsx` - Main social hub with tabbed interface

## Usage Examples

### Share a Workout After Completion

```typescript
import ShareWorkoutModal from '@/components/social/ShareWorkoutModal';

// In your workout completion component
const [showShareModal, setShowShareModal] = useState(false);

// After workout completion
<ShareWorkoutModal
  workoutSessionId={sessionId}
  onClose={() => setShowShareModal(false)}
  onSuccess={() => {
    // Optionally refresh feed or show success message
  }}
/>
```

### Check User Privacy Before Showing Social Features

```typescript
const { data: privacySettings } = await fetch('/api/social/privacy');

if (privacySettings.workout_sharing !== 'private') {
  // Show share button
}
```

### Join a Challenge

```typescript
const joinChallenge = async (challengeId: string) => {
  await fetch('/api/social/challenges', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ challenge_id: challengeId }),
  });
};
```

## Future Enhancements

Potential additions:
- Push notifications for friend requests, comments, challenges
- Direct messaging between friends
- Workout plans marketplace
- Live workout sessions with video chat
- Achievement badges for social milestones
- Team challenges (create groups)
- Gym check-ins with location services
- Integration with wearables for auto-sharing
- Social streaks and accountability tracking

## Security Considerations

1. **RLS Enforcement**: All database access goes through Supabase RLS policies
2. **Privacy First**: Default to private for all features
3. **User Control**: Granular settings for every social feature
4. **Data Protection**: Users can only see data they're authorized to view
5. **No Forced Sharing**: All sharing is explicit and user-initiated

## Performance

- Pagination on feeds and leaderboards
- Indexed queries for fast lookups
- Denormalized counts (likes, comments) for efficiency
- Automatic cleanup of stale data
- Optimized queries with proper indexes

## Testing

To test social features:

1. Create multiple test accounts
2. Enable privacy settings on each account
3. Send friend requests between accounts
4. Create and join challenges
5. Share workout posts
6. Test leaderboard visibility
7. Set up training partner profiles
8. Share and rate program templates

## Migrations

Run the following migrations to add social features:

```bash
# Apply migrations
supabase migration up

# Or manually run:
psql -f supabase/migrations/20260201000000_add_social_features.sql
psql -f supabase/migrations/20260201000001_add_social_helper_functions.sql
```

## Support

For issues or questions about social features, please check:
- Privacy settings first - many features require opt-in
- Friend status - some features only work with accepted friends
- Database migrations - ensure all migrations have been applied
- RLS policies - verify permissions are set correctly
