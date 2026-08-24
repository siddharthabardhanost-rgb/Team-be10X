import React from 'react';
import { Star } from 'lucide-react';
import { Video } from '../types';

interface Props {
  videos: Video[];
  onSelect: (video: Video) => void;
  selectedId?: string;
  favorites: Video[];
  onToggleFavorite: (video: Video) => void;
}

export default function VideoList({ videos, onSelect, selectedId, favorites, onToggleFavorite }: Props) {
  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (!videos.length) return null;

  return (
    <div className="space-y-2">
      {videos.map(video => {
        const isFav = favorites.some(f => f.guid === video.guid);
        const isSelected = selectedId === video.guid;
        
        return (
          <div 
            key={video.guid} 
            className={`p-3 rounded-xl flex gap-3 cursor-pointer group transition-colors border ${
              isSelected 
                ? 'bg-indigo-50 border-indigo-100' 
                : 'bg-white hover:bg-slate-50 border-transparent hover:border-slate-100'
            }`}
            onClick={() => onSelect(video)}
          >
            <div className="w-24 h-14 bg-slate-200 rounded shrink-0 overflow-hidden relative">
              <img 
                src={video.thumbnailUrl} 
                alt={video.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent flex items-end p-1">
                <span className="text-[9px] text-white font-bold bg-black/40 px-1 rounded backdrop-blur-sm tracking-wider">
                  {formatDuration(video.length)}
                </span>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleFavorite(video);
                }}
                className={`absolute top-1 right-1 p-1 rounded-full backdrop-blur-md transition-all ${
                  isFav 
                    ? 'bg-white/80 opacity-100' 
                    : 'bg-black/20 hover:bg-black/40 opacity-0 group-hover:opacity-100'
                }`}
              >
                <Star size={10} className={isFav ? "fill-amber-400 text-amber-400" : "text-white"} />
              </button>
            </div>
            
            <div className="flex flex-col justify-between flex-1 min-w-0">
              <h3 className={`text-sm font-semibold truncate leading-tight transition-colors ${
                isSelected ? 'text-indigo-900 font-bold' : 'text-slate-700 group-hover:text-slate-900'
              }`}>
                {video.title}
              </h3>
              <div className="flex items-center justify-between mt-1">
                <span className="text-[10px] text-slate-500 uppercase font-mono tracking-wider truncate mr-2">
                  ID: {video.guid.substring(0, 13)}...
                </span>
                {video.status !== 3 && (
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" title="Processing"></span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
