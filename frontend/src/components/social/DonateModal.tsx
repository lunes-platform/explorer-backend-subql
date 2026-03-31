import React, { useState } from 'react';
import { X, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { useWalletAuth } from '../../context/WalletAuthContext';
import { WS_ENDPOINTS } from '../../config';
import { LunesLogo } from '../common/LunesLogo';

interface DonateModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectName: string;
  receiverAddress: string;
  onDonated: (amount: number) => void;
}

export const DonateModal: React.FC<DonateModalProps> = ({
  isOpen,
  onClose,
  projectName,
  receiverAddress,
  onDonated,
}) => {
  const { wallet } = useWalletAuth();
  const [amount, setAmount] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [txHash, setTxHash] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const presets = [1, 5, 10, 50, 100];

  const handleDonate = async () => {
    const num = parseFloat(amount);
    if (isNaN(num) || num <= 0 || !wallet?.account?.address) return;

    setStatus('sending');
    setErrorMsg('');

    try {
      const { ApiPromise, WsProvider } = await import('@polkadot/api');
      const { web3FromAddress } = await import('@polkadot/extension-dapp');

      const provider = new WsProvider(WS_ENDPOINTS);
      const api = await ApiPromise.create({ provider });
      const injector = await web3FromAddress(wallet.account.address);

      const planckAmount = BigInt(Math.floor(num * 1e8));
      const tx = api.tx.balances.transferKeepAlive(receiverAddress, planckAmount);

      await new Promise<void>((resolve, reject) => {
        tx.signAndSend(
          wallet.account.address,
          { signer: injector.signer },
          ({ status: txStatus, dispatchError }) => {
            if (dispatchError) {
              if (dispatchError.isModule) {
                const decoded = api.registry.findMetaError(dispatchError.asModule);
                reject(new Error(`${decoded.section}.${decoded.name}`));
              } else {
                reject(new Error(dispatchError.toString()));
              }
            } else if (txStatus.isInBlock) {
              setTxHash(txStatus.asInBlock.toHex());
              resolve();
            }
          }
        ).catch(reject);
      });

      setStatus('success');
      onDonated(num);
    } catch (err: any) {
      setStatus('error');
      setErrorMsg(err?.message || 'Transaction failed');
    }
  };

  const handleClose = () => {
    setStatus('idle');
    setAmount('');
    setTxHash('');
    setErrorMsg('');
    onClose();
  };

  return (
    <div
      onClick={handleClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 20,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--bg-card, #1a1a2e)', borderRadius: 16,
          border: '1px solid rgba(255,255,255,0.1)',
          padding: 28, width: '100%', maxWidth: 420,
          boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
            <LunesLogo size={22} /> Donate to {projectName}
          </h3>
          <button onClick={handleClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        {status === 'success' ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <CheckCircle size={48} color="#26d07c" style={{ marginBottom: 12 }} />
            <h4 style={{ margin: '0 0 8px', color: '#26d07c' }}>Donation Sent!</h4>
            <p style={{ color: 'var(--text-muted)', fontSize: 14, margin: '0 0 12px' }}>
              You donated <strong>{amount} LUNES</strong> to {projectName}
            </p>
            {txHash && (
              <p style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'monospace', wordBreak: 'break-all' }}>
                Tx: {txHash}
              </p>
            )}
            <button
              onClick={handleClose}
              style={{
                marginTop: 16, padding: '10px 24px', borderRadius: 10, border: 'none',
                background: 'var(--color-brand-600)', color: 'white', cursor: 'pointer',
                fontWeight: 600, fontSize: 14,
              }}
            >
              Done
            </button>
          </div>
        ) : status === 'error' ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <AlertCircle size={48} color="#ef4444" style={{ marginBottom: 12 }} />
            <h4 style={{ margin: '0 0 8px', color: '#ef4444' }}>Transaction Failed</h4>
            <p style={{ color: 'var(--text-muted)', fontSize: 13, margin: '0 0 16px' }}>{errorMsg}</p>
            <button
              onClick={() => setStatus('idle')}
              style={{
                padding: '10px 24px', borderRadius: 10, border: 'none',
                background: 'rgba(255,255,255,0.08)', color: 'white', cursor: 'pointer',
                fontWeight: 600, fontSize: 14,
              }}
            >
              Try Again
            </button>
          </div>
        ) : (
          <>
            <p style={{ color: 'var(--text-secondary)', fontSize: 13, margin: '0 0 16px' }}>
              Support this project by donating LUNES directly from your wallet.
            </p>

            {/* Receiver */}
            <div style={{
              padding: '10px 14px', borderRadius: 8, marginBottom: 16,
              background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
              fontSize: 12, color: 'var(--text-muted)',
            }}>
              <span style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5 }}>Receiver</span>
              <div style={{ fontFamily: 'monospace', fontSize: 12, marginTop: 4, wordBreak: 'break-all', color: 'var(--color-brand-400)' }}>
                {receiverAddress}
              </div>
            </div>

            {/* Preset amounts */}
            <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
              {presets.map(p => (
                <button
                  key={p}
                  onClick={() => setAmount(p.toString())}
                  style={{
                    padding: '6px 14px', borderRadius: 8, border: '1px solid',
                    borderColor: amount === p.toString() ? 'var(--color-brand-400)' : 'rgba(255,255,255,0.08)',
                    background: amount === p.toString() ? 'rgba(108, 56, 255, 0.15)' : 'rgba(255,255,255,0.03)',
                    color: amount === p.toString() ? 'var(--color-brand-400)' : 'var(--text-secondary)',
                    cursor: 'pointer', fontSize: 13, fontWeight: 600,
                  }}
                >
                  {p} LUNES
                </button>
              ))}
            </div>

            {/* Custom amount */}
            <div style={{ position: 'relative', marginBottom: 20 }}>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Custom amount..."
                min="0.01"
                step="0.01"
                style={{
                  width: '100%', padding: '12px 80px 12px 14px', borderRadius: 10,
                  border: '1px solid rgba(255,255,255,0.1)',
                  background: 'rgba(255,255,255,0.03)', color: 'white',
                  fontSize: 16, fontWeight: 600, outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
              <span style={{
                position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
                color: 'var(--text-muted)', fontSize: 13, fontWeight: 600,
                display: 'flex', alignItems: 'center', gap: 4,
              }}>
                <LunesLogo size={14} /> LUNES
              </span>
            </div>

            {/* Send button */}
            <button
              onClick={handleDonate}
              disabled={!amount || parseFloat(amount) <= 0 || status === 'sending'}
              style={{
                width: '100%', padding: '14px', borderRadius: 12, border: 'none',
                background: amount && parseFloat(amount) > 0
                  ? 'linear-gradient(135deg, #26d07c, #1a9d5c)'
                  : 'rgba(255,255,255,0.05)',
                color: amount && parseFloat(amount) > 0 ? 'white' : 'var(--text-muted)',
                cursor: amount && parseFloat(amount) > 0 ? 'pointer' : 'not-allowed',
                fontSize: 15, fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                boxShadow: amount && parseFloat(amount) > 0 ? '0 4px 16px rgba(38, 208, 124, 0.3)' : 'none',
              }}
            >
              {status === 'sending' ? (
                <>
                  <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
                  Sending...
                </>
              ) : (
                <>
                  <LunesLogo size={18} color="white" />
                  Donate {amount || '0'} LUNES
                </>
              )}
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default DonateModal;
