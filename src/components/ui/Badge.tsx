import React from 'react';
import { cn } from '@/lib/utils';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple' | 'outline';
  size?: 'sm' | 'md';
}

export function Badge({
  className,
  variant = 'default',
  size = 'md',
  children,
  ...props
}: BadgeProps) {
  const variants = {
    default:
      'bg-[#F1F5F9] dark:bg-[#1E293B] text-[#334155] dark:text-[#CBD5E1] border-[#CBD5E1] dark:border-[#334155]',
    success:
      'bg-[#DCFCE7] dark:bg-[#14532D] text-[#166534] dark:text-[#BBF7D0] border-[#86EFAC] dark:border-[#22C55E]',
    warning:
      'bg-[#FEF3C7] dark:bg-[#78350F] text-[#92400E] dark:text-[#FEF3C7] border-[#FCD34D] dark:border-[#F59E0B]',
    danger:
      'bg-[#FEE2E2] dark:bg-[#7F1D1D] text-[#991B1B] dark:text-[#FECACA] border-[#FCA5A5] dark:border-[#EF4444]',
    info:
      'bg-[#E0F2FE] dark:bg-[#0C4A6E] text-[#0369A1] dark:text-[#38BDF8] border-[#7DD3FC] dark:border-[#0284C7]',
    purple:
      'bg-[#EDE9FE] dark:bg-[#2E1065] text-[#5B21B6] dark:text-[#DDD6FE] border-[#C4B5FD] dark:border-[#7C3AED]',
    outline:
      'bg-transparent text-[#475569] dark:text-[#CBD5E1] border-[#CBD5E1] dark:border-[#475569]',
  };

  const sizes = {
    sm: 'text-[10px] px-1.5 py-0.5 rounded font-medium',
    md: 'text-xs px-2.5 py-0.5 rounded-full font-semibold',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 leading-none whitespace-nowrap border',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
