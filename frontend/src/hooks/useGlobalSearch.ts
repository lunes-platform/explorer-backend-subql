import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApolloClient } from '@apollo/client/react';
import { SEARCH_GLOBAL } from '../services/graphql/queries';
import { logSearchQuery, logSearchSelect, logSearchAbandon } from '../utils/searchTelemetry';
import { fuzzyScore } from '../utils/fuzzySearch';

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
    score?: number;
}

// ── Scoring (BL-SEARCH-001: exact match first, ranked by relevance) ──

const CATEGORY_BASE_SCORE: Record<SearchCategory, number> = {
    account: 100,
    block: 100,
    tx: 100,
    token: 60,
    nft: 40,
    contract: 30,
};

function scoreResult(result: SearchResult, query: string): number {
    const q = query.toLowerCase();
    const label = result.label.toLowerCase();
    let score = CATEGORY_BASE_SCORE[result.category] || 0;

    // Exact match bonus
    if (label === q) score += 50;
    // Starts-with bonus
    else if (label.startsWith(q)) score += 30;
    // Contains bonus
    else if (label.includes(q)) score += 10;

    // Symbol exact match (from sublabel like "Token · LUNES")
    if (result.sublabel) {
        const parts = result.sublabel.split(' · ');
        if (parts.length > 1 && parts[1].toLowerCase() === q) score += 40;
    }

    // Fuzzy score bonus — rewards approximate matches
    const fScore = fuzzyScore(q, label);
    if (fScore > 0) score += Math.floor(fScore * 0.3);

    // Also check sublabel for fuzzy match (e.g. symbol)
    if (result.sublabel) {
        const subFScore = fuzzyScore(q, result.sublabel);
        if (subFScore > 0) score += Math.floor(subFScore * 0.2);
    }

    return score;
}

function rankResults(results: SearchResult[], query: string): SearchResult[] {
    return results
        .map(r => ({ ...r, score: scoreResult(r, query) }))
        .sort((a, b) => (b.score || 0) - (a.score || 0));
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
            category: 'tx',
            id: term,
            label: `${term.slice(0, 10)}...${term.slice(-6)}`,
            sublabel: 'Transaction hash',
            path: `/tx/${term}`,
        });
        results.push({
            category: 'block',
            id: term,
            label: `${term.slice(0, 10)}...${term.slice(-6)}`,
            sublabel: 'Block hash',
            path: `/block/${term}`,
        });
    }

    if (term.startsWith('0x') && term.length > 10 && !isBlockOrTxHash(term)) {
        results.push({
            category: 'tx',
            id: term,
            label: `${term.slice(0, 10)}...`,
            sublabel: 'Partial tx hash',
            path: `/tx/${term}`,
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
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const navigate = useNavigate();
    const client = useApolloClient();
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Reset selection when results change
    useEffect(() => {
        setSelectedIndex(-1);
    }, [results]);

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

                    const ranked = rankResults([...instant, ...graphqlResults], term);
                    setResults(ranked);
                    setShowResults(true);
                    logSearchQuery(term, ranked.length);
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

    // Navigate on Enter / ArrowUp / ArrowDown
    const handleSearch = useCallback((e: React.FormEvent | React.KeyboardEvent) => {
        if ('key' in e) {
            if (e.key === 'Escape') {
                setShowResults(false);
                setSelectedIndex(-1);
                return;
            }
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelectedIndex(prev => (prev < results.length - 1 ? prev + 1 : 0));
                return;
            }
            if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelectedIndex(prev => (prev > 0 ? prev - 1 : results.length - 1));
                return;
            }
            if (e.key !== 'Enter') return;
        }

        const term = query.trim();
        if (!term) return;

        // Use selected result or first result
        const targetIndex = selectedIndex >= 0 ? selectedIndex : 0;
        if (results.length > 0 && targetIndex < results.length) {
            navigate(results[targetIndex].path);
            setQuery('');
            setResults([]);
            setShowResults(false);
            setSelectedIndex(-1);
            return;
        }

        // Fallback: structural match
        if (isSubstrateAddress(term)) { navigate(`/account/${term}`); }
        else if (isBlockNumber(term)) { navigate(`/block/${term}`); }
        else if (isExtrinsicId(term)) { navigate(`/tx/${term}`); }
        else if (isBlockOrTxHash(term) || (term.startsWith('0x') && term.length > 10)) { navigate(`/tx/${term}`); }
        else { navigate('/tokens'); }

        setQuery('');
        setResults([]);
        setShowResults(false);
    }, [query, results, navigate]);

    const selectResult = useCallback((result: SearchResult) => {
        logSearchSelect(query, result.category, results.indexOf(result));
        navigate(result.path);
        setQuery('');
        setResults([]);
        setShowResults(false);
    }, [navigate, query, results]);

    const dismissResults = useCallback(() => {
        if (showResults && results.length > 0 && query.trim().length >= 2) {
            logSearchAbandon(query, results.length);
        }
        setShowResults(false);
    }, [showResults, results, query]);

    return {
        query,
        setQuery,
        results,
        showResults,
        handleSearch,
        selectResult,
        dismissResults,
        isSearching,
        selectedIndex,
    };
};
