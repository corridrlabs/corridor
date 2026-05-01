import React from 'react';

interface SkeletonProps {
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = '' }) => (
  <div className={`animate-pulse rounded-xl bg-slate-200/80 ${className}`} />
);

export const DashboardSkeleton: React.FC = () => (
  <div className="space-y-8 pb-20">
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div className="space-y-3">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-4 w-80" />
      </div>
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-10 w-36" />
      </div>
    </div>

    <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-5">
      <Skeleton className="h-5 w-72" />
      <Skeleton className="mt-3 h-4 w-full" />
      <Skeleton className="mt-2 h-4 w-3/4" />
      <Skeleton className="mt-4 h-9 w-44" />
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <Skeleton className="h-10 w-10 rounded-2xl" />
            <Skeleton className="h-4 w-14" />
          </div>
          <Skeleton className="mt-5 h-4 w-32" />
          <Skeleton className="mt-3 h-8 w-36" />
        </div>
      ))}
    </div>

    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-5">
            <Skeleton className="h-10 w-10 rounded-xl" />
            <Skeleton className="h-5 w-36" />
          </div>
          <Skeleton className="h-4 w-full" />
          <div className="mt-4 space-y-3">
            {Array.from({ length: 4 }).map((__, j) => (
              <div key={j} className="rounded-xl border border-slate-100 p-3">
                <Skeleton className="h-4 w-3/4" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>

    <div className="rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-sm">
      <Skeleton className="h-6 w-44" />
      <div className="mt-5 space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between">
            <div className="space-y-2">
              <Skeleton className="h-4 w-72" />
              <Skeleton className="h-3 w-28" />
            </div>
            <Skeleton className="h-4 w-24" />
          </div>
        ))}
      </div>
    </div>
  </div>
);

export const GenericPageSkeleton: React.FC<{ showSearch?: boolean; cardRows?: number }> = ({
  showSearch = false,
  cardRows = 6,
}) => (
  <div className="space-y-6">
    <div className="flex items-center justify-between gap-4">
      <div className="space-y-3">
        <Skeleton className="h-8 w-52" />
        <Skeleton className="h-4 w-96" />
      </div>
      <Skeleton className="h-10 w-36" />
    </div>

    {showSearch && <Skeleton className="h-12 w-full rounded-2xl" />}

    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: cardRows }).map((_, i) => (
        <div key={i} className="rounded-2xl border border-slate-200 bg-white p-6">
          <div className="flex items-center justify-between">
            <Skeleton className="h-10 w-10 rounded-xl" />
            <Skeleton className="h-4 w-16" />
          </div>
          <Skeleton className="mt-4 h-5 w-2/3" />
          <Skeleton className="mt-3 h-4 w-full" />
          <Skeleton className="mt-2 h-4 w-4/5" />
        </div>
      ))}
    </div>
  </div>
);

export const TablePageSkeleton: React.FC<{ rows?: number }> = ({ rows = 6 }) => (
  <div className="space-y-6">
    <div className="flex items-center justify-between gap-4">
      <div className="space-y-3">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-4 w-80" />
      </div>
      <Skeleton className="h-10 w-36" />
    </div>

    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
      <div className="grid grid-cols-5 gap-4 border-b border-slate-200 p-4 bg-slate-50">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-4 w-20" />
        ))}
      </div>
      <div className="divide-y divide-slate-100">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="grid grid-cols-5 gap-4 p-4">
            {Array.from({ length: 5 }).map((__, j) => (
              <Skeleton key={j} className="h-4 w-full" />
            ))}
          </div>
        ))}
      </div>
    </div>
  </div>
);

export const GoalDetailSkeleton: React.FC = () => (
  <div className="max-w-6xl mx-auto pb-20 px-4 space-y-10">
    <div className="flex items-center justify-between">
      <Skeleton className="h-8 w-36" />
      <div className="flex gap-3">
        <Skeleton className="h-12 w-12" />
        <Skeleton className="h-12 w-52" />
      </div>
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
      <div className="lg:col-span-2 rounded-[2rem] border border-slate-200 bg-white overflow-hidden">
        <Skeleton className="h-72 w-full rounded-none" />
        <div className="p-8 space-y-5">
          <Skeleton className="h-10 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>

      <div className="rounded-[2rem] border border-slate-200 bg-white p-8 space-y-5">
        <Skeleton className="h-10 w-40" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    </div>
  </div>
);
