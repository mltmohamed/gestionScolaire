import * as React from 'react';
import { X } from 'lucide-react';
import { cn } from '@/utils/cn';
import { Button } from './button';

const Dialog = ({ open, onOpenChange, children }) => {
  if (!open) return null;
  
  return (
    <>
      <div 
        className="fixed inset-0 z-40 bg-black/80"
        onClick={() => onOpenChange(false)}
      />
      <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
        <div className="pointer-events-auto">
          {React.Children.map(children, child => 
            React.cloneElement(child, { onOpenChange })
          )}
        </div>
      </div>
    </>
  );
};

const DialogContent = React.forwardRef(({ className, children, onOpenChange }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        "relative z-50 grid w-full max-w-lg gap-4 border bg-background p-6 shadow-lg sm:rounded-lg",
        className
      )}
    >
      {children}
      <Button
        variant="ghost"
        size="icon"
        className="absolute right-4 top-4"
        onClick={() => onOpenChange(false)}
      >
        <X className="h-4 w-4" />
        <span className="sr-only">Fermer</span>
      </Button>
    </div>
  );
});
DialogContent.displayName = "DialogContent";

const DialogHeader = ({ className, ...props }) => (
  <div
    className={cn("flex flex-col space-y-1.5 text-center sm:text-left", className)}
    {...props}
  />
);
DialogHeader.displayName = "DialogHeader";

const DialogFooter = ({ className, ...props }) => (
  <div
    className={cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2", className)}
    {...props}
  />
);
DialogFooter.displayName = "DialogFooter";

const DialogTitle = React.forwardRef(({ className, ...props }, ref) => (
  <h2
    ref={ref}
    className={cn("text-lg font-semibold leading-none tracking-tight", className)}
    {...props}
  />
));
DialogTitle.displayName = "DialogTitle";

const DialogDescription = React.forwardRef(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
));
DialogDescription.displayName = "DialogDescription";

export {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
};
