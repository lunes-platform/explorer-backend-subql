import React, { useState, useEffect } from 'react';
import { Settings, Bell, Eye, Moon, Globe, Save, CheckCircle, LogOut } from 'lucide-react';
import { useWalletAuth } from '../../context/WalletAuthContext';
import { CopyToClipboard } from '../../components/common/CopyToClipboard';
import styles from './Dashboard.module.css';

interface Props { address: string; }

const PREFS_KEY = 'lunes-user-preferences';

interface UserPreferences {
  darkMode: boolean;
  showBalanceUsd: boolean;
  notifications: boolean;
  compactTables: boolean;
  language: string;
}

const DEFAULTS: UserPreferences = {
  darkMode: true,
  showBalanceUsd: true,
  notifications: true,
  compactTables: false,
  language: 'en',
};

function loadPrefs(): UserPreferences {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : DEFAULTS;
  } catch { return DEFAULTS; }
}

function savePrefs(prefs: UserPreferences) {
  localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
}

export default function SettingsTab({ address }: Props) {
  const { disconnect } = useWalletAuth();
  const [prefs, setPrefs] = useState<UserPreferences>(DEFAULTS);
  const [saved, setSaved] = useState(false);

  useEffect(() => { setPrefs(loadPrefs()); }, []);

  const toggle = (key: keyof UserPreferences) => {
    const next = { ...prefs, [key]: !prefs[key] };
    setPrefs(next);
    savePrefs(next);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  const ToggleButton = ({ on, onClick }: { on: boolean; onClick: () => void }) => (
    <button className={`${styles.toggle} ${on ? styles.on : styles.off}`} onClick={onClick} />
  );

  return (
    <div>
      <div className={styles.pageHeader}>
        <h2 className={styles.pageTitle}>
          <Settings size={22} /> Settings
          {saved && <span style={{ fontSize: 12, color: '#26d07c', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4, marginLeft: 12 }}><CheckCircle size={14} /> Saved</span>}
        </h2>
        <p className={styles.pageSubtitle}>Manage your preferences and account settings</p>
      </div>

      {/* Account */}
      <div className={styles.settingsSection}>
        <div className={styles.settingsSectionTitle}><Globe size={16} /> Account</div>
        <div className={styles.settingRow}>
          <div>
            <div className={styles.settingLabel}>Connected Wallet</div>
            <div className={styles.settingDesc}>Your current wallet address</div>
          </div>
          <CopyToClipboard text={address} truncate truncateLength={10} />
        </div>
        <div className={styles.settingRow}>
          <div>
            <div className={styles.settingLabel}>Disconnect Wallet</div>
            <div className={styles.settingDesc}>Log out and clear session</div>
          </div>
          <button className={`${styles.actionBtn} ${styles.danger}`} onClick={disconnect}>
            <LogOut size={12} /> Disconnect
          </button>
        </div>
      </div>

      {/* Display */}
      <div className={styles.settingsSection}>
        <div className={styles.settingsSectionTitle}><Eye size={16} /> Display</div>
        <div className={styles.settingRow}>
          <div>
            <div className={styles.settingLabel}>Dark Mode</div>
            <div className={styles.settingDesc}>Use dark theme (default)</div>
          </div>
          <ToggleButton on={prefs.darkMode} onClick={() => toggle('darkMode')} />
        </div>
        <div className={styles.settingRow}>
          <div>
            <div className={styles.settingLabel}>Show USD Values</div>
            <div className={styles.settingDesc}>Display balances in USD alongside LUNES</div>
          </div>
          <ToggleButton on={prefs.showBalanceUsd} onClick={() => toggle('showBalanceUsd')} />
        </div>
        <div className={styles.settingRow}>
          <div>
            <div className={styles.settingLabel}>Compact Tables</div>
            <div className={styles.settingDesc}>Reduce row height in data tables</div>
          </div>
          <ToggleButton on={prefs.compactTables} onClick={() => toggle('compactTables')} />
        </div>
      </div>

      {/* Notifications */}
      <div className={styles.settingsSection}>
        <div className={styles.settingsSectionTitle}><Bell size={16} /> Notifications</div>
        <div className={styles.settingRow}>
          <div>
            <div className={styles.settingLabel}>Price Alerts</div>
            <div className={styles.settingDesc}>Get notified when LUNES price changes significantly</div>
          </div>
          <ToggleButton on={prefs.notifications} onClick={() => toggle('notifications')} />
        </div>
      </div>

      {/* Language */}
      <div className={styles.settingsSection}>
        <div className={styles.settingsSectionTitle}><Globe size={16} /> Language</div>
        <div className={styles.settingRow}>
          <div>
            <div className={styles.settingLabel}>Interface Language</div>
            <div className={styles.settingDesc}>Choose your preferred language</div>
          </div>
          <select
            className={styles.formSelect}
            value={prefs.language}
            onChange={(e) => { const next = { ...prefs, language: e.target.value }; setPrefs(next); savePrefs(next); }}
            style={{ width: 140 }}
          >
            <option value="en">English</option>
            <option value="pt">Portugues</option>
            <option value="es">Espanol</option>
          </select>
        </div>
      </div>

      {/* Data */}
      <div className={styles.settingsSection}>
        <div className={styles.settingsSectionTitle}><Settings size={16} /> Data</div>
        <div className={styles.settingRow}>
          <div>
            <div className={styles.settingLabel}>Clear Local Data</div>
            <div className={styles.settingDesc}>Remove all locally stored preferences, watchlist, and project data</div>
          </div>
          <button
            className={`${styles.actionBtn} ${styles.danger}`}
            onClick={() => {
              if (window.confirm('This will clear all local data including your watchlist and project info. Continue?')) {
                localStorage.clear();
                window.location.reload();
              }
            }}
          >
            Clear All Data
          </button>
        </div>
      </div>
    </div>
  );
}
