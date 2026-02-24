import React, { useState, useEffect, useCallback } from 'react';
import {
  Shield,
  Wallet,
  TrendingUp,
  Users,
  Gift,
  Plus,
  AlertTriangle,
  CheckCircle,
  Coins,
  Settings,
  BarChart3,
  Loader2,
  ArrowLeft,
  Edit3,
  Save,
  X,
  Power,
  History,
  Copy,
  Check,
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  KeySquare,
  RefreshCw,
  Trophy,
  Trash2,
  Zap,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { Link } from 'react-router-dom';
import { useAdminWallet, useRewardStats } from '../../hooks/useRewards';
import Card from '../../components/common/Card';
import styles from './AdminRewards.module.css';
import { mnemonicGenerate, cryptoWaitReady } from '@polkadot/util-crypto';
import { Keyring } from '@polkadot/keyring';
import { API_BASE_URL } from '../../config';

const API = API_BASE_URL;

interface ChangeLogEntry {
  id: string;
  action: string;
  previousValue?: string;
  newValue?: string;
  changedBy: string;
  timestamp: string;
  details?: string;
}

const AdminRewards: React.FC = () => {
  const { isAuthenticated, isLoading, token } = useAdminAuth();
  const { data: wallet, refill, refetch: reloadWallet } = useAdminWallet(token);
  const { data: stats, loading: statsLoading } = useRewardStats(token);

  const [activeTab, setActiveTab] = useState<'overview' | 'wallet' | 'settings'>('overview');
  const [refillToken, setRefillToken] = useState<'lunes' | 'lusdt' | 'pidchat'>('lunes');
  const [refillAmount, setRefillAmount] = useState('');
  const [refillLoading, setRefillLoading] = useState(false);
  const [refillResult, setRefillResult] = useState<{ success: boolean; message: string } | null>(null);
  const [configValues, setConfigValues] = useState({ minClaimPoints: 100, claimCooldownHours: 24, rewardToken: 'lunes' as 'lunes' | 'lusdt' | 'pidchat', conversionRate: 100, dailyLimit: 10 });
  const [configSaving, setConfigSaving] = useState(false);
  const [configResult, setConfigResult] = useState<{ success: boolean; message: string } | null>(null);
  const [tiers, setTiers] = useState<{ id: string; name: string; minTransactions: number; minStakeAmount: number; multiplier: number; badge: string; color: string }[]>([]);
  const [goals, setGoals] = useState<{ id: string; name: string; description: string; basePoints: number; cooldownHours: number; maxPerDay: number; icon: string; enabled: boolean }[]>([]);
  const [configLoaded, setConfigLoaded] = useState(false);

  // Wallet management state
  const [editingAddress, setEditingAddress] = useState(false);
  const [newAddress, setNewAddress] = useState('');
  const [editingName, setEditingName] = useState(false);
  const [newWalletName, setNewWalletName] = useState('');
  const [walletMessage, setWalletMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [changelog, setChangelog] = useState<ChangeLogEntry[]>([]);
  const [showChangelog, setShowChangelog] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState(false);
  const [showAddress, setShowAddress] = useState(false);
  const [toggleLoading, setToggleLoading] = useState(false);

  // Seed generation state
  const [generatedSeed, setGeneratedSeed] = useState<string | null>(null);
  const [generatedAddress, setGeneratedAddress] = useState<string | null>(null);
  const [showSeed, setShowSeed] = useState(false);
  const [copiedSeed, setCopiedSeed] = useState(false);
  const [seedConfirmed, setSeedConfirmed] = useState(false);

  const handleGenerateSeed = async () => {
    await cryptoWaitReady();
    const mnemonic = mnemonicGenerate(12);
    const keyring = new Keyring({ type: 'sr25519', ss58Format: 42 });
    const pair = keyring.addFromMnemonic(mnemonic);
    setGeneratedSeed(mnemonic);
    setGeneratedAddress(pair.address);
    setShowSeed(true);
    setCopiedSeed(false);
    setSeedConfirmed(false);
  };

  const handleApplyGeneratedAddress = async () => {
    if (!generatedAddress) return;
    setWalletMessage(null);
    try {
      const res = await fetch(`${API}/admin/rewards/wallet/change-address`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: generatedAddress }),
      });
      const data = await res.json();
      if (res.ok) {
        setWalletMessage({ type: 'success', text: 'Generated wallet address applied successfully!' });
        reloadWallet();
        setGeneratedSeed(null);
        setGeneratedAddress(null);
        setShowSeed(false);
        setSeedConfirmed(false);
      } else {
        setWalletMessage({ type: 'error', text: data.error || 'Failed to apply address' });
      }
    } catch { setWalletMessage({ type: 'error', text: 'Connection error' }); }
  };

  const fetchChangelog = useCallback(async () => {
    try {
      const res = await fetch(`${API}/admin/rewards/wallet/changelog`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setChangelog(await res.json());
    } catch { /* ignore */ }
  }, [token]);

  useEffect(() => {
    if (showChangelog) fetchChangelog();
  }, [showChangelog, fetchChangelog]);

  // Load current config from API
  useEffect(() => {
    if (configLoaded) return;
    (async () => {
      try {
        const res = await fetch(`${API}/rewards/config`);
        if (res.ok) {
          const cfg = await res.json();
          setConfigValues({
            minClaimPoints: cfg.minClaimPoints ?? 100,
            claimCooldownHours: cfg.claimCooldownHours ?? 24,
            rewardToken: cfg.rewardToken ?? 'lunes',
            conversionRate: cfg.conversionRate ?? 100,
            dailyLimit: cfg.dailyLimit ?? 10,
          });
          if (cfg.tiers?.length) setTiers(cfg.tiers);
          if (cfg.goals?.length) setGoals(cfg.goals);
          setConfigLoaded(true);
        }
      } catch { /* use defaults */ }
    })();
  }, [configLoaded]);

  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Verifying access...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className={styles.accessDenied}>
        <Shield size={56} color="var(--color-brand-400)" />
        <h2>Admin Access Required</h2>
        <p>You must be logged in to access the rewards panel.</p>
        <Link to="/admin/login" className={styles.loginButton}>Go to Login</Link>
        <Link to="/" className={styles.backButton}><ArrowLeft size={16} /> Back to Explorer</Link>
      </div>
    );
  }

  const handleSaveConfig = async () => {
    setConfigSaving(true);
    setConfigResult(null);
    try {
      const res = await fetch(`${API}/admin/rewards/config`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          minClaimPoints: configValues.minClaimPoints,
          claimCooldownHours: configValues.claimCooldownHours,
          rewardToken: configValues.rewardToken,
          conversionRate: configValues.conversionRate,
          dailyLimit: configValues.dailyLimit,
          tiers: tiers.filter(t => t.name.trim()),
          goals: goals.filter(g => g.name.trim()),
        }),
      });
      if (res.ok) {
        setConfigResult({ success: true, message: 'Configuration saved successfully' });
      } else {
        setConfigResult({ success: false, message: 'Failed to save configuration' });
      }
    } catch {
      setConfigResult({ success: false, message: 'Network error saving configuration' });
    } finally {
      setConfigSaving(false);
    }
  };

  // Tier helpers
  const updateTier = (i: number, field: string, value: string | number) => {
    setTiers(prev => prev.map((t, idx) => idx === i ? { ...t, [field]: value } : t));
  };
  const addTier = () => setTiers(prev => [...prev, { id: `tier-${Date.now()}`, name: '', minTransactions: 0, minStakeAmount: 0, multiplier: 1.0, badge: '🏅', color: '#808080' }]);
  const removeTier = (i: number) => setTiers(prev => prev.filter((_, idx) => idx !== i));

  // Goal helpers
  const updateGoal = (i: number, field: string, value: string | number | boolean) => {
    setGoals(prev => prev.map((g, idx) => idx === i ? { ...g, [field]: value } : g));
  };
  const addGoal = () => setGoals(prev => [...prev, { id: `goal-${Date.now()}`, name: '', description: '', basePoints: 10, cooldownHours: 24, maxPerDay: 1, icon: 'Zap', enabled: true }]);
  const removeGoal = (i: number) => setGoals(prev => prev.filter((_, idx) => idx !== i));

  const handleRefill = async () => {
    const amount = parseFloat(refillAmount);
    if (!amount || amount <= 0) return;

    setRefillLoading(true);
    setRefillResult(null);

    try {
      await refill(refillToken, amount);
      setRefillResult({ success: true, message: `Added ${amount} ${refillToken.toUpperCase()} to wallet` });
      setRefillAmount('');
    } catch (err) {
      setRefillResult({ success: false, message: 'Failed to refill wallet' });
    } finally {
      setRefillLoading(false);
    }
  };

  const formatNumber = (num: number) => num.toLocaleString();

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <h1 className={styles.title}>
          <Shield size={28} />
          Rewards Admin
        </h1>
        <p className={styles.subtitle}>
          Manage reward distribution, wallet balances, and system configuration
        </p>
      </div>

      {/* Stats Overview */}
      <div className={styles.statsGrid}>
        <Card className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: 'rgba(108, 56, 255, 0.15)', color: '#7B42FF' }}>
            <Users size={24} />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>
              {statsLoading ? '...' : formatNumber(stats?.totalUsers || 0)}
            </span>
            <span className={styles.statLabel}>Total Users</span>
          </div>
        </Card>

        <Card className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: 'rgba(38, 208, 124, 0.15)', color: '#26D07C' }}>
            <Gift size={24} />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>
              {statsLoading ? '...' : formatNumber(stats?.totalPointsDistributed || 0)}
            </span>
            <span className={styles.statLabel}>Points Distributed</span>
          </div>
        </Card>

        <Card className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: 'rgba(0, 163, 255, 0.15)', color: '#00A3FF' }}>
            <TrendingUp size={24} />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>
              {statsLoading ? '...' : formatNumber(stats?.totalPointsClaimed || 0)}
            </span>
            <span className={styles.statLabel}>Points Claimed</span>
          </div>
        </Card>

        <Card className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: 'rgba(255, 193, 7, 0.15)', color: '#FFC107' }}>
            <BarChart3 size={24} />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>
              {stats ? `${((stats.totalPointsClaimed / stats.totalPointsDistributed) * 100 || 0).toFixed(1)}%` : '...'}
            </span>
            <span className={styles.statLabel}>Claim Rate</span>
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === 'overview' ? styles.active : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <BarChart3 size={16} />
          Overview
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'wallet' ? styles.active : ''}`}
          onClick={() => setActiveTab('wallet')}
        >
          <Wallet size={16} />
          Wallet
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'settings' ? styles.active : ''}`}
          onClick={() => setActiveTab('settings')}
        >
          <Settings size={16} />
          Settings
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
          <Card title="Token Distribution Summary" icon={<Coins size={18} />}>
            <div className={styles.tokenStats}>
              {stats && Object.entries(stats.walletDistributed).map(([token, amount]) => (
                <div key={token} className={styles.tokenStat}>
                  <div className={styles.tokenHeader}>
                    <span className={styles.tokenSymbol}>{token.toUpperCase()}</span>
                    <span className={styles.tokenBadge}>{stats.walletBalance[token] || 0} available</span>
                  </div>
                  <div className={styles.tokenBar}>
                    <div
                      className={styles.tokenFill}
                      style={{
                        width: `${Math.min((amount / ((amount + (stats.walletBalance[token] || 0)) || 1)) * 100, 100)}%`,
                        backgroundColor: token === 'lunes' ? '#26D07C' : token === 'lusdt' ? '#00A3FF' : '#7B42FF'
                      }}
                    />
                  </div>
                  <div className={styles.tokenNumbers}>
                    <span>{formatNumber(amount)} distributed</span>
                    <span>{formatNumber(stats.walletBalance[token] || 0)} remaining</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card title="System Health" icon={<AlertTriangle size={18} />}>
            <div className={styles.healthGrid}>
              <div className={`${styles.healthItem} ${wallet?.isActive ? styles.healthy : styles.warning}`}>
                <CheckCircle size={20} />
                <div>
                  <span className={styles.healthLabel}>Reward Wallet</span>
                  <span className={styles.healthValue}>{wallet?.isActive ? 'Active' : 'Inactive'}</span>
                </div>
              </div>
              <div className={`${styles.healthItem} ${(stats?.walletBalance?.lunes || 0) > 100 ? styles.healthy : styles.warning}`}>
                <Coins size={20} />
                <div>
                  <span className={styles.healthLabel}>LUNES Balance</span>
                  <span className={styles.healthValue}>{stats?.walletBalance?.lunes || 0} LUNES</span>
                </div>
              </div>
              <div className={`${styles.healthItem} ${(stats?.totalUsers || 0) > 10 ? styles.healthy : styles.neutral}`}>
                <Users size={20} />
                <div>
                  <span className={styles.healthLabel}>Active Users</span>
                  <span className={styles.healthValue}>{stats?.totalUsers || 0} users</span>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'wallet' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
          {walletMessage && (
            <div className={`${styles.refillResult} ${walletMessage.type === 'success' ? styles.success : styles.error}`}>
              {walletMessage.type === 'success' ? <CheckCircle size={18} /> : <AlertTriangle size={18} />}
              {walletMessage.text}
            </div>
          )}

          <Card title="Wallet Configuration" icon={<ShieldCheck size={18} />}>
            <div className={styles.walletInfo}>
              {/* Wallet Status & Toggle */}
              <div className={styles.walletStatusBar}>
                <div className={styles.walletStatusInfo}>
                  <div className={`${styles.walletStatusDot} ${wallet?.isActive ? styles.active : styles.paused}`} />
                  <span className={styles.walletStatusText}>
                    {wallet?.isActive ? 'Distribution Active' : 'Distribution Paused'}
                  </span>
                </div>
                <button
                  className={`${styles.walletToggleBtn} ${wallet?.isActive ? styles.activeToggle : styles.pausedToggle}`}
                  onClick={async () => {
                    setToggleLoading(true);
                    setWalletMessage(null);
                    try {
                      const res = await fetch(`${API}/admin/rewards/wallet/toggle-active`, {
                        method: 'POST',
                        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                      });
                      if (res.ok) {
                        setWalletMessage({ type: 'success', text: wallet?.isActive ? 'Distribution paused successfully' : 'Distribution resumed successfully' });
                        reloadWallet();
                      } else {
                        const data = await res.json();
                        setWalletMessage({ type: 'error', text: data.error || 'Failed to change status' });
                      }
                    } catch { setWalletMessage({ type: 'error', text: 'Connection error' }); }
                    finally { setToggleLoading(false); }
                  }}
                  disabled={toggleLoading}
                >
                  <Power size={14} />
                  {toggleLoading ? 'Please wait...' : wallet?.isActive ? 'Pause' : 'Resume'}
                </button>
              </div>

              {/* Wallet Name */}
              <div className={styles.walletField}>
                <span className={styles.walletFieldLabel}>Wallet Name</span>
                {editingName ? (
                  <div className={styles.walletFieldEdit}>
                    <input
                      type="text"
                      value={newWalletName}
                      onChange={(e) => setNewWalletName(e.target.value)}
                      className={styles.walletFieldInput}
                      placeholder="Wallet name"
                    />
                    <button
                      className={styles.walletFieldSave}
                      onClick={async () => {
                        setWalletMessage(null);
                        try {
                          const res = await fetch(`${API}/admin/rewards/wallet/change-name`, {
                            method: 'POST',
                            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                            body: JSON.stringify({ name: newWalletName }),
                          });
                          if (res.ok) {
                            setWalletMessage({ type: 'success', text: 'Name updated' });
                            reloadWallet();
                            setEditingName(false);
                          }
                        } catch { setWalletMessage({ type: 'error', text: 'Connection error' }); }
                      }}
                    ><Save size={14} /></button>
                    <button className={styles.walletFieldCancel} onClick={() => setEditingName(false)}><X size={14} /></button>
                  </div>
                ) : (
                  <div className={styles.walletFieldValue}>
                    <span>{wallet?.name || 'Unnamed'}</span>
                    <button className={styles.walletFieldEditBtn} onClick={() => { setNewWalletName(wallet?.name || ''); setEditingName(true); }}>
                      <Edit3 size={14} />
                    </button>
                  </div>
                )}
              </div>

              {/* Wallet Address - Secure */}
              <div className={styles.walletField}>
                <span className={styles.walletFieldLabel}>
                  <Lock size={14} />
                  Distribution Address
                </span>
                {editingAddress ? (
                  <div className={styles.walletFieldEdit}>
                    <input
                      type="text"
                      value={newAddress}
                      onChange={(e) => setNewAddress(e.target.value)}
                      className={styles.walletFieldInput}
                      placeholder="5Grwva... (SS58 address)"
                      style={{ fontFamily: 'monospace' }}
                    />
                    <button
                      className={styles.walletFieldSave}
                      onClick={async () => {
                        setWalletMessage(null);
                        if (newAddress.length < 30) {
                          setWalletMessage({ type: 'error', text: 'Invalid address (minimum 30 characters)' });
                          return;
                        }
                        try {
                          const res = await fetch(`${API}/admin/rewards/wallet/change-address`, {
                            method: 'POST',
                            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                            body: JSON.stringify({ address: newAddress }),
                          });
                          const data = await res.json();
                          if (res.ok) {
                            setWalletMessage({ type: 'success', text: 'Address updated successfully!' });
                            reloadWallet();
                            setEditingAddress(false);
                          } else {
                            setWalletMessage({ type: 'error', text: data.error || 'Failed to update address' });
                          }
                        } catch { setWalletMessage({ type: 'error', text: 'Connection error' }); }
                      }}
                    ><Save size={14} /></button>
                    <button className={styles.walletFieldCancel} onClick={() => setEditingAddress(false)}><X size={14} /></button>
                  </div>
                ) : (
                  <div className={styles.walletFieldValue}>
                    <code className={styles.walletCode}>
                      {showAddress
                        ? wallet?.address || 'Not configured'
                        : wallet?.address
                          ? `${wallet.address.slice(0, 8)}${'•'.repeat(20)}${wallet.address.slice(-6)}`
                          : 'Not configured'
                      }
                    </code>
                    <div className={styles.walletAddressActions}>
                      <button
                        className={styles.walletFieldEditBtn}
                        onClick={() => setShowAddress(!showAddress)}
                        title={showAddress ? 'Hide' : 'Show'}
                      >
                        {showAddress ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                      <button
                        className={styles.walletFieldEditBtn}
                        onClick={() => {
                          navigator.clipboard.writeText(wallet?.address || '');
                          setCopiedAddress(true);
                          setTimeout(() => setCopiedAddress(false), 2000);
                        }}
                        title="Copy"
                      >
                        {copiedAddress ? <Check size={14} /> : <Copy size={14} />}
                      </button>
                      <button
                        className={styles.walletFieldEditBtn}
                        onClick={() => { setNewAddress(wallet?.address || ''); setEditingAddress(true); }}
                        title="Change address"
                      >
                        <Edit3 size={14} />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Balances */}
              <div className={styles.balancesGrid}>
                {wallet && Object.entries(wallet.balances).map(([tk, balance]) => (
                  <div key={tk} className={styles.balanceCard}>
                    <span className={styles.balanceToken}>{tk.toUpperCase()}</span>
                    <span className={styles.balanceValue}>{formatNumber(balance)}</span>
                    <span className={styles.balanceDaily}>
                      {formatNumber(wallet.dailyDistributed[tk] || 0)} distributed today
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          {/* Seed Generation */}
          <Card title="Generate New Wallet" icon={<KeySquare size={18} />}>
            <div style={{ padding: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 16 }}>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>
                Generate a seed phrase (mnemonic) to create a new distribution wallet. <strong style={{ color: '#ff284c' }}>Save the seed in a safe place — it will not be stored in the system.</strong>
              </p>

              {!generatedSeed ? (
                <button
                  onClick={handleGenerateSeed}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 8, border: '1px solid rgba(108,56,255,0.3)', background: 'rgba(108,56,255,0.08)', color: 'var(--color-brand-400)', fontWeight: 600, fontSize: 13, cursor: 'pointer', alignSelf: 'flex-start', transition: 'all 0.15s' }}
                >
                  <KeySquare size={16} /> Generate Seed Phrase
                </button>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {/* Seed Phrase */}
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                        <Lock size={12} style={{ marginRight: 4, verticalAlign: -1 }} />
                        Seed Phrase (12 words)
                      </span>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button
                          onClick={() => setShowSeed(!showSeed)}
                          style={{ width: 30, height: 30, borderRadius: 6, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.04)', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                          title={showSeed ? 'Hide' : 'Show'}
                        >
                          {showSeed ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                        <button
                          onClick={() => { navigator.clipboard.writeText(generatedSeed || ''); setCopiedSeed(true); setTimeout(() => setCopiedSeed(false), 2000); }}
                          style={{ width: 30, height: 30, borderRadius: 6, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.04)', color: copiedSeed ? '#26d07c' : 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                          title="Copy seed"
                        >
                          {copiedSeed ? <Check size={14} /> : <Copy size={14} />}
                        </button>
                      </div>
                    </div>
                    <div style={{ padding: '12px 14px', borderRadius: 8, background: 'rgba(255,40,76,0.04)', border: '1px solid rgba(255,40,76,0.15)', fontFamily: 'var(--font-mono)', fontSize: 13, lineHeight: 1.6, wordBreak: 'break-word', color: showSeed ? 'var(--text-primary)' : 'transparent', textShadow: showSeed ? 'none' : '0 0 8px rgba(255,255,255,0.5)', userSelect: showSeed ? 'text' : 'none' }}>
                      {generatedSeed}
                    </div>
                  </div>

                  {/* Generated Address */}
                  <div>
                    <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', marginBottom: 6 }}>
                      Generated Address (SS58)
                    </span>
                    <code style={{ display: 'block', padding: '10px 14px', borderRadius: 8, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-primary)', wordBreak: 'break-all' }}>
                      {generatedAddress}
                    </code>
                  </div>

                  {/* Confirm & Apply */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-muted)', cursor: 'pointer' }}>
                      <input type="checkbox" checked={seedConfirmed} onChange={e => setSeedConfirmed(e.target.checked)} />
                      I confirm that I saved the seed in a safe place
                    </label>
                  </div>

                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      onClick={handleGenerateSeed}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: 'var(--text-muted)', fontSize: 13, cursor: 'pointer' }}
                    >
                      <RefreshCw size={14} /> Generate Another
                    </button>
                    <button
                      onClick={handleApplyGeneratedAddress}
                      disabled={!seedConfirmed}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 20px', borderRadius: 8, border: 'none', background: seedConfirmed ? '#26d07c' : 'rgba(255,255,255,0.06)', color: seedConfirmed ? 'white' : 'var(--text-muted)', fontWeight: 600, fontSize: 13, cursor: seedConfirmed ? 'pointer' : 'not-allowed', transition: 'all 0.15s' }}
                    >
                      <ShieldCheck size={14} /> Apply as Distribution Address
                    </button>
                    <button
                      onClick={() => { setGeneratedSeed(null); setGeneratedAddress(null); setShowSeed(false); setSeedConfirmed(false); }}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: 'var(--text-muted)', fontSize: 13, cursor: 'pointer' }}
                    >
                      <X size={14} /> Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Refill */}
          <Card title="Refill Wallet" icon={<Plus size={18} />}>
            <div className={styles.refillSection}>
              <div className={styles.refillTokenSelect}>
                {(['lunes', 'lusdt', 'pidchat'] as const).map(tk => (
                  <button
                    key={tk}
                    className={`${styles.refillTokenBtn} ${refillToken === tk ? styles.active : ''}`}
                    onClick={() => setRefillToken(tk)}
                  >
                    {tk === 'lunes' ? '🌙' : tk === 'lusdt' ? '💵' : '💬'} {tk.toUpperCase()}
                  </button>
                ))}
              </div>

              <div className={styles.refillInput}>
                <input
                  type="number"
                  placeholder={`Amount (${refillToken.toUpperCase()})`}
                  value={refillAmount}
                  onChange={(e) => setRefillAmount(e.target.value)}
                  className={styles.amountInput}
                />
                <button
                  className={styles.refillBtn}
                  onClick={handleRefill}
                  disabled={refillLoading || !refillAmount}
                >
                  {refillLoading ? (
                    <Loader2 size={18} className={styles.spinner} />
                  ) : (
                    <><Plus size={18} /> Add</>
                  )}
                </button>
              </div>

              {refillResult && (
                <div className={`${styles.refillResult} ${refillResult.success ? styles.success : styles.error}`}>
                  {refillResult.success ? <CheckCircle size={18} /> : <AlertTriangle size={18} />}
                  {refillResult.message}
                </div>
              )}
            </div>
          </Card>

          {/* Change Log */}
          <Card
            title="Change History"
            icon={<History size={18} />}
          >
            <div className={styles.changelogSection}>
              <button
                className={styles.changelogToggle}
                onClick={() => setShowChangelog(!showChangelog)}
              >
                {showChangelog ? 'Hide History' : 'Show History'}
              </button>
              {showChangelog && (
                <div className={styles.changelogList}>
                  {changelog.length === 0 ? (
                    <p className={styles.changelogEmpty}>No changes recorded.</p>
                  ) : (
                    changelog.map((entry) => (
                      <div key={entry.id} className={styles.changelogEntry}>
                        <div className={styles.changelogDot} data-action={entry.action} />
                        <div className={styles.changelogContent}>
                          <span className={styles.changelogAction}>
                            {entry.action === 'address_changed' ? '🔑 Address changed'
                              : entry.action === 'wallet_paused' ? '⏸️ Distribution paused'
                              : entry.action === 'wallet_resumed' ? '▶️ Distribution resumed'
                              : entry.action === 'wallet_renamed' ? '✏️ Name changed'
                              : entry.action === 'balance_refilled' ? '💰 Balance refilled'
                              : entry.action}
                          </span>
                          {entry.details && <span className={styles.changelogDetails}>{entry.details}</span>}
                          <span className={styles.changelogMeta}>
                            by {entry.changedBy} on {new Date(entry.timestamp).toLocaleString('en-US')}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'settings' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
          {/* General Config */}
          <Card title="General Configuration" icon={<Settings size={18} />}>
            <div className={styles.configSection}>
              <div className={styles.configItem}>
                <div className={styles.configInfo}>
                  <span className={styles.configLabel}>Minimum Claim Points</span>
                  <span className={styles.configDesc}>Minimum points required to claim rewards</span>
                </div>
                <input type="number" value={configValues.minClaimPoints} onChange={e => setConfigValues(v => ({ ...v, minClaimPoints: Number(e.target.value) }))} className={styles.configInput} />
              </div>
              <div className={styles.configItem}>
                <div className={styles.configInfo}>
                  <span className={styles.configLabel}>Claim Cooldown (hours)</span>
                  <span className={styles.configDesc}>Time between claims</span>
                </div>
                <input type="number" value={configValues.claimCooldownHours} onChange={e => setConfigValues(v => ({ ...v, claimCooldownHours: Number(e.target.value) }))} className={styles.configInput} />
              </div>
              <div className={styles.configItem}>
                <div className={styles.configInfo}>
                  <span className={styles.configLabel}>Daily Claim Limit</span>
                  <span className={styles.configDesc}>Max tokens a user can claim per day</span>
                </div>
                <input type="number" value={configValues.dailyLimit} onChange={e => setConfigValues(v => ({ ...v, dailyLimit: Number(e.target.value) }))} className={styles.configInput} />
              </div>
            </div>
          </Card>

          {/* Reward Token & Conversion Rate */}
          <Card title="Reward Token (Points → Token)" icon={<Coins size={18} />}>
            <div className={styles.configSection}>
              <div className={styles.configItem}>
                <div className={styles.configInfo}>
                  <span className={styles.configLabel}>Reward Token</span>
                  <span className={styles.configDesc}>The token users receive when claiming rewards</span>
                </div>
                <select
                  value={configValues.rewardToken}
                  onChange={e => setConfigValues(v => ({ ...v, rewardToken: e.target.value as 'lunes' | 'lusdt' | 'pidchat' }))}
                  className={styles.configInput}
                  style={{ minWidth: 140 }}
                >
                  <option value="lunes">🌙 LUNES</option>
                  <option value="lusdt">💵 LUSDT</option>
                  <option value="pidchat">💬 PIDCHAT</option>
                </select>
              </div>
              <div className={styles.configItem}>
                <div className={styles.configInfo}>
                  <span className={styles.configLabel}>Conversion Rate</span>
                  <span className={styles.configDesc}>{configValues.conversionRate} points = 1 {configValues.rewardToken.toUpperCase()}</span>
                </div>
                <input
                  type="number"
                  value={configValues.conversionRate}
                  onChange={e => setConfigValues(v => ({ ...v, conversionRate: Number(e.target.value) }))}
                  className={styles.configInput}
                  min={1}
                />
              </div>
            </div>
          </Card>

          {/* Tier Progress Config */}
          <Card title="Tier Progress Configuration" icon={<Trophy size={18} />}>
            <div style={{ padding: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 14 }}>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>
                Configure the tier levels, requirements, and point multipliers. Users progress through tiers based on transaction count and stake amount.
              </p>

              {tiers.map((tier, i) => (
                <div key={tier.id} style={{
                  display: 'grid', gridTemplateColumns: '40px 1fr 1fr 1fr 1fr 80px 70px auto', gap: 8, alignItems: 'center',
                  padding: '12px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
                }}>
                  {/* Badge */}
                  <div style={{ textAlign: 'center' }}>
                    <input
                      value={tier.badge}
                      onChange={e => updateTier(i, 'badge', e.target.value)}
                      style={{ width: 36, textAlign: 'center', fontSize: 18, padding: '4px 0', borderRadius: 6, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)', color: 'var(--text-primary)' }}
                      maxLength={2}
                      title="Badge emoji"
                    />
                  </div>
                  {/* Name */}
                  <div>
                    <label style={{ fontSize: 10, color: 'var(--text-muted)', display: 'block', marginBottom: 2 }}>Name</label>
                    <input
                      value={tier.name}
                      onChange={e => updateTier(i, 'name', e.target.value)}
                      placeholder="Tier name"
                      style={{ width: '100%', padding: '6px 8px', borderRadius: 6, fontSize: 13, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)', color: 'var(--text-primary)', outline: 'none' }}
                    />
                  </div>
                  {/* Min Transactions */}
                  <div>
                    <label style={{ fontSize: 10, color: 'var(--text-muted)', display: 'block', marginBottom: 2 }}>Min TXs</label>
                    <input
                      type="number"
                      value={tier.minTransactions}
                      onChange={e => updateTier(i, 'minTransactions', Number(e.target.value))}
                      style={{ width: '100%', padding: '6px 8px', borderRadius: 6, fontSize: 13, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)', color: 'var(--text-primary)', outline: 'none' }}
                      min={0}
                    />
                  </div>
                  {/* Min Stake */}
                  <div>
                    <label style={{ fontSize: 10, color: 'var(--text-muted)', display: 'block', marginBottom: 2 }}>Min Stake (LUNES)</label>
                    <input
                      type="number"
                      value={tier.minStakeAmount}
                      onChange={e => updateTier(i, 'minStakeAmount', Number(e.target.value))}
                      style={{ width: '100%', padding: '6px 8px', borderRadius: 6, fontSize: 13, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)', color: 'var(--text-primary)', outline: 'none' }}
                      min={0}
                    />
                  </div>
                  {/* Multiplier */}
                  <div>
                    <label style={{ fontSize: 10, color: 'var(--text-muted)', display: 'block', marginBottom: 2 }}>Multiplier</label>
                    <input
                      type="number"
                      value={tier.multiplier}
                      onChange={e => updateTier(i, 'multiplier', Number(e.target.value))}
                      step={0.1}
                      min={0.1}
                      style={{ width: '100%', padding: '6px 8px', borderRadius: 6, fontSize: 13, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)', color: 'var(--text-primary)', outline: 'none' }}
                    />
                  </div>
                  {/* Color */}
                  <div>
                    <label style={{ fontSize: 10, color: 'var(--text-muted)', display: 'block', marginBottom: 2 }}>Color</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <input
                        type="color"
                        value={tier.color}
                        onChange={e => updateTier(i, 'color', e.target.value)}
                        style={{ width: 28, height: 28, border: 'none', borderRadius: 4, cursor: 'pointer', background: 'none', padding: 0 }}
                      />
                      <span style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'monospace' }}>{tier.color}</span>
                    </div>
                  </div>
                  {/* Preview */}
                  <div style={{ textAlign: 'center' }}>
                    <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 6, background: `${tier.color}20`, color: tier.color, fontWeight: 600, whiteSpace: 'nowrap' }}>
                      {tier.badge} {tier.name || '?'}
                    </span>
                  </div>
                  {/* Remove */}
                  <div>
                    <button
                      onClick={() => removeTier(i)}
                      style={{ background: 'rgba(239,68,68,0.1)', border: 'none', borderRadius: 6, padding: '6px 8px', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                      title="Remove tier"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}

              <button
                onClick={addTier}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '10px 16px', borderRadius: 8, border: '1px dashed rgba(108,56,255,0.3)', background: 'rgba(108,56,255,0.06)', color: 'var(--color-brand-400)', cursor: 'pointer', fontSize: 13, fontWeight: 600, width: '100%' }}
              >
                <Plus size={14} /> Add Tier
              </button>
            </div>
          </Card>

          {/* Goals (Ways to Earn) */}
          <Card title="Goals — Ways to Earn Points" icon={<Zap size={18} />}>
            <div style={{ padding: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 12 }}>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>
                Configure the goals that users can complete to earn points. Each goal has a name, description, base points, cooldown, and daily limit.
              </p>

              {goals.map((goal, i) => (
                <div key={goal.id} style={{
                  padding: '14px 16px', borderRadius: 10, background: goal.enabled ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.01)',
                  border: `1px solid ${goal.enabled ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.03)'}`,
                  opacity: goal.enabled ? 1 : 0.6, transition: 'all 0.15s',
                }}>
                  {/* Row 1: Name, Points, Enable/Disable, Remove */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px 100px auto auto', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                    <div>
                      <label style={{ fontSize: 10, color: 'var(--text-muted)', display: 'block', marginBottom: 2 }}>Name</label>
                      <input
                        value={goal.name}
                        onChange={e => updateGoal(i, 'name', e.target.value)}
                        placeholder="Goal name"
                        style={{ width: '100%', padding: '6px 8px', borderRadius: 6, fontSize: 13, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)', color: 'var(--text-primary)', outline: 'none' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: 10, color: 'var(--text-muted)', display: 'block', marginBottom: 2 }}>Base Points</label>
                      <input
                        type="number"
                        value={goal.basePoints}
                        onChange={e => updateGoal(i, 'basePoints', Number(e.target.value))}
                        min={1}
                        style={{ width: '100%', padding: '6px 8px', borderRadius: 6, fontSize: 13, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)', color: 'var(--color-brand-400)', fontWeight: 600, outline: 'none' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: 10, color: 'var(--text-muted)', display: 'block', marginBottom: 2 }}>Icon</label>
                      <select
                        value={goal.icon}
                        onChange={e => updateGoal(i, 'icon', e.target.value)}
                        style={{ width: '100%', padding: '6px 8px', borderRadius: 6, fontSize: 12, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)', color: 'var(--text-primary)', outline: 'none' }}
                      >
                        {['Send', 'TrendingUp', 'Shield', 'Clock', 'Image', 'Coins', 'FileCode', 'Users', 'Zap', 'Gift', 'Star', 'Award'].map(ic => (
                          <option key={ic} value={ic}>{ic}</option>
                        ))}
                      </select>
                    </div>
                    <div style={{ paddingTop: 14 }}>
                      <button
                        onClick={() => updateGoal(i, 'enabled', !goal.enabled)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: goal.enabled ? '#26d07c' : 'var(--text-muted)', display: 'flex', alignItems: 'center', padding: 4 }}
                        title={goal.enabled ? 'Disable' : 'Enable'}
                      >
                        {goal.enabled ? <ToggleRight size={22} /> : <ToggleLeft size={22} />}
                      </button>
                    </div>
                    <div style={{ paddingTop: 14 }}>
                      <button
                        onClick={() => removeGoal(i)}
                        style={{ background: 'rgba(239,68,68,0.1)', border: 'none', borderRadius: 6, padding: '5px 7px', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                        title="Remove goal"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                  {/* Row 2: Description, Cooldown, Max Per Day */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px 120px', gap: 8, alignItems: 'center' }}>
                    <div>
                      <label style={{ fontSize: 10, color: 'var(--text-muted)', display: 'block', marginBottom: 2 }}>Description</label>
                      <input
                        value={goal.description}
                        onChange={e => updateGoal(i, 'description', e.target.value)}
                        placeholder="What the user needs to do"
                        style={{ width: '100%', padding: '6px 8px', borderRadius: 6, fontSize: 12, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)', color: 'var(--text-secondary)', outline: 'none' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: 10, color: 'var(--text-muted)', display: 'block', marginBottom: 2 }}>Cooldown (hrs)</label>
                      <input
                        type="number"
                        value={goal.cooldownHours}
                        onChange={e => updateGoal(i, 'cooldownHours', Number(e.target.value))}
                        min={0}
                        style={{ width: '100%', padding: '6px 8px', borderRadius: 6, fontSize: 13, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)', color: 'var(--text-primary)', outline: 'none' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: 10, color: 'var(--text-muted)', display: 'block', marginBottom: 2 }}>Max / Day</label>
                      <input
                        type="number"
                        value={goal.maxPerDay}
                        onChange={e => updateGoal(i, 'maxPerDay', Number(e.target.value))}
                        min={1}
                        style={{ width: '100%', padding: '6px 8px', borderRadius: 6, fontSize: 13, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)', color: 'var(--text-primary)', outline: 'none' }}
                      />
                    </div>
                  </div>
                </div>
              ))}

              <button
                onClick={addGoal}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '10px 16px', borderRadius: 8, border: '1px dashed rgba(108,56,255,0.3)', background: 'rgba(108,56,255,0.06)', color: 'var(--color-brand-400)', cursor: 'pointer', fontSize: 13, fontWeight: 600, width: '100%' }}
              >
                <Plus size={14} /> Add Goal
              </button>
            </div>
          </Card>

          {/* Save All */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button className={styles.saveBtn} onClick={handleSaveConfig} disabled={configSaving} style={{ flex: 'none' }}>
              {configSaving ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Saving...</> : <><Save size={14} /> Save All Configuration</>}
            </button>
            {configResult && (
              <div className={`${styles.refillResult} ${configResult.success ? styles.success : styles.error}`} style={{ margin: 0, flex: 1 }}>
                {configResult.success ? <CheckCircle size={18} /> : <AlertTriangle size={18} />}
                {configResult.message}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminRewards;
