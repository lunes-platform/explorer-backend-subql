import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { web3Accounts, web3Enable } from '@polkadot/extension-dapp';
import type { InjectedAccountWithMeta } from '@polkadot/extension-inject/types';

export type WalletType = 'polkadot-js' | 'talisman' | 'subwallet' | 'unknown';

export interface WalletInfo {
  type: WalletType;
  name: string;
  icon: string;
}

export interface ConnectedWallet {
  account: InjectedAccountWithMeta;
  wallet: WalletInfo;
}

interface WalletAuthContextType {
  isConnected: boolean;
  isConnecting: boolean;
  wallet: ConnectedWallet | null;
  accounts: InjectedAccountWithMeta[];
  selectedAccount: string | null;
  availableWallets: WalletInfo[];
  error: string | null;
  connect: (walletType?: WalletType) => Promise<void>;
  disconnect: () => void;
  selectAccount: (address: string) => void;
  getSigner: () => any | null;
}

const SUPPORTED_WALLETS: WalletInfo[] = [
  {
    type: 'polkadot-js',
    name: 'Polkadot.js',
    icon: '/wallets/polkadot-js.svg'
  },
  {
    type: 'talisman',
    name: 'Talisman',
    icon: '/wallets/talisman.svg'
  },
  {
    type: 'subwallet',
    name: 'SubWallet',
    icon: '/wallets/subwallet.svg'
  }
];

const WalletAuthContext = createContext<WalletAuthContextType | undefined>(undefined);

export const WalletAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [wallet, setWallet] = useState<ConnectedWallet | null>(null);
  const [accounts, setAccounts] = useState<InjectedAccountWithMeta[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null);
  const [availableWallets, setAvailableWallets] = useState<WalletInfo[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Detect available wallets on mount
  useEffect(() => {
    const detectWallets = async () => {
      try {
        const injected = await web3Enable('Lunes Explorer');
        const detectedWallets = injected.map((ext) => {
          const name = ext.name.toLowerCase();
          let type: WalletType = 'unknown';
          if (name.includes('polkadot-js') || name.includes('polkadot')) type = 'polkadot-js';
          else if (name.includes('talisman')) type = 'talisman';
          else if (name.includes('subwallet')) type = 'subwallet';
          
          const supportedWallet = SUPPORTED_WALLETS.find(w => w.type === type);
          
          return {
            type,
            name: ext.name,
            icon: supportedWallet?.icon || ''
          };
        }).filter(w => w.type !== 'unknown');
        
        setAvailableWallets(detectedWallets.length > 0 ? detectedWallets : SUPPORTED_WALLETS);
      } catch (err) {
        console.error('Failed to detect wallets:', err);
        setAvailableWallets(SUPPORTED_WALLETS);
      }
    };
    
    detectWallets();
  }, []);

  // Restore session from localStorage
  useEffect(() => {
    const savedWallet = localStorage.getItem('lunes-wallet');
    if (savedWallet) {
      try {
        const parsed = JSON.parse(savedWallet);
        setWallet(parsed);
        setIsConnected(true);
        setSelectedAccount(parsed.account.address);
      } catch (err) {
        console.error('Failed to restore wallet session:', err);
        localStorage.removeItem('lunes-wallet');
      }
    }
  }, []);

  const connect = useCallback(async (preferredWallet?: WalletType) => {
    setIsConnecting(true);
    setError(null);

    try {
      // Enable extension
      const extensions = await web3Enable('Lunes Explorer');
      
      if (extensions.length === 0) {
        throw new Error('No wallet extension found. Please install Polkadot.js, Talisman, or SubWallet.');
      }

      // Get all accounts
      const allAccounts = await web3Accounts();
      
      if (allAccounts.length === 0) {
        throw new Error('No accounts found. Please create or import an account in your wallet.');
      }

      setAccounts(allAccounts);

      // Try to find preferred wallet extension
      let targetExtension = extensions[0];
      if (preferredWallet) {
        const found = extensions.find(ext => {
          const name = ext.name.toLowerCase();
          if (preferredWallet === 'polkadot-js') return name.includes('polkadot');
          if (preferredWallet === 'talisman') return name.includes('talisman');
          if (preferredWallet === 'subwallet') return name.includes('subwallet');
          return false;
        });
        if (found) targetExtension = found;
      }

      // Determine wallet type
      const extName = targetExtension.name.toLowerCase();
      let walletType: WalletType = 'unknown';
      if (extName.includes('polkadot')) walletType = 'polkadot-js';
      else if (extName.includes('talisman')) walletType = 'talisman';
      else if (extName.includes('subwallet')) walletType = 'subwallet';

      // Use first account as default
      const defaultAccount = allAccounts[0];
      
      const supportedWallet = SUPPORTED_WALLETS.find(w => w.type === walletType);
      
      const connectedWallet: ConnectedWallet = {
        account: defaultAccount,
        wallet: {
          type: walletType,
          name: targetExtension.name,
          icon: supportedWallet?.icon || ''
        }
      };

      setWallet(connectedWallet);
      setSelectedAccount(defaultAccount.address);
      setIsConnected(true);

      // Save to localStorage
      localStorage.setItem('lunes-wallet', JSON.stringify(connectedWallet));

    } catch (err: any) {
      console.error('Wallet connection error:', err);
      setError(err.message || 'Failed to connect wallet');
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    setWallet(null);
    setIsConnected(false);
    setSelectedAccount(null);
    setAccounts([]);
    localStorage.removeItem('lunes-wallet');
  }, []);

  const selectAccount = useCallback((address: string) => {
    const account = accounts.find(acc => acc.address === address);
    if (account && wallet) {
      const updatedWallet = { ...wallet, account };
      setWallet(updatedWallet);
      setSelectedAccount(address);
      localStorage.setItem('lunes-wallet', JSON.stringify(updatedWallet));
    }
  }, [accounts, wallet]);

  const getSigner = useCallback(() => {
    return wallet?.account?.meta?.source || null;
  }, [wallet]);

  const value: WalletAuthContextType = {
    isConnected,
    isConnecting,
    wallet,
    accounts,
    selectedAccount,
    availableWallets,
    error,
    connect,
    disconnect,
    selectAccount,
    getSigner
  };

  return (
    <WalletAuthContext.Provider value={value}>
      {children}
    </WalletAuthContext.Provider>
  );
};

export const useWalletAuth = () => {
  const context = useContext(WalletAuthContext);
  if (context === undefined) {
    throw new Error('useWalletAuth must be used within a WalletAuthProvider');
  }
  return context;
};
