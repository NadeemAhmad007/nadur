import { forwardRef, InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
    return (
      <div className="space-y-1.5">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-foreground">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            'flex h-10 w-full rounded-xl border border-input bg-card px-3.5 py-2 text-sm',
            'placeholder:text-muted-foreground/60',
            'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-0 focus:border-ring',
            'disabled:cursor-not-allowed disabled:opacity-50',
            'transition-all duration-150',
            error && 'border-danger focus:ring-danger focus:border-danger',
            className
          )}
          {...props}
        />
        {hint && !error && (
          <p className="text-xs text-muted-foreground/70">{hint}</p>
        )}
        {error && (
          <p className="text-xs text-danger">{error}</p>
        )}
      </div>
    );
  }
);
Input.displayName = 'Input';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
    return (
      <div className="space-y-1.5">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-foreground">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={inputId}
          className={cn(
            'flex min-h-[80px] w-full rounded-xl border border-input bg-card px-3.5 py-2 text-sm',
            'placeholder:text-muted-foreground/60',
            'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-0 focus:border-ring',
            'disabled:cursor-not-allowed disabled:opacity-50',
            'transition-all duration-150 resize-y',
            error && 'border-danger focus:ring-danger focus:border-danger',
            className
          )}
          {...props}
        />
        {error && <p className="text-xs text-danger">{error}</p>}
      </div>
    );
  }
);
Textarea.displayName = 'Textarea';
