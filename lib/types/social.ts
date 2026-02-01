// ============================================================================
// SOCIAL FEATURES TYPES
// ============================================================================

export type ProfileVisibility = 'public' | 'friends' | 'private';
export type FriendshipStatus = 'pending' | 'accepted' | 'rejected' | 'blocked';
export type ReactionType = 'like' | 'fire' | 'strong' | 'clap' | 'heart';
export type ChallengeType = 'volume' | 'pr_count' | 'workout_count' | 'consistency' | 'custom';
export type PreferredTime = 'early_morning' | 'morning' | 'afternoon' | 'evening' | 'late_night';
export type PartnerRequestStatus = 'pending' | 'accepted' | 'rejected';
export type AgeGroup = 'under_18' | '18_29' | '30_39' | '40_49' | '50_plus';
export type ExperienceLevel = 'beginner' | 'intermediate' | 'advanced' | 'elite';
export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced';

// ============================================================================
// Privacy Settings
// ============================================================================

export interface UserPrivacySettings {
  user_id: string;
  profile_visibility: ProfileVisibility;
  workout_sharing: ProfileVisibility;
  show_on_leaderboards: boolean;
  allow_friend_requests: boolean;
  allow_partner_matching: boolean;
  show_strength_scores: boolean;
  show_location: boolean;
  location_city?: string;
  location_country?: string;
  gym_name?: string;
  age_group?: AgeGroup;
  experience_level?: ExperienceLevel;
  created_at: string;
  updated_at: string;
}

export interface UpdatePrivacySettingsPayload {
  profile_visibility?: ProfileVisibility;
  workout_sharing?: ProfileVisibility;
  show_on_leaderboards?: boolean;
  allow_friend_requests?: boolean;
  allow_partner_matching?: boolean;
  show_strength_scores?: boolean;
  show_location?: boolean;
  location_city?: string;
  location_country?: string;
  gym_name?: string;
  age_group?: AgeGroup;
  experience_level?: ExperienceLevel;
}

// ============================================================================
// Friend System
// ============================================================================

export interface Friendship {
  id: string;
  user_id: string;
  friend_id: string;
  status: FriendshipStatus;
  requested_at: string;
  responded_at?: string;
  created_at: string;
  updated_at: string;
}

export interface FriendProfile {
  id: string;
  name: string;
  avatar?: string;
  fitness_level?: string;
  current_level?: number;
  strength_score?: number;
  friendship_status?: FriendshipStatus;
  recent_workouts_count?: number;
}

export interface FriendRequest {
  id: string;
  user_id: string;
  friend_id: string;
  status: FriendshipStatus;
  requested_at: string;
  requester_name: string;
  requester_avatar?: string;
}

export interface FriendStats {
  total_friends: number;
  pending_requests: number;
  sent_requests: number;
}

// ============================================================================
// Workout Sharing
// ============================================================================

export interface WorkoutPost {
  id: string;
  user_id: string;
  workout_session_id: string;
  caption?: string;
  photo_urls?: string[];
  visibility: ProfileVisibility;
  likes_count: number;
  comments_count: number;
  created_at: string;
  updated_at: string;
  // Joined fields
  user_name?: string;
  user_avatar?: string;
  user_level?: number;
  session_duration?: number;
  session_volume?: number;
  has_user_reacted?: boolean;
  user_reaction_type?: ReactionType;
}

export interface PostReaction {
  id: string;
  post_id: string;
  user_id: string;
  reaction_type: ReactionType;
  created_at: string;
  // Joined fields
  user_name?: string;
  user_avatar?: string;
}

export interface PostComment {
  id: string;
  post_id: string;
  user_id: string;
  comment_text: string;
  created_at: string;
  updated_at: string;
  // Joined fields
  user_name?: string;
  user_avatar?: string;
}

export interface CreatePostPayload {
  workout_session_id: string;
  caption?: string;
  photo_urls?: string[];
  visibility: ProfileVisibility;
}

export interface CreateCommentPayload {
  post_id: string;
  comment_text: string;
}

export interface CreateReactionPayload {
  post_id: string;
  reaction_type: ReactionType;
}

// ============================================================================
// Weekly Challenges
// ============================================================================

export interface WeeklyChallenge {
  id: string;
  title: string;
  description: string;
  challenge_type: ChallengeType;
  target_value: number;
  target_unit?: string;
  xp_multiplier: number;
  bonus_xp: number;
  start_date: string;
  end_date: string;
  is_active: boolean;
  participants_count: number;
  completions_count: number;
  created_at: string;
}

export interface UserChallengeProgress {
  id: string;
  challenge_id: string;
  user_id: string;
  current_value: number;
  completed: boolean;
  completed_at?: string;
  joined_at: string;
  updated_at: string;
  // Joined fields
  challenge?: WeeklyChallenge;
}

export interface ChallengeWithProgress extends WeeklyChallenge {
  user_progress?: UserChallengeProgress;
  progress_percentage: number;
}

// ============================================================================
// Leaderboards
// ============================================================================

export interface MonthlyLeaderboardStats {
  id: string;
  user_id: string;
  month_year: string;
  workouts_completed: number;
  total_volume_kg: number;
  total_xp_earned: number;
  prs_achieved: number;
  streak_days: number;
  updated_at: string;
  // Joined fields
  user_name?: string;
  user_avatar?: string;
  rank?: number;
}

export interface LeaderboardEntry {
  user_id: string;
  user_name: string;
  user_avatar?: string;
  user_level?: number;
  rank: number;
  value: number;
  is_current_user: boolean;
}

export interface LeaderboardFilters {
  age_group?: AgeGroup;
  experience_level?: ExperienceLevel;
  location?: string;
  friends_only?: boolean;
}

// ============================================================================
// Training Partners
// ============================================================================

export interface TrainingPartnerProfile {
  user_id: string;
  goals?: string[];
  available_days?: string[];
  preferred_time?: PreferredTime;
  bio?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Joined fields
  user_name?: string;
  user_avatar?: string;
  user_level?: number;
  fitness_level?: string;
  location_city?: string;
  match_score?: number;
}

export interface PartnerRequest {
  id: string;
  sender_id: string;
  receiver_id: string;
  message?: string;
  status: PartnerRequestStatus;
  created_at: string;
  responded_at?: string;
  // Joined fields
  sender_name?: string;
  sender_avatar?: string;
  receiver_name?: string;
  receiver_avatar?: string;
}

export interface WorkoutInvite {
  id: string;
  sender_id: string;
  receiver_id: string;
  workout_id: string;
  scheduled_time?: string;
  status: PartnerRequestStatus | 'completed';
  created_at: string;
  // Joined fields
  sender_name?: string;
  workout_name?: string;
}

export interface AccountabilityCheckIn {
  id: string;
  partner_request_id: string;
  user_id: string;
  check_in_date: string;
  completed: boolean;
  notes?: string;
  created_at: string;
}

export interface CreatePartnerProfilePayload {
  goals?: string[];
  available_days?: string[];
  preferred_time?: PreferredTime;
  bio?: string;
}

export interface SendPartnerRequestPayload {
  receiver_id: string;
  message?: string;
}

export interface SendWorkoutInvitePayload {
  receiver_id: string;
  workout_id: string;
  scheduled_time?: string;
}

// ============================================================================
// Community Templates
// ============================================================================

export interface CommunityProgramTemplate {
  id: string;
  creator_id: string;
  program_id: string;
  title: string;
  description?: string;
  category?: string;
  difficulty_level?: DifficultyLevel;
  duration_weeks?: number;
  rating_average: number;
  rating_count: number;
  uses_count: number;
  is_featured: boolean;
  tags?: string[];
  created_at: string;
  updated_at: string;
  // Joined fields
  creator_name?: string;
  creator_avatar?: string;
  user_rating?: number;
}

export interface TemplateRating {
  id: string;
  template_id: string;
  user_id: string;
  rating: number;
  review_text?: string;
  created_at: string;
  updated_at: string;
  // Joined fields
  user_name?: string;
  user_avatar?: string;
}

export interface CreateTemplatePayload {
  program_id: string;
  title: string;
  description?: string;
  category?: string;
  difficulty_level?: DifficultyLevel;
  duration_weeks?: number;
  tags?: string[];
}

export interface CreateRatingPayload {
  template_id: string;
  rating: number;
  review_text?: string;
}

// ============================================================================
// Social Feed
// ============================================================================

export interface FeedItem {
  id: string;
  type: 'workout_post' | 'achievement' | 'pr' | 'challenge_complete' | 'friend_joined';
  user_id: string;
  user_name: string;
  user_avatar?: string;
  user_level?: number;
  content: any; // Type-specific content
  created_at: string;
  likes_count?: number;
  comments_count?: number;
}

// ============================================================================
// Notifications
// ============================================================================

export interface SocialNotification {
  id: string;
  user_id: string;
  type: 'friend_request' | 'friend_accepted' | 'post_like' | 'post_comment' | 'partner_request' | 'workout_invite' | 'challenge_complete';
  title: string;
  message: string;
  link?: string;
  read: boolean;
  created_at: string;
}

// ============================================================================
// API Responses
// ============================================================================

export interface SocialStats {
  friends_count: number;
  posts_count: number;
  total_likes_received: number;
  challenges_completed: number;
  templates_shared: number;
}

export interface FeedResponse {
  items: FeedItem[];
  has_more: boolean;
  next_cursor?: string;
}
