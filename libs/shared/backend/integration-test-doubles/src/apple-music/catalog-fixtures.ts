export interface AppleMusicTrackFixture {
  id: string;
  name: string;
  artistName: string;
  albumName: string;
  durationMs: number;
  artworkUrl: string | null;
}

export interface AppleMusicPlaylistFixture {
  id: string;
  name: string;
  description: string | null;
  artworkUrl: string | null;
  trackIds: string[];
}

export const trackFixtures: AppleMusicTrackFixture[] = [
  {
    id: 'mock-track-001',
    name: 'Morning Meditation Calm',
    artistName: 'Zen Nature Sounds',
    albumName: 'Zen Garden',
    durationMs: 180000,
    artworkUrl: 'https://images.unsplash.com/photo-1518241353330-0f7941c2d9b5?w=300&h=300&fit=crop',
  },
  {
    id: 'mock-track-002',
    name: 'Deep Sleep Ambient Rain',
    artistName: 'Rainstorm Ambient',
    albumName: 'Relaxing Storms',
    durationMs: 300000,
    artworkUrl: 'https://images.unsplash.com/photo-1534274988757-a28bf1a57c17?w=300&h=300&fit=crop',
  },
  {
    id: 'mock-track-003',
    name: 'Relaxing Acoustic Guitar',
    artistName: 'Guitar Chillout',
    albumName: 'Acoustic Sunday',
    durationMs: 240000,
    artworkUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300&h=300&fit=crop',
  },
  {
    id: 'mock-track-004',
    name: 'Lo-Fi Study Beats',
    artistName: 'Coffee Shop Chill',
    albumName: 'Late Night Chill',
    durationMs: 150000,
    artworkUrl: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=300&h=300&fit=crop',
  },
  {
    id: 'mock-track-005',
    name: 'Classical Serenade',
    artistName: 'Symphony Ensemble',
    albumName: 'Baroque Classics',
    durationMs: 320000,
    artworkUrl: 'https://images.unsplash.com/photo-1507838153414-b4b713384a76?w=300&h=300&fit=crop',
  },
  {
    id: 'mock-track-006',
    name: 'Focus Instrumental Piano',
    artistName: 'Keyboard Maestro',
    albumName: 'Focus & Study Piano',
    durationMs: 210000,
    artworkUrl: 'https://images.unsplash.com/photo-1520523839897-bd0b52f945a0?w=300&h=300&fit=crop',
  },
  {
    id: 'mock-track-007',
    name: 'Birdsong Morning Woods',
    artistName: 'Nature Recording Collective',
    albumName: 'Sounds of the Forest',
    durationMs: 270000,
    artworkUrl: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=300&h=300&fit=crop',
  },
];

export const playlistFixtures: AppleMusicPlaylistFixture[] = [
  {
    id: 'mock-playlist-001',
    name: 'Relaxation Essentials',
    description: 'A curated playlist containing relaxing nature sounds and acoustic guitars.',
    artworkUrl: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=300&h=300&fit=crop',
    trackIds: ['mock-track-001', 'mock-track-002', 'mock-track-003', 'mock-track-007'],
  },
  {
    id: 'mock-playlist-002',
    name: 'Study Focus Beats',
    description: 'Instrumental music and low fidelity tracks to help you concentrate.',
    artworkUrl: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=300&h=300&fit=crop',
    trackIds: ['mock-track-004', 'mock-track-006'],
  },
];
