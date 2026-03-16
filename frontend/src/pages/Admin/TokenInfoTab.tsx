import { useState, useEffect } from 'react';
import { Coins, Save, CheckCircle } from 'lucide-react';
import { useAdminTokenInfo } from '../../hooks/useAdminData';
import ImageUpload from '../../components/common/ImageUpload';
import styles from './Admin.module.css';

interface Props {
  adminAddress: string;
}

export default function TokenInfoTab({ adminAddress }: Props) {
  const { tokenInfo, loaded, updateTokenInfo } = useAdminTokenInfo();
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({
    description: '',
    website: '',
    twitter: '',
    telegram: '',
    discord: '',
    github: '',
    logoUrl: '',
    coingeckoId: '',
  });

  useEffect(() => {
    if (loaded && tokenInfo) {
      setForm({
        description: tokenInfo.description || '',
        website: tokenInfo.website || '',
        twitter: tokenInfo.twitter || '',
        telegram: tokenInfo.telegram || '',
        discord: tokenInfo.discord || '',
        github: tokenInfo.github || '',
        logoUrl: tokenInfo.logoUrl || '',
        coingeckoId: tokenInfo.coingeckoId || '',
      });
    }
  }, [loaded, tokenInfo]);

  const handleSave = () => {
    updateTokenInfo(form, adminAddress);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div>
      <div className={styles.pageHeader}>
        <h2 className={styles.pageTitle}><Coins size={22} /> LUNES Token Info</h2>
        <p className={styles.pageSubtitle}>Manage the displayed information for the LUNES native token</p>
      </div>

      <div style={{ maxWidth: 700 }}>
        <div className={styles.formGrid}>
          <div className={styles.formGroupFull}>
            <label className={styles.formLabel}>Description</label>
            <textarea
              className={styles.formTextarea}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Brief description of LUNES token..."
              rows={3}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Website</label>
            <input className={styles.formInput} value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} placeholder="https://lunes.io" />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>GitHub</label>
            <input className={styles.formInput} value={form.github} onChange={(e) => setForm({ ...form, github: e.target.value })} placeholder="https://github.com/lunes-platform" />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Twitter / X</label>
            <input className={styles.formInput} value={form.twitter} onChange={(e) => setForm({ ...form, twitter: e.target.value })} placeholder="https://x.com/LunesNetwork" />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Telegram</label>
            <input className={styles.formInput} value={form.telegram} onChange={(e) => setForm({ ...form, telegram: e.target.value })} placeholder="https://t.me/LunesNetwork" />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Discord</label>
            <input className={styles.formInput} value={form.discord} onChange={(e) => setForm({ ...form, discord: e.target.value })} placeholder="https://discord.gg/..." />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>CoinGecko ID</label>
            <input className={styles.formInput} value={form.coingeckoId} onChange={(e) => setForm({ ...form, coingeckoId: e.target.value })} placeholder="lunes" />
          </div>

          <div className={styles.formGroupFull}>
            <ImageUpload
              label="Logo"
              value={form.logoUrl}
              onChange={(url) => setForm({ ...form, logoUrl: url })}
              placeholder="https://..."
            />
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 20 }}>
          <button className={styles.submitBtn} onClick={handleSave}>
            <Save size={16} /> Save Token Info
          </button>
          {saved && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#26d07c', fontSize: 13, fontWeight: 600 }}>
              <CheckCircle size={16} /> Saved
            </span>
          )}
        </div>

        {tokenInfo?.updatedAt && (
          <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 12 }}>
            Last updated: {new Date(tokenInfo.updatedAt).toLocaleString()} by {tokenInfo.updatedBy?.slice(0, 8)}...
          </p>
        )}
      </div>
    </div>
  );
}
