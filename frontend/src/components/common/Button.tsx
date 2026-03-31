import React, { type ButtonHTMLAttributes } from 'react';
import { Loader2 } from 'lucide-react'; // Using Lucide for icons
import classes from './Button.module.css';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'tertiary';
    size?: 'large' | 'small';
    isLoading?: boolean;
    icon?: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({
    children,
    className = '',
    variant = 'primary',
    size = 'large',
    isLoading = false,
    icon,
    disabled,
    ...props
}) => {
    const rootClasses = [
        classes.button,
        classes[variant],
        classes[size],
        isLoading ? classes.loading : '',
        className
    ].join(' ');

    return (
        <button className={rootClasses} disabled={disabled || isLoading} {...props}>
            {isLoading ? (
                <Loader2 className="animate-spin" size={16} />
            ) : icon ? (
                <span style={{ display: 'flex', alignItems: 'center' }}>{icon}</span>
            ) : null}

            {children}

            {/* Figma designs often show right arrow for text buttons, can be added conditionally */}
        </button>
    );
};

export default Button;
