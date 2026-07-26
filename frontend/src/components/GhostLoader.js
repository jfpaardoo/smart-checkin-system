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
        <div className="w-100 py-3">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div className="ba-ghost-element-dark ba-ghost-title" style={{ width: '220px', height: '36px' }}></div>
                <div className="ba-ghost-element-dark" style={{ width: '120px', height: '38px', borderRadius: '20px' }}></div>
            </div>
            <div className="d-flex flex-column gap-2">
                {Array.from({ length: rows }).map((_, rowIndex) => {
                    const rowKey = `ghost-row-${rowIndex}`;
                    return (
                        <div 
                            key={rowKey} 
                            className="ba-ghost-element-dark ba-ghost-row d-flex align-items-center px-4"
                            style={{ opacity: 1 - rowIndex * 0.15 }}
                        >
                            <div className="d-flex w-100 justify-content-between align-items-center">
                                {Array.from({ length: columns }).map((_, colIndex) => {
                                    const colKey = `${rowKey}-col-${colIndex}`;
                                    return (
                                        <div 
                                            key={colKey} 
                                            className="ba-ghost-element" 
                                            style={{ 
                                                height: '16px', 
                                                width: getColumnWidth(colIndex, columns),
                                                borderRadius: '8px' 
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
        <div className="ba-container justify-content-center">
            <div className="ba-ghost-card my-auto mx-auto" style={{ maxWidth: '750px' }}>
                <div className="ba-ghost-element-dark ba-ghost-title mb-4"></div>
                <div className="ba-ghost-element-dark ba-ghost-subtitle mb-4"></div>
                <div className="d-flex flex-column gap-3 mb-4">
                    <div className="ba-ghost-element-dark ba-ghost-row"></div>
                    <div className="ba-ghost-element-dark ba-ghost-row" style={{ width: '80%' }}></div>
                    <div className="ba-ghost-element-dark ba-ghost-row" style={{ width: '60%' }}></div>
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
        <div className="d-flex flex-column flex-md-row align-items-center justify-content-center gap-4 gap-lg-5 py-2 my-auto w-100">
            {/* Left QR Frame Skeleton */}
            <div className="ba-ghost-element-dark ba-ghost-qr-box"></div>
            {/* Right Side Skeleton Info */}
            <div className="d-flex flex-column align-items-center align-items-md-start text-center text-md-start w-100" style={{ maxWidth: '320px' }}>
                <div className="ba-ghost-element-dark ba-ghost-title w-100" style={{ height: '36px' }}></div>
                <div className="ba-ghost-element-dark ba-ghost-subtitle w-100" style={{ height: '20px' }}></div>
                <div className="ba-ghost-element-dark my-3" style={{ width: '180px', height: '54px', borderRadius: '28px' }}></div>
                <div className="ba-ghost-element-dark" style={{ width: '100%', height: '10px', borderRadius: '10px' }}></div>
            </div>
        </div>
    );
};

export default CardGhostLoader;
