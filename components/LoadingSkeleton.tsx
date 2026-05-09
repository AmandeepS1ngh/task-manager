'use client';

interface LoadingSkeletonProps {
  variant?: 'card' | 'row' | 'stat';
  count?: number;
}

function StatSkeleton() {
  return (
    <div className="bg-[var(--color-surface)] rounded-xl p-5 border border-[var(--color-border)] animate-pulse">
      <div className="flex items-center justify-between">
        <div>
          <div className="h-4 w-20 bg-[var(--color-border)] rounded mb-2" />
          <div className="h-8 w-12 bg-[var(--color-border)] rounded" />
        </div>
        <div className="w-12 h-12 bg-[var(--color-border)] rounded-xl" />
      </div>
    </div>
  );
}

function CardSkeleton() {
  return (
    <div className="bg-[var(--color-surface)] rounded-xl p-5 border border-[var(--color-border)] animate-pulse">
      <div className="flex items-start justify-between mb-3">
        <div className="h-5 w-32 bg-[var(--color-border)] rounded" />
        <div className="h-5 w-14 bg-[var(--color-border)] rounded-full" />
      </div>
      <div className="h-4 w-full bg-[var(--color-border)] rounded mb-2" />
      <div className="h-4 w-2/3 bg-[var(--color-border)] rounded mb-4" />
      <div className="flex gap-4">
        <div className="h-3 w-20 bg-[var(--color-border)] rounded" />
        <div className="h-3 w-16 bg-[var(--color-border)] rounded" />
      </div>
    </div>
  );
}

function RowSkeleton() {
  return (
    <div className="flex items-center gap-4 p-3 animate-pulse">
      <div className="h-4 w-4/12 bg-[var(--color-border)] rounded" />
      <div className="h-4 w-2/12 bg-[var(--color-border)] rounded" />
      <div className="h-4 w-2/12 bg-[var(--color-border)] rounded" />
      <div className="h-4 w-1/12 bg-[var(--color-border)] rounded-full" />
    </div>
  );
}

export default function LoadingSkeleton({
  variant = 'card',
  count = 3,
}: LoadingSkeletonProps) {
  const Component =
    variant === 'stat'
      ? StatSkeleton
      : variant === 'row'
        ? RowSkeleton
        : CardSkeleton;

  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <Component key={i} />
      ))}
    </>
  );
}
