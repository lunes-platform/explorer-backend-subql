import React from 'react';
import { SearchX, Inbox, FileQuestion, Database } from 'lucide-react';
import styles from './EmptyState.module.css';

interface EmptyStateProps {
    type?: 'search' | 'empty' | 'error' | 'no-data';
    title?: string;
    message?: string;
    action?: {
        label: string;
        onClick: () => void;
    };
    className?: string;
}

const defaultMessages = {
    search: {
        icon: SearchX,
        title: 'No results found',
        message: 'We couldn\'t find anything matching your search. Try different keywords or check the spelling.',
    },
    empty: {
        icon: Inbox,
        title: 'Nothing here yet',
        message: 'There\'s no data available at the moment. Please check back later.',
    },
    error: {
        icon: FileQuestion,
        title: 'Something went wrong',
        message: 'An error occurred while loading the data. Please try again.',
    },
    'no-data': {
        icon: Database,
        title: 'No data available',
        message: 'There are no records to display.',
    },
};

export const EmptyState: React.FC<EmptyStateProps> = ({
    type = 'empty',
    title,
    message,
    action,
    className = '',
}) => {
    const config = defaultMessages[type];
    const Icon = config.icon;

    return (
        <div className={`${styles.container} ${className}`}>
            <div className={styles.iconWrapper}>
                <Icon size={48} strokeWidth={1.5} />
            </div>
            <h3 className={styles.title}>{title || config.title}</h3>
            <p className={styles.message}>{message || config.message}</p>
            {action && (
                <button className={styles.actionButton} onClick={action.onClick}>
                    {action.label}
                </button>
            )}
        </div>
    );
};

export default EmptyState;
