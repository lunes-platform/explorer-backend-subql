import { useState, useEffect } from 'react';
import { API_BASE_URL } from '../config';

export interface LunesPriceData {
    price: number;
    change24h: number;
    volume24h: number;
    marketCap: number;
    high24h: number;
    low24h: number;
    loading: boolean;
    error: string | null;
    source: string;
    lastUpdated: string | null;
}

/**
 * Format price with dynamic decimals for sub-cent tokens.
 * Shows enough decimals to display at least 2 significant digits.
 * Examples: 1234.56 → "1,234.56", 0.000499 → "0.000499", 0.00000012 → "0.00000012"
 */
export function formatPrice(price: number): string {
    if (price === 0) return '$0.00';
    if (price >= 1) return `$${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    if (price >= 0.01) return `$${price.toFixed(4)}`;
    // Sub-cent: find first significant digit and show 2 significant digits
    const str = price.toFixed(12);
    const match = str.match(/^0\.(0*[1-9])/);
    if (match) {
        const leadingZeros = match[1].length;
        const decimals = Math.max(leadingZeros + 1, 4);
        return `$${price.toFixed(decimals)}`;
    }
    return `$${price.toFixed(6)}`;
}

export const useLunesPrice = () => {
    const [data, setData] = useState<LunesPriceData>({
        price: 0,
        change24h: 0,
        volume24h: 0,
        marketCap: 0,
        high24h: 0,
        low24h: 0,
        loading: true,
        error: null,
        source: '',
        lastUpdated: null,
    });

    const fetchPrice = async () => {
        try {
            // Fetch from our backend (Cached for 5 minutes)
            const response = await fetch(`${API_BASE_URL}/prices`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const result = await response.json();

            if (result && typeof result.price === 'number') {
                setData({
                    price: result.price,
                    change24h: result.change24h || 0,
                    volume24h: result.volume24h || 0,
                    marketCap: result.marketCap || 0,
                    high24h: result.high24h || 0,
                    low24h: result.low24h || 0,
                    loading: false,
                    error: null,
                    source: result.source || 'cache',
                    lastUpdated: result.lastUpdated || null,
                });
            } else {
                throw new Error('Invalid price response structure');
            }
        } catch (err: any) {
            console.error('Error fetching Lunes price:', err);
            setData(prev => ({ ...prev, loading: false, error: err.message }));
        }
    };

    useEffect(() => {
        fetchPrice();
        // Poll every 60s - backend handles the 5-min cache TTL
        const interval = setInterval(fetchPrice, 60000);
        return () => clearInterval(interval);
    }, []);

    return data;
};
