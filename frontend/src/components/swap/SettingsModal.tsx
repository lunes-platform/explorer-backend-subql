import React, { useState } from 'react';
import { X } from 'lucide-react';
import classes from './SettingsModal.module.css';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    slippage: number;
    setSlippage: (value: number) => void;
    deadline: number;
    setDeadline: (value: number) => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({
    isOpen,
    onClose,
    slippage,
    setSlippage,
    deadline,
    setDeadline
}) => {
    if (!isOpen) return null;

    const predefinedSlippage = [0.1, 0.5, 1.0];
    const [customSlippage, setCustomSlippage] = useState<string>('');

    const handleSlippageChange = (val: number) => {
        setSlippage(val);
        setCustomSlippage('');
    };

    const handleCustomSlippage = (val: string) => {
        setCustomSlippage(val);
        const num = parseFloat(val);
        if (!isNaN(num)) {
            setSlippage(num);
        }
    };

    return (
        <div className={classes.overlay}>
            <div className={classes.modal}>
                <div className={classes.header}>
                    <span className={classes.title}>Settings</span>
                    <button className={classes.closeButton} onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                <div className={classes.section}>
                    <span className={classes.sectionTitle}>Slippage Tolerance</span>
                    <div className={classes.optionsRow}>
                        {predefinedSlippage.map((val) => (
                            <button
                                key={val}
                                className={`${classes.optionButton} ${slippage === val && customSlippage === '' ? classes.selected : ''}`}
                                onClick={() => handleSlippageChange(val)}
                            >
                                {val}%
                            </button>
                        ))}
                        <input
                            type="number"
                            placeholder="Custom"
                            className={classes.inputInput}
                            value={customSlippage}
                            onChange={(e) => handleCustomSlippage(e.target.value)}
                        />
                        <span style={{ alignSelf: 'center', color: 'var(--text-muted)' }}>%</span>
                    </div>
                </div>

                <div className={classes.section}>
                    <span className={classes.sectionTitle}>Transaction Deadline</span>
                    <div className={classes.optionsRow}>
                        <input
                            type="number"
                            className={classes.inputInput}
                            style={{ textAlign: 'left' }}
                            value={deadline}
                            onChange={(e) => setDeadline(parseInt(e.target.value) || 0)}
                        />
                        <span style={{ alignSelf: 'center', color: 'var(--text-muted)' }}>minutes</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SettingsModal;
