import React, { useState, useCallback } from 'react';
import { Copy, Check } from 'lucide-react';
import styles from './CopyToClipboard.module.css';

interface CopyToClipboardProps {
  text: string;
  label?: string;
  truncate?: boolean;
  truncateLength?: number;
  showText?: boolean;
  className?: string;
}

export const CopyToClipboard: React.FC<CopyToClipboardProps> = ({
  text,
  label,
  truncate = false,
  truncateLength = 12,
  showText = true,
  className = ''
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }, [text]);

  const displayText = truncate && text.length > truncateLength * 2
    ? `${text.slice(0, truncateLength)}...${text.slice(-truncateLength)}`
    : text;

  return (
    <span className={`${styles.container} ${className}`}>
      {label && <span className={styles.label}>{label}</span>}
      {showText && (
        <span className={styles.text} title={text}>
          {displayText}
        </span>
      )}
      <button
        onClick={handleCopy}
        className={styles.copyButton}
        aria-label={copied ? 'Copied!' : 'Copy to clipboard'}
        title={copied ? 'Copied!' : 'Copy to clipboard'}
      >
        {copied ? (
          <Check size={14} className={styles.checkIcon} />
        ) : (
          <Copy size={14} className={styles.copyIcon} />
        )}
      </button>
    </span>
  );
};
