import * as React from 'react';
import { createPortal } from 'react-dom';
import {
  AlertTriangle,
  CheckCircle,
  Loader2,
  Power,
  Trash2,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { Button } from './button';

const AlertDialogIdsContext = React.createContext(null);

const AlertDialog = ({
  open,
  onOpenChange,
  children,
  closeOnBackdrop = false,
}) => {
  const containerRef = React.useRef(null);
  const previousFocusRef = React.useRef(null);
  const onOpenChangeRef = React.useRef(onOpenChange);

  React.useEffect(() => {
    onOpenChangeRef.current = onOpenChange;
  }, [onOpenChange]);

  React.useEffect(() => {
    if (!open || typeof document === 'undefined') return undefined;

    previousFocusRef.current = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const focusTimer = window.setTimeout(() => {
      const preferredTarget = containerRef.current?.querySelector('[data-alert-dialog-cancel]');
      const fallbackTarget = containerRef.current?.querySelector('[role="alertdialog"]');
      (preferredTarget || fallbackTarget)?.focus();
    }, 0);

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onOpenChangeRef.current(false);
        return;
      }

      if (event.key !== 'Tab' || !containerRef.current) return;
      const focusableElements = Array.from(
        containerRef.current.querySelectorAll(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
      );
      if (focusableElements.length === 0) {
        event.preventDefault();
        return;
      }

      const first = focusableElements[0];
      const last = focusableElements[focusableElements.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      window.clearTimeout(focusTimer);
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
      previousFocusRef.current?.focus?.();
    };
  }, [open]);

  if (!open) return null;

  const content = (
    <div className="fixed inset-0 z-[110] p-4">
      <div
        className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm"
        aria-hidden="true"
        onMouseDown={() => {
          if (closeOnBackdrop) onOpenChange(false);
        }}
      />
      <div className="relative flex min-h-full items-center justify-center pointer-events-none">
        <div ref={containerRef} className="pointer-events-auto w-full max-w-lg">
          {React.Children.map(children, (child) => (
            React.isValidElement(child)
              ? React.cloneElement(child, { onOpenChange })
              : child
          ))}
        </div>
      </div>
    </div>
  );

  return typeof document === 'undefined'
    ? content
    : createPortal(content, document.body);
};

const AlertDialogContent = React.forwardRef(({
  className,
  children,
  onOpenChange,
  ...props
}, ref) => {
  const titleId = React.useId();
  const descriptionId = React.useId();

  return (
    <AlertDialogIdsContext.Provider value={{ titleId, descriptionId }}>
      <div
        ref={ref}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        tabIndex={-1}
        className={cn(
          'app-dialog-enter relative z-50 grid max-h-[calc(100vh-2rem)] w-full gap-5 overflow-y-auto rounded-xl border bg-background p-6 shadow-2xl',
          className
        )}
        {...props}
      >
        {children}
      </div>
    </AlertDialogIdsContext.Provider>
  );
});
AlertDialogContent.displayName = 'AlertDialogContent';

const AlertDialogHeader = ({ className, ...props }) => (
  <div
    className={cn('flex flex-col items-center space-y-3 text-center', className)}
    {...props}
  />
);
AlertDialogHeader.displayName = 'AlertDialogHeader';

const AlertDialogFooter = ({ className, ...props }) => (
  <div
    className={cn('mt-1 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end', className)}
    {...props}
  />
);
AlertDialogFooter.displayName = 'AlertDialogFooter';

const AlertDialogTitle = React.forwardRef(({ className, id, ...props }, ref) => {
  const ids = React.useContext(AlertDialogIdsContext);
  return (
    <h2
      ref={ref}
      id={id || ids?.titleId}
      className={cn('text-xl font-bold leading-7 tracking-tight', className)}
      {...props}
    />
  );
});
AlertDialogTitle.displayName = 'AlertDialogTitle';

const AlertDialogDescription = React.forwardRef(({ className, id, ...props }, ref) => {
  const ids = React.useContext(AlertDialogIdsContext);
  return (
    <div
      ref={ref}
      id={id || ids?.descriptionId}
      className={cn('w-full text-sm leading-6 text-muted-foreground', className)}
      {...props}
    />
  );
});
AlertDialogDescription.displayName = 'AlertDialogDescription';

const TONE_STYLES = {
  orange: {
    iconBox: 'bg-orange-500/10 text-orange-600 dark:text-orange-300',
    title: 'text-orange-700 dark:text-orange-300',
    panel: 'border-orange-500/20 bg-orange-500/5',
    bullet: 'bg-orange-500',
  },
  green: {
    iconBox: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
    title: 'text-emerald-700 dark:text-emerald-300',
    panel: 'border-emerald-500/20 bg-emerald-500/5',
    bullet: 'bg-emerald-500',
  },
  red: {
    iconBox: 'bg-[#CC0033]/10 text-[#CC0033] dark:text-red-300',
    title: 'text-[#CC0033] dark:text-red-300',
    panel: 'border-[#CC0033]/20 bg-[#CC0033]/5',
    bullet: 'bg-[#CC0033]',
  },
};

function DialogIcon({ icon: Icon, tone }) {
  const styles = TONE_STYLES[tone] || TONE_STYLES.orange;
  return (
    <div className={cn('flex h-14 w-14 items-center justify-center rounded-2xl', styles.iconBox)}>
      <Icon className="h-7 w-7" aria-hidden="true" />
    </div>
  );
}

function ItemSummary({ entityLabel = 'Élément concerné', itemName, itemMeta }) {
  if (!itemName) return null;
  const metaItems = Array.isArray(itemMeta)
    ? itemMeta.filter(Boolean)
    : (itemMeta ? [itemMeta] : []);

  return (
    <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3 text-left dark:border-slate-800 dark:bg-slate-900">
      <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
        {entityLabel}
      </p>
      <p className="mt-1 break-words text-base font-bold text-slate-950 dark:text-white">
        {itemName}
      </p>
      {metaItems.length > 0 ? (
        <div className="mt-2 flex flex-wrap gap-2">
          {metaItems.map((meta, index) => (
            <span
              key={`${meta}-${index}`}
              className="rounded-md bg-white px-2 py-1 text-xs font-medium text-slate-600 shadow-sm dark:bg-slate-950 dark:text-slate-300"
            >
              {meta}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function ImpactList({ title, items = [], tone = 'orange' }) {
  const styles = TONE_STYLES[tone] || TONE_STYLES.orange;
  const visibleItems = items.filter(Boolean);
  if (visibleItems.length === 0) return null;

  return (
    <div className={cn('mt-4 rounded-lg border p-3 text-left', styles.panel)}>
      <p className="font-semibold text-foreground">{title}</p>
      <ul className="mt-2 space-y-2">
        {visibleItems.map((item, index) => (
          <li key={`${item}-${index}`} className="flex gap-2 text-sm text-muted-foreground">
            <span className={cn('mt-2 h-1.5 w-1.5 shrink-0 rounded-full', styles.bullet)} aria-hidden="true" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ConfirmationActions({
  onConfirm,
  onOpenChange,
  confirmLabel,
  pendingLabel,
  confirmVariant = 'default',
  confirmClassName,
  confirmIcon: ConfirmIcon,
}) {
  const [isConfirming, setIsConfirming] = React.useState(false);

  const handleConfirm = async () => {
    if (isConfirming) return;
    setIsConfirming(true);
    try {
      const result = await onConfirm?.();
      if (result !== false) {
        onOpenChange(false);
      }
    } catch (error) {
      console.error('Erreur de confirmation:', error);
    } finally {
      setIsConfirming(false);
    }
  };

  return (
    <AlertDialogFooter>
      <Button
        type="button"
        variant="outline"
        data-alert-dialog-cancel
        disabled={isConfirming}
        onClick={() => onOpenChange(false)}
      >
        Annuler
      </Button>
      <Button
        type="button"
        variant={confirmVariant}
        className={confirmClassName}
        disabled={isConfirming}
        onClick={handleConfirm}
      >
        {isConfirming ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
        ) : ConfirmIcon ? (
          <ConfirmIcon className="mr-2 h-4 w-4" aria-hidden="true" />
        ) : null}
        {isConfirming ? pendingLabel : confirmLabel}
      </Button>
    </AlertDialogFooter>
  );
}

const ConfirmDeactivateDialog = ({
  open,
  onOpenChange,
  onConfirm,
  title,
  description,
  itemName,
  itemMeta,
  entityLabel = 'Élément à désactiver',
}) => (
  <AlertDialog open={open} onOpenChange={onOpenChange}>
    <AlertDialogContent className="border-orange-500/30">
      <AlertDialogHeader>
        <DialogIcon icon={Power} tone="orange" />
        <AlertDialogTitle className={TONE_STYLES.orange.title}>
          {title || 'Confirmer la désactivation'}
        </AlertDialogTitle>
        <AlertDialogDescription>
          <p>
            {description || 'Cette action change le statut sans supprimer les informations enregistrées.'}
          </p>
          <ItemSummary entityLabel={entityLabel} itemName={itemName} itemMeta={itemMeta} />
          <ImpactList
            tone="orange"
            title="Conséquences de cette action"
            items={[
              'L’élément deviendra inactif et ne pourra plus être utilisé dans les nouvelles opérations.',
              'Toutes les données et l’historique existants seront conservés.',
              'Une réactivation restera possible ultérieurement.',
            ]}
          />
        </AlertDialogDescription>
      </AlertDialogHeader>
      <ConfirmationActions
        onConfirm={onConfirm}
        onOpenChange={onOpenChange}
        confirmLabel="Confirmer la désactivation"
        pendingLabel="Désactivation..."
        confirmIcon={Power}
        confirmClassName="bg-orange-500 text-white hover:bg-orange-600"
      />
    </AlertDialogContent>
  </AlertDialog>
);

const ConfirmActivateDialog = ({
  open,
  onOpenChange,
  onConfirm,
  title,
  description,
  itemName,
  itemMeta,
  entityLabel = 'Élément à réactiver',
}) => (
  <AlertDialog open={open} onOpenChange={onOpenChange}>
    <AlertDialogContent className="border-emerald-500/30">
      <AlertDialogHeader>
        <DialogIcon icon={CheckCircle} tone="green" />
        <AlertDialogTitle className={TONE_STYLES.green.title}>
          {title || 'Confirmer la réactivation'}
        </AlertDialogTitle>
        <AlertDialogDescription>
          <p>
            {description || 'Cette action remettra l’élément en service dans l’application.'}
          </p>
          <ItemSummary entityLabel={entityLabel} itemName={itemName} itemMeta={itemMeta} />
          <ImpactList
            tone="green"
            title="Après confirmation"
            items={[
              'Le statut redeviendra actif immédiatement.',
              'L’élément pourra de nouveau être sélectionné et utilisé.',
              'Les données et l’historique conservés resteront disponibles.',
            ]}
          />
        </AlertDialogDescription>
      </AlertDialogHeader>
      <ConfirmationActions
        onConfirm={onConfirm}
        onOpenChange={onOpenChange}
        confirmLabel="Confirmer la réactivation"
        pendingLabel="Réactivation..."
        confirmIcon={CheckCircle}
        confirmClassName="bg-emerald-600 text-white hover:bg-emerald-700"
      />
    </AlertDialogContent>
  </AlertDialog>
);

const ConfirmHardDeleteDialog = ({
  open,
  onOpenChange,
  onConfirm,
  title,
  description,
  itemName,
  itemMeta,
  warnings = [],
  entityLabel = 'Élément à supprimer',
}) => (
  <AlertDialog open={open} onOpenChange={onOpenChange}>
    <AlertDialogContent className="border-[#CC0033]/40">
      <AlertDialogHeader>
        <DialogIcon icon={AlertTriangle} tone="red" />
        <AlertDialogTitle className={TONE_STYLES.red.title}>
          {title || 'Confirmer la suppression définitive'}
        </AlertDialogTitle>
        <AlertDialogDescription>
          <p>
            {description || 'Vous êtes sur le point de supprimer définitivement cet élément et les données qui lui sont liées.'}
          </p>
          <ItemSummary entityLabel={entityLabel} itemName={itemName} itemMeta={itemMeta} />
          <ImpactList
            tone="red"
            title="Données concernées par la suppression"
            items={warnings}
          />
          <div className="mt-4 rounded-lg border border-[#CC0033]/30 bg-[#CC0033]/10 p-3 text-left">
            <p className="font-bold text-[#CC0033] dark:text-red-300">
              Cette action est irréversible.
            </p>
            <p className="mt-1 text-sm text-slate-700 dark:text-slate-200">
              Une fois confirmées, les données supprimées ne pourront pas être restaurées sans sauvegarde préalable.
            </p>
          </div>
        </AlertDialogDescription>
      </AlertDialogHeader>
      <ConfirmationActions
        onConfirm={onConfirm}
        onOpenChange={onOpenChange}
        confirmLabel="Supprimer définitivement"
        pendingLabel="Suppression..."
        confirmIcon={Trash2}
        confirmVariant="destructive"
      />
    </AlertDialogContent>
  </AlertDialog>
);

const ConfirmActionDialog = ({
  open,
  onOpenChange,
  onConfirm,
  title = 'Confirmer cette action',
  description,
  itemName,
  itemMeta,
  details = [],
  entityLabel = 'Action concernée',
  confirmLabel = 'Confirmer',
  pendingLabel = 'Traitement...',
}) => (
  <AlertDialog open={open} onOpenChange={onOpenChange}>
    <AlertDialogContent className="border-orange-500/30">
      <AlertDialogHeader>
        <DialogIcon icon={AlertTriangle} tone="orange" />
        <AlertDialogTitle className={TONE_STYLES.orange.title}>
          {title}
        </AlertDialogTitle>
        <AlertDialogDescription>
          {description ? <p>{description}</p> : null}
          <ItemSummary entityLabel={entityLabel} itemName={itemName} itemMeta={itemMeta} />
          <ImpactList
            tone="orange"
            title="Ce qui va se passer"
            items={details}
          />
        </AlertDialogDescription>
      </AlertDialogHeader>
      <ConfirmationActions
        onConfirm={onConfirm}
        onOpenChange={onOpenChange}
        confirmLabel={confirmLabel}
        pendingLabel={pendingLabel}
        confirmIcon={AlertTriangle}
        confirmClassName="bg-orange-500 text-white hover:bg-orange-600"
      />
    </AlertDialogContent>
  </AlertDialog>
);

export {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  ConfirmActionDialog,
  ConfirmDeactivateDialog,
  ConfirmActivateDialog,
  ConfirmHardDeleteDialog,
};
