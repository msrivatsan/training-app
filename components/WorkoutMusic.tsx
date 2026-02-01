/**
 * WorkoutMusic Component
 *
 * Integrates with Spotify/Apple Music playlists
 * Provides quick access to workout playlists and track controls
 */

'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Music, Play, SkipForward, Volume2, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';

interface Playlist {
  id: string;
  name: string;
  platform: 'spotify' | 'apple-music';
  url: string;
  icon: string;
}

const BEAST_MODE_PLAYLISTS: Playlist[] = [
  {
    id: '1',
    name: 'Beast Mode 🔥',
    platform: 'spotify',
    url: 'https://open.spotify.com/playlist/37i9dQZF1DX76Wlfdnj7AP',
    icon: '🎧',
  },
  {
    id: '2',
    name: 'Power Workout',
    platform: 'spotify',
    url: 'https://open.spotify.com/playlist/37i9dQZF1DX70RN3TfWWJh',
    icon: '💪',
  },
  {
    id: '3',
    name: 'Heavy Metal Workout',
    platform: 'spotify',
    url: 'https://open.spotify.com/playlist/37i9dQZF1DX9qNs32fujYe',
    icon: '🤘',
  },
  {
    id: '4',
    name: 'Hip Hop Workout',
    platform: 'spotify',
    url: 'https://open.spotify.com/playlist/37i9dQZF1DX0pH2SQMRXnC',
    icon: '🎤',
  },
  {
    id: '5',
    name: 'Electronic Workout',
    platform: 'spotify',
    url: 'https://open.spotify.com/playlist/37i9dQZF1DX4dyzvuaRJ0n',
    icon: '⚡',
  },
];

interface WorkoutMusicProps {
  isOpen?: boolean;
  onToggle?: (open: boolean) => void;
}

export default function WorkoutMusic({ isOpen = false, onToggle }: WorkoutMusicProps) {
  const [expanded, setExpanded] = useState(isOpen);
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const handleToggle = () => {
    const newExpanded = !expanded;
    setExpanded(newExpanded);
    onToggle?.(newExpanded);
  };

  const handlePlaylistSelect = (playlist: Playlist) => {
    setSelectedPlaylist(playlist);
    // Open playlist in new tab
    window.open(playlist.url, '_blank');
  };

  const handleSkipTrack = () => {
    // This is a placeholder - actual implementation would require Spotify Web API integration
    if ('vibrate' in navigator) {
      navigator.vibrate(50);
    }
    console.log('Skip track requested - requires Spotify API integration');
  };

  return (
    <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl shadow-md border-2 border-purple-200 overflow-hidden">
      {/* Header - Always visible */}
      <button
        onClick={handleToggle}
        className="w-full px-5 py-4 flex items-center justify-between hover:bg-purple-100/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg">
            <Music className="w-6 h-6 text-white" />
          </div>
          <div className="text-left">
            <h3 className="font-bold text-gray-900">Workout Music</h3>
            <p className="text-sm text-gray-600">
              {selectedPlaylist ? `Playing: ${selectedPlaylist.name}` : 'Choose your pump-up playlist'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {selectedPlaylist && isPlaying && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="flex gap-1"
            >
              <div className="w-1 h-4 bg-purple-600 rounded-full animate-pulse" />
              <div className="w-1 h-4 bg-purple-600 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
              <div className="w-1 h-4 bg-purple-600 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
            </motion.div>
          )}
          {expanded ? (
            <ChevronUp className="w-5 h-5 text-gray-600" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-600" />
          )}
        </div>
      </button>

      {/* Expandable Content */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="border-t border-purple-200"
          >
            <div className="p-5 space-y-4">
              {/* Quick Skip Button (if music is selected) */}
              {selectedPlaylist && (
                <motion.div
                  initial={{ y: -10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  className="bg-white rounded-lg p-4 border-2 border-purple-300"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-purple-100 rounded-full">
                        <Volume2 className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{selectedPlaylist.name}</p>
                        <p className="text-xs text-gray-600">
                          {selectedPlaylist.platform === 'spotify' ? 'Spotify' : 'Apple Music'}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={handleSkipTrack}
                      className="p-3 bg-purple-600 hover:bg-purple-700 text-white rounded-full transition-all hover:scale-105"
                      title="Skip Track"
                    >
                      <SkipForward className="w-5 h-5" />
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Playlist Suggestions */}
              <div>
                <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <span>🔥</span>
                  Beast Mode Playlists
                </h4>
                <div className="space-y-2">
                  {BEAST_MODE_PLAYLISTS.map((playlist, idx) => (
                    <motion.button
                      key={playlist.id}
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: idx * 0.1 }}
                      onClick={() => handlePlaylistSelect(playlist)}
                      className={`w-full flex items-center justify-between p-3 rounded-lg transition-all hover:scale-102 ${
                        selectedPlaylist?.id === playlist.id
                          ? 'bg-purple-600 text-white shadow-lg'
                          : 'bg-white hover:bg-purple-50 border-2 border-gray-200 hover:border-purple-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{playlist.icon}</span>
                        <div className="text-left">
                          <p
                            className={`font-semibold ${
                              selectedPlaylist?.id === playlist.id ? 'text-white' : 'text-gray-900'
                            }`}
                          >
                            {playlist.name}
                          </p>
                          <p
                            className={`text-xs ${
                              selectedPlaylist?.id === playlist.id ? 'text-purple-200' : 'text-gray-600'
                            }`}
                          >
                            {playlist.platform === 'spotify' ? 'Spotify Playlist' : 'Apple Music'}
                          </p>
                        </div>
                      </div>
                      <ExternalLink
                        className={`w-5 h-5 ${
                          selectedPlaylist?.id === playlist.id ? 'text-white' : 'text-gray-400'
                        }`}
                      />
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Integration Notice */}
              <div className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-lg p-4 border border-purple-300">
                <p className="text-sm text-gray-700 mb-2">
                  <strong>🎵 Music Controls</strong>
                </p>
                <p className="text-xs text-gray-600 leading-relaxed">
                  Click any playlist to open it in Spotify or Apple Music. For full playback control (skip,
                  pause, volume), keep the music app open in another tab or use your device's media controls.
                </p>
              </div>

              {/* Add Custom Playlist */}
              <div className="pt-2 border-t border-purple-200">
                <p className="text-xs text-center text-gray-600">
                  💡 Tip: Create your own playlist on Spotify and paste the link in your workout notes!
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
