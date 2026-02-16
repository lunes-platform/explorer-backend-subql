import { useMemo } from 'react';
import { useWalletAuth } from '../context/WalletAuthContext';
import { ADMIN_ADDRESSES } from '../config/admin';

export interface AdminAuth {
  isAdmin: boolean;
  isConnected: boolean;
  address: string | null;
}

export function useAdminAuth(): AdminAuth {
  const { isConnected, wallet } = useWalletAuth();
  const address = wallet?.account?.address || null;

  const isAdmin = useMemo(() => {
    if (!isConnected || !address) return false;
    return ADMIN_ADDRESSES.some(
      (admin) => admin.toLowerCase() === address.toLowerCase()
    );
  }, [isConnected, address]);

  return { isAdmin, isConnected, address };
}
