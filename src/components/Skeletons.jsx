import React from 'react';

/* ─── Shimmer base ─────────────────────────────────── */
const shimmerClass =
    'relative overflow-hidden bg-slate-700/60 rounded-lg before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.4s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/8 before:to-transparent';

const S = ({ className = '' }) => (
    <div className={`${shimmerClass} ${className}`} />
);

/* ─── Dashboard Skeleton ──────────────────────────── */
export function DashboardSkeleton() {
    return (
        <div className="space-y-6 animate-pulse-subtle">
            {/* Title */}
            <div className="flex items-center justify-between">
                <S className="h-9 w-48 rounded-xl" />
            </div>

            {/* Stat cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-lg">
                        <div className="flex justify-between items-start">
                            <div className="space-y-2 flex-1">
                                <S className="h-3.5 w-28 rounded-md" />
                                <S className="h-8 w-32 rounded-md mt-2" />
                            </div>
                            <S className="h-12 w-12 rounded-xl flex-shrink-0" />
                        </div>
                    </div>
                ))}
            </div>

            {/* Charts header */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between mt-10 mb-2 gap-4">
                <S className="h-8 w-52 rounded-xl" />
                <S className="h-10 w-36 rounded-lg" />
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-slate-800 rounded-2xl p-6 border border-slate-700 h-96">
                    <S className="h-5 w-64 mb-6 rounded-md" />
                    {/* Bar chart skeleton */}
                    <div className="flex items-end gap-2 h-64 px-4">
                        {[60, 85, 40, 70, 55, 90, 45, 75, 50, 65, 30, 80].map((h, i) => (
                            <div key={i} className="flex-1 flex flex-col items-center gap-1">
                                <S className="w-full rounded-sm" style={{ height: `${h}%` }} />
                            </div>
                        ))}
                    </div>
                </div>
                <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700 h-96 flex flex-col">
                    <S className="h-5 w-48 mb-4 rounded-md" />
                    {/* Pie chart skeleton */}
                    <div className="flex-1 flex items-center justify-center">
                        <div className="relative">
                            <div className={`${shimmerClass} w-44 h-44 rounded-full`} />
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-20 h-20 rounded-full bg-slate-800" />
                            </div>
                        </div>
                    </div>
                    <div className="space-y-2 mt-4">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="flex items-center gap-2">
                                <S className="h-3 w-3 rounded-full flex-shrink-0" />
                                <S className="h-3 flex-1 rounded-md" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

/* ─── Events Skeleton ─────────────────────────────── */
export function EventsSkeleton() {
    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <S className="h-9 w-32 rounded-xl" />
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <S className="h-10 w-48 rounded-xl flex-1 md:flex-none" />
                    <S className="h-10 w-24 rounded-xl" />
                    <S className="h-10 w-36 rounded-xl" />
                </div>
            </div>

            {/* Monthly group */}
            {[...Array(2)].map((_, g) => (
                <div key={g} className="mb-8">
                    <div className="flex items-center gap-3 mb-4 pb-2 border-b border-slate-700">
                        <S className="h-6 w-32 rounded-md" />
                        <S className="h-4 w-8 rounded-md" />
                    </div>
                    <div className="space-y-4">
                        {[...Array(g === 0 ? 3 : 2)].map((_, i) => (
                            <div key={i} className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden">
                                <div className="p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                    <div className="space-y-2 flex-1">
                                        <S className="h-6 w-48 rounded-md" />
                                        <div className="flex flex-wrap gap-4 mt-2">
                                            <S className="h-4 w-24 rounded-md" />
                                            <S className="h-4 w-20 rounded-md" />
                                            <S className="h-4 w-28 rounded-md" />
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <S className="h-8 w-8 rounded-lg" />
                                        <S className="h-8 w-8 rounded-lg" />
                                        <S className="h-8 w-28 rounded-lg" />
                                        <S className="h-6 w-6 rounded-md" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}

/* ─── Suppliers Skeleton ──────────────────────────── */
export function SuppliersSkeleton() {
    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <S className="h-9 w-40 rounded-xl" />
                <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
                    <S className="h-10 w-full sm:w-64 rounded-xl" />
                    <S className="h-10 w-32 rounded-xl flex-shrink-0" />
                </div>
            </div>

            {/* Grid of supplier cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(6)].map((_, i) => (
                    <div key={i} className="bg-slate-800 p-5 rounded-2xl border border-slate-700 flex flex-col justify-between">
                        <div className="space-y-2">
                            <S className="h-6 w-36 rounded-md" />
                            <S className="h-4 w-24 rounded-md" />
                            <S className="h-4 w-40 rounded-md mt-2" />
                            <S className="h-4 w-32 rounded-md" />
                        </div>
                        <div className="flex gap-2 mt-6 justify-end">
                            <S className="h-8 w-8 rounded-lg" />
                            <S className="h-8 w-8 rounded-lg" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

/* ─── Payments Skeleton ───────────────────────────── */
export function PaymentsSkeleton() {
    return (
        <div className="space-y-6" dir="rtl">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <S className="h-9 w-32 rounded-xl" />
                <S className="h-10 w-full md:w-72 rounded-xl" />
            </div>

            {/* Balance rows */}
            <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                    <div key={i} className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden">
                        <div className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                            {/* Left: Avatar + name */}
                            <div className="flex items-center gap-3">
                                <S className="w-10 h-10 rounded-full flex-shrink-0" />
                                <div className="space-y-1.5">
                                    <S className="h-4 w-28 rounded-md" />
                                    <S className="h-3 w-16 rounded-md" />
                                </div>
                            </div>
                            {/* Right: badges + actions */}
                            <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                                <div className="flex gap-2">
                                    <S className="h-6 w-20 rounded-full" />
                                </div>
                                <div className="flex items-center gap-2">
                                    <S className="h-7 w-20 rounded-lg" />
                                    <S className="h-7 w-7 rounded-lg" />
                                    <S className="h-5 w-5 rounded-md" />
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

/* ─── Partners Skeleton ───────────────────────────── */
export function PartnersSkeleton() {
    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <S className="h-9 w-28 rounded-xl" />
                <S className="h-10 w-36 rounded-xl" />
            </div>

            {/* Progress bar card */}
            <div className="bg-slate-800 rounded-2xl p-5 border border-slate-700">
                <div className="flex justify-between items-center mb-3">
                    <S className="h-4 w-28 rounded-md" />
                    <S className="h-4 w-16 rounded-md" />
                </div>
                <S className="h-4 w-full rounded-full" />
            </div>

            {/* Partner cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(3)].map((_, i) => (
                    <div key={i} className="bg-slate-800 rounded-2xl p-5 border border-slate-700">
                        <div className="flex justify-between items-start mb-4">
                            <div className="space-y-2">
                                <S className="h-6 w-32 rounded-md" />
                                <S className="h-3 w-24 rounded-md" />
                            </div>
                            <div className="flex gap-1">
                                <S className="h-8 w-8 rounded-lg" />
                                <S className="h-8 w-8 rounded-lg" />
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <S className="h-3 flex-1 rounded-full" />
                            <S className="h-5 w-10 rounded-md" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
