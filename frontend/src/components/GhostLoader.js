import React from 'react';

const getColumnWidth = (colIndex, columns) => {
    if (colIndex === 0) return '120px';
    if (colIndex === columns - 1) return '90px';
    return '80px';
};

/**
 * TableGhostLoader - Renders skeleton ghost table rows matching the glass liquid table layout.
 */
export const TableGhostLoader = ({ rows = 4, columns = 5 }) => {
    return (
        <div className="w-full py-3">
            <div className="flex justify-between items-center mb-4">
                <div className="da-ghost-element-dark da-ghost-title" style={{ width: '220px', height: '36px' }}></div>
                <div className="da-ghost-element-dark rounded-2xl" style={{ width: '120px', height: '38px' }}></div>
            </div>
            <div className="flex flex-col gap-2">
                {Array.from({ length: rows }).map((_, rowIndex) => {
                    const rowKey = `ghost-row-${rowIndex}`;
                    return (
                        <div 
                            key={rowKey} 
                            className="da-ghost-element-dark da-ghost-row flex items-center px-4"
                            style={{ opacity: 1 - rowIndex * 0.15 }}
                        >
                            <div className="flex w-full justify-between items-center">
                                {Array.from({ length: columns }).map((_, colIndex) => {
                                    const colKey = `${rowKey}-col-${colIndex}`;
                                    return (
                                        <div 
                                            key={colKey} 
                                            className="da-ghost-element rounded-lg" 
                                            style={{ 
                                                height: '16px', 
                                                width: getColumnWidth(colIndex, columns)
                                            }}
                                        ></div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

/**
 * CardGhostLoader - Renders skeleton ghost card for details or page validation loading.
 */
export const CardGhostLoader = () => {
    return (
        <div className="da-container flex items-center justify-center min-h-[60vh]">
            <div className="da-ghost-card w-full max-w-2xl mx-auto my-auto p-6 sm:p-8">
                <div className="da-ghost-element-dark da-ghost-title mb-4"></div>
                <div className="da-ghost-element-dark da-ghost-subtitle mb-4"></div>
                <div className="flex flex-col gap-3 mb-4">
                    <div className="da-ghost-element-dark da-ghost-row"></div>
                    <div className="da-ghost-element-dark da-ghost-row" style={{ width: '80%' }}></div>
                    <div className="da-ghost-element-dark da-ghost-row" style={{ width: '60%' }}></div>
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
        <div className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-10 py-6 w-full">
            {/* Left QR Frame Skeleton */}
            <div className="da-ghost-element-dark da-ghost-qr-box shrink-0"></div>
            {/* Right Side Skeleton Info */}
            <div className="flex flex-col items-center md:items-start text-center md:text-left w-full max-w-xs">
                <div className="da-ghost-element-dark da-ghost-title w-full" style={{ height: '36px' }}></div>
                <div className="da-ghost-element-dark da-ghost-subtitle w-full mt-2" style={{ height: '20px' }}></div>
                <div className="da-ghost-element-dark my-4 rounded-3xl" style={{ width: '180px', height: '54px' }}></div>
                <div className="da-ghost-element-dark rounded-full" style={{ width: '100%', height: '10px' }}></div>
            </div>
        </div>
    );
};

export default CardGhostLoader;
