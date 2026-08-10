import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center rounded-card font-heading font-semibold uppercase tracking-label transition-colors duration-200',
          'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-offset-2 focus-visible:ring-offset-cream',
          'disabled:pointer-events-none disabled:opacity-50',
          {
            'bg-ink text-cream hover:bg-primary-800 focus-visible:ring-ink':
              variant === 'primary',
            'bg-primary-500 text-cream hover:bg-primary-600 focus-visible:ring-primary-600':
              variant === 'secondary',
            'border border-ink/80 text-ink hover:bg-ink hover:text-cream focus-visible:ring-ink':
              variant === 'outline',
            'text-primary-600 hover:text-ink focus-visible:ring-primary-500':
              variant === 'ghost',
          },
          {
            'h-9 px-5 text-[11px] gap-1.5': size === 'sm',
            'h-11 px-7 text-xs gap-2': size === 'md',
            'h-14 px-10 text-sm gap-2.5': size === 'lg',
          },
          className
        )}
        disabled={disabled || isLoading}
        aria-busy={isLoading}
        {...props}
      >
        {isLoading ? (
          <>
            <svg
              className="h-4 w-4 animate-spin"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span className="sr-only">Loading</span>
          </>
        ) : (
          <>
            {leftIcon && <span className="shrink-0">{leftIcon}</span>}
            {children}
            {rightIcon && <span className="shrink-0">{rightIcon}</span>}
          </>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';
