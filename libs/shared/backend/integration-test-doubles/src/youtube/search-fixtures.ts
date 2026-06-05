/**
 * Canned YouTube video search fixtures.
 *
 * Each fixture represents a single video result with realistic metadata.
 * The fixture set spans diverse content categories to support query-aware
 * filtering in tests.
 */

export interface VideoFixture {
  videoId: string;
  title: string;
  channelTitle: string;
  channelId: string;
  description: string;
  publishedAt: string; // ISO 8601
  thumbnailIndex: number; // Maps to thumbnail-XX.jpg
  duration: string; // ISO 8601 duration (e.g., "PT20M15S")
  viewCount: string;
  tags: string[];
}

export const videoFixtures: VideoFixture[] = [
  {
    videoId: 'test-vid-001',
    title: 'Morning Yoga Flow - 20 Minutes',
    channelTitle: 'Wellness Daily',
    channelId: 'UC-wellness-daily-001',
    description:
      'Start your day with this gentle 20-minute yoga flow for all levels.',
    publishedAt: '2024-03-15T10:00:00Z',
    thumbnailIndex: 1,
    duration: 'PT20M15S',
    viewCount: '1250000',
    tags: ['yoga', 'morning', 'wellness', 'fitness', 'stretching'],
  },
  {
    videoId: 'test-vid-002',
    title: 'How to Make Classic Italian Pasta carbonara',
    channelTitle: 'Chef Roberto',
    channelId: 'UC-chef-roberto-002',
    description:
      'Learn the secrets to authentic, creamy Roman carbonara without cream!',
    publishedAt: '2024-03-14T17:30:00Z',
    thumbnailIndex: 2,
    duration: 'PT12M45S',
    viewCount: '450000',
    tags: ['cooking', 'pasta', 'carbonara', 'italian', 'recipe'],
  },
  {
    videoId: 'test-vid-003',
    title: 'TypeScript in 100 Seconds',
    channelTitle: 'Code Academy',
    channelId: 'UC-code-academy-003',
    description:
      'A quick overview of TypeScript features and type safety benefits.',
    publishedAt: '2024-03-13T12:00:00Z',
    thumbnailIndex: 3,
    duration: 'PT1M40S',
    viewCount: '890000',
    tags: ['programming', 'typescript', 'javascript', 'coding', 'tutorial'],
  },
  {
    videoId: 'test-vid-004',
    title: 'Solo Travel Guide: 5 Days in Tokyo',
    channelTitle: 'Wanderlust Journal',
    channelId: 'UC-wanderlust-journal-004',
    description:
      'Discover the best sights, food, and neighborhoods in Tokyo as a solo traveler.',
    publishedAt: '2024-03-12T08:15:00Z',
    thumbnailIndex: 4,
    duration: 'PT25M10S',
    viewCount: '620000',
    tags: ['travel', 'tokyo', 'japan', 'guide', 'solo'],
  },
  {
    videoId: 'test-vid-005',
    title: 'Acoustic Guitar Cover of Popular Hits 2024',
    channelTitle: 'Acoustic Sessions',
    channelId: 'UC-acoustic-sessions-005',
    description:
      'Relaxing instrumental acoustic guitar covers for studying or working.',
    publishedAt: '2024-03-11T20:00:00Z',
    thumbnailIndex: 5,
    duration: 'PT45M00S',
    viewCount: '340000',
    tags: ['music', 'guitar', 'acoustic', 'covers', 'relax'],
  },
  {
    videoId: 'test-vid-006',
    title: 'What Happens Inside a Black Hole?',
    channelTitle: 'Curiosity Lab',
    channelId: 'UC-curiosity-lab-006',
    description: 'Exploring the science of event horizons and singularity.',
    publishedAt: '2024-03-10T14:00:00Z',
    thumbnailIndex: 6,
    duration: 'PT15M30S',
    viewCount: '2100000',
    tags: ['science', 'space', 'blackhole', 'physics', 'astronomy'],
  },
  {
    videoId: 'test-vid-007',
    title: 'Elden Ring Speedrun World Record Attempt',
    channelTitle: 'Pixel Adventures',
    channelId: 'UC-pixel-adventures-007',
    description: 'Running through the Lands Between to beat the clock.',
    publishedAt: '2024-03-09T19:45:00Z',
    thumbnailIndex: 7,
    duration: 'PT58M20S',
    viewCount: '150000',
    tags: ['gaming', 'elden-ring', 'speedrun', 'streamer', 'rpg'],
  },
  {
    videoId: 'test-vid-008',
    title: 'Linear Algebra: Matrices Made Intuitive',
    channelTitle: 'Learn Math Easily',
    channelId: 'UC-learn-math-easily-008',
    description:
      'Visualizing matrix transformations, eigenvectors, and eigenvalues.',
    publishedAt: '2024-03-08T11:00:00Z',
    thumbnailIndex: 8,
    duration: 'PT30M15S',
    viewCount: '980000',
    tags: ['education', 'math', 'algebra', 'matrices', 'visual'],
  },
  {
    videoId: 'test-vid-009',
    title: 'The Great Migration: Serengeti Wild Life',
    channelTitle: 'Earth Documentaries',
    channelId: 'UC-earth-docs-009',
    description:
      'Witnessing millions of wildebeests cross the Mara River in Africa.',
    publishedAt: '2024-03-07T06:00:00Z',
    thumbnailIndex: 9,
    duration: 'PT48M50S',
    viewCount: '3200000',
    tags: ['nature', 'wildlife', 'serengeti', 'documentary', 'africa'],
  },
  {
    videoId: 'test-vid-010',
    title: 'Landscape Photography: Mastering the Golden Hour',
    channelTitle: 'Shutter Mastery',
    channelId: 'UC-shutter-mastery-010',
    description:
      'Tips and tricks for capturing perfect lighting in outdoor landscape shots.',
    publishedAt: '2024-03-06T15:40:00Z',
    thumbnailIndex: 10,
    duration: 'PT18M12S',
    viewCount: '280000',
    tags: ['photography', 'landscape', 'camera', 'golden-hour', 'tutorial'],
  },
  {
    videoId: 'test-vid-011',
    title: 'Design System Architecture: Figma to Code',
    channelTitle: 'Creative UI/UX',
    channelId: 'UC-creative-uiux-011',
    description:
      'How to structure design tokens and components for seamless engineering hands.',
    publishedAt: '2024-03-05T09:30:00Z',
    thumbnailIndex: 11,
    duration: 'PT22M05S',
    viewCount: '410000',
    tags: ['design', 'ui', 'ux', 'figma', 'architecture'],
  },
  {
    videoId: 'test-vid-012',
    title: 'How We Built a $10M SaaS: Startup Lessons',
    channelTitle: 'Startup Grind',
    channelId: 'UC-startup-grind-012',
    description:
      'An honest breakdown of product-market fit, pricing, and scaling strategies.',
    publishedAt: '2024-03-04T13:10:00Z',
    thumbnailIndex: 12,
    duration: 'PT16M55S',
    viewCount: '540000',
    tags: ['business', 'saas', 'startup', 'scaling', 'lessons'],
  },
  {
    videoId: 'test-vid-013',
    title: 'Learn French: 100 Common Phrases for Beginners',
    channelTitle: 'Speak French Fluently',
    channelId: 'UC-speak-french-013',
    description:
      'Essential French phrases for travel, greeting, and simple daily conversation.',
    publishedAt: '2024-03-03T07:00:00Z',
    thumbnailIndex: 13,
    duration: 'PT14M20S',
    viewCount: '730000',
    tags: ['language-learning', 'french', 'phrases', 'beginners', 'vocabulary'],
  },
  {
    videoId: 'test-vid-014',
    title: 'DIY Oak Coffee Table: Woodworking Guide',
    channelTitle: 'Home Woodworking',
    channelId: 'UC-home-woodworking-014',
    description:
      'Building a modern coffee table from scratch using white oak and mortise joinery.',
    publishedAt: '2024-03-02T16:20:00Z',
    thumbnailIndex: 14,
    duration: 'PT28M45S',
    viewCount: '190000',
    tags: ['diy', 'woodworking', 'table', 'furniture', 'maker'],
  },
  {
    videoId: 'test-vid-015',
    title: '15-Minute Mindfulness Meditation for Anxiety',
    channelTitle: 'Calm Minds',
    channelId: 'UC-calm-minds-015',
    description:
      'A guided meditation to reduce stress, calm the nervous system, and return to center.',
    publishedAt: '2024-03-01T21:00:00Z',
    thumbnailIndex: 15,
    duration: 'PT15M00S',
    viewCount: '1500000',
    tags: ['meditation', 'mindfulness', 'calm', 'anxiety', 'mentalhealth'],
  },
  {
    videoId: 'test-vid-016',
    title: 'HIIT Workout: Full Body Fat Burner',
    channelTitle: 'Active Training',
    channelId: 'UC-active-training-016',
    description:
      'High intensity interval training routine. No equipment needed.',
    publishedAt: '2024-02-28T09:00:00Z',
    thumbnailIndex: 16,
    duration: 'PT30M00S',
    viewCount: '2500000',
    tags: ['sports', 'hiit', 'workout', 'cardio', 'fitness'],
  },
  {
    videoId: 'test-vid-017',
    title: 'iPhone 16 Pro Max: Honest Review After 6 Months',
    channelTitle: 'Gadget Sphere',
    channelId: 'UC-gadget-sphere-017',
    description:
      'Is it still worth buying? Camera, battery life, and durability analysis.',
    publishedAt: '2024-02-27T14:30:00Z',
    thumbnailIndex: 17,
    duration: 'PT13M40S',
    viewCount: '870000',
    tags: ['tech-reviews', 'iphone', 'apple', 'smartphone', 'gadgets'],
  },
  {
    videoId: 'test-vid-018',
    title: 'The Rise and Fall of the Roman Empire',
    channelTitle: 'Chronicles of Old',
    channelId: 'UC-chronicles-old-018',
    description:
      'Understanding the political and social dynamics that shaped European history.',
    publishedAt: '2024-02-26T10:00:00Z',
    thumbnailIndex: 18,
    duration: 'PT52M15S',
    viewCount: '1850000',
    tags: ['history', 'rome', 'roman-empire', 'documentary', 'history-lessons'],
  },
  {
    videoId: 'test-vid-019',
    title: 'When Programmers Try to Socialize (Sketch)',
    channelTitle: 'Laughter Zone',
    channelId: 'UC-laughter-zone-019',
    description:
      'A funny comedy sketch about introverted developers attending a house party.',
    publishedAt: '2024-02-25T18:00:00Z',
    thumbnailIndex: 19,
    duration: 'PT4M15S',
    viewCount: '950000',
    tags: ['comedy', 'programming', 'developer-humor', 'skit', 'funny'],
  },
  {
    videoId: 'test-vid-020',
    title: 'Behind the Scenes: Hand-Drawn Animation Loop',
    channelTitle: 'Cartoon Studio',
    channelId: 'UC-cartoon-studio-020',
    description:
      'Timelapse of a 24-frame classical animation walk cycle on light box.',
    publishedAt: '2024-02-24T12:00:00Z',
    thumbnailIndex: 20,
    duration: 'PT8M50S',
    viewCount: '320000',
    tags: ['animation', 'cartoon', 'art', 'timelapse', 'drawing'],
  },
];

/**
 * Search fixtures using query-aware filtering.
 *
 * Matches `q` against title, description, and tags (case-insensitive).
 * If no matches found, returns a general fallback subset.
 * Never returns empty unless the fixture set itself is empty.
 */
export function searchFixtures(
  query: string,
  maxResults = 10,
  fixtures: VideoFixture[] = videoFixtures
): VideoFixture[] {
  const clampedMax = Math.min(Math.max(maxResults, 1), 50);

  if (fixtures.length === 0) {
    return [];
  }

  if (!query || query.trim() === '') {
    return fixtures.slice(0, clampedMax);
  }

  const q = query.toLowerCase().trim();
  const matches = fixtures.filter(
    (v) =>
      v.title.toLowerCase().includes(q) ||
      v.tags.some((t) => t.toLowerCase().includes(q)) ||
      v.description.toLowerCase().includes(q)
  );

  if (matches.length === 0) {
    // Fallback: return general subset so tests don't get unexpected empty results
    return fixtures.slice(0, clampedMax);
  }

  return matches.slice(0, clampedMax);
}
