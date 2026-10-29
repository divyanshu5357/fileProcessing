import React from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'gradient';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] dark:focus-visible:ring-[#60A5FA] disabled:opacity-60 disabled:cursor-not-allowed select-none active:scale-[0.98] cursor-pointer';

    const variants = {
      primary:
        'bg-[#2563EB] hover:bg-[#1D4ED8] dark:bg-[#3B82F6] dark:hover:bg-[#60A5FA] text-white shadow-xs font-semibold',
      secondary:
        'bg-[#E2E8F0] hover:bg-[#CBD5E1] text-[#0F172A] dark:bg-[#334155] dark:hover:bg-[#475569] dark:text-[#F8FAFC] border border-[#CBD5E1] dark:border-[#475569]',
      outline:
        'border border-[#CBD5E1] hover:bg-[#F1F5F9] text-[#334155] dark:border-[#475569] dark:text-[#CBD5E1] dark:hover:bg-[#1E293B]',
      ghost:
        'text-[#334155] hover:bg-[#F1F5F9] dark:text-[#CBD5E1] dark:hover:bg-[#1E293B] hover:text-[#0F172A] dark:hover:text-[#F8FAFC]',
      danger:
        'bg-[#DC2626] hover:bg-[#B91C1C] text-white dark:bg-[#EF4444] dark:hover:bg-[#DC2626] shadow-xs font-semibold',
      gradient:
        'bg-gradient-to-r from-[#2563EB] via-indigo-600 to-purple-600 hover:opacity-95 text-white shadow-sm font-semibold',
    };

    const sizes = {
      sm: 'text-xs px-3 py-1.5 gap-1.5',
      md: 'text-sm px-4 py-2 gap-2',
      lg: 'text-base px-5 py-2.5 gap-2.5',
      icon: 'h-9 w-9 p-0',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {isLoading && <Loader2 className="h-4 w-4 animate-spin shrink-0" />}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
