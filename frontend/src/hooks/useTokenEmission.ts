import { useState, useEffect, useCallback } from 'react';
import { WS_ENDPOINTS, API_BASE_URL } from '../config';

const API_BASE = API_BASE_URL;

export interface TokenEmissionConfig {
  emissionFee: number;
  receiverAddress: string;
  minSupply: number;
  maxSupply: number;
  isEnabled: boolean;
}

export interface TokenCreateParams {
  assetId: number;
  name: string;
  symbol: string;
  decimals: number;
  totalSupply: string;
  logoUrl?: string;
  description?: string;
  website?: string;
}

export type EmissionStep =
  | 'idle'
  | 'fee_payment'       // Step 1: Pay fee to receiver address
  | 'creating_asset'    // Step 2: assets.create on-chain
  | 'setting_metadata'  // Step 3: assets.setMetadata
  | 'minting'           // Step 4: assets.mint
  | 'registering'       // Step 5: Register in backend
  | 'done'
  | 'error';

export interface EmissionState {
  step: EmissionStep;
  error: string | null;
  txHash: string | null;
  assetId: number | null;
  progress: number; // 0-100
}

// Fetch emission config from backend
export function useTokenEmissionConfig() {
  const [config, setConfig] = useState<TokenEmissionConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${API_BASE}/token-emission/config`)
      .then(r => r.json())
      .then(data => { setConfig(data); setLoading(false); })
      .catch(e => { setError(e.message); setLoading(false); });
  }, []);

  return { config, loading, error };
}

// Fetch next available asset ID from chain
export async function getNextAssetId(): Promise<number> {
  try {
    const { ApiPromise, WsProvider } = await import('@polkadot/api');
    const provider = new WsProvider(WS_ENDPOINTS);
    const api = await ApiPromise.create({ provider });
    const assets = await (api.query.assets as any).asset.keys();
    const ids = assets.map((k: any) => {
      const decoded = k.args[0];
      return Number(decoded.toString());
    });
    await api.disconnect();
    if (ids.length === 0) return 10;
    return Math.max(...ids) + 1;
  } catch {
    // Fallback: return a timestamp-based ID
    return Math.floor(Date.now() / 1000) % 100000;
  }
}

// Main hook for token creation flow
export function useTokenEmission() {
  const [state, setState] = useState<EmissionState>({
    step: 'idle',
    error: null,
    txHash: null,
    assetId: null,
    progress: 0,
  });

  const resetState = useCallback(() => {
    setState({ step: 'idle', error: null, txHash: null, assetId: null, progress: 0 });
  }, []);

  const createToken = useCallback(async (
    params: TokenCreateParams,
    signerAddress: string,
    injector: any,
    config: TokenEmissionConfig,
  ) => {
    setState({ step: 'fee_payment', error: null, txHash: null, assetId: params.assetId, progress: 5 });

    try {
      const { ApiPromise, WsProvider } = await import('@polkadot/api');
      const provider = new WsProvider(WS_ENDPOINTS);
      const api = await ApiPromise.create({ provider });

      // ── Step 1: Pay emission fee ──
      setState(s => ({ ...s, step: 'fee_payment', progress: 10 }));

      let feePaymentTxHash = '';

      if (config.emissionFee > 0 && config.receiverAddress) {
        // Transfer fee in LUNES (8 decimals)
        const feeAmount = BigInt(Math.round(config.emissionFee * 1e8));
        const feeTx = api.tx.balances.transferKeepAlive(config.receiverAddress, feeAmount);

        feePaymentTxHash = await new Promise<string>((resolve, reject) => {
          feeTx.signAndSend(
            signerAddress,
            { signer: injector.signer },
            ({ status, dispatchError }: any) => {
              if (dispatchError) {
                const err = dispatchError.isModule
                  ? api.registry.findMetaError(dispatchError.asModule)
                  : { documentation: [dispatchError.toString()] };
                reject(new Error(`Fee payment failed: ${err.documentation?.join(', ')}`));
              }
              if (status.isInBlock || status.isFinalized) {
                resolve(status.asInBlock?.toString() || status.asFinalized?.toString() || '');
              }
            }
          ).catch(reject);
        });
      }

      setState(s => ({ ...s, step: 'creating_asset', progress: 30 }));

      // ── Step 2: Create asset on-chain (assets.create) ──
      // assets.create(id, admin, minBalance)
      // admin = the wallet that will manage the asset (same as creator)
      const minBalance = 1; // minimum balance required to hold the token
      const createTx = api.tx.assets.create(params.assetId, signerAddress, minBalance);

      await new Promise<void>((resolve, reject) => {
        createTx.signAndSend(
          signerAddress,
          { signer: injector.signer },
          ({ status, dispatchError }: any) => {
            if (dispatchError) {
              const err = dispatchError.isModule
                ? api.registry.findMetaError(dispatchError.asModule)
                : { documentation: [dispatchError.toString()] };
              reject(new Error(`Asset creation failed: ${err.documentation?.join(', ')}`));
            }
            if (status.isInBlock || status.isFinalized) resolve();
          }
        ).catch(reject);
      });

      setState(s => ({ ...s, step: 'setting_metadata', progress: 55 }));

      // ── Step 3: Set metadata (assets.setMetadata) ──
      const setMetaTx = api.tx.assets.setMetadata(
        params.assetId,
        params.name,
        params.symbol,
        params.decimals,
      );

      await new Promise<void>((resolve, reject) => {
        setMetaTx.signAndSend(
          signerAddress,
          { signer: injector.signer },
          ({ status, dispatchError }: any) => {
            if (dispatchError) {
              const err = dispatchError.isModule
                ? api.registry.findMetaError(dispatchError.asModule)
                : { documentation: [dispatchError.toString()] };
              reject(new Error(`Set metadata failed: ${err.documentation?.join(', ')}`));
            }
            if (status.isInBlock || status.isFinalized) resolve();
          }
        ).catch(reject);
      });

      setState(s => ({ ...s, step: 'minting', progress: 75 }));

      // ── Step 4: Mint initial supply (assets.mint) ──
      if (params.totalSupply && params.totalSupply !== '0') {
        const supplyBig = BigInt(params.totalSupply) * BigInt(10 ** params.decimals);
        const mintTx = api.tx.assets.mint(params.assetId, signerAddress, supplyBig);

        await new Promise<void>((resolve, reject) => {
          mintTx.signAndSend(
            signerAddress,
            { signer: injector.signer },
            ({ status, dispatchError }: any) => {
              if (dispatchError) {
                const err = dispatchError.isModule
                  ? api.registry.findMetaError(dispatchError.asModule)
                  : { documentation: [dispatchError.toString()] };
                reject(new Error(`Minting failed: ${err.documentation?.join(', ')}`));
              }
              if (status.isInBlock || status.isFinalized) resolve();
            }
          ).catch(reject);
        });
      }

      await api.disconnect();

      setState(s => ({ ...s, step: 'registering', progress: 90 }));

      // ── Step 5: Register in backend ──
      const res = await fetch(`${API_BASE}/tokens/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assetId: params.assetId,
          name: params.name,
          symbol: params.symbol,
          decimals: params.decimals,
          totalSupply: params.totalSupply,
          ownerAddress: signerAddress,
          adminAddress: signerAddress,
          paymentTxHash: feePaymentTxHash || `no-fee-${Date.now()}`,
          logoUrl: params.logoUrl || '',
          description: params.description || '',
          website: params.website || '',
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        // Non-critical: token is already on-chain, just log the registration error
        console.warn('[Token] Backend registration failed:', err.error);
      }

      setState(s => ({ ...s, step: 'done', txHash: feePaymentTxHash, progress: 100 }));

    } catch (err: any) {
      console.error('[Token] Creation failed:', err);
      setState(s => ({ ...s, step: 'error', error: err.message || 'Unknown error' }));
    }
  }, []);

  return { state, createToken, resetState };
}

// Fetch tokens registered by owner from backend
export function useMyTokens(address: string) {
  const [tokens, setTokens] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!address) { setTokens([]); setLoading(false); return; }
    try {
      const res = await fetch(`${API_BASE}/tokens/owner/${address}`);
      if (res.ok) setTokens(await res.json());
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [address]);

  useEffect(() => { load(); }, [load]);

  return { tokens, loading, refetch: load };
}
