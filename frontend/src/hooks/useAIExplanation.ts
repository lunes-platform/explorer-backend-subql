import { useState, useCallback } from 'react';
import { API_BASE_URL } from '../config';

export interface AIExplanationResult {
  type: string;
  explanation: string;
  sources: string[];
  confidence: 'high' | 'medium' | 'low';
  generatedAt: string;
  aiAssisted: boolean;
}

export interface UseAIExplanationResult {
  explanation: AIExplanationResult | null;
  loading: boolean;
  error: string | null;
  explain: (type: string, data: Record<string, unknown>) => Promise<void>;
  clear: () => void;
}

export function useAIExplanation(): UseAIExplanationResult {
  const [explanation, setExplanation] = useState<AIExplanationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const explain = useCallback(async (type: string, data: Record<string, unknown>) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_BASE_URL}/explain`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, data }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to get explanation');
      }

      const result: AIExplanationResult = await response.json();
      setExplanation(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      // Fallback: generate local explanation if API fails (BL-AI-003 compliance)
      setExplanation({
        type,
        explanation: generateLocalExplanation(type, data),
        sources: data.sources as string[] || [],
        confidence: 'low',
        generatedAt: new Date().toISOString(),
        aiAssisted: false,
      });
    } finally {
      setLoading(false);
    }
  }, []);

  const clear = useCallback(() => {
    setExplanation(null);
    setError(null);
  }, []);

  return { explanation, loading, error, explain, clear };
}

// Local fallback explanation generator (BL-AI-003: graceful degradation)
function generateLocalExplanation(type: string, data: Record<string, unknown>): string {
  switch (type) {
    case 'transaction': {
      const from = data.from as string;
      const to = data.to as string;
      const amount = (data.amountFormatted as number)?.toFixed(4) || 'unknown';
      const block = data.blockNumber as number;
      return `Transfer of ${amount} LUNES from ${shortenAddress(from)} to ${shortenAddress(to)} in block #${block}.`;
    }
    case 'account': {
      const total = (data.totalFormatted as number)?.toFixed(4) || '0';
      const nonce = (data.nonce as number) || 0;
      return `Account with ${total} LUNES and ${nonce} transactions.`;
    }
    case 'block': {
      const num = data.number as number;
      const txs = data.extrinsicCount as number;
      return `Block #${num} with ${txs} transactions.`;
    }
    case 'extrinsic': {
      const section = data.section as string;
      const method = data.method as string;
      return `${section}.${method} operation.`;
    }
    default:
      return 'No explanation available.';
  }
}

function shortenAddress(addr: string): string {
  if (!addr || addr.length < 14) return addr || 'unknown';
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}
