import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Shield, 
  LayoutDashboard, 
  FolderCheck, 
  Coins, 
  Megaphone, 
  Image, 
  ArrowLeft,
  LogOut,
  User,
  ChevronRight,
  Bell,
  Award,
  Home as HomeIcon,
  MonitorPlay,
  Brain
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { usePageTitle } from '../../hooks/usePageTitle';
import styles from './Admin.module.css';

type AdminTab = 'overview' | 'projects' | 'token' | 'banners' | 'ads' | 'announcements' | 'rewards' | 'ai' | 'settings';

const TABS: { key: AdminTab; label: string; icon: React.ReactNode; description: string }[] = [
  { key: 'overview', label: 'Dashboard', icon: <LayoutDashboard size={18} />, description: 'System overview' },
  { key: 'projects', label: 'Projects', icon: <FolderCheck size={18} />, description: 'Manage projects' },
  { key: 'token', label: 'Tokens', icon: <Coins size={18} />, description: 'Token information' },
  { key: 'banners', label: 'Banners', icon: <Image size={18} />, description: 'Manage banners' },
  { key: 'ads', label: 'Ads', icon: <MonitorPlay size={18} />, description: 'Manage advertisements' },
  { key: 'announcements', label: 'Announcements', icon: <Megaphone size={18} />, description: 'Official announcements' },
  { key: 'rewards', label: 'Rewards', icon: <Award size={18} />, description: 'Rewards system' },
  { key: 'ai', label: 'AI / LLM', icon: <Brain size={18} />, description: 'Configure artificial intelligence' },
  { key: 'settings', label: 'Settings', icon: <Shield size={18} />, description: 'Password and team' },
];

const OverviewTab = React.lazy(() => import('./OverviewTab'));
const ProjectsTab = React.lazy(() => import('./ProjectsTab'));
const TokenInfoTab = React.lazy(() => import('./TokenInfoTab'));
const BannersTab = React.lazy(() => import('./BannersTab'));
const AdsTab = React.lazy(() => import('./AdsTab'));
const AnnouncementsTab = React.lazy(() => import('./AnnouncementsTab'));
const AdminRewardsPage = React.lazy(() => import('../AdminRewards'));
const AITab = React.lazy(() => import('./AITab'));
const SettingsTab = React.lazy(() => import('./SettingsTab'));

export default function AdminPage() {
  usePageTitle('Admin');
  const { isAuthenticated, isLoading, user, logout } = useAdminAuth();
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');

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
        <div className={styles.accessIcon}>
          <Shield size={64} />
        </div>
        <h2>Admin Access</h2>
        <p>You must be authenticated to access the administration panel.</p>
        <div className={styles.accessActions}>
          <Link to="/admin/login" className={styles.loginButton}>
            Sign In
          </Link>
          <Link to="/" className={styles.backButton}>
            <ArrowLeft size={16} /> 
            Back to Explorer
          </Link>
        </div>
      </div>
    );
  }

  const activeTabData = TABS.find(t => t.key === activeTab);

  return (
    <div className={styles.adminContainer}>
      {/* Sidebar */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <div className={styles.logo}>
            <div className={styles.logoIcon}>
              <Shield size={24} />
            </div>
            <div className={styles.logoText}>
              <span className={styles.logoTitle}>Lunes</span>
              <span className={styles.logoSubtitle}>Admin Panel</span>
            </div>
          </div>
        </div>
        
        <nav className={styles.sidebarNav}>
          <div className={styles.navSection}>
            <span className={styles.navSectionTitle}>Main Menu</span>
            {TABS.map((tab) => (
              <button
                key={tab.key}
                className={`${styles.navItem} ${activeTab === tab.key ? styles.active : ''}`}
                onClick={() => setActiveTab(tab.key)}
              >
                <span className={styles.navIcon}>{tab.icon}</span>
                <div className={styles.navContent}>
                  <span className={styles.navLabel}>{tab.label}</span>
                  <span className={styles.navDescription}>{tab.description}</span>
                </div>
                {activeTab === tab.key && (
                  <motion.div 
                    className={styles.activeIndicator}
                    layoutId="activeIndicator"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
              </button>
            ))}
          </div>
        </nav>
        
        <div className={styles.sidebarFooter}>
          <Link to="/" className={styles.backLink}>
            <ArrowLeft size={16} />
            Back to Explorer
          </Link>
          <div className={styles.version}>v2.0.0</div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className={styles.contentArea}>
        {/* Header */}
        <header className={styles.header}>
          <div className={styles.headerLeft}>
            <div className={styles.breadcrumb}>
              <Link to="/" className={styles.breadcrumbLink}>
                <HomeIcon size={14} />
                Explorer
              </Link>
              <ChevronRight size={14} className={styles.breadcrumbSeparator} />
              <span className={styles.breadcrumbCurrent}>Admin</span>
              {activeTabData && (
                <>
                  <ChevronRight size={14} className={styles.breadcrumbSeparator} />
                  <span className={styles.breadcrumbCurrent}>{activeTabData.label}</span>
                </>
              )}
            </div>
            <h1 className={styles.pageTitle}>
              {activeTabData?.icon}
              {activeTabData?.label}
            </h1>
          </div>
          
          <div className={styles.headerRight}>
            <button className={styles.headerIconBtn} title="Notifications">
              <Bell size={18} />
              <span className={styles.notificationBadge}>3</span>
            </button>
            
            <div className={styles.userMenu}>
              <div className={styles.userAvatar}>
                <User size={18} />
              </div>
              <div className={styles.userInfo}>
                <span className={styles.userName}>{user?.full_name || 'Admin'}</span>
                <span className={styles.userEmail}>{user?.email}</span>
              </div>
              <button className={styles.logoutBtn} onClick={logout} title="Sign Out">
                <LogOut size={16} />
              </button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className={styles.mainContent}>
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className={styles.tabContent}
            >
              <React.Suspense 
                fallback={
                  <div className={styles.fallback}>
                    <div className={styles.spinner}></div>
                    <span>Loading...</span>
                  </div>
                }
              >
                {activeTab === 'overview' && <OverviewTab />}
                {activeTab === 'projects' && <ProjectsTab adminAddress={user?.email || ''} />}
                {activeTab === 'token' && <TokenInfoTab adminAddress={user?.email || ''} />}
                {activeTab === 'banners' && <BannersTab />}
                {activeTab === 'ads' && <AdsTab />}
                {activeTab === 'announcements' && <AnnouncementsTab adminAddress={user?.email || ''} />}
                {activeTab === 'rewards' && <AdminRewardsPage />}
                {activeTab === 'ai' && <AITab />}
                {activeTab === 'settings' && <SettingsTab />}
              </React.Suspense>
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
