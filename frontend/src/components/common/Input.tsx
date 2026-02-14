import React, { type InputHTMLAttributes } from 'react';
import classes from './Input.module.css';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label: string;
    error?: string;
    helperText?: string;
}

const Input: React.FC<InputProps> = ({
    label,
    error,
    helperText,
    id,
    className = '',
    ...props
}) => {
    const inputId = id || `input-${label.toLowerCase().replace(/\s+/g, '-')}`;

    return (
        <div className={`${classes.container} ${className}`}>
            <label htmlFor={inputId} className={classes.label}>
                {label}
            </label>
            <input
                id={inputId}
                className={`${classes.input} ${error ? classes.errorInput : ''}`}
                aria-invalid={!!error}
                aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined}
                {...props}
            />
            {error && (
                <span id={`${inputId}-error`} className={classes.errorText}>
                    {error}
                </span>
            )}
            {helperText && !error && (
                <span id={`${inputId}-helper`} className={classes.helperText}>
                    {helperText}
                </span>
            )}
        </div>
    );
};

export default Input;
