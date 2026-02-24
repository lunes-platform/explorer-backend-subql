import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Shield, AlertTriangle, CheckCircle, XCircle, FileText, DollarSign } from 'lucide-react';
import { API_BASE_URL } from '../../config';

interface Pricing {
  costPer1000Impressions: number;
  minImpressions: number;
  maxImpressions: number;
  paymentWallet: string;
}

export default function AdPoliciesPage() {
  const [pricing, setPricing] = useState<Pricing | null>(null);

  useEffect(() => {
    fetch(`${API_BASE_URL}/ads/pricing`)
      .then(r => r.json())
      .then(d => setPricing(d))
      .catch(() => {});
  }, []);

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '40px 20px' }}>
      <Link to="/advertise" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)', fontSize: 13, marginBottom: 24, textDecoration: 'none' }}>
        <ArrowLeft size={14} /> Back to Advertise
      </Link>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
        <div style={{ width: 48, height: 48, borderRadius: 12, background: 'linear-gradient(135deg, #6c38ff, #a78bfa)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Shield size={24} color="white" />
        </div>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: 'white', margin: 0 }}>Advertising Policies</h1>
          <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: 0 }}>Guidelines and pricing for advertising on Lunes Explorer</p>
        </div>
      </div>

      {/* Pricing Section */}
      {pricing && (
        <section style={{ marginBottom: 32, padding: 24, background: 'linear-gradient(135deg, rgba(108,56,255,0.1), rgba(38,208,124,0.05))', borderRadius: 16, border: '1px solid rgba(108,56,255,0.3)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <DollarSign size={20} color="#f5a623" />
            <h2 style={{ fontSize: 18, fontWeight: 700, color: 'white', margin: 0 }}>Current Pricing</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 16 }}>
            <div style={{ textAlign: 'center', padding: 16, background: 'rgba(0,0,0,0.2)', borderRadius: 12 }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Cost per 1,000 impressions</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#26d07c' }}>{pricing.costPer1000Impressions} <span style={{ fontSize: 14 }}>LUNES</span></div>
            </div>
            <div style={{ textAlign: 'center', padding: 16, background: 'rgba(0,0,0,0.2)', borderRadius: 12 }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Minimum impressions</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#6c38ff' }}>{pricing.minImpressions.toLocaleString()}</div>
            </div>
            <div style={{ textAlign: 'center', padding: 16, background: 'rgba(0,0,0,0.2)', borderRadius: 12 }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Maximum impressions</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#6c38ff' }}>{pricing.maxImpressions.toLocaleString()}</div>
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>
              Example: 10,000 impressions = <strong style={{ color: '#f5a623' }}>{Math.ceil((10000 / 1000) * pricing.costPer1000Impressions).toLocaleString()} LUNES</strong> ≈ ${(Math.ceil((10000 / 1000) * pricing.costPer1000Impressions) * 0.0003).toFixed(2)} USD
            </p>
          </div>
        </section>
      )}

      {/* Accepted Content */}
      <section style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <CheckCircle size={20} color="#26d07c" />
          <h2 style={{ fontSize: 18, fontWeight: 700, color: 'white', margin: 0 }}>Accepted Content</h2>
        </div>
        <div style={{ background: 'rgba(38,208,124,0.05)', border: '1px solid rgba(38,208,124,0.2)', borderRadius: 12, padding: 20 }}>
          <ul style={{ margin: 0, paddingLeft: 20, color: 'var(--text-secondary)', lineHeight: 1.8, fontSize: 14 }}>
            <li>Blockchain and cryptocurrency projects</li>
            <li>DeFi protocols and applications</li>
            <li>NFT marketplaces and collections</li>
            <li>Web3 tools and services</li>
            <li>Educational content about blockchain</li>
            <li>Crypto exchanges and wallets (licensed)</li>
            <li>Token launches and IDOs (legitimate projects)</li>
            <li>Blockchain development services</li>
            <li>DAO and governance platforms</li>
          </ul>
        </div>
      </section>

      {/* Prohibited Content */}
      <section style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <XCircle size={20} color="#ff284c" />
          <h2 style={{ fontSize: 18, fontWeight: 700, color: 'white', margin: 0 }}>Prohibited Content</h2>
        </div>
        <div style={{ background: 'rgba(255,40,76,0.05)', border: '1px solid rgba(255,40,76,0.2)', borderRadius: 12, padding: 20 }}>
          <ul style={{ margin: 0, paddingLeft: 20, color: 'var(--text-secondary)', lineHeight: 1.8, fontSize: 14 }}>
            <li><strong>Scams & Fraud:</strong> Ponzi schemes, pyramid schemes, rug pulls</li>
            <li><strong>Misleading Claims:</strong> Guaranteed returns, "get rich quick" promises</li>
            <li><strong>Illegal Activities:</strong> Money laundering, unlicensed securities</li>
            <li><strong>Adult Content:</strong> Pornography, explicit material</li>
            <li><strong>Gambling:</strong> Unlicensed gambling platforms</li>
            <li><strong>Malware:</strong> Phishing sites, malicious software</li>
            <li><strong>Hate Speech:</strong> Discriminatory or violent content</li>
            <li><strong>Impersonation:</strong> Fake projects claiming to be established brands</li>
            <li><strong>Pump & Dump:</strong> Coordinated market manipulation</li>
          </ul>
        </div>
      </section>

      {/* Requirements */}
      <section style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <FileText size={20} color="#6c38ff" />
          <h2 style={{ fontSize: 18, fontWeight: 700, color: 'white', margin: 0 }}>Ad Requirements</h2>
        </div>
        <div style={{ background: 'rgba(108,56,255,0.05)', border: '1px solid rgba(108,56,255,0.2)', borderRadius: 12, padding: 20 }}>
          <div style={{ display: 'grid', gap: 16 }}>
            <div>
              <h4 style={{ fontSize: 14, fontWeight: 600, color: 'white', margin: '0 0 8px' }}>Title</h4>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>
                Maximum 60 characters. Must be clear and not misleading.
              </p>
            </div>
            <div>
              <h4 style={{ fontSize: 14, fontWeight: 600, color: 'white', margin: '0 0 8px' }}>Description</h4>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>
                Maximum 150 characters. Accurate representation of your product/service.
              </p>
            </div>
            <div>
              <h4 style={{ fontSize: 14, fontWeight: 600, color: 'white', margin: '0 0 8px' }}>Destination URL</h4>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>
                Must be a working HTTPS URL. Landing page must match ad content.
              </p>
            </div>
            <div>
              <h4 style={{ fontSize: 14, fontWeight: 600, color: 'white', margin: '0 0 8px' }}>Advertiser Information</h4>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>
                Valid email required. We may contact you for verification.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Review Process */}
      <section style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <AlertTriangle size={20} color="#f5a623" />
          <h2 style={{ fontSize: 18, fontWeight: 700, color: 'white', margin: 0 }}>Review Process</h2>
        </div>
        <div style={{ background: 'rgba(245,166,35,0.05)', border: '1px solid rgba(245,166,35,0.2)', borderRadius: 12, padding: 20 }}>
          <ol style={{ margin: 0, paddingLeft: 20, color: 'var(--text-secondary)', lineHeight: 2, fontSize: 14 }}>
            <li>Submit your ad and complete payment</li>
            <li>Our team reviews your ad within 24-48 hours</li>
            <li>If approved, your ad goes live immediately</li>
            <li>If rejected, you'll receive an email with the reason</li>
            <li>Rejected ads may be refunded at our discretion</li>
          </ol>
        </div>
      </section>

      {/* Terms */}
      <section style={{ marginBottom: 32 }}>
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: 20 }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: 'white', margin: '0 0 12px' }}>Terms & Conditions</h3>
          <ul style={{ margin: 0, paddingLeft: 20, color: 'var(--text-muted)', lineHeight: 1.8, fontSize: 13 }}>
            <li>Lunes Explorer reserves the right to reject or remove any ad at any time</li>
            <li>Impressions are estimated and may vary based on traffic</li>
            <li>No refunds for approved and delivered impressions</li>
            <li>Advertisers are responsible for compliance with local laws</li>
            <li>By submitting an ad, you agree to these policies</li>
          </ul>
        </div>
      </section>

      {/* Contact */}
      <div style={{ textAlign: 'center', padding: 24, background: 'rgba(108,56,255,0.05)', borderRadius: 12, border: '1px solid rgba(108,56,255,0.2)' }}>
        <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: '0 0 12px' }}>
          Questions about advertising? Contact us at:
        </p>
        <a href="mailto:ads@lunes.io" style={{ fontSize: 16, fontWeight: 600, color: '#6c38ff' }}>
          ads@lunes.io
        </a>
      </div>
    </div>
  );
}
