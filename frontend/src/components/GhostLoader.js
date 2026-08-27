import React, { useId } from 'react';

/**
 * Calculates column header skeleton width.
 */
const getHeaderWidth = (colIndex, totalCols) => {
    if (colIndex === 0) return '45%';
    if (colIndex === totalCols - 1) return '50px';
    return '30%';
};

/**
 * Renders the content of a skeleton table cell based on its column position.
 */
const renderCellContent = (colIndex, totalCols) => {
    if (colIndex === 0) {
        return (
            <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-2xl bg-slate-300/50 dark:bg-slate-700/50 shrink-0"></div>
                <div className="flex flex-col gap-1.5 flex-1">
                    <div className="h-3.5 w-3/4 rounded-md bg-slate-300/60 dark:bg-slate-700/60"></div>
                    <div className="h-2.5 w-1/3 rounded-md bg-slate-300/40 dark:bg-slate-700/40"></div>
                </div>
            </div>
        );
    }

    if (colIndex === totalCols - 1) {
        return (
            <div className="flex justify-end gap-2">
                <div className="w-8 h-8 rounded-xl bg-slate-300/50 dark:bg-slate-700/50"></div>
                <div className="w-8 h-8 rounded-xl bg-slate-300/50 dark:bg-slate-700/50"></div>
            </div>
        );
    }

    const cellWidth = colIndex === 1 ? '60%' : '40%';
    return (
        <div 
            className="h-3.5 rounded-md bg-slate-300/50 dark:bg-slate-700/50"
            style={{ width: cellWidth }}
        ></div>
    );
};

/**
 * TableGhostLoader - Renders skeleton ghost layout matching the exact geometry of glass tables and mobile card views.
 * Prevents Cumulative Layout Shift (CLS) and provides a smooth, flicker-free loading experience.
 */
export const TableGhostLoader = ({ rows = 5, columns = 4, showFilter = true }) => {
    const baseId = useId();
    const rowList = Array.from({ length: rows }, (_, idx) => `${baseId}-row-${idx}`);
    const colList = Array.from({ length: columns }, (_, idx) => `${baseId}-col-${idx}`);

    return (
        <div className="w-full da-fade-in" aria-busy="true" aria-label="Cargando contenido...">
            {/* Top Bar Skeleton (Filter / Search bar) */}
            {showFilter && (
                <div className="flex justify-end mb-3">
                    <div className="w-full sm:w-64 h-10 rounded-2xl bg-white/40 dark:bg-slate-800/40 border border-white/60 dark:border-white/10 animate-pulse"></div>
                </div>
            )}

            {/* 1. Desktop Table Skeleton */}
            <div className="hidden md:block overflow-x-auto rounded-3xl border border-white/60 dark:border-white/10 bg-white/40 dark:bg-slate-800/40 backdrop-blur-xl shadow-[0_8px_32px_0_rgba(31,38,135,0.06)] animate-pulse">
                <table className="w-full text-left border-collapse align-middle">
                    <thead>
                        <tr className="border-b border-white/40 dark:border-white/10 bg-white/50 dark:bg-slate-800/60 h-12">
                            {colList.map((colKey, i) => (
                                <th key={colKey} className="py-4 px-5">
                                    <div 
                                        className="h-3.5 rounded-md bg-slate-300/60 dark:bg-slate-700/60"
                                        style={{ width: getHeaderWidth(i, columns) }}
                                    ></div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/40 dark:divide-white/10">
                        {rowList.map((rowKey) => (
                            <tr key={rowKey} className="h-16">
                                {colList.map((colKey, cIdx) => (
                                    <td key={`${rowKey}-${colKey}`} className="py-4 px-5">
                                        {renderCellContent(cIdx, columns)}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* 2. Mobile Cards Skeleton */}
            <div className="md:hidden flex flex-col gap-3 mt-2 animate-pulse">
                {rowList.map((cardKey) => (
                    <div 
                        key={`m-${cardKey}`} 
                        className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-md shadow-sm rounded-2xl p-4 border border-white/40 dark:border-white/10 flex flex-col gap-3"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-slate-300/50 dark:bg-slate-700/50 shrink-0"></div>
                            <div className="flex-1 flex flex-col gap-2">
                                <div className="h-4 w-3/4 rounded-md bg-slate-300/60 dark:bg-slate-700/60"></div>
                                <div className="h-3 w-1/3 rounded-md bg-slate-300/40 dark:bg-slate-700/40"></div>
                            </div>
                            <div className="w-16 h-6 rounded-full bg-slate-300/40 dark:bg-slate-700/40"></div>
                        </div>
                        <div className="flex justify-end gap-2 pt-2 border-t border-slate-200/50 dark:border-slate-700/50">
                            <div className="w-8 h-8 rounded-xl bg-slate-300/50 dark:bg-slate-700/50"></div>
                            <div className="w-8 h-8 rounded-xl bg-slate-300/50 dark:bg-slate-700/50"></div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

/**
 * CardGhostLoader - Renders skeleton ghost card for details or page validation loading.
 */
export const CardGhostLoader = () => {
    return (
        <div className="da-container flex items-center justify-center min-h-[60vh] da-fade-in" aria-busy="true">
            <div className="da-ghost-card w-full max-w-2xl mx-auto my-auto p-6 sm:p-8 animate-pulse">
                <div className="h-8 w-1/2 rounded-xl bg-slate-300/60 dark:bg-slate-700/60 mb-4"></div>
                <div className="h-4 w-3/4 rounded-lg bg-slate-300/40 dark:bg-slate-700/40 mb-6"></div>
                <div className="flex flex-col gap-3">
                    <div className="h-12 w-full rounded-2xl bg-slate-300/30 dark:bg-slate-700/30"></div>
                    <div className="h-12 w-4/5 rounded-2xl bg-slate-300/30 dark:bg-slate-700/30"></div>
                    <div className="h-12 w-3/5 rounded-2xl bg-slate-300/30 dark:bg-slate-700/30"></div>
                </div>
            </div>
        </div>
    );
};

/**
 * QRGhostLoader - Renders skeleton ghost layout for QR code generator.
 */
export const QRGhostLoader = () => {
    return (
        <div className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-10 py-6 w-full da-fade-in animate-pulse" aria-busy="true">
            {/* Left QR Frame Skeleton */}
            <div className="w-64 h-64 rounded-3xl bg-slate-300/40 dark:bg-slate-700/40 border border-white/60 dark:border-white/10 shrink-0 shadow-inner"></div>
            {/* Right Side Skeleton Info */}
            <div className="flex flex-col items-center md:items-start text-center md:text-left w-full max-w-xs gap-3">
                <div className="h-8 w-full rounded-xl bg-slate-300/60 dark:bg-slate-700/60"></div>
                <div className="h-4 w-3/4 rounded-lg bg-slate-300/40 dark:bg-slate-700/40"></div>
                <div className="h-12 w-44 rounded-3xl bg-slate-300/50 dark:bg-slate-700/50 my-2"></div>
                <div className="h-2.5 w-full rounded-full bg-slate-300/30 dark:bg-slate-700/30"></div>
            </div>
        </div>
    );
};

export default CardGhostLoader;
