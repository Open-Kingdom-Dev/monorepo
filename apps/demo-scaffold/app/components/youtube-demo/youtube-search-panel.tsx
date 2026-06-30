import React from 'react';

interface YoutubeSearchPanelProps {
  activeTwin: boolean;
  searching: boolean;
  query: string;
  onQueryChange: (q: string) => void;
  maxResults: number;
  onMaxResultsChange: (n: number) => void;
  onSearch: (e: React.FormEvent) => void;
}

export function YoutubeSearchPanel({
  activeTwin,
  searching,
  query,
  onQueryChange,
  maxResults,
  onMaxResultsChange,
  onSearch,
}: YoutubeSearchPanelProps) {
  return (
    <div className="border rounded-xl bg-white shadow-sm p-6 space-y-4">
      <h2 className="text-xl font-bold text-gray-900">Search Mock Catalog</h2>
      <form onSubmit={onSearch} className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Search mock videos (e.g., yoga, music, space)..."
          disabled={!activeTwin || searching}
          className="flex-1 border rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-500 focus:outline-none disabled:bg-gray-50 disabled:cursor-not-allowed"
          required
        />
        <div className="flex items-center gap-2">
          <select
            value={maxResults}
            onChange={(e) => onMaxResultsChange(Number(e.target.value))}
            disabled={!activeTwin || searching}
            className="border rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-500 focus:outline-none bg-white disabled:bg-gray-50"
          >
            <option value={1}>1 Result</option>
            <option value={3}>3 Results</option>
            <option value={5}>5 Results</option>
            <option value={10}>10 Results</option>
          </select>
          <button
            type="submit"
            disabled={!activeTwin || searching}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg shadow-sm hover:shadow transition disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
          >
            {searching ? 'Searching...' : '🔍 Search'}
          </button>
        </div>
      </form>
    </div>
  );
}
