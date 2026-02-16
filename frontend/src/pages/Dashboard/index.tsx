import React, { useState } from 'react';
import { LayoutDashboard, FolderKanban, History, Star, Settings, Wallet } from 'lucide-react';
import { useWalletAuth } from '../../context/WalletAuthContext';
import { usePageTitle } from '../../hooks/usePageTitle';
import styles from './Dashboard.module.css';

type DashTab = 'overview' | 'projects' | 'history' | 'watchlist' | 'settings';

const TABS: { key: DashTab; label: string; icon: React.ReactNode }[] = [
  { key: 'overview', label: 'Overview', icon: <LayoutDashboard size={16} /> },
  { key: 'projects', label: 'My Projects', icon: <FolderKanban size={16} /> },
  { key: 'history', label: 'History', icon: <History size={16} /> },
  { key: 'watchlist', label: 'Watchlist', icon: <Star size={16} /> },
  { key: 'settings', label: 'Settings', icon: <Settings size={16} /> },
];

const OverviewTab = React.lazy(() => import('./OverviewTab'));
const MyProjectsTab = React.lazy(() => import('./MyProjectsTab'));
const HistoryTab = React.lazy(() => import('./HistoryTab'));
const WatchlistTab = React.lazy(() => import('./WatchlistTab'));
const SettingsTab = React.lazy(() => import('./SettingsTab'));

export default function DashboardPage() {
  usePageTitle('My Dashboard');
  const { isConnected, connect, wallet } = useWalletAuth();
  const [activeTab, setActiveTab] = useState<DashTab>('overview');
  const address = wallet?.account?.address || '';

  if (!isConnected) {
    return (
      <div className={styles.notConnected}>
        <Wallet size={56} color="var(--color-brand-400)" />
        <h2>Connect Your Wallet</h2>
        <p>Connect a wallet to access your personal dashboard, manage projects, and view your activity on Lunes.</p>
        <button className={styles.connectBtn} onClick={() => connect()}>
          <Wallet size={18} /> Connect Wallet
        </button>
      </div>
    );
  }

  return (
    <div className={styles.dashboardLayout}>
      <nav className={styles.sidebar}>
        <div className={styles.sidebarTitle}>My Dashboard</div>
        {TABS.map((tab) => (
          <button
            key={tab.key}
            className={`${styles.sidebarLink} ${activeTab === tab.key ? styles.active : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </nav>
      <main className={styles.mainContent}>
        <React.Suspense fallback={<div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Loading...</div>}>
          {activeTab === 'overview' && <OverviewTab address={address} />}
          {activeTab === 'projects' && <MyProjectsTab address={address} />}
          {activeTab === 'history' && <HistoryTab address={address} />}
          {activeTab === 'watchlist' && <WatchlistTab />}
          {activeTab === 'settings' && <SettingsTab address={address} />}
        </React.Suspense>
      </main>
    </div>
  );
}
