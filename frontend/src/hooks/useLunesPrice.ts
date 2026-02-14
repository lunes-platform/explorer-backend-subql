import { useState, useEffect } from 'react';

export interface LunesPriceData {
    price: number;
    change24h: number;
    volume24h: number;
    high24h: number;
    low24h: number;
    loading: boolean;
    error: string | null;
}

export const useLunesPrice = () => {
    const [data, setData] = useState<LunesPriceData>({
        price: 0,
        change24h: 0,
        volume24h: 0,
        high24h: 0,
        low24h: 0,
        loading: true,
        error: null,
    });

    const fetchPrice = async () => {
        try {
            // Using a CORS proxy if needed, but let's try direct first
            // Note: BitStorage API might require a proxy in a real browser environment
            const response = await fetch('https://api.bitstorage.finance/v1/public/ticker?pair=LUNESUSDT');
            const result = await response.json();

            if (result.status && result.data) {
                setData({
                    price: parseFloat(result.data.last),
                    change24h: parseFloat(result.data.percent_сhange), // Note: UTF-8 'с' in 'сhange' from API
                    volume24h: parseFloat(result.data.volume_24H),
                    high24h: parseFloat(result.data.high),
                    low24h: parseFloat(result.data.low),
                    loading: false,
                    error: null,
                });
            } else {
                throw new Error('API returned invalid status');
            }
        } catch (err: any) {
            console.error('Error fetching Lunes price:', err);
            setData(prev => ({ ...prev, loading: false, error: err.message }));
        }
    };

    useEffect(() => {
        fetchPrice();
        const interval = setInterval(fetchPrice, 30000); // Update every 30s
        return () => clearInterval(interval);
    }, []);

    return data;
};
