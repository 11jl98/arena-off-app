import { cn } from '@/lib/utils';

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('animate-pulse rounded-md bg-muted', className)}
      {...props}
      style={{ backgroundColor: 'hsl(var(--muted))' }}
    />
  );
}

export { Skeleton };
