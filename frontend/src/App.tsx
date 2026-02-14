import React from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import Layout from './components/layout/Layout';
import { WalletAuthProvider } from './context/WalletAuthContext';
import Home from './pages/Home';
import TokenList from './pages/TokenList';
import BlockDetail from './pages/BlockDetail';
import TxDetail from './pages/TxDetail';
import NFTs from './pages/NFTs';
import Contracts from './pages/Contracts';
import Blocks from './pages/Blocks';
import Extrinsics from './pages/Extrinsics';
import AccountDetail from './pages/AccountDetail';
import Staking from './pages/Staking';
import Assets from './pages/Assets';
import AssetDetail from './pages/AssetDetail';
import NFTDetail from './pages/NFTDetail';
import ProjectRegister from './pages/ProjectRegister';
import ProjectDetail from './pages/ProjectDetail';
import ProjectVerify from './pages/ProjectVerify';
import RichList from './pages/RichList';

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
  console.log("Lunes Explorer App Loaded");

  return (
    <WalletAuthProvider>
      <Layout>
        <AnimatePresence mode="wait">
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
            <Route path="/rich-list" element={<PageWrapper><RichList /></PageWrapper>} />
            <Route path="/assets" element={<PageWrapper><Assets /></PageWrapper>} />
            <Route path="/asset/:id" element={<PageWrapper><AssetDetail /></PageWrapper>} />
            <Route path="/nft/:id" element={<PageWrapper><NFTDetail /></PageWrapper>} />
            <Route path="/projects" element={<PageWrapper><ProjectDetail /></PageWrapper>} />
            <Route path="/project/verify" element={<PageWrapper><ProjectVerify /></PageWrapper>} />
            <Route path="/project/register" element={<PageWrapper><ProjectRegister /></PageWrapper>} />
            <Route path="/project/:slug" element={<PageWrapper><ProjectDetail /></PageWrapper>} />
          </Routes>
        </AnimatePresence>
      </Layout>
    </WalletAuthProvider>
  );
}

export default App;
