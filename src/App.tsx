import React, { useState, useEffect, useRef } from 'react';
import { Search, Settings, Video as VideoIcon, Loader2, Film, Star, BarChart3, Bookmark } from 'lucide-react';
import { Video } from './types';
import SearchInput from './components/SearchInput';
import VideoList from './components/VideoList';
import VideoDetails from './components/VideoDetails';
import ConfigModal from './components/ConfigModal';
import LibraryStats from './components/LibraryStats';

type ActiveTab = 'library' | 'favorites' | 'stats';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('library');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Video[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [favorites, setFavorites] = useState<Video[]>([]);

  const abortControllerRef = useRef<AbortController | null>(null);
  const searchTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    const storedRecent = localStorage.getItem('bunny_recent_searches');
    if (storedRecent) setRecentSearches(JSON.parse(storedRecent));
    
    const storedFavs = localStorage.getItem('bunny_favorites');
    if (storedFavs) setFavorites(JSON.parse(storedFavs));

    // Fetch initial videos on load
    fetchVideos('');
  }, []);

  const saveRecentSearch = (term: string) => {
    if (!term.trim()) return;
    const updated = [term, ...recentSearches.filter(s => s.toLowerCase() !== term.toLowerCase())].slice(0, 10);
    setRecentSearches(updated);
    localStorage.setItem('bunny_recent_searches', JSON.stringify(updated));
  };

  const toggleFavorite = (video: Video) => {
    let updated;
    if (favorites.some(v => v.guid === video.guid)) {
      updated = favorites.filter(v => v.guid !== video.guid);
    } else {
      updated = [video, ...favorites];
    }
    setFavorites(updated);
    localStorage.setItem('bunny_favorites', JSON.stringify(updated));
  };

  const fetchVideos = async (searchTerm: string, saveSearch = false) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    setLoading(true);
    setError(null);
    setQuery(searchTerm);

    if (saveSearch && searchTerm.trim()) {
      saveRecentSearch(searchTerm);
    }

    try {
      const url = searchTerm.trim() 
        ? `/api/videos?search=${encodeURIComponent(searchTerm)}`
        : `/api/videos`;

      const res = await fetch(url, { signal: abortControllerRef.current.signal });
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch videos');
      }
      
      const items = data.items || [];
      setResults(items);
      
      if (items.length === 0 && searchTerm.trim()) {
        setError('No videos found. Try a different search term.');
      } else if (items.length > 0 && (!selectedVideo || !items.some((v: Video) => v.guid === selectedVideo.guid))) {
        setSelectedVideo(items[0]);
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSearchInput = (searchTerm: string) => {
    setQuery(searchTerm);
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = window.setTimeout(() => {
      fetchVideos(searchTerm, searchTerm.trim().length > 2);
    }, 250);
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50 font-sans text-slate-900 overflow-hidden">
      {/* Premium Header */}
      <header className="flex items-center justify-between px-8 py-4 bg-white border-b border-slate-200 shrink-0 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-md shadow-indigo-100">
            <VideoIcon size={22} />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-slate-900">Bunny Video Studio</h1>
            <p className="text-xs text-slate-500 font-medium">Internal Product & Content Dashboard</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="hidden md:flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/60">
          <button
            onClick={() => setActiveTab('library')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'library'
                ? 'bg-white text-indigo-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Film size={15} /> Video Library
          </button>
          <button
            onClick={() => setActiveTab('favorites')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all relative ${
              activeTab === 'favorites'
                ? 'bg-white text-indigo-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Star size={15} /> Favorites
            {favorites.length > 0 && (
              <span className="ml-0.5 px-1.5 py-0.2 bg-indigo-100 text-indigo-700 rounded-full text-[10px] font-bold">
                {favorites.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('stats')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'stats'
                ? 'bg-white text-indigo-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BarChart3 size={15} /> Analytics
          </button>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
            <span className="text-xs font-semibold text-emerald-700">API Connected</span>
          </div>
          <button 
            onClick={() => setIsConfigOpen(true)}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            title="Configuration"
          >
            <Settings size={20} />
          </button>
        </div>
      </header>

      {/* Mobile Tab Navigation */}
      <div className="flex md:hidden bg-white border-b border-slate-200 px-4 py-2 justify-around">
        <button
          onClick={() => setActiveTab('library')}
          className={`flex items-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-bold ${
            activeTab === 'library' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-600'
          }`}
        >
          <Film size={14} /> Library
        </button>
        <button
          onClick={() => setActiveTab('favorites')}
          className={`flex items-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-bold ${
            activeTab === 'favorites' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-600'
          }`}
        >
          <Star size={14} /> Favorites ({favorites.length})
        </button>
        <button
          onClick={() => setActiveTab('stats')}
          className={`flex items-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-bold ${
            activeTab === 'stats' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-600'
          }`}
        >
          <BarChart3 size={14} /> Stats
        </button>
      </div>

      {/* Main Content Area */}
      <main className="flex flex-1 overflow-hidden">
        {activeTab === 'library' && (
          <div className="flex flex-1 overflow-hidden">
            <aside className="w-[380px] bg-white border-r border-slate-200 flex flex-col shrink-0">
              <div className="p-5 border-b border-slate-100">
                <SearchInput onSearch={handleSearchInput} initialQuery={query} />
                
                {recentSearches.length > 0 && (
                  <div className="mt-4">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-2">Recent Searches</span>
                    <div className="flex flex-wrap gap-1.5">
                      {recentSearches.map(term => (
                        <button
                          key={term}
                          onClick={() => {
                            fetchVideos(term, true);
                          }}
                          className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                            query.toLowerCase() === term.toLowerCase()
                              ? 'bg-indigo-50 text-indigo-700 border border-indigo-100'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-transparent'
                          }`}
                        >
                          {term}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex-1 overflow-y-auto">
                {error && (
                  <div className="m-4 bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl text-sm text-center">
                    {error}
                  </div>
                )}

                {loading ? (
                  <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                    <Loader2 size={24} className="animate-spin mb-3 text-indigo-600" />
                    <p className="text-sm">Searching Bunny library...</p>
                  </div>
                ) : (
                  <div className="p-3">
                    {favorites.length > 0 && results.length === 0 && (
                      <div className="mb-6">
                        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-3 px-2">Starred Favorites</span>
                        <VideoList 
                          videos={favorites} 
                          onSelect={setSelectedVideo} 
                          selectedId={selectedVideo?.guid}
                          favorites={favorites}
                          onToggleFavorite={toggleFavorite}
                        />
                      </div>
                    )}
                    
                    {results.length > 0 && (
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-3 px-2">
                          {query.trim() ? `Search Results (${results.length})` : `All Videos (${results.length})`}
                        </span>
                        <VideoList 
                          videos={results} 
                          onSelect={setSelectedVideo} 
                          selectedId={selectedVideo?.guid}
                          favorites={favorites}
                          onToggleFavorite={toggleFavorite}
                        />
                      </div>
                    )}

                    {results.length === 0 && favorites.length === 0 && !loading && !error && (
                      <div className="text-center px-4 py-16 text-slate-400">
                        <Search size={32} className="mx-auto mb-3 opacity-40 text-indigo-400" />
                        <p className="text-sm font-medium">No videos found.</p>
                        <p className="text-xs text-slate-400 mt-1">Type in search above to find assets.</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </aside>

            <section className="flex-1 bg-white p-8 overflow-y-auto">
              {selectedVideo ? (
                <VideoDetails video={selectedVideo} />
              ) : (
                <div className="h-full flex items-center justify-center text-slate-400">
                  <div className="text-center max-w-sm">
                    <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-indigo-600">
                      <Film size={28} />
                    </div>
                    <p className="text-base font-bold text-slate-800">No video selected</p>
                    <p className="text-sm text-slate-500 mt-1">Choose a video from the library list on the left to preview and copy streaming links.</p>
                  </div>
                </div>
              )}
            </section>
          </div>
        )}

        {activeTab === 'favorites' && (
          <div className="flex-1 bg-white p-8 overflow-y-auto">
            <div className="max-w-5xl mx-auto">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">Starred Favorites</h2>
                  <p className="text-slate-500 text-sm mt-1">Quick access to your saved video assets.</p>
                </div>
                <span className="px-3 py-1 bg-indigo-50 text-indigo-700 font-bold text-xs rounded-full">
                  {favorites.length} saved
                </span>
              </div>

              {favorites.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {favorites.map(video => (
                    <div 
                      key={video.guid}
                      onClick={() => {
                        setSelectedVideo(video);
                        setActiveTab('library');
                      }}
                      className="bg-white border border-slate-200 rounded-xl p-4 cursor-pointer hover:border-indigo-200 hover:shadow-md transition-all group relative"
                    >
                      <div className="aspect-video bg-slate-100 rounded-lg overflow-hidden mb-3 relative">
                        <img src={video.thumbnailUrl} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavorite(video);
                          }}
                          className="absolute top-2 right-2 p-1.5 rounded-full bg-white/95 text-amber-400 shadow-sm hover:scale-110 transition-transform"
                        >
                          <Star size={14} className="fill-amber-400" />
                        </button>
                      </div>
                      <h4 className="font-bold text-slate-800 text-sm line-clamp-2 group-hover:text-indigo-600 transition-colors">
                        {video.title}
                      </h4>
                      <div className="flex items-center justify-between mt-3 text-xs text-slate-400">
                        <span>{new Date(video.dateUploaded).toLocaleDateString()}</span>
                        <span className="font-medium text-indigo-600 group-hover:underline">View Links →</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-20 bg-slate-50 rounded-2xl border border-slate-200">
                  <Bookmark size={40} className="mx-auto text-slate-300 mb-3" />
                  <p className="text-base font-bold text-slate-700">No favorites yet</p>
                  <p className="text-sm text-slate-500 mt-1">Click the star icon on any video to save it to your favorites.</p>
                  <button
                    onClick={() => setActiveTab('library')}
                    className="mt-6 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition-colors"
                  >
                    Browse Video Library
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'stats' && (
          <div className="flex-1 bg-slate-50 overflow-y-auto">
            <LibraryStats videos={results} favorites={favorites} />
          </div>
        )}
      </main>
      
      {isConfigOpen && (
        <ConfigModal onClose={() => setIsConfigOpen(false)} />
      )}
    </div>
  );
}
