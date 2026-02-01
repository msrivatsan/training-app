'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FriendProfile, FriendRequest } from '@/lib/types/social';

export default function FriendsManager() {
  const [friends, setFriends] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<FriendProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'friends' | 'requests' | 'search'>('friends');

  useEffect(() => {
    fetchFriends();
    fetchRequests();
  }, []);

  const fetchFriends = async () => {
    try {
      const response = await fetch('/api/social/friends?status=accepted');
      const data = await response.json();
      setFriends(data);
    } catch (error) {
      console.error('Error fetching friends:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRequests = async () => {
    try {
      const response = await fetch('/api/social/friends?status=pending');
      const data = await response.json();
      setRequests(data);
    } catch (error) {
      console.error('Error fetching requests:', error);
    }
  };

  const handleSearch = async () => {
    if (searchQuery.length < 2) return;

    try {
      const response = await fetch(`/api/social/friends/search?q=${encodeURIComponent(searchQuery)}`);
      const data = await response.json();
      setSearchResults(data);
    } catch (error) {
      console.error('Error searching users:', error);
    }
  };

  const handleSendRequest = async (friendId: string) => {
    try {
      const response = await fetch('/api/social/friends', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ friend_id: friendId }),
      });

      if (response.ok) {
        alert('Friend request sent!');
        setSearchResults(searchResults.map(u =>
          u.id === friendId ? { ...u, friendship_status: 'pending' } : u
        ));
      }
    } catch (error) {
      console.error('Error sending friend request:', error);
    }
  };

  const handleAcceptRequest = async (requestId: string) => {
    try {
      const response = await fetch(`/api/social/friends/${requestId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'accepted' }),
      });

      if (response.ok) {
        alert('Friend request accepted!');
        fetchFriends();
        fetchRequests();
      }
    } catch (error) {
      console.error('Error accepting request:', error);
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    try {
      await fetch(`/api/social/friends/${requestId}`, {
        method: 'DELETE',
      });
      fetchRequests();
    } catch (error) {
      console.error('Error rejecting request:', error);
    }
  };

  const handleRemoveFriend = async (friendshipId: string) => {
    if (!confirm('Remove this friend?')) return;

    try {
      await fetch(`/api/social/friends/${friendshipId}`, {
        method: 'DELETE',
      });
      fetchFriends();
    } catch (error) {
      console.error('Error removing friend:', error);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex space-x-2 border-b">
        <button
          onClick={() => setActiveTab('friends')}
          className={`px-4 py-2 ${activeTab === 'friends' ? 'border-b-2 border-blue-500 font-semibold' : ''}`}
        >
          Friends ({friends.length})
        </button>
        <button
          onClick={() => setActiveTab('requests')}
          className={`px-4 py-2 ${activeTab === 'requests' ? 'border-b-2 border-blue-500 font-semibold' : ''}`}
        >
          Requests ({requests.length})
        </button>
        <button
          onClick={() => setActiveTab('search')}
          className={`px-4 py-2 ${activeTab === 'search' ? 'border-b-2 border-blue-500 font-semibold' : ''}`}
        >
          Add Friends
        </button>
      </div>

      {activeTab === 'friends' && (
        <div className="space-y-3">
          {friends.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No friends yet. Start by adding some!</p>
          ) : (
            friends.map((friendship) => {
              const friend = friendship.friend_profile;
              return (
                <div key={friendship.id} className="flex items-center justify-between p-4 bg-white rounded-lg shadow">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
                      {friend.avatar ? (
                        <img src={friend.avatar} alt={friend.name} className="w-12 h-12 rounded-full" />
                      ) : (
                        <span className="text-xl">{friend.name?.[0]}</span>
                      )}
                    </div>
                    <div>
                      <p className="font-semibold">{friend.name}</p>
                      <p className="text-sm text-gray-600">{friend.fitness_level || 'Lifter'}</p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRemoveFriend(friendship.id)}
                  >
                    Remove
                  </Button>
                </div>
              );
            })
          )}
        </div>
      )}

      {activeTab === 'requests' && (
        <div className="space-y-3">
          {requests.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No pending requests</p>
          ) : (
            requests.map((request) => (
              <div key={request.id} className="flex items-center justify-between p-4 bg-white rounded-lg shadow">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
                    <span className="text-xl">{request.user?.name?.[0]}</span>
                  </div>
                  <div>
                    <p className="font-semibold">{request.user?.name}</p>
                    <p className="text-sm text-gray-600">
                      {new Date(request.requested_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="space-x-2">
                  <Button size="sm" onClick={() => handleAcceptRequest(request.id)}>
                    Accept
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleRejectRequest(request.id)}>
                    Decline
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'search' && (
        <div className="space-y-4">
          <div className="flex space-x-2">
            <Input
              placeholder="Search by username..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            <Button onClick={handleSearch}>Search</Button>
          </div>

          <div className="space-y-3">
            {searchResults.map((user) => (
              <div key={user.id} className="flex items-center justify-between p-4 bg-white rounded-lg shadow">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
                    {user.avatar ? (
                      <img src={user.avatar} alt={user.name} className="w-12 h-12 rounded-full" />
                    ) : (
                      <span className="text-xl">{user.name[0]}</span>
                    )}
                  </div>
                  <div>
                    <p className="font-semibold">{user.name}</p>
                    <p className="text-sm text-gray-600">{user.fitness_level || 'Lifter'}</p>
                  </div>
                </div>
                {user.friendship_status === 'accepted' ? (
                  <span className="text-green-600 font-medium">Friends</span>
                ) : user.friendship_status === 'pending' ? (
                  <span className="text-yellow-600 font-medium">Pending</span>
                ) : (
                  <Button size="sm" onClick={() => handleSendRequest(user.id)}>
                    Add Friend
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
