import React from 'react';
import { Link } from 'react-router-dom';
import {
  LayoutDashboard, Wallet, Coins, Lock, Layers,
  ArrowUpRight, Loader2,
} from 'lucide-react';
import { useAccountInfo, useAccountStaking, useAssets, useNftCollections } from '../../hooks/useChainData';
import { useLunesPrice } from '../../hooks/useLunesPrice';
import { CopyToClipboard } from '../../components/common/CopyToClipboard';
import styles from './Dashboard.module.css';

interface Props { address: string; }

export default function OverviewTab({ address }: Props) {
  const { data: account, loading: accLoading } = useAccountInfo(address);
  const { data: staking, loading: stakLoading } = useAccountStaking(address);
  const { data: assets } = useAssets();
  const { data: nfts } = useNftCollections();
  const { price } = useLunesPrice();

  const freeBalance = account?.freeFormatted || 0;
  const reservedBalance = account?.reservedFormatted || 0;
  const totalBalance = account?.totalFormatted || 0;
  const bondedBalance = staking?.bondedFormatted || 0;
  const usdValue = price > 0 ? totalBalance * price : 0;
  const isLoading = accLoading || stakLoading;

  return (
    <div>
      <div className={styles.pageHeader}>
        <h2 className={styles.pageTitle}><LayoutDashboard size={22} /> Account Overview</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
          <CopyToClipboard text={address} truncate truncateLength={10} />
        </div>
      </div>

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: 48 }}>
          <Loader2 size={24} style={{ animation: 'spin 1s linear infinite', color: 'var(--color-brand-400)' }} />
          <p style={{ marginTop: 12, color: 'var(--text-muted)', fontSize: 13 }}>Loading account data...</p>
        </div>
      ) : (
        <>
          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <div className={styles.statIcon} style={{ background: 'rgba(108,56,255,0.12)' }}>
                <Wallet size={20} color="var(--color-brand-400)" />
              </div>
              <div className={styles.statInfo}>
                <span className={styles.statLabel}>Total Balance</span>
                <span className={styles.statValue}>{totalBalance.toLocaleString('en-US', { maximumFractionDigits: 2 })} LUNES</span>
                {usdValue > 0 && <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>${usdValue.toFixed(2)} USD</span>}
              </div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statIcon} style={{ background: 'rgba(38,208,124,0.12)' }}>
                <Coins size={20} color="#26d07c" />
              </div>
              <div className={styles.statInfo}>
                <span className={styles.statLabel}>Available</span>
                <span className={styles.statValue}>{freeBalance.toLocaleString('en-US', { maximumFractionDigits: 2 })}</span>
              </div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statIcon} style={{ background: 'rgba(254,159,0,0.12)' }}>
                <Lock size={20} color="#fe9f00" />
              </div>
              <div className={styles.statInfo}>
                <span className={styles.statLabel}>Reserved</span>
                <span className={styles.statValue}>{reservedBalance.toLocaleString('en-US', { maximumFractionDigits: 2 })}</span>
              </div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statIcon} style={{ background: 'rgba(0,163,255,0.12)' }}>
                <Layers size={20} color="#00a3ff" />
              </div>
              <div className={styles.statInfo}>
                <span className={styles.statLabel}>Staked</span>
                <span className={styles.statValue}>{bondedBalance.toLocaleString('en-US', { maximumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div className={styles.settingsSection}>
              <div className={styles.settingsSectionTitle}><Layers size={16} /> Staking</div>
              {staking?.isNominator ? (
                <div>
                  <div className={styles.settingRow}>
                    <span className={styles.settingLabel}>Bonded</span>
                    <span style={{ fontWeight: 700, fontSize: 14 }}>{bondedBalance.toLocaleString()} LUNES</span>
                  </div>
                  <div className={styles.settingRow}>
                    <span className={styles.settingLabel}>Nominations</span>
                    <span style={{ fontWeight: 600, fontSize: 13 }}>{staking.nominations.length} validators</span>
                  </div>
                  {staking.unbonding.length > 0 && (
                    <div className={styles.settingRow}>
                      <span className={styles.settingLabel}>Unbonding</span>
                      <span style={{ fontWeight: 600, fontSize: 13, color: '#fe9f00' }}>{staking.unbonding.length} chunks</span>
                    </div>
                  )}
                  <Link to="/staking" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: 'var(--color-brand-400)', fontSize: 12, fontWeight: 600, marginTop: 8, textDecoration: 'none' }}>
                    View Staking <ArrowUpRight size={12} />
                  </Link>
                </div>
              ) : (
                <div>
                  <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>Not currently staking</p>
                  <Link to="/staking" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: 'var(--color-brand-400)', fontSize: 12, fontWeight: 600, marginTop: 8, textDecoration: 'none' }}>
                    Start Staking <ArrowUpRight size={12} />
                  </Link>
                </div>
              )}
            </div>

            <div className={styles.settingsSection}>
              <div className={styles.settingsSectionTitle}><Coins size={16} /> Assets & NFTs</div>
              <div className={styles.settingRow}>
                <span className={styles.settingLabel}>Pallet Assets</span>
                <span style={{ fontWeight: 600, fontSize: 13 }}>{assets?.length || 0} tokens on chain</span>
              </div>
              <div className={styles.settingRow}>
                <span className={styles.settingLabel}>NFT Collections</span>
                <span style={{ fontWeight: 600, fontSize: 13 }}>{nfts?.length || 0} collections</span>
              </div>
              <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                <Link to="/tokens" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: 'var(--color-brand-400)', fontSize: 12, fontWeight: 600, textDecoration: 'none' }}>
                  Tokens <ArrowUpRight size={12} />
                </Link>
                <Link to="/nft-gallery" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: 'var(--color-brand-400)', fontSize: 12, fontWeight: 600, textDecoration: 'none' }}>
                  NFTs <ArrowUpRight size={12} />
                </Link>
              </div>
            </div>
          </div>

          <div className={styles.settingsSection} style={{ marginTop: 16 }}>
            <div className={styles.settingsSectionTitle}><Wallet size={16} /> Account Info</div>
            <div className={styles.settingRow}>
              <span className={styles.settingLabel}>Address</span>
              <CopyToClipboard text={address} truncate truncateLength={12} />
            </div>
            <div className={styles.settingRow}>
              <span className={styles.settingLabel}>Nonce</span>
              <span style={{ fontWeight: 600, fontSize: 13 }}>{account?.nonce || 0}</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
