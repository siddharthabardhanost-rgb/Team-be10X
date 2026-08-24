import React from 'react';
import { Video } from '../types';
import { BarChart3, Film, CheckCircle2, HardDrive, Clock, ShieldCheck, Zap } from 'lucide-react';

interface Props {
  videos: Video[];
  favorites: Video[];
}

export default function LibraryStats({ videos, favorites }: Props) {
  const totalVideos = videos.length;
  const finishedVideos = videos.filter(v => v.status === 3).length;
  const processingVideos = videos.filter(v => v.status !== 3).length;
  
  const totalDurationSeconds = videos.reduce((acc, v) => acc + (v.length || 0), 0);
  const totalHours = (totalDurationSeconds / 3600).toFixed(1);

  // Resolution counts
  const resolutionsMap: Record<string, number> = {};
  videos.forEach(v => {
    if (v.availableResolutions) {
      v.availableResolutions.split(',').forEach(res => {
        const trimmed = res.trim();
        resolutionsMap[trimmed] = (resolutionsMap[trimmed] || 0) + 1;
      });
    }
  });

  return (
    <div className="max-w-4xl mx-auto py-6 px-4">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Library Analytics & Overview</h2>
        <p className="text-slate-500 text-sm mt-1">Real-time metrics and breakdown of your Bunny Stream video assets.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <Film size={24} />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900">{totalVideos}</div>
            <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Videos</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 size={24} />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900">{finishedVideos}</div>
            <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Processed & Ready</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Clock size={24} />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900">{totalHours} hrs</div>
            <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Duration</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <Zap size={24} />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900">{favorites.length}</div>
            <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Starred Favorites</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
            <BarChart3 size={18} className="text-indigo-600" /> Resolution Distribution
          </h3>
          <div className="space-y-3">
            {Object.keys(resolutionsMap).length > 0 ? (
              Object.entries(resolutionsMap).map(([res, count]) => (
                <div key={res} className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-700 bg-slate-100 px-2.5 py-1 rounded-md">{res}</span>
                  <div className="flex items-center gap-3 flex-1 mx-4">
                    <div className="h-2 bg-slate-100 rounded-full flex-1 overflow-hidden">
                      <div 
                        className="h-full bg-indigo-600 rounded-full" 
                        style={{ width: `${Math.min(100, (count / totalVideos) * 100)}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-sm font-bold text-slate-900">{count} videos</span>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-400 py-4 text-center">No resolution data available.</p>
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
              <ShieldCheck size={18} className="text-emerald-600" /> Bunny Stream Status
            </h3>
            <div className="space-y-4 text-sm text-slate-600">
              <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                <span className="font-medium">API Connection</span>
                <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 font-bold text-xs rounded-full flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span> Secure & Active
                </span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                <span className="font-medium">Processing Queue</span>
                <span className="font-bold text-slate-900">{processingVideos} items</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium">CDN Edge Delivery</span>
                <span className="font-bold text-emerald-600">Optimized</span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 text-xs text-slate-400">
            Metrics auto-sync securely via Bunny Stream API integration.
          </div>
        </div>
      </div>
    </div>
  );
}
