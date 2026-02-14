import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

// Base58 character set (no 0, O, I, l)
const BASE58_CHARS = /^[1-9A-HJ-NP-Za-km-z]+$/;

// Validate SS58 address: Base58 encoded, 42-52 chars, starts with valid prefix
function isSubstrateAddress(term: string): boolean {
    if (term.length < 42 || term.length > 52) return false;
    if (term.startsWith('0x')) return false;
    if (!BASE58_CHARS.test(term)) return false;
    // SS58 addresses on most chains start with 1-9 or uppercase letters
    // Lunes addresses typically start with '5'
    return true;
}

// Block hash or extrinsic hash: 0x followed by 64 hex chars
function isBlockOrTxHash(term: string): boolean {
    return /^0x[0-9a-fA-F]{64}$/.test(term);
}

// Pure block number
function isBlockNumber(term: string): boolean {
    return /^\d+$/.test(term);
}

// Extrinsic ID format: blockNumber-index
function isExtrinsicId(term: string): boolean {
    return /^\d+-\d+$/.test(term);
}

export const useGlobalSearch = () => {
    const [query, setQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const navigate = useNavigate();

    const handleSearch = async (e: React.FormEvent | React.KeyboardEvent) => {
        if ('key' in e && e.key !== 'Enter') return;

        const term = query.trim();
        if (!term) return;

        setIsSearching(true);

        try {
            // 1. Substrate address → account page (check FIRST, before block number)
            if (isSubstrateAddress(term)) {
                navigate(`/account/${term}`);
                setQuery('');
                return;
            }

            // 2. Block number → block detail
            if (isBlockNumber(term)) {
                navigate(`/block/${term}`);
                setQuery('');
                return;
            }

            // 3. Extrinsic ID (e.g. 9400100-2) → tx detail
            if (isExtrinsicId(term)) {
                navigate(`/tx/${term}`);
                setQuery('');
                return;
            }

            // 4. Block/tx hash (0x...) → try as block hash first
            if (isBlockOrTxHash(term)) {
                navigate(`/block/${term}`);
                setQuery('');
                return;
            }

            // 5. Short 0x prefix → could be a partial hash
            if (term.startsWith('0x') && term.length > 10) {
                navigate(`/block/${term}`);
                setQuery('');
                return;
            }

            // 6. Text search → try as token/asset name, redirect to tokens page
            navigate('/tokens');
            setQuery('');

        } catch (error) {
            console.error('Search error:', error);
        } finally {
            setIsSearching(false);
        }
    };

    return {
        query,
        setQuery,
        handleSearch,
        isSearching
    };
};
