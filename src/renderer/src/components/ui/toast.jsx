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
    success: 'bg-[#0066CC]/10 dark:bg-[#0066CC]/20',
    error: 'bg-[#CC0033]/10 dark:bg-[#CC0033]/20',
    warning: 'bg-[#FF6600]/10 dark:bg-[#FF6600]/20',
  };

  const borderColors = {
    success: 'border-[#0066CC]/30 dark:border-[#0066CC]/40',
    error: 'border-[#CC0033]/30 dark:border-[#CC0033]/40',
    warning: 'border-[#FF6600]/30 dark:border-[#FF6600]/40',
  };

  const textColors = {
    success: 'text-[#003399] dark:text-white',
    error: 'text-[#CC0033] dark:text-white',
    warning: 'text-[#FF3300] dark:text-white',
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
