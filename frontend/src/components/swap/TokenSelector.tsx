import React, { useState } from 'react';
import { X, Search } from 'lucide-react';
import classes from './TokenSelector.module.css';

interface Token {
    symbol: string;
    name: string;
    balance?: string;
}

interface TokenSelectorProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (token: Token) => void;
    tokens?: Token[]; // This will eventually come from API/Context
}

// Default tokens available on Lunes chain
const DEFAULT_TOKENS: Token[] = [
    { symbol: 'LUNES', name: 'Lunes' },
    { symbol: 'LUSDT', name: 'Lunes Dollar' },
    { symbol: 'PIDCHAT', name: 'PidChat' },
];

const TokenSelector: React.FC<TokenSelectorProps> = ({
    isOpen,
    onClose,
    onSelect,
    tokens = DEFAULT_TOKENS
}) => {
    const [searchQuery, setSearchQuery] = useState('');

    if (!isOpen) return null;

    const filteredTokens = tokens.filter(t =>
        t.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className={classes.overlay}>
            <div className={classes.modal}>
                <div className={classes.header}>
                    <span className={classes.title}>Select a Token</span>
                    <button className={classes.closeButton} onClick={onClose}>
                        <X size={24} />
                    </button>
                </div>

                <div className={classes.searchContainer}>
                    <div className={classes.searchInputWrapper}>
                        <Search className={classes.searchIcon} />
                        <input
                            type="text"
                            className={classes.searchInput}
                            placeholder="Search by name or address"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            autoFocus
                        />
                    </div>
                </div>

                <div className={classes.tokenList}>
                    {filteredTokens.map((token) => (
                        <div
                            key={token.symbol}
                            className={classes.tokenItem}
                            onClick={() => {
                                onSelect(token);
                                onClose();
                            }}
                        >
                            <div className={classes.tokenInfo}>
                                {/* Using a simple placeholder for now, would ideally be an <img /> */}
                                <div className={classes.tokenIconPlaceholder}>
                                    {token.symbol.substring(0, 2)}
                                </div>
                                <div className={classes.tokenDetails}>
                                    <span className={classes.tokenSymbol}>{token.symbol}</span>
                                    <span className={classes.tokenName}>{token.name}</span>
                                </div>
                            </div>
                            {token.balance && (
                                <span className={classes.tokenBalance}>{token.balance}</span>
                            )}
                        </div>
                    ))}
                    {filteredTokens.length === 0 && (
                        <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                            No tokens found.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TokenSelector;
