export interface AppleMusicTrackFixture {
  id: string;
  name: string;
  artistName: string;
  albumName: string;
  durationMs: number;
  artworkFile: string | null;
  audioFile: string;
}

export interface AppleMusicPlaylistFixture {
  id: string;
  name: string;
  description: string | null;
  artworkFile: string | null;
  trackIds: string[];
}

// All fixtures reference the ~15 second clips shipped under ./audio. Keep
// durationMs in sync with those clips so catalog metadata matches playback.
const TRACK_DURATION_MS = 15000;

export const trackFixtures: AppleMusicTrackFixture[] = [
  {
    id: 'mock-track-001',
    name: 'Morning Meditation Calm',
    artistName: 'Zen Nature Sounds',
    albumName: 'Zen Garden',
    durationMs: TRACK_DURATION_MS,
    artworkFile: 'track-001.svg',
    audioFile: 'mock-1.mp3',
  },
  {
    id: 'mock-track-002',
    name: 'Deep Sleep Ambient Rain',
    artistName: 'Rainstorm Ambient',
    albumName: 'Relaxing Storms',
    durationMs: TRACK_DURATION_MS,
    artworkFile: 'track-002.svg',
    audioFile: 'mock-2.mp3',
  },
  {
    id: 'mock-track-003',
    name: 'Relaxing Acoustic Guitar',
    artistName: 'Guitar Chillout',
    albumName: 'Acoustic Sunday',
    durationMs: TRACK_DURATION_MS,
    artworkFile: 'track-003.svg',
    audioFile: 'mock-3.mp3',
  },
  {
    id: 'mock-track-004',
    name: 'Lo-Fi Study Beats',
    artistName: 'Coffee Shop Chill',
    albumName: 'Late Night Chill',
    durationMs: TRACK_DURATION_MS,
    artworkFile: 'track-004.svg',
    audioFile: 'mock-1.mp3',
  },
  {
    id: 'mock-track-005',
    name: 'Classical Serenade',
    artistName: 'Symphony Ensemble',
    albumName: 'Baroque Classics',
    durationMs: TRACK_DURATION_MS,
    artworkFile: 'track-005.svg',
    audioFile: 'mock-2.mp3',
  },
  {
    id: 'mock-track-006',
    name: 'Focus Instrumental Piano',
    artistName: 'Keyboard Maestro',
    albumName: 'Focus & Study Piano',
    durationMs: TRACK_DURATION_MS,
    artworkFile: 'track-006.svg',
    audioFile: 'mock-3.mp3',
  },
  {
    id: 'mock-track-007',
    name: 'Birdsong Morning Woods',
    artistName: 'Nature Recording Collective',
    albumName: 'Sounds of the Forest',
    durationMs: TRACK_DURATION_MS,
    artworkFile: 'track-007.svg',
    audioFile: 'mock-1.mp3',
  },
];

export const playlistFixtures: AppleMusicPlaylistFixture[] = [
  {
    id: 'mock-playlist-001',
    name: 'Relaxation Essentials',
    description:
      'A curated playlist containing relaxing nature sounds and acoustic guitars.',
    artworkFile: 'playlist-001.svg',
    trackIds: [
      'mock-track-001',
      'mock-track-002',
      'mock-track-003',
      'mock-track-007',
    ],
  },
  {
    id: 'mock-playlist-002',
    name: 'Study Focus Beats',
    description:
      'Instrumental music and low fidelity tracks to help you concentrate.',
    artworkFile: 'playlist-002.svg',
    trackIds: ['mock-track-004', 'mock-track-006'],
  },
];
