import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { WS_ENDPOINTS, API_BASE_URL } from '../../config';
import {
  ArrowLeft,
  ShieldCheck,
  Coins,
  Send,
  CheckCircle,
  Loader2,
  AlertCircle,
  FileText,
  User,
  Globe,
  Mail,
  CreditCard,
} from 'lucide-react';
import Card from '../../components/common/Card';
import { VerifiedBadge } from '../../components/common/VerifiedBadge';
import { useWalletAuth } from '../../context/WalletAuthContext';
import {
  VERIFICATION_FEE_LUNES as DEFAULT_FEE,
  VERIFICATION_RECEIVER as DEFAULT_RECEIVER,
} from '../../data/knownProjects';
import { fetchProjects, submitVerification, type ApiProject } from '../../services/projectsApi';
import styles from './ProjectVerify.module.css';

type Step = 'select' | 'form' | 'payment' | 'success';

interface KycFormData {
  projectSlug: string;
  responsibleName: string;
  responsibleEmail: string;
  responsibleDocument: string;
  proofOfOwnership: string;
  projectWebsite: string;
}

const INITIAL_FORM: KycFormData = {
  projectSlug: '',
  responsibleName: '',
  responsibleEmail: '',
  responsibleDocument: '',
  proofOfOwnership: '',
  projectWebsite: '',
};

function shortAddr(addr: string): string {
  if (!addr || addr.length < 14) return addr;
  return `${addr.slice(0, 8)}...${addr.slice(-6)}`;
}

const ProjectVerify: React.FC = () => {
  const { isConnected, wallet } = useWalletAuth();
  const [step, setStep] = useState<Step>('select');
  const [form, setForm] = useState<KycFormData>(INITIAL_FORM);
  const [selectedProject, setSelectedProject] = useState<ApiProject | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [paymentError, setPaymentError] = useState('');
  const [txHash, setTxHash] = useState('');

  // Projects from API
  const [ownedProjects, setOwnedProjects] = useState<ApiProject[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);

  // Dynamic config from admin
  const [verificationFee, setVerificationFee] = useState(DEFAULT_FEE);
  const [verificationReceiver, setVerificationReceiver] = useState(DEFAULT_RECEIVER);

  const connectedAddress = wallet?.account?.address;

  useEffect(() => {
    fetch(`${API_BASE_URL}/config/financial`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.verificationFee) setVerificationFee(data.verificationFee);
        if (data?.verificationWallet) setVerificationReceiver(data.verificationWallet);
      })
      .catch(() => {});
  }, []);

  // Load projects owned by connected wallet from API
  useEffect(() => {
    if (!connectedAddress) { setOwnedProjects([]); return; }
    setLoadingProjects(true);
    fetchProjects()
      .then(all => {
        const owned = all.filter(
          p =>
            p.ownerAddress?.toLowerCase() === connectedAddress.toLowerCase() &&
            p.verification?.status !== 'verified'
        );
        setOwnedProjects(owned);
      })
      .catch(() => setOwnedProjects([]))
      .finally(() => setLoadingProjects(false));
  }, [connectedAddress]);

  const handleProjectSelect = (project: ApiProject) => {
    setSelectedProject(project);
    setForm(prev => ({ ...prev, projectSlug: project.slug }));
    setStep('form');
  };

  const handleFormSubmit = () => {
    if (!form.responsibleName || !form.responsibleEmail || !form.responsibleDocument || !form.proofOfOwnership) {
      return;
    }
    setStep('payment');
  };

  const handlePayment = async () => {
    if (!wallet || !isConnected || !connectedAddress) {
      setPaymentError('Connect your wallet first');
      return;
    }

    setPaymentStatus('sending');
    setPaymentError('');

    try {
      const { ApiPromise, WsProvider } = await import('@polkadot/api');
      const { web3FromSource } = await import('@polkadot/extension-dapp');

      const wsProvider = new WsProvider(WS_ENDPOINTS);
      const api = await ApiPromise.create({ provider: wsProvider });

      const injector = await web3FromSource(wallet.account.meta.source || 'polkadot-js');

      const transfer = api.tx.balances.transferKeepAlive(
        verificationReceiver,
        BigInt(verificationFee) * BigInt(10 ** 12)
      );

      const hash = await transfer.signAndSend(
        connectedAddress,
        { signer: injector.signer }
      );

      const txHashStr = hash.toString();
      setTxHash(txHashStr);

      await api.disconnect();

      // Submit verification to API — backend validates ownerAddress
      await submitVerification(form.projectSlug, {
        payerAddress: connectedAddress,
        paymentTxHash: txHashStr,
        responsibleName: form.responsibleName,
        responsibleEmail: form.responsibleEmail,
        responsibleDocument: form.responsibleDocument,
        proofOfOwnership: form.proofOfOwnership,
        projectWebsite: form.projectWebsite,
      });

      // Also record payment in financial system
      fetch(`${API_BASE_URL}/financial/verification-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectSlug: form.projectSlug,
          projectName: selectedProject?.name || form.projectSlug,
          payerAddress: connectedAddress,
          receiverAddress: verificationReceiver,
          amount: verificationFee,
          txHash: txHashStr,
          status: 'pending',
          submittedAt: new Date().toISOString(),
        }),
      }).catch(() => {});

      setPaymentStatus('sent');
      setStep('success');
    } catch (err: any) {
      console.error('Payment error:', err);
      setPaymentError(err.message || 'Payment failed. Please try again.');
      setPaymentStatus('error');
    }
  };

  const isFormValid = form.responsibleName && form.responsibleEmail && form.responsibleDocument && form.proofOfOwnership;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Link to="/projects" className={styles.backLink}>
          <ArrowLeft size={16} />
          Projects
        </Link>
        <h1 className={styles.title}>Project Verification (KYC)</h1>
        <p className={styles.subtitle}>
          Get the <VerifiedBadge status="verified" size="sm" /> seal for your project.
          Prove your identity and pay the verification fee of {verificationFee} LUNES.
        </p>
      </div>

      {/* Steps indicator */}
      <div className={styles.steps}>
        <div className={step === 'select' ? styles.stepActive : (step === 'form' || step === 'payment' || step === 'success') ? styles.stepDone : styles.step}>
          <span className={styles.stepNumber}>1</span>
          Project
        </div>
        <div className={styles.stepLine} />
        <div className={step === 'form' ? styles.stepActive : (step === 'payment' || step === 'success') ? styles.stepDone : styles.step}>
          <span className={styles.stepNumber}>2</span>
          KYC Data
        </div>
        <div className={styles.stepLine} />
        <div className={step === 'payment' ? styles.stepActive : step === 'success' ? styles.stepDone : styles.step}>
          <span className={styles.stepNumber}>3</span>
          Payment
        </div>
        <div className={styles.stepLine} />
        <div className={step === 'success' ? styles.stepDone : styles.step}>
          <span className={styles.stepNumber}>4</span>
          Done
        </div>
      </div>

      {/* Fee info */}
      <div className={styles.feeBox}>
        <div className={styles.feeIcon}>
          <Coins size={22} color="white" />
        </div>
        <div className={styles.feeInfo}>
          <div className={styles.feeLabel}>Verification Fee</div>
          <div>
            <span className={styles.feeAmount}>{verificationFee.toLocaleString()}</span>
            <span className={styles.feeCurrency}>LUNES</span>
          </div>
        </div>
        <VerifiedBadge status="verified" size="lg" />
      </div>

      {/* Step 1: Select Project */}
      {step === 'select' && (
        <Card title="Select Project" icon={<FileText size={18} />}>
          {!isConnected ? (
            <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
              <AlertCircle size={32} color="var(--color-warning)" style={{ marginBottom: '8px' }} />
              <p>Connect your wallet to see your projects</p>
            </div>
          ) : loadingProjects ? (
            <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
              <Loader2 size={24} style={{ animation: 'spin 1s linear infinite' }} />
              <p style={{ marginTop: '8px' }}>Loading your projects...</p>
            </div>
          ) : ownedProjects.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
              <ShieldCheck size={32} color="#26d07c" style={{ marginBottom: '8px' }} />
              <p>You have no unverified projects eligible for verification.</p>
              <p style={{ fontSize: '12px', marginTop: '8px' }}>
                Only the wallet that registered the project can submit a verification request.
              </p>
              <Link to="/project/register" style={{ color: 'var(--color-brand-400)', fontSize: '13px', marginTop: '8px', display: 'inline-block' }}>
                Register a new project →
              </Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {ownedProjects.map(project => (
                <button
                  key={project.id}
                  onClick={() => handleProjectSelect(project)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '14px 16px',
                    borderRadius: '10px',
                    border: '1px solid rgba(255,255,255,0.08)',
                    background: 'rgba(255,255,255,0.02)',
                    cursor: 'pointer',
                    textAlign: 'left',
                    color: 'var(--text-primary)',
                    transition: 'all 0.2s',
                    fontFamily: 'inherit',
                    fontSize: '14px',
                  }}
                >
                  <div style={{
                    width: 40, height: 40, borderRadius: 12,
                    background: 'linear-gradient(135deg, var(--color-brand-500), var(--color-brand-400))',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'white', fontWeight: 700, fontSize: 16, flexShrink: 0,
                  }}>
                    {project.name.charAt(0)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600 }}>{project.name}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{project.description.slice(0, 80)}...</div>
                  </div>
                  <VerifiedBadge status={project.verification?.status ?? 'unverified'} size="sm" />
                </button>
              ))}
            </div>
          )}

          <div className={styles.infoBox} style={{ marginTop: '16px' }}>
            <strong>How it works:</strong> Submit your project info and the responsible person's identity data.
            After paying {verificationFee} LUNES, the Lunes team will review your submission.
            Once approved, your project gets the <strong>Verified</strong> seal.
          </div>
        </Card>
      )}

      {/* Step 2: KYC Form */}
      {step === 'form' && selectedProject && (
        <Card title={`Verify: ${selectedProject.name}`} icon={<User size={18} />}>
          <div className={styles.form}>
            <div className={styles.fieldGroup}>
              <label className={styles.label}>
                <User size={14} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
                Responsible Person (Full Name) *
              </label>
              <input
                className={styles.input}
                type="text"
                placeholder="Ex: João da Silva"
                value={form.responsibleName}
                onChange={e => setForm(prev => ({ ...prev, responsibleName: e.target.value }))}
              />
            </div>

            <div className={styles.row}>
              <div className={styles.fieldGroup}>
                <label className={styles.label}>
                  <Mail size={14} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
                  Email *
                </label>
                <input
                  className={styles.input}
                  type="email"
                  placeholder="contact@project.com"
                  value={form.responsibleEmail}
                  onChange={e => setForm(prev => ({ ...prev, responsibleEmail: e.target.value }))}
                />
              </div>
              <div className={styles.fieldGroup}>
                <label className={styles.label}>
                  <CreditCard size={14} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
                  CPF / CNPJ / ID *
                </label>
                <input
                  className={styles.input}
                  type="text"
                  placeholder="000.000.000-00"
                  value={form.responsibleDocument}
                  onChange={e => setForm(prev => ({ ...prev, responsibleDocument: e.target.value }))}
                />
              </div>
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.label}>
                <Globe size={14} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
                Project Website
              </label>
              <input
                className={styles.input}
                type="url"
                placeholder="https://myproject.com"
                value={form.projectWebsite}
                onChange={e => setForm(prev => ({ ...prev, projectWebsite: e.target.value }))}
              />
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.label}>
                <FileText size={14} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
                Proof of Ownership *
                <span className={styles.labelHint}> (describe how you can prove this project is yours)</span>
              </label>
              <textarea
                className={styles.input}
                style={{ minHeight: '80px', resize: 'vertical' }}
                placeholder="Ex: I am the admin of the official GitHub repo, I can add a TXT record to the domain, I own the contract deployer address 5xxx..."
                value={form.proofOfOwnership}
                onChange={e => setForm(prev => ({ ...prev, proofOfOwnership: e.target.value }))}
              />
            </div>

            <div className={styles.infoBox}>
              <AlertCircle size={14} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
              Your data will be reviewed by the Lunes team. This information is kept confidential
              and used only for project verification purposes.
            </div>

            <div className={styles.btnRow}>
              <button className={styles.secondaryBtn} onClick={() => setStep('select')}>
                Back
              </button>
              <button
                className={styles.submitBtn}
                disabled={!isFormValid}
                onClick={handleFormSubmit}
                style={{ flex: 1 }}
              >
                Continue to Payment
                <Send size={16} />
              </button>
            </div>
          </div>
        </Card>
      )}

      {/* Step 3: Payment */}
      {step === 'payment' && selectedProject && (
        <Card title="Pay Verification Fee" icon={<Coins size={18} />}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '16px', borderRadius: '10px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Project</span>
                <span style={{ fontWeight: 600 }}>{selectedProject.name}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Responsible</span>
                <span>{form.responsibleName}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>From</span>
                <span style={{ fontFamily: 'monospace', fontSize: '13px' }}>
                  {wallet ? shortAddr(wallet.account.address) : 'Not connected'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>To (Verification)</span>
                <span style={{ fontFamily: 'monospace', fontSize: '13px' }}>{shortAddr(verificationReceiver)}</span>
              </div>
              <div style={{ height: '1px', background: 'rgba(255,255,255,0.08)', margin: '4px 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: 600, fontSize: '15px' }}>Amount</span>
                <span style={{ fontWeight: 700, fontSize: '18px', color: 'var(--color-brand-400)' }}>
                  {verificationFee.toLocaleString()} LUNES
                </span>
              </div>
            </div>

            {!isConnected && (
              <div className={styles.errorMsg}>
                <AlertCircle size={14} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
                Please connect your wallet first using the button in the header.
              </div>
            )}

            {paymentError && (
              <div className={styles.errorMsg}>
                <AlertCircle size={14} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
                {paymentError}
              </div>
            )}

            <div className={styles.btnRow}>
              <button className={styles.secondaryBtn} onClick={() => setStep('form')}>
                Back
              </button>
              <button
                className={styles.submitBtn}
                disabled={!isConnected || paymentStatus === 'sending'}
                onClick={handlePayment}
                style={{ flex: 1 }}
              >
                {paymentStatus === 'sending' ? (
                  <>
                    <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                    Sending Transaction...
                  </>
                ) : (
                  <>
                    <Send size={16} />
                    Pay {verificationFee} LUNES
                  </>
                )}
              </button>
            </div>
          </div>
        </Card>
      )}

      {/* Step 4: Success */}
      {step === 'success' && (
        <Card title="Verification Submitted!" icon={<CheckCircle size={18} color="#26d07c" />}>
          <div className={styles.successBox}>
            <div className={styles.successIcon}>
              <ShieldCheck size={32} color="#26d07c" />
            </div>
            <h3 style={{ margin: 0, color: 'var(--text-primary)' }}>KYC Submitted Successfully</h3>
            <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '14px', lineHeight: 1.6 }}>
              Your verification request for <strong>{selectedProject?.name}</strong> has been submitted.
              The Lunes team will review your data and verify the project.
            </p>

            {txHash && (
              <div style={{
                padding: '10px 14px', borderRadius: '8px',
                background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
                fontFamily: 'monospace', fontSize: '12px', color: 'var(--text-muted)',
                wordBreak: 'break-all',
              }}>
                Payment TX: {txHash}
              </div>
            )}

            <VerifiedBadge status="pending" size="lg" />

            <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '12px' }}>
              Typical review time: 24-48 hours
            </p>

            <Link to="/projects" className={styles.submitBtn} style={{ textDecoration: 'none', marginTop: '8px' }}>
              Back to Projects
            </Link>
          </div>
        </Card>
      )}
    </div>
  );
};

export default ProjectVerify;
