import React from 'react';
import { cn } from '@/utils/cn';
import { CheckCircle2, XCircle, AlertCircle, X } from 'lucide-react';

export function Toast({ message, type = 'success', onClose }) {
  const icons = {
    success: <CheckCircle2 className="h-5 w-5" />,
    error: <XCircle className="h-5 w-5" />,
    warning: <AlertCircle className="h-5 w-5" />,
  };

  const bgColors = {
    success: 'bg-green-50 dark:bg-green-900/20',
    error: 'bg-red-50 dark:bg-red-900/20',
    warning: 'bg-yellow-50 dark:bg-yellow-900/20',
  };

  const borderColors = {
    success: 'border-green-200 dark:border-green-800',
    error: 'border-red-200 dark:border-red-800',
    warning: 'border-yellow-200 dark:border-yellow-800',
  };

  const textColors = {
    success: 'text-green-800 dark:text-green-300',
    error: 'text-red-800 dark:text-red-300',
    warning: 'text-yellow-800 dark:text-yellow-300',
  };

  return (
    <div
      className={cn(
        'fixed top-4 right-4 z-[100] flex items-center gap-3 rounded-lg border px-4 py-3 shadow-lg animate-in slide-in-from-right fade-in duration-300',
        bgColors[type],
        borderColors[type],
        textColors[type]
      )}
    >
      <div className={cn('flex-shrink-0', textColors[type])}>
        {icons[type]}
      </div>
      <p className="text-sm font-medium">{message}</p>
      <button
        onClick={onClose}
        className="ml-auto rounded-md p-1 hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
