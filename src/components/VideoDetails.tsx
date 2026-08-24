import React, { useState } from 'react';
import { Copy, Check, ExternalLink, Play, AlertCircle } from 'lucide-react';
import { Video } from '../types';

interface Props {
  video: Video;
}

export default function VideoDetails({ video }: Props) {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleCopyAll = () => {
    const text = `Video Title: ${video.title}\n\nDirect Play URL:\n${video.directPlayUrl}\n\n${video.previewAnimationUrl ? `Preview Animation URL:\n${video.previewAnimationUrl}` : ''}`;
    navigator.clipboard.writeText(text);
    setCopiedField('all');
    setTimeout(() => setCopiedField(null), 2000);
  };

  const formatSize = (bytes?: number) => {
    if (!bytes) return 'Unknown size';
    const mb = bytes / (1024 * 1024);
    if (mb > 1024) return `${(mb / 1024).toFixed(2)} GB`;
    return `${mb.toFixed(1)} MB`;
  };

  return (
    <div className="max-w-3xl mx-auto pb-12">
      <div className="aspect-video bg-slate-900 rounded-2xl shadow-2xl overflow-hidden relative group mb-8">
        <iframe 
          src={video.directPlayUrl}
          loading="lazy" 
          className="w-full h-full border-0 absolute inset-0"
          allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;" 
          allowFullScreen
        />
      </div>

      <div className="flex items-start justify-between mb-10">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">{video.title}</h2>
          <p className="text-slate-500 mt-1 text-sm">
            Added: {new Date(video.dateUploaded).toLocaleDateString()} • {video.availableResolutions || 'N/A'} • {video.status === 3 ? 'Finished' : 'Processing'}
          </p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={handleCopyAll}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-colors flex items-center gap-2"
          >
            {copiedField === 'all' ? <Check size={16} /> : <Copy size={16} />}
            {copiedField === 'all' ? 'Copied' : 'Copy All Links'}
          </button>
          <a 
            href={video.directPlayUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 border border-slate-200 text-slate-700 rounded-lg text-sm font-semibold hover:bg-slate-50 transition-colors flex items-center justify-center"
          >
            Open in Tab
          </a>
        </div>
      </div>

      <div className="space-y-4">
        <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Video & Asset Links</h4>
        
        <LinkRow 
          label="Direct Play URL" 
          url={video.directPlayUrl} 
          fieldId="direct" 
          copiedField={copiedField} 
          onCopy={handleCopy} 
          badge="RECOMMENDED"
        />
        {video.previewAnimationUrl && (
          <LinkRow 
            label="Preview Animation URL" 
            url={video.previewAnimationUrl} 
            fieldId="preview" 
            copiedField={copiedField} 
            onCopy={handleCopy} 
          />
        )}
      </div>

      <div className="mt-8 bg-slate-50 border border-slate-200 rounded-xl p-4 flex gap-3 text-sm text-slate-600">
        <AlertCircle size={18} className="shrink-0 mt-0.5 text-indigo-500" />
        <p>These URLs contain your authentication tokens (if configured) and are safe to share directly with the Product team.</p>
      </div>
    </div>
  );
}

function LinkRow({ label, url, fieldId, copiedField, onCopy, badge, hideOpen = false }: { label: string, url: string, fieldId: string, copiedField: string | null, onCopy: (text: string, id: string) => void, badge?: string, hideOpen?: boolean }) {
  return (
    <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-bold text-slate-700">{label}</span>
        {badge && (
          <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">{badge}</span>
        )}
      </div>
      <div className="flex gap-2">
        <code className="flex-1 bg-white border border-slate-200 px-3 py-2 rounded-lg text-xs font-mono text-slate-500 truncate select-all overflow-hidden flex items-center">
          {url}
        </code>
        {!hideOpen && (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:border-slate-300 hover:bg-slate-50 transition-all flex items-center justify-center"
            title="Open in new tab"
          >
            <ExternalLink size={14} />
          </a>
        )}
        <button
          onClick={() => onCopy(url, fieldId)}
          className={`px-4 py-2 bg-white border rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 min-w-[80px] ${
            copiedField === fieldId 
              ? 'border-emerald-200 bg-emerald-50 text-emerald-700' 
              : 'border-slate-200 text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50'
          }`}
        >
          {copiedField === fieldId ? <Check size={14} /> : <Copy size={14} />}
          {copiedField === fieldId ? 'Copied' : 'Copy'}
        </button>
      </div>
    </div>
  );
}
