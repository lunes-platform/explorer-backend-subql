import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Wallet, ChevronDown, LogOut, Copy, Check, Eye, LayoutDashboard } from 'lucide-react';
import { useWalletAuth } from '../../context/WalletAuthContext';
import { WalletModal } from './WalletModal';
import styles from './WalletButton.module.css';

export const WalletButton: React.FC = () => {
  const { isConnected, wallet, isConnecting, disconnect } = useWalletAuth();
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopyAddress = async () => {
    if (wallet?.account?.address) {
      await navigator.clipboard.writeText(wallet.account.address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleOpenModal = () => {
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
  };

  if (isConnected && wallet) {
    return (
      <div className={styles.container}>
        <button
          className={styles.connectedButton}
          onClick={() => setShowDropdown(!showDropdown)}
        >
          <div 
            className={styles.walletIcon}
            style={{ 
              backgroundColor: 
                wallet.wallet.type === 'talisman' ? '#D5FF0020' :
                wallet.wallet.type === 'subwallet' ? '#007AFF20' :
                '#E6007A20',
              color: 
                wallet.wallet.type === 'talisman' ? '#D5FF00' :
                wallet.wallet.type === 'subwallet' ? '#007AFF' :
                '#E6007A'
            }}
          >
            <Wallet size={16} />
          </div>
          <span className={styles.address}>
            {wallet.account.address.slice(0, 6)}...{wallet.account.address.slice(-4)}
          </span>
          <ChevronDown 
            size={16} 
            className={`${styles.chevron} ${showDropdown ? styles.rotate : ''}`}
          />
        </button>

        {showDropdown && (
          <div className={styles.dropdown}>
            <div className={styles.dropdownHeader}>
              <span className={styles.dropdownTitle}>Connected</span>
              <span className={styles.walletName}>{wallet.wallet.name}</span>
            </div>
            
            <div className={styles.dropdownAddress}>
              <span className={styles.fullAddress}>{wallet.account.address.slice(0, 6)}...{wallet.account.address.slice(-4)}</span>
              <button 
                className={styles.copyButton}
                onClick={handleCopyAddress}
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
              </button>
            </div>

            <button
              className={styles.disconnectButton}
              style={{ color: 'var(--color-brand-400)', borderColor: 'rgba(108, 56, 255, 0.2)' }}
              onClick={() => {
                navigate('/dashboard');
                setShowDropdown(false);
              }}
            >
              <LayoutDashboard size={16} />
              My Dashboard
            </button>

            <button
              className={styles.disconnectButton}
              style={{ color: 'var(--color-brand-400)', borderColor: 'rgba(108, 56, 255, 0.2)' }}
              onClick={() => {
                navigate(`/account/${wallet.account.address}`);
                setShowDropdown(false);
              }}
            >
              <Eye size={16} />
              View Account
            </button>

            <button
              className={styles.disconnectButton}
              onClick={() => {
                disconnect();
                setShowDropdown(false);
              }}
            >
              <LogOut size={16} />
              Disconnect
            </button>
          </div>
        )}

        {showDropdown && (
          <div 
            className={styles.backdrop}
            onClick={() => setShowDropdown(false)}
          />
        )}
      </div>
    );
  }

  return (
    <div style={{ display: 'inline-flex' }}>
      <button
        className={styles.connectButton}
        onClick={handleOpenModal}
        disabled={isConnecting}
      >
        {isConnecting ? (
          <>
            <span className={styles.spinner} />
            Connecting...
          </>
        ) : (
          <>
            <Wallet size={18} />
            Connect Wallet
          </>
        )}
      </button>

      <WalletModal 
        isOpen={showModal} 
        onClose={handleCloseModal} 
      />
    </div>
  );
};
