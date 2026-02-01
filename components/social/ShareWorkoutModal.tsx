'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { CreatePostPayload, ProfileVisibility } from '@/lib/types/social';

interface ShareWorkoutModalProps {
  workoutSessionId: string;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function ShareWorkoutModal({
  workoutSessionId,
  onClose,
  onSuccess,
}: ShareWorkoutModalProps) {
  const [caption, setCaption] = useState('');
  const [visibility, setVisibility] = useState<ProfileVisibility>('friends');
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [sharing, setSharing] = useState(false);

  const handleShare = async () => {
    setSharing(true);
    try {
      const payload: CreatePostPayload = {
        workout_session_id: workoutSessionId,
        caption: caption.trim() || undefined,
        photo_urls: photoUrls.length > 0 ? photoUrls : undefined,
        visibility,
      };

      const response = await fetch('/api/social/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        alert('Workout shared successfully!');
        onSuccess?.();
        onClose();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to share workout');
      }
    } catch (error) {
      console.error('Error sharing workout:', error);
      alert('Failed to share workout');
    } finally {
      setSharing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 max-w-lg w-full">
        <h2 className="text-2xl font-bold mb-4">Share Your Workout</h2>

        <div className="space-y-4">
          <div>
            <Label htmlFor="caption">Caption (Optional)</Label>
            <textarea
              id="caption"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
              rows={3}
              placeholder="How did it go? Share your thoughts..."
            />
          </div>

          <div>
            <Label htmlFor="visibility">Who can see this?</Label>
            <select
              id="visibility"
              value={visibility}
              onChange={(e) => setVisibility(e.target.value as ProfileVisibility)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
            >
              <option value="private">Private - Only me</option>
              <option value="friends">Friends - Only my friends</option>
              <option value="public">Public - Everyone</option>
            </select>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded p-3 text-sm text-blue-800">
            💡 Tip: Sharing your workouts helps keep you accountable and can inspire your friends!
          </div>

          <div className="flex space-x-3 pt-4">
            <Button
              onClick={handleShare}
              disabled={sharing}
              className="flex-1"
            >
              {sharing ? 'Sharing...' : 'Share Workout'}
            </Button>
            <Button
              variant="outline"
              onClick={onClose}
              disabled={sharing}
            >
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
