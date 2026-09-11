import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, XCircle, Loader2, Key, Save } from 'lucide-react';
import { safeFetch } from '../lib/api';

interface Props {
  onClose: () => void;
}

export default function ConfigModal({ onClose }: Props) {
  const [libraryId, setLibraryId] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [tokenKey, setTokenKey] = useState('');
  const [cdnHostname, setCdnHostname] = useState('');
  
  const [status, setStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    setLibraryId(localStorage.getItem('bunny_library_id') || '239218');
    setApiKey(localStorage.getItem('bunny_api_key') || 'bbd4e23b-2f03-4adf-92786ad883e4-820f-4d47');
    setTokenKey(localStorage.getItem('bunny_token_key') || '');
    setCdnHostname(localStorage.getItem('bunny_cdn_hostname') || 'vz-aaf3ef7a-e4a.b-cdn.net');

    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('bunny_library_id', libraryId.trim());
    localStorage.setItem('bunny_api_key', apiKey.trim());
    localStorage.setItem('bunny_token_key', tokenKey.trim());
    localStorage.setItem('bunny_cdn_hostname', cdnHostname.trim());
    
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
    testConnection();
  };

  const testConnection = async () => {
    const trimmedLibId = libraryId.trim();
    const trimmedApiKey = apiKey.trim();

    setStatus('testing');
    setMessage('');
    try {
      const data = await safeFetch('/api/status', {
        headers: {
          'x-bunny-library-id': trimmedLibId,
          'x-bunny-access-key': trimmedApiKey,
          'x-bunny-token-key': tokenKey.trim(),
          'x-bunny-cdn-hostname': cdnHostname.trim(),
        }
      });
      
      if (data.success || data.connected) {
        setStatus('success');
        setMessage(data.message || 'Bunny Stream connection successful.');
      } else {
        setStatus('error');
        setMessage(data.message || 'Bunny Stream authentication failed. Please check your Library ID and API Access Key.');
      }
    } catch (err: any) {
      setStatus('error');
      setMessage(err.message || 'Bunny connection service is unavailable. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden relative animate-in fade-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Key size={20} className="text-indigo-600" />
            <h2 className="text-xl font-bold text-slate-900">Bunny Stream Configuration</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSave} className="p-6 space-y-4">
          <p className="text-xs text-slate-500">
            Enter your Bunny Stream Video Library credentials below. These are securely stored in your browser's local storage and used to communicate with Bunny API.
          </p>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Library ID <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. 384920"
              value={libraryId}
              onChange={(e) => setLibraryId(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              API Access Key <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              required
              placeholder="Library API Key (Pull/Read/Write)"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Token Authentication Key <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <input
              type="password"
              placeholder="Security Token Key for signed URLs"
              value={tokenKey}
              onChange={(e) => setTokenKey(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              CDN Hostname <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <input
              type="text"
              placeholder="e.g. vz-xxxx.b-cdn.net"
              value={cdnHostname}
              onChange={(e) => setCdnHostname(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
            />
          </div>

          {message && (
            <div className={`p-3 rounded-xl text-sm flex items-start gap-2.5 ${status === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
              {status === 'success' ? <CheckCircle2 size={16} className="shrink-0 mt-0.5 text-emerald-600" /> : <XCircle size={16} className="shrink-0 mt-0.5 text-red-600" />}
              <p className="text-xs leading-relaxed">{message}</p>
            </div>
          )}

          {savedSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium rounded-xl flex items-center gap-2">
              <CheckCircle2 size={15} /> Configuration saved successfully!
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={testConnection}
              disabled={status === 'testing' || !libraryId || !apiKey}
              className="flex-1 flex justify-center items-center gap-2 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-700 font-semibold py-3 rounded-xl transition-colors text-sm"
            >
              {status === 'testing' ? <Loader2 size={16} className="animate-spin" /> : null}
              Test Connection
            </button>
            <button
              type="submit"
              className="flex-1 flex justify-center items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-xl transition-colors text-sm shadow-sm"
            >
              <Save size={16} /> Save & Close
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
