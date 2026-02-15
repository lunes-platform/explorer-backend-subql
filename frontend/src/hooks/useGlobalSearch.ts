import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApolloClient } from '@apollo/client/react';
import { SEARCH_GLOBAL } from '../services/graphql/queries';

// ── Pattern matchers (BL-SEARCH-001: exact match first) ──────────────

const BASE58_CHARS = /^[1-9A-HJ-NP-Za-km-z]+$/;

function isSubstrateAddress(term: string): boolean {
    if (term.length < 42 || term.length > 52) return false;
    if (term.startsWith('0x')) return false;
    return BASE58_CHARS.test(term);
}

function isBlockOrTxHash(term: string): boolean {
    return /^0x[0-9a-fA-F]{64}$/.test(term);
}

function isBlockNumber(term: string): boolean {
    return /^\d+$/.test(term);
}

function isExtrinsicId(term: string): boolean {
    return /^\d+-\d+$/.test(term);
}

// ── Types (BL-SEARCH-002: categorized results) ──────────────────────

export type SearchCategory = 'account' | 'block' | 'tx' | 'token' | 'nft' | 'contract';

export interface SearchResult {
    category: SearchCategory;
    id: string;
    label: string;
    sublabel?: string;
    path: string;
}

// ── Classify input into instant results ──────────────────────────────

function getInstantResults(term: string): SearchResult[] {
    const results: SearchResult[] = [];

    if (isSubstrateAddress(term)) {
        results.push({
            category: 'account',
            id: term,
            label: `${term.slice(0, 8)}...${term.slice(-6)}`,
            sublabel: 'Account',
            path: `/account/${term}`,
        });
    }

    if (isBlockNumber(term)) {
        results.push({
            category: 'block',
            id: term,
            label: `Block #${Number(term).toLocaleString()}`,
            sublabel: 'Block',
            path: `/block/${term}`,
        });
    }

    if (isExtrinsicId(term)) {
        results.push({
            category: 'tx',
            id: term,
            label: `Extrinsic ${term}`,
            sublabel: 'Transaction',
            path: `/tx/${term}`,
        });
    }

    if (isBlockOrTxHash(term)) {
        results.push({
            category: 'block',
            id: term,
            label: `${term.slice(0, 10)}...${term.slice(-6)}`,
            sublabel: 'Hash lookup',
            path: `/block/${term}`,
        });
    }

    if (term.startsWith('0x') && term.length > 10 && !isBlockOrTxHash(term)) {
        results.push({
            category: 'block',
            id: term,
            label: `${term.slice(0, 10)}...`,
            sublabel: 'Partial hash',
            path: `/block/${term}`,
        });
    }

    return results;
}

// ── GraphQL response type ────────────────────────────────────────────

interface SearchGlobalResponse {
    psp22Tokens?: { nodes: { id: string; name: string; symbol: string }[] };
    psp34Collections?: { nodes: { id: string; name: string; symbol: string }[] };
    smartContracts?: { nodes: { id: string; name: string }[] };
}

// ── Hook ─────────────────────────────────────────────────────────────

export const useGlobalSearch = () => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showResults, setShowResults] = useState(false);
    const navigate = useNavigate();
    const client = useApolloClient();
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Debounced live search: runs 300ms after user stops typing
    useEffect(() => {
        const term = query.trim();

        if (term.length < 2) {
            setResults([]);
            setShowResults(false);
            return;
        }

        // Instant results from pattern matching (always sync)
        const instant = getInstantResults(term);

        // If we got an exact structural match, show it immediately
        if (instant.length > 0) {
            setResults(instant);
            setShowResults(true);
        }

        // For text queries, also search GraphQL (debounced)
        if (!isSubstrateAddress(term) && !isBlockOrTxHash(term) && !isBlockNumber(term) && !isExtrinsicId(term)) {
            if (debounceRef.current) clearTimeout(debounceRef.current);
            debounceRef.current = setTimeout(async () => {
                setIsSearching(true);
                try {
                    const { data } = await client.query<SearchGlobalResponse>({
                        query: SEARCH_GLOBAL,
                        variables: { searchTerm: term },
                        fetchPolicy: 'cache-first',
                    });

                    const graphqlResults: SearchResult[] = [];

                    // Tokens (PSP22)
                    data?.psp22Tokens?.nodes?.forEach((t: { id: string; name: string; symbol: string }) => {
                        graphqlResults.push({
                            category: 'token',
                            id: t.id,
                            label: t.name || t.symbol || t.id,
                            sublabel: t.symbol ? `Token · ${t.symbol}` : 'Token',
                            path: `/asset/${t.id}`,
                        });
                    });

                    // NFT Collections (PSP34)
                    data?.psp34Collections?.nodes?.forEach((n: { id: string; name: string; symbol: string }) => {
                        graphqlResults.push({
                            category: 'nft',
                            id: n.id,
                            label: n.name || n.symbol || n.id,
                            sublabel: n.symbol ? `NFT · ${n.symbol}` : 'NFT Collection',
                            path: `/nft/${n.id}`,
                        });
                    });

                    // Smart Contracts
                    data?.smartContracts?.nodes?.forEach((c: { id: string; name: string }) => {
                        graphqlResults.push({
                            category: 'contract',
                            id: c.id,
                            label: c.name || `${c.id.slice(0, 10)}...`,
                            sublabel: 'Contract',
                            path: `/account/${c.id}`,
                        });
                    });

                    setResults([...instant, ...graphqlResults]);
                    setShowResults(true);
                } catch (err) {
                    console.error('[Search] GraphQL error:', err);
                    // Still show instant results if GraphQL fails
                    if (instant.length > 0) {
                        setResults(instant);
                        setShowResults(true);
                    }
                } finally {
                    setIsSearching(false);
                }
            }, 300);
        } else {
            setIsSearching(false);
        }

        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, [query, client]);

    // Navigate on Enter: picks first result or best guess
    const handleSearch = useCallback((e: React.FormEvent | React.KeyboardEvent) => {
        if ('key' in e) {
            if (e.key === 'Escape') {
                setShowResults(false);
                return;
            }
            if (e.key !== 'Enter') return;
        }

        const term = query.trim();
        if (!term) return;

        // Use first result if available
        if (results.length > 0) {
            navigate(results[0].path);
            setQuery('');
            setResults([]);
            setShowResults(false);
            return;
        }

        // Fallback: structural match
        if (isSubstrateAddress(term)) { navigate(`/account/${term}`); }
        else if (isBlockNumber(term)) { navigate(`/block/${term}`); }
        else if (isExtrinsicId(term)) { navigate(`/tx/${term}`); }
        else if (isBlockOrTxHash(term) || (term.startsWith('0x') && term.length > 10)) { navigate(`/block/${term}`); }
        else { navigate('/tokens'); }

        setQuery('');
        setResults([]);
        setShowResults(false);
    }, [query, results, navigate]);

    const selectResult = useCallback((result: SearchResult) => {
        navigate(result.path);
        setQuery('');
        setResults([]);
        setShowResults(false);
    }, [navigate]);

    const dismissResults = useCallback(() => {
        setShowResults(false);
    }, []);

    return {
        query,
        setQuery,
        results,
        showResults,
        handleSearch,
        selectResult,
        dismissResults,
        isSearching,
    };
};
