'use client';

import { useState, useEffect } from 'react';
import { LeaderboardEntry } from '@/lib/types/social';

export default function Leaderboard() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [type, setType] = useState<'workouts' | 'volume' | 'xp' | 'strength'>('workouts');
  const [scope, setScope] = useState<'global' | 'friends'>('friends');

  useEffect(() => {
    fetchLeaderboard();
  }, [type, scope]);

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/social/leaderboards?type=${type}&scope=${scope}`);
      const data = await response.json();
      setEntries(data);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRankBadge = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  const formatValue = (value: number) => {
    if (type === 'volume') return `${value.toFixed(0)}kg`;
    if (type === 'strength') return value.toFixed(0);
    return value.toString();
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold mb-2">Leaderboards</h2>
        <p className="text-gray-600">
          See how you stack up against other lifters!
        </p>
      </div>

      <div className="flex space-x-2">
        <select
          value={type}
          onChange={(e) => setType(e.target.value as any)}
          className="px-4 py-2 border rounded-lg"
        >
          <option value="workouts">Most Consistent</option>
          <option value="volume">Total Volume</option>
          <option value="xp">Total XP</option>
          <option value="strength">Strength Score</option>
        </select>
        <select
          value={scope}
          onChange={(e) => setScope(e.target.value as any)}
          className="px-4 py-2 border rounded-lg"
        >
          <option value="friends">Friends</option>
          <option value="global">Global</option>
        </select>
      </div>

      {loading ? (
        <div className="text-center py-8">Loading leaderboard...</div>
      ) : entries.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          {scope === 'friends'
            ? 'No friends on the leaderboard yet. Add friends who have opted in!'
            : 'No entries yet. Be the first to opt in!'}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold">Rank</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Lifter</th>
                <th className="px-4 py-3 text-right text-sm font-semibold">
                  {type === 'workouts' ? 'Workouts' :
                   type === 'volume' ? 'Volume' :
                   type === 'xp' ? 'XP' : 'Score'}
                </th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr
                  key={entry.user_id}
                  className={`border-t ${entry.is_current_user ? 'bg-blue-50 font-semibold' : ''}`}
                >
                  <td className="px-4 py-3">
                    <span className="text-lg">{getRankBadge(entry.rank)}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                        {entry.user_avatar ? (
                          <img src={entry.user_avatar} alt={entry.user_name} className="w-8 h-8 rounded-full" />
                        ) : (
                          <span className="text-sm">{entry.user_name[0]}</span>
                        )}
                      </div>
                      <span>{entry.user_name}</span>
                      {entry.is_current_user && (
                        <span className="text-xs text-blue-600">(You)</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right font-semibold">
                    {formatValue(entry.value)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
