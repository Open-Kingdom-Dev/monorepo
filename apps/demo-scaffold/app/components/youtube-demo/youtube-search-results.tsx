/* eslint-disable jsx-a11y/accessible-emoji */
import { YoutubeSearchResultItem } from '../../routes/use-youtube-demo';

interface YoutubeSearchResultsProps {
  searchResults: YoutubeSearchResultItem[];
  currentVideoId: string | null;
  onPlayVideo: (id: string) => void;
}

export function YoutubeSearchResults({
  searchResults,
  currentVideoId,
  onPlayVideo,
}: YoutubeSearchResultsProps) {
  return (
    <div className="border rounded-xl bg-white shadow-sm p-6 space-y-4">
      <h2 className="text-xl font-bold text-gray-900 border-b pb-3">
        Search Results
      </h2>
      {searchResults.length === 0 ? (
        <div className="py-16 text-center text-gray-400 text-sm flex flex-col items-center justify-center space-y-2">
          <span className="text-3xl">📺</span>
          <span>
            No video search results. Try searching for "yoga" or "space" after
            launching the twin.
          </span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {searchResults.map((item) => (
            <div
              key={item.id.videoId}
              className={`border rounded-lg overflow-hidden flex flex-col bg-gray-50 hover:bg-white hover:shadow-md transition-all duration-300 ${
                currentVideoId === item.id.videoId
                  ? 'border-blue-500 ring-2 ring-blue-100'
                  : 'border-gray-200'
              }`}
            >
              <div className="relative aspect-video bg-black flex-shrink-0">
                <img
                  src={item.snippet.thumbnails.medium.url}
                  alt={item.snippet.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-25 hover:bg-opacity-40 transition duration-200">
                  <button
                    onClick={() => onPlayVideo(item.id.videoId)}
                    className="p-3 bg-red-600 text-white rounded-full hover:scale-110 shadow-lg transition transform duration-200"
                  >
                    ▶️
                  </button>
                </div>
              </div>
              <div className="p-4 flex-1 flex flex-col justify-between space-y-2">
                <div>
                  <h4
                    className="font-bold text-gray-900 line-clamp-1"
                    title={item.snippet.title}
                  >
                    {item.snippet.title}
                  </h4>
                  <p className="text-xs text-gray-500 font-semibold mt-0.5">
                    {item.snippet.channelTitle}
                  </p>
                  <p className="text-xs text-gray-600 line-clamp-2 mt-1.5">
                    {item.snippet.description}
                  </p>
                </div>
                <button
                  onClick={() => onPlayVideo(item.id.videoId)}
                  className={`w-full py-1.5 rounded text-xs font-bold transition ${
                    currentVideoId === item.id.videoId
                      ? 'bg-blue-600 hover:bg-blue-700 text-white'
                      : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
                  }`}
                >
                  {currentVideoId === item.id.videoId
                    ? 'Currently Loaded'
                    : 'Load in Player'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
