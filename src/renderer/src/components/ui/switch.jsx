import * as React from 'react';
import { cn } from '@/utils/cn';

const Switch = React.forwardRef(({ className, ...props }, ref) => (
  <button
    type="button"
    ref={ref}
    role="switch"
    aria-checked={props.checked}
    data-state={props.checked ? 'checked' : 'unchecked'}
    className={cn(
      "peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066CC] focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50",
      props.checked 
        ? "bg-[#0066CC]" 
        : "bg-gray-300 dark:bg-gray-700",
      className
    )}
    {...props}
  >
    <span
      data-state={props.checked ? 'checked' : 'unchecked'}
      className={cn(
        "pointer-events-none block h-5 w-5 rounded-full bg-white shadow-lg ring-0 transition-transform",
        props.checked ? "translate-x-5" : "translate-x-0"
      )}
    />
  </button>
));
Switch.displayName = "Switch";

export { Switch };
