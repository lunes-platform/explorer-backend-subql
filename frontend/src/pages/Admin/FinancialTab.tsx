import React, { useState, useEffect, useCallback } from 'react';
import {
  Wallet, Save, Coins, CheckCircle, AlertTriangle,
  Loader2, Lock, Eye, EyeOff, Copy, Check, Edit3, X,
  DollarSign, Clock, ShieldCheck,
  Power, History, Megaphone, Gift, Heart
} from 'lucide-react';
import { useAdminAuth } from '../../context/AdminAuthContext';
import Card from '../../components/common/Card';
import { API_BASE_URL } from '../../config';

const API = API_BASE_URL;

interface ManagedWallet {
  purpose: string;
  label: string;
  address: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface AuditEntry {
  id: string;
  purpose: string;
  action: string;
  previousValue?: string;
  newValue?: string;
  changedBy: string;
  timestamp: string;
  details?: string;
}

interface FinancialConfig {
  verificationWallet: string;
  verificationFee: number;
  verificationFeePlanckMultiplier: number;
  adsWallet: string;
  rewardsWallet: string;
}

interface VerificationPayment {
  id: string;
  projectSlug: string;
  projectName: string;
  payerAddress: string;
  amount: number;
  txHash: string;
  status: 'pending' | 'confirmed' | 'failed';
  submittedAt: string;
}

interface FinancialSummary {
  totalVerificationIncome: number;
  totalVerificationsCompleted: number;
  totalVerificationsPending: number;
  totalRewardsDistributed: number;
  recentPayments: VerificationPayment[];
}

const WALLET_ICONS: Record<string, React.ReactNode> = {
  verification: <ShieldCheck size={18} />,
  ads: <Megaphone size={18} />,
  rewards: <Gift size={18} />,
  donations: <Heart size={18} />,
};

const WALLET_COLORS: Record<string, string> = {
  verification: '#7B42FF',
  ads: '#f5a623',
  rewards: '#26d07c',
  donations: '#ff6b9d',
};

const IS: React.CSSProperties = {
  width: '100%', padding: '8px 12px', borderRadius: 8, fontSize: 13,
  border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.3)',
  color: 'white', boxSizing: 'border-box', fontFamily: 'monospace',
};

type SubTab = 'wallets' | 'payments' | 'audit';

export default function FinancialTab() {
  const { token } = useAdminAuth();
  const [subTab, setSubTab] = useState<SubTab>('wallets');
  const [wallets, setWallets] = useState<ManagedWallet[]>([]);
  const [config, setConfig] = useState<FinancialConfig | null>(null);
  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [payments, setPayments] = useState<VerificationPayment[]>([]);
  const [auditLog, setAuditLog] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Edit states
  const [editingWallet, setEditingWallet] = useState<string | null>(null);
  const [newAddress, setNewAddress] = useState('');
  const [editingFee, setEditingFee] = useState(false);
  const [newFee, setNewFee] = useState('');
  const [showAddresses, setShowAddresses] = useState<Record<string, boolean>>({});
  const [copied, setCopied] = useState('');

  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

  const fetchData = useCallback(async () => {
    try {
      const [walletsR, cfgR, sumR, payR, auditR] = await Promise.all([
        fetch(`${API}/admin/wallets`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API}/config/financial`),
        fetch(`${API}/admin/financial/summary`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API}/admin/financial/payments?limit=20`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API}/admin/wallets-audit?limit=50`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      if (walletsR.ok) setWallets(await walletsR.json());
      if (cfgR.ok) setConfig(await cfgR.json());
      if (sumR.ok) setSummary(await sumR.json());
      if (payR.ok) setPayments(await payR.json());
      if (auditR.ok) setAuditLog(await auditR.json());
    } catch { /* */ }
    finally { setLoading(false); }
  }, [token]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSaveAddress = async (purpose: string) => {
    if (!newAddress || newAddress.length < 30) {
      setMessage({ type: 'error', text: 'Invalid wallet address (min 30 chars)' }); return;
    }
    setSaving(true); setMessage(null);
    try {
      const r = await fetch(`${API}/admin/wallets/${purpose}/address`, {
        method: 'PUT', headers, body: JSON.stringify({ address: newAddress }),
      });
      const data = await r.json();
      if (r.ok) {
        setMessage({ type: 'success', text: `${purpose} wallet updated` });
        setEditingWallet(null); fetchData();
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to update' });
      }
    } catch { setMessage({ type: 'error', text: 'Connection error' }); }
    finally { setSaving(false); }
  };

  const handleToggleWallet = async (purpose: string) => {
    try {
      const r = await fetch(`${API}/admin/wallets/${purpose}/toggle`, { method: 'PUT', headers });
      if (r.ok) { fetchData(); setMessage({ type: 'success', text: `${purpose} wallet toggled` }); }
    } catch { /* */ }
  };

  const handleSaveFee = async () => {
    const fee = parseFloat(newFee);
    if (!fee || fee <= 0) { setMessage({ type: 'error', text: 'Fee must be > 0' }); return; }
    setSaving(true); setMessage(null);
    try {
      const r = await fetch(`${API}/admin/config/financial`, {
        method: 'PUT', headers, body: JSON.stringify({ verificationFee: fee }),
      });
      if (r.ok) { setMessage({ type: 'success', text: 'Fee updated' }); setEditingFee(false); fetchData(); }
      else { setMessage({ type: 'error', text: 'Failed to update fee' }); }
    } catch { setMessage({ type: 'error', text: 'Connection error' }); }
    finally { setSaving(false); }
  };

  const handleConfirmPayment = async (id: string) => {
    try {
      const r = await fetch(`${API}/admin/financial/payments/${id}/status`, {
        method: 'PUT', headers, body: JSON.stringify({ status: 'confirmed' }),
      });
      if (r.ok) fetchData();
    } catch { /* */ }
  };

  const shortAddr = (addr: string) => addr?.length > 14 ? `${addr.slice(0, 8)}...${addr.slice(-6)}` : addr;
  const formatDate = (d: string) => new Date(d).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><Loader2 size={24} className="animate-spin" /></div>;

  const ok = message?.type === 'success';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Feedback */}
      {message && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', borderRadius: 8,
          background: ok ? 'rgba(38,208,124,0.1)' : 'rgba(239,68,68,0.1)',
          border: `1px solid ${ok ? 'rgba(38,208,124,0.3)' : 'rgba(239,68,68,0.3)'}`,
          color: ok ? '#26d07c' : '#ef4444', fontSize: 13 }}>
          {ok ? <CheckCircle size={16} /> : <AlertTriangle size={16} />} {message.text}
        </div>
      )}

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
        {[
          { l: 'Verification Income', v: `${(summary?.totalVerificationIncome || 0).toLocaleString()} LUNES`, c: '#26d07c', icon: <DollarSign size={18} /> },
          { l: 'Verifications', v: `${summary?.totalVerificationsCompleted || 0}`, c: '#7B42FF', icon: <ShieldCheck size={18} /> },
          { l: 'Pending', v: `${summary?.totalVerificationsPending || 0}`, c: '#FFC107', icon: <Clock size={18} /> },
          { l: 'Managed Wallets', v: `${wallets.length}`, c: '#00A3FF', icon: <Wallet size={18} /> },
        ].map((s, i) => (
          <div key={i} style={{ padding: 20, borderRadius: 12, background: `${s.c}08`, border: `1px solid ${s.c}25` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <span style={{ color: s.c }}>{s.icon}</span>
              <span style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>{s.l}</span>
            </div>
            <div style={{ fontSize: 24, fontWeight: 700, color: s.c }}>{s.v}</div>
          </div>
        ))}
      </div>

      {/* Sub-tabs */}
      <div style={{ display: 'flex', gap: 4, background: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: 4 }}>
        {([['wallets', 'Wallet Management', wallets.length], ['payments', 'Payments', payments.length], ['audit', 'Audit Log', auditLog.length]] as const).map(([k, l, c]) => (
          <button key={k} onClick={() => setSubTab(k as SubTab)}
            style={{ flex: 1, padding: '10px 16px', borderRadius: 8, border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              background: subTab === k ? '#6c38ff' : 'transparent', color: subTab === k ? 'white' : 'var(--text-muted)' }}>
            {k === 'wallets' && <Wallet size={14} />}
            {k === 'payments' && <Coins size={14} />}
            {k === 'audit' && <History size={14} />}
            {l} <span style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: 10, fontSize: 11 }}>{c}</span>
          </button>
        ))}
      </div>

      {/* Wallets Tab */}
      {subTab === 'wallets' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {wallets.map(w => {
            const color = WALLET_COLORS[w.purpose] || '#6c38ff';
            const icon = WALLET_ICONS[w.purpose] || <Wallet size={18} />;
            const isEditing = editingWallet === w.purpose;
            const isShown = showAddresses[w.purpose];

            return (
              <div key={w.purpose} style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${color}30`, borderRadius: 12, padding: 20, opacity: w.isActive ? 1 : 0.6 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: `${color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', color }}>{icon}</div>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 600, color: 'white' }}>{w.label}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        {w.purpose} · Updated {formatDate(w.updatedAt)}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={() => handleToggleWallet(w.purpose)} title={w.isActive ? 'Pause' : 'Activate'}
                      style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.08)', background: 'transparent', color: w.isActive ? '#26d07c' : '#ff284c', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12 }}>
                      <Power size={14} /> {w.isActive ? 'Active' : 'Paused'}
                    </button>
                  </div>
                </div>

                {/* Address */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    <Lock size={11} style={{ marginRight: 4, verticalAlign: -1 }} /> Receiving Address
                  </span>
                  {isEditing ? (
                    <div style={{ display: 'flex', gap: 6 }}>
                      <input value={newAddress} onChange={e => setNewAddress(e.target.value)} placeholder="5Grwva... (SS58 address)" style={IS} />
                      <button onClick={() => handleSaveAddress(w.purpose)} disabled={saving}
                        style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: '#26d07c', color: 'white', fontWeight: 600, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap' }}>
                        <Save size={14} /> Save
                      </button>
                      <button onClick={() => setEditingWallet(null)} style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer' }}>
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <code style={{ flex: 1, padding: '10px 14px', borderRadius: 8, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', fontFamily: 'monospace', fontSize: 13, color: 'var(--text-primary)', wordBreak: 'break-all' }}>
                        {isShown ? w.address : `${w.address.slice(0, 8)}${'•'.repeat(20)}${w.address.slice(-6)}`}
                      </code>
                      <button onClick={() => setShowAddresses(s => ({ ...s, [w.purpose]: !s[w.purpose] }))}
                        style={{ width: 32, height: 32, borderRadius: 6, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.04)', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                        {isShown ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                      <button onClick={() => { navigator.clipboard.writeText(w.address); setCopied(w.purpose); setTimeout(() => setCopied(''), 2000); }}
                        style={{ width: 32, height: 32, borderRadius: 6, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.04)', color: copied === w.purpose ? '#26d07c' : 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                        {copied === w.purpose ? <Check size={14} /> : <Copy size={14} />}
                      </button>
                      <button onClick={() => { setNewAddress(w.address); setEditingWallet(w.purpose); }}
                        style={{ width: 32, height: 32, borderRadius: 6, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.04)', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                        <Edit3 size={14} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Verification Fee */}
          <Card title="Verification Fee" icon={<Coins size={18} />}>
            <div style={{ padding: 16 }}>
              {editingFee ? (
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <input type="number" value={newFee} onChange={e => setNewFee(e.target.value)} min={1}
                    style={{ width: 140, padding: '8px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.3)', color: 'white', fontSize: 14, fontWeight: 600 }} />
                  <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>LUNES</span>
                  <button onClick={handleSaveFee} disabled={saving}
                    style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: '#26d07c', color: 'white', fontWeight: 600, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Save size={14} /> Save
                  </button>
                  <button onClick={() => setEditingFee(false)} style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer' }}>
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 20, fontWeight: 700, color: '#7B42FF' }}>{(config?.verificationFee || 0).toLocaleString()}</span>
                  <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>LUNES per verification</span>
                  <button onClick={() => { setNewFee(String(config?.verificationFee || 1000)); setEditingFee(true); }}
                    style={{ marginLeft: 8, width: 32, height: 32, borderRadius: 6, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.04)', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                    <Edit3 size={14} />
                  </button>
                </div>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* Payments Tab */}
      {subTab === 'payments' && (
        <Card title="Verification Payments" icon={<Coins size={18} />}>
          <div style={{ padding: 16 }}>
            {payments.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: 13, textAlign: 'center', padding: 20 }}>No payments recorded yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 100px 80px 100px', gap: 8, padding: '8px 12px', fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  <span>Project</span><span>Payer</span><span>Amount</span><span>Status</span><span>Date</span>
                </div>
                {payments.map(p => (
                  <div key={p.id} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 100px 80px 100px', gap: 8, padding: '10px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', alignItems: 'center', fontSize: 13 }}>
                    <span style={{ fontWeight: 600 }}>{p.projectName || p.projectSlug}</span>
                    <span style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--text-muted)' }}>{shortAddr(p.payerAddress)}</span>
                    <span style={{ fontWeight: 600, color: '#7B42FF' }}>{p.amount.toLocaleString()}</span>
                    <span>
                      {p.status === 'confirmed' ? (
                        <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 4, background: 'rgba(38,208,124,0.15)', color: '#26d07c' }}>Confirmed</span>
                      ) : p.status === 'pending' ? (
                        <button onClick={() => handleConfirmPayment(p.id)} style={{ fontSize: 11, padding: '2px 8px', borderRadius: 4, background: 'rgba(255,193,7,0.15)', color: '#FFC107', border: 'none', cursor: 'pointer' }}>Pending</button>
                      ) : (
                        <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 4, background: 'rgba(239,68,68,0.15)', color: '#ef4444' }}>Failed</span>
                      )}
                    </span>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{formatDate(p.submittedAt)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Audit Log Tab */}
      {subTab === 'audit' && (
        <Card title="Wallet Audit Log" icon={<History size={18} />}>
          <div style={{ padding: 16 }}>
            {auditLog.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: 13, textAlign: 'center', padding: 20 }}>No audit entries yet. Changes to wallets will be logged here.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {auditLog.map(entry => (
                  <div key={entry.id} style={{ padding: '12px 16px', borderRadius: 8, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 4, background: `${WALLET_COLORS[entry.purpose] || '#666'}20`, color: WALLET_COLORS[entry.purpose] || '#666', fontWeight: 600, textTransform: 'uppercase' }}>
                          {entry.purpose}
                        </span>
                        <span style={{ fontSize: 12, fontWeight: 600, color: 'white' }}>
                          {entry.action.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{formatDate(entry.timestamp)}</span>
                    </div>
                    {entry.details && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>{entry.details}</div>}
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      by <strong style={{ color: '#6c38ff' }}>{entry.changedBy}</strong>
                      {entry.previousValue && <> · from <code style={{ color: '#ff284c' }}>{shortAddr(entry.previousValue)}</code></>}
                      {entry.newValue && <> · to <code style={{ color: '#26d07c' }}>{shortAddr(entry.newValue)}</code></>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
