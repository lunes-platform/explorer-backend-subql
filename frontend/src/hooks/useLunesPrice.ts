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
