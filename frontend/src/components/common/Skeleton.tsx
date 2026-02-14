import React from 'react';
import styles from './Skeleton.module.css';

interface SkeletonProps {
    width?: string | number;
    height?: string | number;
    borderRadius?: string | number;
    variant?: 'text' | 'circular' | 'rectangular';
    className?: string;
    animation?: 'pulse' | 'wave' | 'none';
    count?: number;
}

export const Skeleton: React.FC<SkeletonProps> = ({
    width = '100%',
    height = '20px',
    borderRadius = '4px',
    variant = 'rectangular',
    className = '',
    animation = 'pulse',
    count = 1
}) => {
    const style: React.CSSProperties = {
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height,
        borderRadius: typeof borderRadius === 'number' ? `${borderRadius}px` : borderRadius,
    };

    const variantClass = variant === 'circular' ? styles.circular : variant === 'text' ? styles.text : styles.rectangular;
    const animationClass = animation === 'wave' ? styles.wave : animation === 'none' ? '' : styles.pulse;

    if (count > 1) {
        return (
            <div className={styles.skeletonGroup}>
                {Array.from({ length: count }).map((_, index) => (
                    <div
                        key={index}
                        className={`${styles.skeleton} ${variantClass} ${animationClass} ${className}`}
                        style={style}
                    />
                ))}
            </div>
        );
    }

    return (
        <div
            className={`${styles.skeleton} ${variantClass} ${animationClass} ${className}`}
            style={style}
        />
    );
};

// Table row skeleton for loading states
export const TableRowSkeleton: React.FC<{ columns: number; rows?: number }> = ({
    columns = 5,
    rows = 5
}) => {
    return (
        <div className={styles.tableSkeleton}>
            {/* Header */}
            <div className={styles.tableHeader}>
                {Array.from({ length: columns }).map((_, i) => (
                    <Skeleton key={`header-${i}`} height={14} width="60%" />
                ))}
            </div>
            {/* Rows */}
            {Array.from({ length: rows }).map((_, rowIndex) => (
                <div key={`row-${rowIndex}`} className={styles.tableRow}>
                    {Array.from({ length: columns }).map((_, colIndex) => (
                        <Skeleton
                            key={`cell-${rowIndex}-${colIndex}`}
                            height={16}
                            width={colIndex === 0 ? '40%' : colIndex === columns - 1 ? '80%' : '70%'}
                        />
                    ))}
                </div>
            ))}
        </div>
    );
};

// Card skeleton for grid layouts
export const CardSkeleton: React.FC<{ count?: number }> = ({ count = 4 }) => {
    return (
        <div className={styles.cardGrid}>
            {Array.from({ length: count }).map((_, i) => (
                <div key={i} className={styles.cardSkeleton}>
                    <Skeleton height={120} borderRadius={8} />
                    <div className={styles.cardContent}>
                        <Skeleton height={20} width="70%" />
                        <Skeleton height={14} width="40%" />
                        <div className={styles.cardStats}>
                            <Skeleton height={12} width={60} />
                            <Skeleton height={12} width={60} />
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export const SkeletonRows: React.FC<{ columns: number; rows?: number }> = ({
    columns = 5,
    rows = 5
}) => {
    return (
        <>
            {Array.from({ length: rows }).map((_, rowIndex) => (
                <tr key={`skel-row-${rowIndex}`}>
                    {Array.from({ length: columns }).map((_, colIndex) => (
                        <td key={`skel-cell-${rowIndex}-${colIndex}`}>
                            <Skeleton height={20} width={colIndex === 0 ? '40%' : '80%'} />
                        </td>
                    ))}
                </tr>
            ))}
        </>
    );
};

export default Skeleton;
