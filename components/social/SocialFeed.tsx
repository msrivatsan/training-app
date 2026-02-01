'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { WorkoutPost, PostComment, ReactionType } from '@/lib/types/social';

export default function SocialFeed() {
  const [posts, setPosts] = useState<WorkoutPost[]>([]);
  const [filter, setFilter] = useState<'all' | 'friends' | 'own'>('friends');
  const [loading, setLoading] = useState(true);
  const [commentTexts, setCommentTexts] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchPosts();
  }, [filter]);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/social/posts?filter=${filter}&limit=20`);
      const data = await response.json();
      setPosts(data);
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReaction = async (postId: string, reactionType: ReactionType = 'like') => {
    try {
      const post = posts.find(p => p.id === postId);
      if (post?.has_user_reacted) {
        // Remove reaction
        await fetch(`/api/social/posts/${postId}/reactions`, {
          method: 'DELETE',
        });
        setPosts(posts.map(p =>
          p.id === postId
            ? { ...p, has_user_reacted: false, likes_count: p.likes_count - 1 }
            : p
        ));
      } else {
        // Add reaction
        await fetch(`/api/social/posts/${postId}/reactions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reaction_type: reactionType }),
        });
        setPosts(posts.map(p =>
          p.id === postId
            ? { ...p, has_user_reacted: true, likes_count: p.likes_count + 1, user_reaction_type: reactionType }
            : p
        ));
      }
    } catch (error) {
      console.error('Error toggling reaction:', error);
    }
  };

  const handleComment = async (postId: string) => {
    const commentText = commentTexts[postId]?.trim();
    if (!commentText) return;

    try {
      await fetch(`/api/social/posts/${postId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comment_text: commentText }),
      });

      // Update comments count
      setPosts(posts.map(p =>
        p.id === postId ? { ...p, comments_count: p.comments_count + 1 } : p
      ));
      setCommentTexts({ ...commentTexts, [postId]: '' });
    } catch (error) {
      console.error('Error posting comment:', error);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  return (
    <div className="space-y-4">
      <div className="flex space-x-2 border-b pb-2">
        <button
          onClick={() => setFilter('friends')}
          className={`px-4 py-2 rounded ${filter === 'friends' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
        >
          Friends
        </button>
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded ${filter === 'all' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
        >
          Public
        </button>
        <button
          onClick={() => setFilter('own')}
          className={`px-4 py-2 rounded ${filter === 'own' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
        >
          My Posts
        </button>
      </div>

      {loading ? (
        <div className="text-center py-8">Loading feed...</div>
      ) : posts.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          {filter === 'friends' ? 'No posts from friends yet. Add some friends to see their workouts!' : 'No posts available'}
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <div key={post.id} className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                  {post.user_avatar ? (
                    <img src={post.user_avatar} alt={post.user_name} className="w-10 h-10 rounded-full" />
                  ) : (
                    <span className="text-lg">{post.user_name?.[0]}</span>
                  )}
                </div>
                <div>
                  <p className="font-semibold">{post.user_name}</p>
                  <p className="text-xs text-gray-500">{formatTimeAgo(post.created_at)}</p>
                </div>
              </div>

              {post.caption && (
                <p className="mb-3">{post.caption}</p>
              )}

              {post.photo_urls && post.photo_urls.length > 0 && (
                <div className="mb-3 grid grid-cols-2 gap-2">
                  {post.photo_urls.map((url, idx) => (
                    <img key={idx} src={url} alt="Workout" className="rounded-lg w-full" />
                  ))}
                </div>
              )}

              <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
                {post.session_volume && (
                  <span>💪 {post.session_volume.toFixed(0)}kg total volume</span>
                )}
                {post.session_duration && (
                  <span>⏱️ {post.session_duration} mins</span>
                )}
              </div>

              <div className="flex items-center space-x-4 border-t pt-3">
                <button
                  onClick={() => handleReaction(post.id)}
                  className={`flex items-center space-x-1 ${post.has_user_reacted ? 'text-red-500' : 'text-gray-600'}`}
                >
                  <span>{post.has_user_reacted ? '❤️' : '🤍'}</span>
                  <span>{post.likes_count}</span>
                </button>
                <button className="flex items-center space-x-1 text-gray-600">
                  <span>💬</span>
                  <span>{post.comments_count}</span>
                </button>
              </div>

              <div className="mt-3 flex space-x-2">
                <input
                  type="text"
                  placeholder="Add a comment..."
                  value={commentTexts[post.id] || ''}
                  onChange={(e) => setCommentTexts({ ...commentTexts, [post.id]: e.target.value })}
                  onKeyDown={(e) => e.key === 'Enter' && handleComment(post.id)}
                  className="flex-1 px-3 py-2 border rounded-lg text-sm"
                />
                <Button size="sm" onClick={() => handleComment(post.id)}>
                  Post
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
