import { FaMusic, FaListUl } from 'react-icons/fa';
import { AppleMusicDemoHook } from './use-apple-music-demo';

interface AppleMusicSearchResultsProps {
  demo: AppleMusicDemoHook;
}

export function AppleMusicSearchResults({ demo }: AppleMusicSearchResultsProps) {
  const { searchResults, currentTrack, playTrack } = demo;
  const songs = searchResults.songs || [];
  const playlists = searchResults.playlists || [];
  const currentTrackId = currentTrack?.id || null;

  if (songs.length === 0 && playlists.length === 0) {
    return (
      <div className="border rounded-xl bg-white shadow-sm p-6 text-center text-gray-500 text-sm font-medium">
        No results. Run a search query to explore catalog fixtures.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {songs.length > 0 && (
        <div className="border rounded-xl bg-white shadow-sm p-5 space-y-3">
          <h4 className="font-bold text-gray-900 text-sm border-b pb-2">Songs</h4>
          <div className="divide-y text-xs">
            {songs.map((song) => (
              <div key={song.id} className="flex justify-between items-center py-3">
                <div className="flex items-center gap-3">
                  {song.artworkUrl ? (
                    <img
                      src={song.artworkUrl.replace('{w}', '40').replace('{h}', '40')}
                      alt="Artwork"
                      className="w-10 h-10 rounded border object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded bg-red-50 flex items-center justify-center text-red-600 font-bold text-md border">
                      <FaMusic className="h-4 w-4" />
                    </div>
                  )}
                  <div>
                    <p className="font-bold text-gray-900">{song.name}</p>
                    <p className="text-gray-500">
                      {song.artistName} • {song.albumName}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => playTrack(song)}
                  className={`py-1.5 px-3 rounded-lg font-bold border transition ${
                    currentTrackId === song.id
                      ? 'bg-red-50 text-red-700 border-red-300'
                      : 'hover:bg-gray-50 text-gray-700 border-gray-300'
                  }`}
                >
                  {currentTrackId === song.id ? 'Playing' : 'Play'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {playlists.length > 0 && (
        <div className="border rounded-xl bg-white shadow-sm p-5 space-y-3">
          <h4 className="font-bold text-gray-900 text-sm border-b pb-2">Playlists</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {playlists.map((playlist) => (
              <div key={playlist.id} className="border rounded-lg p-4 bg-gray-50 space-y-2">
                <div className="flex items-center gap-3">
                  {playlist.artworkUrl ? (
                    <img
                      src={playlist.artworkUrl.replace('{w}', '40').replace('{h}', '40')}
                      alt="Artwork"
                      className="w-10 h-10 rounded border object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded bg-red-100 flex items-center justify-center text-red-600 font-bold text-lg border">
                      <FaListUl className="h-4 w-4" />
                    </div>
                  )}
                  <div>
                    <h5 className="font-bold text-gray-900 text-sm">{playlist.name}</h5>
                    <p className="text-gray-500 text-[10px]">{playlist.trackCount} Songs</p>
                  </div>
                </div>
                <p className="text-gray-600 text-xs line-clamp-2">{playlist.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
