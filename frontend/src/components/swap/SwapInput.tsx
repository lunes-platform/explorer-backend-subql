import React from 'react';
import { ChevronDown } from 'lucide-react';
import classes from './SwapInput.module.css';

interface SwapInputProps {
    label: string;
    balance?: string;
    value: string;
    onChange: (value: string) => void;
    onMax?: () => void;
    tokenSymbol?: string;
    onTokenSelect?: () => void;
    disabled?: boolean;
}

const SwapInput: React.FC<SwapInputProps> = ({
    label,
    balance = '0',
    value,
    onChange,
    onMax,
    tokenSymbol,
    onTokenSelect,
    disabled
}) => {
    return (
        <div className={classes.container}>
            <div className={classes.header}>
                <span className={classes.label}>{label}</span>
                <span className={classes.balance}>Balance: {balance}</span>
            </div>
            
            <div className={classes.inputRow}>
                <input
                    type="number"
                    className={classes.input}
                    placeholder="0.00"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    disabled={disabled}
                />
                
                {onMax && (
                    <button className={classes.maxButton} onClick={onMax}>
                        MAX
                    </button>
                )}

                <button className={classes.tokenButton} onClick={onTokenSelect}>
                    <div className={classes.tokenInfo}>
                        {/* Placeholder for Icon */}
                        {tokenSymbol ? (
                            <span>{tokenSymbol}</span>
                        ) : (
                            <span>Select Token</span>
                        )}
                    </div>
                    <ChevronDown className={classes.chevron} />
                </button>
            </div>
        </div>
    );
};

export default SwapInput;
