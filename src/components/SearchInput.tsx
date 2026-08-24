import React, { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';

interface Props {
  onSearch: (query: string) => void;
  initialQuery?: string;
}

export default function SearchInput({ onSearch, initialQuery = '' }: Props) {
  const [value, setValue] = useState(initialQuery);

  useEffect(() => {
    setValue(initialQuery);
  }, [initialQuery]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVal = e.target.value;
    setValue(newVal);
    onSearch(newVal);
  };

  const handleClear = () => {
    setValue('');
    onSearch('');
  };

  return (
    <div className="relative w-full">
      <input
        type="text"
        className="w-full pl-10 pr-9 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none"
        placeholder="Search videos by title..."
        value={value}
        onChange={handleChange}
      />
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
        <Search size={16} />
      </div>
      {value && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
}
