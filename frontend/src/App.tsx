import React, { Suspense } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import Layout from './components/layout/Layout';
import ErrorBoundary from './components/common/ErrorBoundary';
import { WalletAuthProvider } from './context/WalletAuthContext';
import { WatchlistProvider } from './hooks/useWatchlist';
import { AdminAuthProvider } from './context/AdminAuthContext';
import Home from './pages/Home';
import LoginPage from './pages/Login';

// Lazy-loaded routes for code splitting (D2)
const TokenList = React.lazy(() => import('./pages/TokenList'));
const BlockDetail = React.lazy(() => import('./pages/BlockDetail'));
const TxDetail = React.lazy(() => import('./pages/TxDetail'));
const NFTs = React.lazy(() => import('./pages/NFTs'));
const Contracts = React.lazy(() => import('./pages/Contracts'));
const Blocks = React.lazy(() => import('./pages/Blocks'));
const Extrinsics = React.lazy(() => import('./pages/Extrinsics'));
const AccountDetail = React.lazy(() => import('./pages/AccountDetail'));
const Staking = React.lazy(() => import('./pages/Staking'));
const Assets = React.lazy(() => import('./pages/Assets'));
const AssetDetail = React.lazy(() => import('./pages/AssetDetail'));
const AssetTransfers = React.lazy(() => import('./pages/AssetTransfers'));
const NFTDetail = React.lazy(() => import('./pages/NFTDetail'));
const ProjectRegister = React.lazy(() => import('./pages/ProjectRegister'));
const ProjectDetail = React.lazy(() => import('./pages/ProjectDetail'));
const ProjectVerify = React.lazy(() => import('./pages/ProjectVerify'));
const Analytics = React.lazy(() => import('./pages/Analytics'));
const RichList = React.lazy(() => import('./pages/RichList'));
const AdminPage = React.lazy(() => import('./pages/Admin'));
const SwapPage = React.lazy(() => import('./pages/Swap'));
const TokenDetail = React.lazy(() => import('./pages/TokenDetail'));
const NFTGallery = React.lazy(() => import('./pages/NFTGallery'));
const DashboardPage = React.lazy(() => import('./pages/Dashboard'));
const RewardsPage = React.lazy(() => import('./pages/Rewards'));
const AdminRewardsPage = React.lazy(() => import('./pages/AdminRewards'));
const AnomalyRadarPage = React.lazy(() => import('./pages/AnomalyRadar'));
const AdvertisePage = React.lazy(() => import('./pages/Advertise'));
const AdPoliciesPage = React.lazy(() => import('./pages/Advertise/Policies'));
const EcosystemPage = React.lazy(() => import('./pages/Ecosystem'));

const LazyFallback = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '40vh' }}>
    <div style={{ width: 24, height: 24, border: '3px solid rgba(108,56,255,0.2)', borderTopColor: 'var(--color-brand-400)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
  </div>
);

const PageWrapper = ({ children }: { children: React.ReactNode }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -10 }}
    transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
  >
    {children}
  </motion.div>
);

function App() {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');

  return (
    <ErrorBoundary>
      <WatchlistProvider>
        <WalletAuthProvider>
          <AdminAuthProvider>
            <Suspense fallback={<LazyFallback />}>
              <AnimatePresence mode="wait">
                {isAdminRoute ? (
                  <Routes location={location} key={location.pathname}>
                    <Route path="/admin/login" element={<PageWrapper><LoginPage /></PageWrapper>} />
                    <Route path="/admin/rewards" element={<PageWrapper><AdminRewardsPage /></PageWrapper>} />
                    <Route path="/admin" element={<AdminPage />} />
                  </Routes>
                ) : (
                  <Layout>
                    <Routes location={location} key={location.pathname}>
                      <Route path="/" element={<PageWrapper><Home /></PageWrapper>} />
                      <Route path="/tokens" element={<PageWrapper><TokenList /></PageWrapper>} />
                      <Route path="/block/:id" element={<PageWrapper><BlockDetail /></PageWrapper>} />
                      <Route path="/tx/:id" element={<PageWrapper><TxDetail /></PageWrapper>} />
                      <Route path="/nfts" element={<PageWrapper><NFTs /></PageWrapper>} />
                      <Route path="/contracts" element={<PageWrapper><Contracts /></PageWrapper>} />
                      <Route path="/blocks" element={<PageWrapper><Blocks /></PageWrapper>} />
                      <Route path="/extrinsics" element={<PageWrapper><Extrinsics /></PageWrapper>} />
                      <Route path="/account/:id" element={<PageWrapper><AccountDetail /></PageWrapper>} />
                      <Route path="/staking" element={<PageWrapper><Staking /></PageWrapper>} />
                      <Route path="/analytics" element={<PageWrapper><Analytics /></PageWrapper>} />
                      <Route path="/rich-list" element={<PageWrapper><RichList /></PageWrapper>} />
                      <Route path="/assets" element={<PageWrapper><Assets /></PageWrapper>} />
                      <Route path="/assets/transfers" element={<PageWrapper><AssetTransfers /></PageWrapper>} />
                      <Route path="/asset/:id" element={<PageWrapper><AssetDetail /></PageWrapper>} />
                      <Route path="/nft/:id" element={<PageWrapper><NFTDetail /></PageWrapper>} />
                      <Route path="/projects" element={<PageWrapper><ProjectDetail /></PageWrapper>} />
                      <Route path="/project/verify" element={<PageWrapper><ProjectVerify /></PageWrapper>} />
                      <Route path="/project/register" element={<PageWrapper><ProjectRegister /></PageWrapper>} />
                      <Route path="/project/:slug" element={<PageWrapper><ProjectDetail /></PageWrapper>} />
                      <Route path="/swap" element={<PageWrapper><SwapPage /></PageWrapper>} />
                      <Route path="/token/:id" element={<PageWrapper><TokenDetail /></PageWrapper>} />
                      <Route path="/nft-gallery" element={<PageWrapper><NFTGallery /></PageWrapper>} />
                      <Route path="/dashboard" element={<PageWrapper><DashboardPage /></PageWrapper>} />
                      <Route path="/rewards" element={<PageWrapper><RewardsPage /></PageWrapper>} />
                      <Route path="/anomalies" element={<PageWrapper><AnomalyRadarPage /></PageWrapper>} />
                      <Route path="/advertise" element={<PageWrapper><AdvertisePage /></PageWrapper>} />
                      <Route path="/advertise/policies" element={<PageWrapper><AdPoliciesPage /></PageWrapper>} />
                      <Route path="/ecosystem" element={<PageWrapper><EcosystemPage /></PageWrapper>} />
                    </Routes>
                  </Layout>
                )}
              </AnimatePresence>
            </Suspense>
          </AdminAuthProvider>
        </WalletAuthProvider>
      </WatchlistProvider>
    </ErrorBoundary>
  );
}

export default App;
