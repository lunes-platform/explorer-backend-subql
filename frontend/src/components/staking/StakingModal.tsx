import React, { useState, useEffect } from 'react';
import { X, AlertCircle, CheckCircle, Loader2, Wallet, Clock } from 'lucide-react';
import { useWalletAuth } from '../../context/WalletAuthContext';
import { bond, bondExtra, unbond, withdrawUnbonded, nominate, getStakingInfo } from '../../services/staking';
import Card from '../common/Card';
import styles from './StakingModal.module.css';

interface StakingModalProps {
  isOpen: boolean;
  onClose: () => void;
  validatorAddress?: string;
}

function shortAddr(addr: string): string {
  if (!addr || addr.length < 14) return addr;
  return `${addr.slice(0, 8)}...${addr.slice(-6)}`;
}

const MIN_STAKE = 10_000;

export const StakingModal: React.FC<StakingModalProps> = ({ isOpen, onClose, validatorAddress }) => {
  const { wallet, isConnected } = useWalletAuth();
  const [activeTab, setActiveTab] = useState<'stake' | 'unstake' | 'withdraw'>('stake');
  const [amount, setAmount] = useState('');
  const [selectedValidator, setSelectedValidator] = useState(validatorAddress || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [stakingInfo, setStakingInfo] = useState<any>(null);
  const [unbondingInfo, setUnbondingInfo] = useState<any>(null);

  const address = wallet?.account?.address;

  useEffect(() => {
    if (isOpen && address) {
      loadStakingInfo();
    }
  }, [isOpen, address]);

  useEffect(() => {
    if (validatorAddress) {
      setSelectedValidator(validatorAddress);
    }
  }, [validatorAddress]);

  const loadStakingInfo = async () => {
    if (!address) return;
    try {
      const info = await getStakingInfo(address);
      setStakingInfo(info);
      
      // Check for unbonding amounts
      if (info.ledger?.unlocking) {
        const now = Date.now();
        const ready = info.ledger.unlocking.filter((u: any) => u.era * 6 * 60 * 60 * 1000 < now);
        const pending = info.ledger.unlocking.filter((u: any) => u.era * 6 * 60 * 60 * 1000 >= now);
        
        setUnbondingInfo({
          ready: ready.reduce((acc: bigint, u: any) => acc + BigInt(u.value.replace(/,/g, '')), BigInt(0)),
          pending: pending.reduce((acc: bigint, u: any) => acc + BigInt(u.value.replace(/,/g, '')), BigInt(0)),
        });
      }
    } catch (err) {
      console.error('Error loading staking info:', err);
    }
  };

  const handleStake = async () => {
    if (!address || !amount) return;
    const parsed = parseFloat(amount);
    if (isNaN(parsed) || parsed < MIN_STAKE) {
      setError(`Minimum stake is ${MIN_STAKE.toLocaleString()} LUNES`);
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      const amountPlanck = BigInt(Math.floor(parseFloat(amount) * 1e8));
      await bond(address, amountPlanck, 'Staked');
      
      // After bonding, nominate the selected validator
      if (selectedValidator) {
        await nominate(address, [selectedValidator]);
      }
      
      setSuccess(`Successfully staked ${amount} LUNES and nominated validator ${shortAddr(selectedValidator)}!`);
      setAmount('');
      await loadStakingInfo();
    } catch (err: any) {
      setError(err.message || 'Failed to stake. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStakeMore = async () => {
    if (!address || !amount) return;
    const parsed = parseFloat(amount);
    if (isNaN(parsed) || parsed < MIN_STAKE) {
      setError(`Minimum additional stake is ${MIN_STAKE.toLocaleString()} LUNES`);
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      const amountPlanck = BigInt(Math.floor(parseFloat(amount) * 1e8));
      await bondExtra(address, amountPlanck);
      
      setSuccess(`Successfully added ${amount} LUNES to your stake!`);
      setAmount('');
      await loadStakingInfo();
    } catch (err: any) {
      setError(err.message || 'Failed to add stake. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUnstake = async () => {
    if (!address || !amount) return;
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      const amountPlanck = BigInt(Math.floor(parseFloat(amount) * 1e8));
      await unbond(address, amountPlanck);
      
      setSuccess(`Successfully unbonded ${amount} LUNES! You can withdraw after the unbonding period (28 eras).`);
      setAmount('');
      await loadStakingInfo();
    } catch (err: any) {
      setError(err.message || 'Failed to unbond. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleWithdraw = async () => {
    if (!address) return;
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      await withdrawUnbonded(address);
      
      setSuccess('Successfully withdrawn unbonded LUNES!');
      await loadStakingInfo();
    } catch (err: any) {
      setError(err.message || 'Failed to withdraw. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const hasExistingStake = stakingInfo?.ledger?.total && BigInt(stakingInfo.ledger.total.replace(/,/g, '')) > 0;

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>Staking</h2>
          <button className={styles.closeButton} onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {!isConnected ? (
          <div className={styles.connectPrompt}>
            <Wallet size={48} className={styles.connectIcon} />
            <p>Please connect your wallet to stake LUNES</p>
          </div>
        ) : (
          <>
            {/* Tabs */}
            <div className={styles.tabs}>
              <button
                className={`${styles.tab} ${activeTab === 'stake' ? styles.active : ''}`}
                onClick={() => setActiveTab('stake')}
              >
                {hasExistingStake ? 'Add Stake' : 'Stake'}
              </button>
              <button
                className={`${styles.tab} ${activeTab === 'unstake' ? styles.active : ''}`}
                onClick={() => setActiveTab('unstake')}
                disabled={!hasExistingStake}
              >
                Unstake
              </button>
              <button
                className={`${styles.tab} ${activeTab === 'withdraw' ? styles.active : ''}`}
                onClick={() => setActiveTab('withdraw')}
                disabled={!unbondingInfo?.ready || unbondingInfo.ready === BigInt(0)}
              >
                Withdraw
              </button>
            </div>

            {/* Content */}
            <div className={styles.content}>
              {error && (
                <div className={styles.error}>
                  <AlertCircle size={16} />
                  {error}
                </div>
              )}

              {success && (
                <div className={styles.success}>
                  <CheckCircle size={16} />
                  {success}
                </div>
              )}

              {/* Stake Tab */}
              {activeTab === 'stake' && (
                <div className={styles.tabContent}>
                  {stakingInfo?.ledger && (
                    <Card title="Current Stake" className={styles.infoCard}>
                      <div className={styles.stakeInfo}>
                        <div>
                          <span className={styles.label}>Total Staked</span>
                          <span className={styles.value}>
                            {(Number(BigInt(stakingInfo.ledger.total.replace(/,/g, ''))) / 1e8).toFixed(4)} LUNES
                          </span>
                        </div>
                        <div>
                          <span className={styles.label}>Active</span>
                          <span className={styles.value}>
                            {(Number(BigInt(stakingInfo.ledger.active.replace(/,/g, ''))) / 1e8).toFixed(4)} LUNES
                          </span>
                        </div>
                      </div>
                    </Card>
                  )}

                  {selectedValidator && (
                    <div style={{
                      padding: '10px 14px', borderRadius: '8px',
                      background: 'rgba(108, 56, 255, 0.08)',
                      border: '1px solid rgba(108, 56, 255, 0.15)',
                      fontSize: '13px', color: 'var(--text-secondary)',
                      marginBottom: '8px',
                    }}>
                      Nominating: <span style={{ fontFamily: 'monospace', color: 'var(--color-brand-400)' }}>{shortAddr(selectedValidator)}</span>
                    </div>
                  )}

                  <div className={styles.formGroup}>
                    <label className={styles.label}>Amount (LUNES)</label>
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder={`Min. ${MIN_STAKE.toLocaleString()} LUNES`}
                      className={styles.input}
                      min={MIN_STAKE}
                      step="1"
                    />
                    <span className={styles.hint}>Minimum: {MIN_STAKE.toLocaleString()} LUNES</span>
                  </div>

                  {!hasExistingStake && !selectedValidator && (
                    <div className={styles.formGroup}>
                      <label className={styles.label}>Validator Address</label>
                      <input
                        type="text"
                        value={selectedValidator}
                        onChange={(e) => setSelectedValidator(e.target.value)}
                        placeholder="Enter validator address (5xxx...)"
                        className={styles.input}
                      />
                      <span className={styles.hint}>Go back and select a validator from the list</span>
                    </div>
                  )}

                  <button
                    onClick={hasExistingStake ? handleStakeMore : handleStake}
                    disabled={!amount || isSubmitting || parseFloat(amount) < MIN_STAKE}
                    className={styles.submitButton}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 size={18} className={styles.spinner} />
                        Processing...
                      </>
                    ) : hasExistingStake ? (
                      'Add to Stake'
                    ) : (
                      'Stake Now'
                    )}
                  </button>
                </div>
              )}

              {/* Unstake Tab */}
              {activeTab === 'unstake' && (
                <div className={styles.tabContent}>
                  <Card title="Unstake" className={styles.infoCard}>
                    <p className={styles.infoText}>
                      When you unstake, your funds will be unbonded and enter a 28-day waiting period. 
                      After this period, you can withdraw your funds.
                    </p>
                  </Card>

                  <div className={styles.formGroup}>
                    <label className={styles.label}>Amount to Unstake (LUNES)</label>
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="Enter amount to unstake"
                      className={styles.input}
                      min="1"
                      step="0.01"
                    />
                    {stakingInfo?.ledger?.active && (
                      <span className={styles.hint}>
                        Available: {(Number(BigInt(stakingInfo.ledger.active.replace(/,/g, ''))) / 1e8).toFixed(4)} LUNES
                      </span>
                    )}
                  </div>

                  <button
                    onClick={handleUnstake}
                    disabled={!amount || isSubmitting}
                    className={`${styles.submitButton} ${styles.danger}`}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 size={18} className={styles.spinner} />
                        Processing...
                      </>
                    ) : (
                      'Unstake'
                    )}
                  </button>
                </div>
              )}

              {/* Withdraw Tab */}
              {activeTab === 'withdraw' && (
                <div className={styles.tabContent}>
                  <Card title="Withdraw" className={styles.infoCard}>
                    <div className={styles.withdrawInfo}>
                      {unbondingInfo?.ready > 0 && (
                        <div className={styles.readyAmount}>
                          <CheckCircle size={20} color="#26D07C" />
                          <div>
                            <span className={styles.label}>Ready to Withdraw</span>
                            <span className={styles.value}>
                              {(Number(unbondingInfo.ready) / 1e8).toFixed(4)} LUNES
                            </span>
                          </div>
                        </div>
                      )}
                      {unbondingInfo?.pending > 0 && (
                        <div className={styles.pendingAmount}>
                          <Clock size={20} color="#FE9F00" />
                          <div>
                            <span className={styles.label}>Still Unbonding</span>
                            <span className={styles.value}>
                              {(Number(unbondingInfo.pending) / 1e8).toFixed(4)} LUNES
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </Card>

                  <button
                    onClick={handleWithdraw}
                    disabled={!unbondingInfo?.ready || unbondingInfo.ready === BigInt(0) || isSubmitting}
                    className={styles.submitButton}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 size={18} className={styles.spinner} />
                        Processing...
                      </>
                    ) : (
                      'Withdraw'
                    )}
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default StakingModal;
