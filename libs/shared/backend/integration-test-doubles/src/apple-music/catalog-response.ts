import { AppleMusicTrackFixture, AppleMusicPlaylistFixture } from './catalog-fixtures.js';

export function formatTrackResource(track: AppleMusicTrackFixture) {
  return {
    id: track.id,
    type: 'songs',
    attributes: {
      name: track.name,
      artistName: track.artistName,
      albumName: track.albumName,
      durationInMillis: track.durationMs,
      artwork: track.artworkUrl
        ? {
            url: track.artworkUrl,
            width: 300,
            height: 300,
          }
        : null,
    },
  };
}

export function formatPlaylistResource(
  playlist: AppleMusicPlaylistFixture,
  allTracks: AppleMusicTrackFixture[]
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
      artwork: playlist.artworkUrl
        ? {
            url: playlist.artworkUrl,
            width: 300,
            height: 300,
          }
        : null,
      trackCount: playlistTracks.length,
    },
    relationships: {
      tracks: {
        data: playlistTracks.map((t) => formatTrackResource(t)),
      },
    },
  };
}

export function formatSearchResponse(
  tracks: AppleMusicTrackFixture[],
  playlists: AppleMusicPlaylistFixture[],
  allTracks: AppleMusicTrackFixture[]
) {
  const response: { results: Record<string, { data: unknown[] }> } = {
    results: {},
  };

  if (tracks.length > 0) {
    response.results.songs = {
      data: tracks.map((t) => formatTrackResource(t)),
    };
  }

  if (playlists.length > 0) {
    response.results.playlists = {
      data: playlists.map((p) => formatPlaylistResource(p, allTracks)),
    };
  }

  return response;
}
