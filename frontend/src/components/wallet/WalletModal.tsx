import React from 'react';
import { X, Wallet, AlertCircle, Loader2, Check } from 'lucide-react';
import { useWalletAuth, type WalletType } from '../../context/WalletAuthContext';
import styles from './WalletModal.module.css';

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const WALLET_INFO: Record<WalletType, { name: string; description: string; color: string }> = {
  'polkadot-js': {
    name: 'Polkadot.js',
    description: 'Browser extension wallet',
    color: '#E6007A'
  },
  'talisman': {
    name: 'Talisman',
    description: 'Multi-chain wallet',
    color: '#D5FF00'
  },
  'subwallet': {
    name: 'SubWallet',
    description: 'Polkadot & Kusama wallet',
    color: '#007AFF'
  },
  'unknown': {
    name: 'Unknown',
    description: 'Wallet not detected',
    color: '#6B7280'
  }
};

export const WalletModal: React.FC<WalletModalProps> = ({ isOpen, onClose }) => {
  const { connect, isConnecting, error, availableWallets, accounts, selectAccount, selectedAccount, wallet } = useWalletAuth();

  console.log('WalletModal render - isOpen:', isOpen, 'wallet:', wallet, 'accounts:', accounts.length);

  if (!isOpen) return null;

  const handleWalletSelect = async (walletType: WalletType) => {
    await connect(walletType);
  };

  const handleAccountSelect = (address: string) => {
    selectAccount(address);
    onClose();
  };

  // Show account selection if connected and has multiple accounts
  if (wallet && accounts.length > 1) {
    return (
      <div className={styles.overlay} onClick={onClose}>
        <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
          <div className={styles.header}>
            <h2 className={styles.title}>Select Account</h2>
            <button className={styles.closeButton} onClick={onClose}>
              <X size={20} />
            </button>
          </div>

          <div className={styles.accountsList}>
            {accounts.map((account) => (
              <button
                key={account.address}
                className={`${styles.accountItem} ${selectedAccount === account.address ? styles.selected : ''}`}
                onClick={() => handleAccountSelect(account.address)}
              >
                <div className={styles.accountInfo}>
                  <span className={styles.accountName}>{account.meta.name || 'Unnamed Account'}</span>
                  <span className={styles.accountAddress}>
                    {account.address.slice(0, 8)}...{account.address.slice(-8)}
                  </span>
                </div>
                {selectedAccount === account.address && (
                  <Check size={20} className={styles.checkIcon} />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <div className={styles.headerIcon}>
            <Wallet size={24} />
          </div>
          <h2 className={styles.title}>Connect Wallet</h2>
          <p className={styles.subtitle}>Select your preferred wallet to connect</p>
          <button className={styles.closeButton} onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className={styles.walletsList}>
          {(['polkadot-js', 'talisman', 'subwallet'] as WalletType[]).map((walletType) => {
            const info = WALLET_INFO[walletType];
            const isAvailable = availableWallets.some(w => w.type === walletType);
            
            return (
              <button
                key={walletType}
                className={`${styles.walletOption} ${!isAvailable ? styles.unavailable : ''}`}
                onClick={() => isAvailable && handleWalletSelect(walletType)}
                disabled={!isAvailable || isConnecting}
              >
                <div 
                  className={styles.walletIcon}
                  style={{ backgroundColor: `${info.color}20`, color: info.color }}
                >
                  <Wallet size={24} />
                </div>
                <div className={styles.walletInfo}>
                  <span className={styles.walletName}>{info.name}</span>
                  <span className={styles.walletDescription}>
                    {isAvailable ? info.description : 'Extension not detected'}
                  </span>
                </div>
                {isConnecting && (
                  <Loader2 size={20} className={styles.spinner} />
                )}
              </button>
            );
          })}
        </div>

        {error && (
          <div className={styles.error}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <div className={styles.footer}>
          <p className={styles.footerText}>
            Don&apos;t have a wallet?{' '}
            <a 
              href="https://polkadot.js.org/extension/" 
              target="_blank" 
              rel="noopener noreferrer"
              className={styles.footerLink}
            >
              Install Polkadot.js
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};
