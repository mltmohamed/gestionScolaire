import * as React from 'react';
import { AlertTriangle, Power, Trash2, X, CheckCircle } from 'lucide-react';
import { cn } from '@/utils/cn';
import { Button } from './button';

const AlertDialog = ({ open, onOpenChange, children }) => {
  if (!open) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
        onClick={() => onOpenChange(false)}
      />
      <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none p-4">
        <div className="pointer-events-auto w-full max-w-md">
          {React.Children.map(children, child =>
            React.cloneElement(child, { onOpenChange })
          )}
        </div>
      </div>
    </>
  );
};

const AlertDialogContent = React.forwardRef(({ className, children, onOpenChange }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        "relative z-50 grid w-full gap-4 border bg-background p-6 shadow-lg rounded-lg animate-in fade-in zoom-in-95 duration-200",
        className
      )}
    >
      {children}
    </div>
  );
});
AlertDialogContent.displayName = "AlertDialogContent";

const AlertDialogHeader = ({ className, ...props }) => (
  <div
    className={cn("flex flex-col space-y-2 text-center sm:text-left", className)}
    {...props}
  />
);
AlertDialogHeader.displayName = "AlertDialogHeader";

const AlertDialogFooter = ({ className, ...props }) => (
  <div
    className={cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 mt-4", className)}
    {...props}
  />
);
AlertDialogFooter.displayName = "AlertDialogFooter";

const AlertDialogTitle = React.forwardRef(({ className, ...props }, ref) => (
  <h2
    ref={ref}
    className={cn("text-lg font-semibold leading-none tracking-tight", className)}
    {...props}
  />
));
AlertDialogTitle.displayName = "AlertDialogTitle";

const AlertDialogDescription = React.forwardRef(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
));
AlertDialogDescription.displayName = "AlertDialogDescription";

// Pre-configured alert dialogs for common use cases
const ConfirmDeactivateDialog = ({ open, onOpenChange, onConfirm, title, description, itemName }) => {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
              <Power className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            </div>
            <AlertDialogTitle className="text-orange-600 dark:text-orange-400">
              {title || 'Désactiver'}
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription className="pt-2">
            {description || (
              <>
                Voulez-vous désactiver <strong>{itemName}</strong> ?
                <br /><br />
                <span className="text-amber-600 dark:text-amber-400">
                  L'élément sera marqué comme inactif mais toutes les données seront conservées.
                </span>
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button
            type="button"
            variant="default"
            className="bg-orange-500 hover:bg-orange-600 text-white"
            onClick={() => {
              onConfirm();
              onOpenChange(false);
            }}
          >
            <Power className="mr-2 h-4 w-4" />
            Désactiver
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

const ConfirmActivateDialog = ({ open, onOpenChange, onConfirm, title, description, itemName }) => {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <AlertDialogTitle className="text-green-600 dark:text-green-400">
              {title || 'Réactiver'}
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription className="pt-2">
            {description || (
              <>
                Voulez-vous réactiver <strong>{itemName}</strong> ?
                <br /><br />
                <span className="text-green-600 dark:text-green-400">
                  L'élément sera marqué comme actif et pourra être utilisé à nouveau.
                </span>
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button
            type="button"
            variant="default"
            className="bg-green-500 hover:bg-green-600 text-white"
            onClick={() => {
              onConfirm();
              onOpenChange(false);
            }}
          >
            <CheckCircle className="mr-2 h-4 w-4" />
            Réactiver
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

const ConfirmHardDeleteDialog = ({ open, onOpenChange, onConfirm, title, description, itemName, warnings }) => {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="border-destructive/50">
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
            <AlertDialogTitle className="text-destructive">
              {title || 'Suppression définitive'}
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription className="pt-2">
            {description || (
              <>
                Vous êtes sur le point de supprimer définitivement <strong className="text-foreground">{itemName}</strong>.
                <br /><br />
                <span className="text-destructive font-medium">⚠️ Cette action est irréversible.</span>
                <br /><br />
                {warnings && (
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                    {warnings.map((warning, idx) => (
                      <li key={idx}>{warning}</li>
                    ))}
                  </ul>
                )}
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={() => {
              onConfirm();
              onOpenChange(false);
            }}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Supprimer définitivement
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  ConfirmDeactivateDialog,
  ConfirmActivateDialog,
  ConfirmHardDeleteDialog,
};
