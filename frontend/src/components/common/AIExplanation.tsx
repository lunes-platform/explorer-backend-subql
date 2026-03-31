import React from 'react';
import { Sparkles, AlertCircle, Loader2, X } from 'lucide-react';
import type { AIExplanationResult } from '../../hooks/useAIExplanation';
import styles from './AIExplanation.module.css';

interface AIExplanationProps {
  result: AIExplanationResult | null;
  loading: boolean;
  error: string | null;
  onClose?: () => void;
  onExplain?: () => void;
  showButton?: boolean;
}

const AIExplanation: React.FC<AIExplanationProps> = ({
  result,
  loading,
  error,
  onClose,
  onExplain,
  showButton = true,
}) => {
  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <Loader2 size={18} className={styles.spinner} />
          <span>Analyzing with AI...</span>
        </div>
      </div>
    );
  }

  if (error && !result) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <AlertCircle size={18} />
          <span>{error}</span>
          {showButton && onExplain && (
            <button onClick={onExplain} className={styles.retryButton}>
              Try again
            </button>
          )}
        </div>
      </div>
    );
  }

  if (!result) {
    if (!showButton || !onExplain) return null;
    return (
      <button onClick={onExplain} className={styles.explainButton}>
        <Sparkles size={16} />
        Explain with AI
      </button>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.badge}>
          <Sparkles size={14} />
          <span>AI-Assisted Explanation</span>
        </div>
        {onClose && (
          <button onClick={onClose} className={styles.closeButton}>
            <X size={16} />
          </button>
        )}
      </div>
      
      <div className={styles.content}>
        <p className={styles.explanation}>{result.explanation}</p>
        
        {result.sources.length > 0 && (
          <div className={styles.sources}>
            <span className={styles.sourcesLabel}>Sources:</span>
            {result.sources.map((source, i) => (
              <span key={i} className={styles.sourceTag}>{source}</span>
            ))}
          </div>
        )}
        
        <div className={styles.footer}>
          <span className={styles.confidence} data-level={result.confidence}>
            Confidence: {result.confidence === 'high' ? 'High' : result.confidence === 'medium' ? 'Medium' : 'Low'}
          </span>
          <span className={styles.timestamp}>
            {new Date(result.generatedAt).toLocaleTimeString('pt-BR', { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </span>
        </div>
      </div>
    </div>
  );
};

export default AIExplanation;
