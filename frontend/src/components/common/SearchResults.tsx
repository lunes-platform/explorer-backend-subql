import React, { useEffect, useRef } from 'react';
import { User, Box, ArrowRightLeft, Coins, Image, FileCode, Search } from 'lucide-react';
import type { SearchResult, SearchCategory } from '../../hooks/useGlobalSearch';

interface SearchResultsProps {
    results: SearchResult[];
    show: boolean;
    isSearching: boolean;
    query: string;
    onSelect: (result: SearchResult) => void;
    onDismiss: () => void;
}

const categoryIcons: Record<SearchCategory, React.ReactNode> = {
    account: <User size={14} />,
    block: <Box size={14} />,
    tx: <ArrowRightLeft size={14} />,
    token: <Coins size={14} />,
    nft: <Image size={14} />,
    contract: <FileCode size={14} />,
};

const categoryColors: Record<SearchCategory, string> = {
    account: '#a78bfa',
    block: '#60a5fa',
    tx: '#34d399',
    token: '#fbbf24',
    nft: '#f472b6',
    contract: '#fb923c',
};

const SearchResults: React.FC<SearchResultsProps> = ({
    results,
    show,
    isSearching,
    query,
    onSelect,
    onDismiss,
}) => {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                onDismiss();
            }
        };
        if (show) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [show, onDismiss]);

    if (!show || (results.length === 0 && !isSearching && query.trim().length < 2)) {
        return null;
    }

    return (
        <div
            ref={containerRef}
            style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                marginTop: 4,
                background: 'var(--bg-card, #1a1a2e)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 10,
                boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                zIndex: 1000,
                maxHeight: 360,
                overflowY: 'auto',
                backdropFilter: 'blur(12px)',
            }}
        >
            {isSearching && results.length === 0 && (
                <div style={{
                    padding: '16px 20px',
                    color: 'var(--text-muted)',
                    fontSize: 13,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                }}>
                    <Search size={14} style={{ animation: 'spin 1s linear infinite' }} />
                    Searching...
                </div>
            )}

            {!isSearching && results.length === 0 && query.trim().length >= 2 && (
                <div style={{
                    padding: '16px 20px',
                    color: 'var(--text-muted)',
                    fontSize: 13,
                }}>
                    <div style={{ fontWeight: 600, marginBottom: 4 }}>No results found</div>
                    <div style={{ fontSize: 12, lineHeight: 1.5 }}>
                        Try a valid address (starts with 5...), block number, extrinsic ID (e.g. 9400100-2), or token name.
                    </div>
                </div>
            )}

            {results.length > 0 && (
                <div style={{ padding: '6px 0' }}>
                    {results.map((result, index) => (
                        <button
                            key={`${result.category}-${result.id}-${index}`}
                            onClick={() => onSelect(result)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 10,
                                width: '100%',
                                padding: '10px 16px',
                                border: 'none',
                                background: 'transparent',
                                cursor: 'pointer',
                                textAlign: 'left',
                                color: 'var(--text-primary, #fff)',
                                fontSize: 13,
                                transition: 'background 0.15s',
                            }}
                            onMouseEnter={(e) => {
                                (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.05)';
                            }}
                            onMouseLeave={(e) => {
                                (e.currentTarget as HTMLElement).style.background = 'transparent';
                            }}
                        >
                            <span style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: 28,
                                height: 28,
                                borderRadius: 6,
                                background: `${categoryColors[result.category]}15`,
                                color: categoryColors[result.category],
                                flexShrink: 0,
                            }}>
                                {categoryIcons[result.category]}
                            </span>
                            <div style={{ minWidth: 0, flex: 1 }}>
                                <div style={{
                                    fontWeight: 500,
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                }}>
                                    {result.label}
                                </div>
                                {result.sublabel && (
                                    <div style={{
                                        fontSize: 11,
                                        color: 'var(--text-muted)',
                                        marginTop: 1,
                                    }}>
                                        {result.sublabel}
                                    </div>
                                )}
                            </div>
                            <span style={{
                                fontSize: 10,
                                padding: '2px 6px',
                                borderRadius: 4,
                                background: `${categoryColors[result.category]}15`,
                                color: categoryColors[result.category],
                                fontWeight: 600,
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em',
                                flexShrink: 0,
                            }}>
                                {result.category}
                            </span>
                        </button>
                    ))}
                </div>
            )}

            {results.length > 0 && (
                <div style={{
                    padding: '8px 16px',
                    borderTop: '1px solid rgba(255,255,255,0.06)',
                    fontSize: 11,
                    color: 'var(--text-muted)',
                    display: 'flex',
                    justifyContent: 'space-between',
                }}>
                    <span>Press Enter to go to first result</span>
                    <span>Esc to close</span>
                </div>
            )}
        </div>
    );
};

export default SearchResults;
