import { useState, useEffect, useCallback } from 'react';
import { Coins, Save, Loader2, CheckCircle, AlertCircle, ToggleLeft, ToggleRight } from 'lucide-react';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { API_BASE_URL } from '../../config';
import styles from './Admin.module.css';

const API_BASE = API_BASE_URL;

interface EmissionConfig {
  emissionFee: number;
  receiverAddress: string;
  minSupply: number;
  maxSupply: number;
  isEnabled: boolean;
  updatedAt?: string;
}

interface RegisteredToken {
  id: string;
  assetId: string;
  name: string;
  symbol: string;
  decimals: number;
  totalSupply: string;
  ownerAddress: string;
  paymentTxHash: string;
  feePaid: number;
  logoUrl?: string;
  description?: string;
  registeredAt: string;
  onChainConfirmed: boolean;
}

export default function TokenEmissionTab() {
  const { token } = useAdminAuth();
  const [config, setConfig] = useState<EmissionConfig | null>(null);
  const [tokens, setTokens] = useState<RegisteredToken[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [emissionFee, setEmissionFee] = useState('');
  const [receiverAddress, setReceiverAddress] = useState('');
  const [minSupply, setMinSupply] = useState('');
  const [maxSupply, setMaxSupply] = useState('');
  const [isEnabled, setIsEnabled] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [cfgRes, tokRes] = await Promise.all([
        fetch(`${API_BASE}/admin/token-emission/config`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_BASE}/admin/tokens`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);
      if (cfgRes.ok) {
        const cfg: EmissionConfig = await cfgRes.json();
        setConfig(cfg);
        setEmissionFee(String(cfg.emissionFee));
        setReceiverAddress(cfg.receiverAddress || '');
        setMinSupply(String(cfg.minSupply));
        setMaxSupply(String(cfg.maxSupply));
        setIsEnabled(cfg.isEnabled);
      }
      if (tokRes.ok) setTokens(await tokRes.json());
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/admin/token-emission/config`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          emissionFee: Number(emissionFee),
          receiverAddress: receiverAddress.trim(),
          minSupply: Number(minSupply),
          maxSupply: Number(maxSupply),
          isEnabled,
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Save failed');
      }
      const updated = await res.json();
      setConfig(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 14px', borderRadius: 8, fontSize: 13,
    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
    color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box',
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 60 }}>
        <Loader2 size={24} style={{ animation: 'spin 1s linear infinite', color: 'var(--color-brand-400)' }} />
        <p style={{ color: 'var(--text-muted)', marginTop: 12 }}>Loading token emission config...</p>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 4px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <Coins size={20} color="var(--color-brand-400)" /> Token Emission Management
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: 13, margin: 0 }}>
          Configure the fee and receiver wallet for token creation on the Lunes network.
        </p>
      </div>

      {error && (
        <div style={{ padding: '10px 14px', borderRadius: 8, background: 'rgba(255,77,106,0.08)', border: '1px solid rgba(255,77,106,0.2)', color: '#ff4d6a', fontSize: 13, marginBottom: 20, display: 'flex', gap: 8, alignItems: 'center' }}>
          <AlertCircle size={15} /> {error}
        </div>
      )}

      {/* Config Form */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 32 }}>
        {/* Emission Settings */}
        <div style={{ padding: 24, borderRadius: 16, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-brand-400)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 20px' }}>
            Emission Settings
          </h3>

          {/* Enabled toggle */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.06)', marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>Token Emission</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Enable or disable token creation for users</div>
            </div>
            <button
              onClick={() => setIsEnabled(!isEnabled)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: isEnabled ? '#26d07c' : 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700 }}
            >
              {isEnabled ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
              {isEnabled ? 'Enabled' : 'Disabled'}
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>
                Emission Fee (LUNES)
              </label>
              <input
                style={inputStyle}
                type="number"
                value={emissionFee}
                onChange={e => setEmissionFee(e.target.value)}
                min={0}
                placeholder="1000"
              />
              <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '4px 0 0' }}>
                Amount in LUNES that users must pay to create a token. Set 0 to waive fee.
              </p>
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>
                Receiver Wallet Address
              </label>
              <input
                style={{ ...inputStyle, fontFamily: 'monospace', fontSize: 12 }}
                value={receiverAddress}
                onChange={e => setReceiverAddress(e.target.value)}
                placeholder="5C... (Lunes SS58 address)"
              />
              <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '4px 0 0' }}>
                The admin wallet that will receive emission fees from users.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>
                  Min Supply
                </label>
                <input
                  style={inputStyle}
                  type="number"
                  value={minSupply}
                  onChange={e => setMinSupply(e.target.value)}
                  min={1}
                  placeholder="1"
                />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>
                  Max Supply <span style={{ fontWeight: 400 }}>(0 = unlimited)</span>
                </label>
                <input
                  style={inputStyle}
                  type="number"
                  value={maxSupply}
                  onChange={e => setMaxSupply(e.target.value)}
                  min={0}
                  placeholder="0"
                />
              </div>
            </div>
          </div>

          <div style={{ marginTop: 20, display: 'flex', gap: 10, alignItems: 'center' }}>
            <button
              onClick={handleSave}
              disabled={saving}
              className={`${styles.actionBtn} ${styles.approve}`}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', fontSize: 13, fontWeight: 700 }}
            >
              {saving
                ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                : <Save size={14} />}
              {saving ? 'Saving...' : 'Save Configuration'}
            </button>
            {saved && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#26d07c', fontSize: 13, fontWeight: 600 }}>
                <CheckCircle size={15} /> Saved
              </span>
            )}
          </div>
        </div>

        {/* Current Config Summary */}
        <div style={{ padding: 24, borderRadius: 16, background: 'rgba(108,56,255,0.04)', border: '1px solid rgba(108,56,255,0.15)' }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-brand-400)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 20px' }}>
            Current Config
          </h3>
          {config && [
            ['Status', config.isEnabled ? '✅ Enabled' : '❌ Disabled'],
            ['Emission Fee', `${config.emissionFee.toLocaleString()} LUNES`],
            ['Receiver', config.receiverAddress ? `${config.receiverAddress.slice(0, 14)}...` : '—'],
            ['Min Supply', config.minSupply.toLocaleString()],
            ['Max Supply', config.maxSupply === 0 ? 'Unlimited' : config.maxSupply.toLocaleString()],
            ['Last Updated', config.updatedAt ? new Date(config.updatedAt).toLocaleString() : '—'],
          ].map(([label, value]) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: 13 }}>
              <span style={{ color: 'var(--text-muted)' }}>{label}</span>
              <span style={{ fontWeight: 600, fontFamily: label === 'Receiver' ? 'monospace' : undefined }}>{value}</span>
            </div>
          ))}

          <div style={{ marginTop: 16, padding: '12px 14px', borderRadius: 10, background: 'rgba(38,208,124,0.06)', border: '1px solid rgba(38,208,124,0.15)', fontSize: 12, color: '#26d07c' }}>
            <strong>Total Tokens Created:</strong> {tokens.length}
            {tokens.length > 0 && (
              <span style={{ marginLeft: 12, color: 'var(--text-muted)' }}>
                Total Fees: {tokens.reduce((s, t) => s + (t.feePaid || 0), 0).toLocaleString()} LUNES
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Tokens Table */}
      <div>
        <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Coins size={16} /> All Created Tokens ({tokens.length})
        </h3>

        {tokens.length === 0 ? (
          <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13, borderRadius: 12, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
            No tokens created yet.
          </div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Token</th>
                <th>Asset ID</th>
                <th>Supply</th>
                <th>Owner</th>
                <th>Fee Paid</th>
                <th>Status</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {tokens.map((t) => (
                <tr key={t.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {t.logoUrl ? (
                        <img src={t.logoUrl} alt="" style={{ width: 26, height: 26, borderRadius: 6, objectFit: 'cover' }} />
                      ) : (
                        <div style={{ width: 26, height: 26, borderRadius: 6, background: 'rgba(108,56,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: 'var(--color-brand-400)' }}>
                          {t.symbol?.charAt(0)}
                        </div>
                      )}
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 13 }}>{t.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{t.symbol}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ fontFamily: 'monospace', fontSize: 12 }}>#{t.assetId}</td>
                  <td style={{ fontSize: 12 }}>{Number(t.totalSupply).toLocaleString()}</td>
                  <td style={{ fontFamily: 'monospace', fontSize: 11 }}>{t.ownerAddress?.slice(0, 10)}...{t.ownerAddress?.slice(-4)}</td>
                  <td style={{ fontSize: 12, color: '#26d07c', fontWeight: 600 }}>{t.feePaid?.toLocaleString()} LUNES</td>
                  <td>
                    {t.onChainConfirmed
                      ? <span className={`${styles.badge} ${styles.approved}`}>On-chain</span>
                      : <span className={`${styles.badge} ${styles.pending}`}>Pending</span>}
                  </td>
                  <td style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    {new Date(t.registeredAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
