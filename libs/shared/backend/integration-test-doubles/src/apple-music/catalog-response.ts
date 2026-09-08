import {
  AppleMusicTrackFixture,
  AppleMusicPlaylistFixture,
} from './catalog-fixtures.js';

function formatArtwork(
  artworkFile: string | null,
  baseUrl?: string
): { url: string; width: number; height: number } | null {
  if (!artworkFile || !baseUrl) return null;
  // Real MusicKit artwork URLs carry {w}/{h} placeholders that clients
  // substitute with the size they need — keep that shape so consumers (and
  // the demo UI's .replace('{w}', ...) calls) exercise the real contract.
  return {
    url: `${baseUrl}/v1/artwork/{w}x{h}/${artworkFile}`,
    width: 300,
    height: 300,
  };
}

export function formatTrackResource(
  track: AppleMusicTrackFixture,
  baseUrl?: string
) {
  return {
    id: track.id,
    type: 'songs',
    attributes: {
      name: track.name,
      artistName: track.artistName,
      albumName: track.albumName,
      durationInMillis: track.durationMs,
      audioUrl: baseUrl ? `${baseUrl}/v1/audio/${track.audioFile}` : null,
      artwork: formatArtwork(track.artworkFile, baseUrl),
    },
  };
}

export function formatPlaylistResource(
  playlist: AppleMusicPlaylistFixture,
  allTracks: AppleMusicTrackFixture[],
  baseUrl?: string
) {
  const playlistTracks = playlist.trackIds
    .map((id) => allTracks.find((t) => t.id === id))
    .filter((t): t is AppleMusicTrackFixture => !!t);

  return {
    id: playlist.id,
    type: 'playlists',
    attributes: {
      name: playlist.name,
      description: playlist.description
        ? {
            standard: playlist.description,
          }
        : null,
      artwork: formatArtwork(playlist.artworkFile, baseUrl),
      trackCount: playlistTracks.length,
    },
    relationships: {
      tracks: {
        data: playlistTracks.map((t) => formatTrackResource(t, baseUrl)),
      },
    },
  };
}

export function formatSearchResponse(
  tracks: AppleMusicTrackFixture[],
  playlists: AppleMusicPlaylistFixture[],
  allTracks: AppleMusicTrackFixture[],
  baseUrl?: string
) {
  const response: { results: Record<string, { data: unknown[] }> } = {
    results: {},
  };

  if (tracks.length > 0) {
    response.results.songs = {
      data: tracks.map((t) => formatTrackResource(t, baseUrl)),
    };
  }

  if (playlists.length > 0) {
    response.results.playlists = {
      data: playlists.map((p) => formatPlaylistResource(p, allTracks, baseUrl)),
    };
  }

  return response;
}
