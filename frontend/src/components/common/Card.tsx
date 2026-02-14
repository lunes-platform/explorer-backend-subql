import React, { type HTMLAttributes } from 'react';

interface CardProps extends Omit<HTMLAttributes<HTMLElement>, 'title'> {
    title?: React.ReactNode;
    action?: React.ReactNode;
    icon?: React.ReactNode;
}

const Card: React.FC<CardProps> = ({ children, className = '', title, action, icon, style, ...props }) => {
    return (
        <section
            className={className}
            style={{
                backgroundColor: 'var(--bg-surface)',
                borderRadius: 'var(--radius-md)',
                padding: 'min(5vw, 24px)',
                border: '1px solid var(--border-default)',
                transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                display: 'flex',
                flexDirection: 'column',
                ...style
            }}
            {...props}
        >
            {(title || action) && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    {title && (
                        <h3 style={{
                            margin: 0,
                            fontSize: 'var(--text-lg)',
                            fontWeight: 700,
                            letterSpacing: '-0.02em',
                            fontFamily: 'var(--font-family-display)',
                            color: 'var(--text-primary)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 'var(--space-2)'
                        }}>
                            {icon && <span style={{ color: 'var(--color-brand-400)' }}>{icon}</span>}
                            {title}
                        </h3>
                    )}
                    {action}
                </div>
            )}
            {children}
        </section>
    );
};

export default Card;
