import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, XCircle, Loader2 } from 'lucide-react';

interface Props {
  onClose: () => void;
}

export default function ConfigModal({ onClose }: Props) {
  const [status, setStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  const testConnection = async () => {
    setStatus('testing');
    try {
      const res = await fetch('/api/status');
      const data = await res.json();
      
      if (data.connected) {
        setStatus('success');
        setMessage(data.message);
      } else {
        setStatus('error');
        setMessage(data.message);
      }
    } catch (err: any) {
      setStatus('error');
      setMessage('Failed to reach the server to test connection.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden relative animate-in fade-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900">Configuration</h2>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6">
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 mb-6 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-500 font-medium">Bunny Integration</span>
              {status === 'success' ? (
                <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-100 px-2.5 py-1 rounded-full uppercase tracking-wider">
                  <CheckCircle2 size={14} /> Connected
                </span>
              ) : status === 'error' ? (
                <span className="flex items-center gap-1.5 text-xs font-bold text-red-600 bg-red-100 px-2.5 py-1 rounded-full uppercase tracking-wider">
                  <XCircle size={14} /> Error
                </span>
              ) : (
                <span className="text-xs font-bold text-slate-500 bg-slate-200 px-2.5 py-1 rounded-full uppercase tracking-wider">
                  Unknown
                </span>
              )}
            </div>
            
            <div className="pt-3 border-t border-slate-200">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-slate-500">Library ID</span>
                <span className="text-sm font-mono text-slate-900">Check .env</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-500">API Key</span>
                <span className="text-sm font-mono text-slate-900">••••••••••••</span>
              </div>
            </div>
          </div>
          
          {message && (
            <div className={`p-4 rounded-lg mb-6 text-sm flex items-start gap-3 ${status === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
              {status === 'success' ? <CheckCircle2 size={18} className="shrink-0 mt-0.5 text-emerald-600" /> : <XCircle size={18} className="shrink-0 mt-0.5 text-red-600" />}
              <p>{message}</p>
            </div>
          )}

          <button
            onClick={testConnection}
            disabled={status === 'testing'}
            className="w-full flex justify-center items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-medium py-3 rounded-xl transition-colors"
          >
            {status === 'testing' ? (
              <><Loader2 size={18} className="animate-spin" /> Testing Connection...</>
            ) : (
              'Test Connection'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
