import React, { useState } from 'react';
import { Settings, ArrowDown } from 'lucide-react';
import SwapInput from '../../components/swap/SwapInput';
import TokenSelector from '../../components/swap/TokenSelector';
import SettingsModal from '../../components/swap/SettingsModal';
import classes from './Swap.module.css';

// Types
interface Token {
    symbol: string;
    name: string;
    balance?: string;
}

const SwapPage: React.FC = () => {
    // State
    const [fromAmount, setFromAmount] = useState('');
    const [toAmount, setToAmount] = useState('');
    const [fromToken, setFromToken] = useState<Token | null>(null);
    const [toToken, setToToken] = useState<Token | null>(null);

    // Modals
    const [isTokenSelectorOpen, setIsTokenSelectorOpen] = useState(false);
    const [selectingSide, setSelectingSide] = useState<'from' | 'to'>('from');
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    // Settings
    const [slippage, setSlippage] = useState(0.5);
    const [deadline, setDeadline] = useState(20);

    // Handlers
    const handleTokenSelectClick = (side: 'from' | 'to') => {
        setSelectingSide(side);
        setIsTokenSelectorOpen(true);
    };

    const handleTokenSelect = (token: Token) => {
        if (selectingSide === 'from') {
            setFromToken(token);
        } else {
            setToToken(token);
        }
    };

    const handleSwitch = () => {
        setFromToken(toToken);
        setToToken(fromToken);
        setFromAmount(toAmount);
        setToAmount(fromAmount);
    };

    return (
        <div className={classes.container}>
            <div className={classes.blob} />

            <div className={classes.swapCard}>
                <div className={classes.header}>
                    <h1 className={classes.title}>Swap</h1>
                    <button className={classes.settingsButton} onClick={() => setIsSettingsOpen(true)}>
                        <Settings size={20} />
                    </button>
                </div>

                <div className={classes.inputsContainer}>
                    <SwapInput
                        label="You Pay"
                        value={fromAmount}
                        onChange={setFromAmount}
                        balance={fromToken?.balance || '0.00'}
                        tokenSymbol={fromToken?.symbol}
                        onTokenSelect={() => handleTokenSelectClick('from')}
                        onMax={() => setFromAmount(fromToken?.balance || '0')}
                    />

                    <button className={classes.switchButton} onClick={handleSwitch}>
                        <ArrowDown size={20} />
                    </button>

                    <SwapInput
                        label="You Receive"
                        value={toAmount}
                        onChange={setToAmount}
                        balance={toToken?.balance || '0.00'}
                        tokenSymbol={toToken?.symbol}
                        onTokenSelect={() => handleTokenSelectClick('to')}
                    />
                </div>

                {fromToken && toToken && (
                    <div className={classes.infoRow}>
                        <span>1 {fromToken.symbol} ≈ 12.34 {toToken.symbol}</span>
                        <span>Fuel: $0.23</span>
                    </div>
                )}


                <button className={classes.swapButton}>
                    Connect Wallet
                </button>
            </div>

            <TokenSelector
                isOpen={isTokenSelectorOpen}
                onClose={() => setIsTokenSelectorOpen(false)}
                onSelect={handleTokenSelect}
            />

            <SettingsModal
                isOpen={isSettingsOpen}
                onClose={() => setIsSettingsOpen(false)}
                slippage={slippage}
                setSlippage={setSlippage}
                deadline={deadline}
                setDeadline={setDeadline}
            />
        </div>
    );
};

export default SwapPage;
