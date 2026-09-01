import { AppleMusicDemoHook } from './use-apple-music-demo';

interface AppleMusicSearchPanelProps {
  demo: AppleMusicDemoHook;
}

export function AppleMusicSearchPanel({ demo }: AppleMusicSearchPanelProps) {
  const { activeTwin, searching, query, setQuery, handleSearch } = demo;

  return (
    <form
      onSubmit={handleSearch}
      className="border rounded-xl bg-white shadow-sm p-5 space-y-4"
    >
      <h3 className="font-bold text-gray-900 border-b pb-2 text-md">
        Catalog Explorer
      </h3>
      <div className="flex gap-2">
        <input
          type="text"
          disabled={!activeTwin || searching}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search songs or playlists..."
          className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-red-500 focus:outline-none disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={!activeTwin || searching}
          className="bg-red-600 hover:bg-red-700 text-white font-semibold px-5 py-2 rounded-lg text-sm transition disabled:opacity-50"
        >
          {searching ? 'Searching...' : 'Search'}
        </button>
      </div>
    </form>
  );
}
