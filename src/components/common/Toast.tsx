import React from 'react';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';

export interface ToastProps {
  isVisible: boolean;
  message: string;
  type?: 'success' | 'error' | 'info';
  onClose: () => void;
}

export default function Toast({ isVisible, message, type = 'success', onClose }: ToastProps) {
  if (!isVisible) return null;

  return (
    <div className="fixed top-6 right-6 z-50 animate-in slide-in-from-top-4 duration-300">
      <div className={`flex items-center space-x-3 px-5 py-4 rounded-2xl shadow-xl border backdrop-blur-md ${
        type === 'success' 
          ? 'bg-emerald-900/90 text-white border-emerald-500/30' 
          : type === 'error'
          ? 'bg-rose-900/90 text-white border-rose-500/30'
          : 'bg-indigo-900/90 text-white border-indigo-500/30'
      }`}>
        {type === 'success' && <CheckCircle size={22} className="text-emerald-400 shrink-0" />}
        {type === 'error' && <AlertCircle size={22} className="text-rose-400 shrink-0" />}
        {type === 'info' && <Info size={22} className="text-indigo-400 shrink-0" />}

        <div className="text-sm font-semibold pr-2">{message}</div>

        <button 
          onClick={onClose} 
          className="p-1 hover:bg-white/10 rounded-full transition-colors opacity-80 hover:opacity-100 cursor-pointer"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
