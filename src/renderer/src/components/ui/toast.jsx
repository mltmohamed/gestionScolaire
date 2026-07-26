import React from 'react';
import { createPortal } from 'react-dom';
import {
  AlertCircle,
  CheckCircle2,
  Info,
  X,
  XCircle,
} from 'lucide-react';
import { cn } from '@/utils/cn';

const TOAST_CONFIG = {
  success: {
    label: 'Confirmation',
    title: 'Opération réussie',
    hint: 'La modification a bien été prise en compte. Vous pouvez poursuivre votre travail.',
    icon: CheckCircle2,
    border: 'border-emerald-500/40',
    accent: 'bg-emerald-500',
    iconBox: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
    badge: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
  },
  error: {
    label: 'Erreur',
    title: 'L’opération n’a pas pu aboutir',
    hint: 'Vérifiez le détail ci-dessus, corrigez les informations concernées, puis réessayez.',
    icon: XCircle,
    border: 'border-[#CC0033]/50',
    accent: 'bg-[#CC0033]',
    iconBox: 'bg-[#CC0033]/10 text-[#CC0033] dark:text-red-300',
    badge: 'bg-[#CC0033]/10 text-[#CC0033] dark:text-red-300',
  },
  warning: {
    label: 'Attention',
    title: 'Une vérification est nécessaire',
    hint: 'Prenez connaissance de ce message avant de continuer.',
    icon: AlertCircle,
    border: 'border-[#FF6600]/50',
    accent: 'bg-[#FF6600]',
    iconBox: 'bg-[#FF6600]/10 text-[#FF3300] dark:text-orange-300',
    badge: 'bg-[#FF6600]/10 text-[#FF3300] dark:text-orange-300',
  },
  info: {
    label: 'Information',
    title: 'Information importante',
    hint: 'Ce message est fourni pour vous aider à poursuivre correctement.',
    icon: Info,
    border: 'border-[#0066CC]/40',
    accent: 'bg-[#0066CC]',
    iconBox: 'bg-[#0066CC]/10 text-[#0066CC] dark:text-blue-300',
    badge: 'bg-[#0066CC]/10 text-[#0066CC] dark:text-blue-300',
  },
};

function DetailContent({ details }) {
  if (!details) return null;

  if (Array.isArray(details)) {
    if (details.length === 0) return null;
    return (
      <ul className="mt-3 space-y-1.5 rounded-lg bg-slate-50 px-3 py-2.5 text-sm text-slate-700 dark:bg-slate-900 dark:text-slate-200">
        {details.map((detail, index) => (
          <li key={`${detail}-${index}`} className="flex gap-2">
            <span aria-hidden="true" className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-current opacity-60" />
            <span>{detail}</span>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <p className="mt-3 rounded-lg bg-slate-50 px-3 py-2.5 text-sm text-slate-700 dark:bg-slate-900 dark:text-slate-200">
      {details}
    </p>
  );
}

export function Toast({
  message,
  title,
  description,
  details,
  type = 'success',
  onClose,
}) {
  const config = TOAST_CONFIG[type] || TOAST_CONFIG.info;
  const Icon = config.icon;

  const content = (
    <div className="pointer-events-none fixed inset-0 z-[120] flex items-center justify-center p-4">
      <div
        role={type === 'error' || type === 'warning' ? 'alert' : 'status'}
        aria-live={type === 'error' ? 'assertive' : 'polite'}
        aria-atomic="true"
        className={cn(
          'pointer-events-auto relative max-h-[calc(100vh-2rem)] w-full max-w-xl overflow-y-auto rounded-xl border bg-white shadow-2xl dark:bg-slate-950',
          'app-notification-enter',
          config.border
        )}
      >
        <div className={cn('absolute inset-y-0 left-0 w-1.5', config.accent)} />
        <div className="flex items-start gap-4 p-5 pl-6 sm:p-6 sm:pl-7">
          <div className={cn('flex h-12 w-12 shrink-0 items-center justify-center rounded-xl', config.iconBox)}>
            <Icon className="h-6 w-6" />
          </div>

          <div className="min-w-0 flex-1 pr-7">
            <span className={cn('inline-flex rounded-md px-2 py-1 text-[11px] font-bold uppercase tracking-wide', config.badge)}>
              {config.label}
            </span>
            <h2 className="mt-2 text-lg font-bold leading-6 text-slate-950 dark:text-white">
              {title || config.title}
            </h2>
            <p className="mt-2 whitespace-pre-line text-sm font-medium leading-6 text-slate-700 dark:text-slate-200">
              {message || 'Aucun détail supplémentaire n’a été fourni.'}
            </p>
            {description ? (
              <p className="mt-2 text-sm leading-5 text-slate-600 dark:text-slate-300">
                {description}
              </p>
            ) : null}
            <DetailContent details={details} />
            <p className="mt-3 border-t border-slate-200 pt-3 text-xs leading-5 text-slate-500 dark:border-slate-800 dark:text-slate-400">
              {config.hint}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="absolute right-3 top-3 rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066CC] dark:hover:bg-slate-900 dark:hover:text-white"
            aria-label="Fermer la notification"
            title="Fermer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return typeof document === 'undefined'
    ? content
    : createPortal(content, document.body);
}
