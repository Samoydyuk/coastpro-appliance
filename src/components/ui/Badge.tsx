import { cn } from '@/lib/utils';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
  size?: 'sm' | 'md';
  children: React.ReactNode;
}

export function Badge({
  className,
  variant = 'default',
  size = 'md',
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center font-heading font-semibold uppercase tracking-label rounded-card border',
        {
          'border-primary-500/40 text-primary-600': variant === 'default',
          'border-primary-700/50 bg-primary-700 text-cream': variant === 'success',
          'border-accent-500/50 text-accent-700': variant === 'warning',
          'border-red-800/40 text-red-800': variant === 'error',
          'border-ink/70 bg-ink text-cream': variant === 'info',
        },
        {
          'px-2 py-0.5 text-[10px]': size === 'sm',
          'px-3 py-1 text-[11px]': size === 'md',
        },
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
