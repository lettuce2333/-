import React from 'react';
import { cn } from './utils';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  accent?: boolean;
}

export function Card({ className, children, accent, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'relative rounded-[var(--radius-md)] border border-[var(--color-border-light)] bg-[var(--color-surface)] shadow-[var(--shadow-card)] transition-shadow duration-250',
        'hover:shadow-[var(--shadow-md)]',
        accent && 'before:absolute before:inset-x-0 before:top-0 before:h-[3px] before:rounded-t-[var(--radius-md)] before:bg-[var(--color-accent)]',
        accent && 'pt-[3px]',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('border-b border-[var(--color-border-light)] px-5 py-4', className)} {...props}>{children}</div>;
}

export function CardContent({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('px-5 py-4', className)} {...props}>{children}</div>;
}

export function CardFooter({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('border-t border-[var(--color-border-light)] px-5 py-4', className)} {...props}>{children}</div>;
}
