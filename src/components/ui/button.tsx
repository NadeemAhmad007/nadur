import { forwardRef, ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

const variants = {
  primary: 'bg-accent text-white hover:bg-accent-light shadow-sm hover:shadow active:scale-[0.98]',
  secondary: 'bg-secondary text-secondary-foreground hover:bg-border active:scale-[0.98]',
  outline: 'border-2 border-border bg-card hover:border-accent/40 hover:bg-accent/[0.03] active:scale-[0.98]',
  ghost: 'text-muted-foreground hover:text-foreground hover:bg-secondary active:scale-[0.98]',
  danger: 'bg-danger text-danger-foreground hover:opacity-90 active:scale-[0.98]',
  accent: 'bg-primary text-primary-foreground hover:bg-primary-light shadow-sm hover:shadow active:scale-[0.98]',
} as const;

const sizes = {
  sm: 'h-9 px-3.5 text-xs gap-1.5 rounded-lg',
  md: 'h-10 px-5 text-sm gap-2 rounded-xl',
  lg: 'h-12 px-7 text-base gap-2 rounded-xl',
  icon: 'h-10 w-10 rounded-xl',
} as const;

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center font-medium transition-all duration-150',
          'focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2',
          'disabled:pointer-events-none disabled:opacity-50',
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';
