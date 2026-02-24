// Ads Store - Manages promotional ads displayed across the explorer
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { getWalletByPurpose } from './financialStore.ts';

const DATA_DIR = './data';
const ADS_FILE = join(DATA_DIR, 'ads.json');

if (!existsSync(DATA_DIR)) {
  mkdirSync(DATA_DIR, { recursive: true });
}

export interface Ad {
  id: string;
  title: string;
  description: string;
  ctaText: string;
  ctaUrl: string;
  imageUrl?: string;
  placement: 'home_stats' | 'sidebar' | 'block_detail' | 'token_detail' | 'global';
  isActive: boolean;
  priority: number;
  impressions: number;
  clicks: number;
  startDate?: string;
  endDate?: string;
  createdAt: string;
  updatedAt: string;
  // Self-service fields
  advertiserAddress?: string;
  advertiserName?: string;
  advertiserEmail?: string;
  status: 'active' | 'pending_payment' | 'pending_review' | 'approved' | 'rejected' | 'expired';
  paidAmount?: number;
  purchasedImpressions?: number;
  paymentTxHash?: string;
  reviewNotes?: string;
  rejectionReason?: string;
}

export interface AdPricingConfig {
  costPer1000Impressions: number; // LUNES per 1000 impressions (CPM)
  minImpressions: number;
  maxImpressions: number;
  paymentWallet: string;
  autoApprove: boolean;
  allowedPlacements: string[];
}

export interface AdvertiserProfile {
  address: string;
  name: string;
  email: string;
  website?: string;
  company?: string;
  totalSpent: number;
  totalAds: number;
  totalImpressions: number;
  createdAt: string;
  updatedAt: string;
}

interface AdsData {
  ads: Ad[];
  pricing: AdPricingConfig;
  advertisers: AdvertiserProfile[];
  lastUpdated: string;
}

const DEFAULT_PRICING: AdPricingConfig = {
  costPer1000Impressions: 50,
  minImpressions: 1000,
  maxImpressions: 1000000,
  paymentWallet: '5C8Kq8Wd1ZqQJSdZiGNAcbYGmyJy5cKjFg2BgPFEH2EFeXZU',
  autoApprove: false,
  allowedPlacements: ['home_stats', 'sidebar', 'global'],
};

const DEFAULT_ADS: Ad[] = [
  {
    id: 'ad_default_1',
    title: 'Launch Your Token on Lunes',
    description: 'Deploy smart contracts, create tokens & NFTs on a fast, low-fee blockchain',
    ctaText: 'Get Started →',
    ctaUrl: 'https://launchpad.lunes.io',
    placement: 'home_stats',
    isActive: true,
    priority: 0,
    impressions: 0,
    clicks: 0,
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

let adsData: AdsData = {
  ads: DEFAULT_ADS,
  pricing: DEFAULT_PRICING,
  advertisers: [],
  lastUpdated: new Date().toISOString(),
};

function loadData() {
  try {
    if (existsSync(ADS_FILE)) {
      const raw = JSON.parse(readFileSync(ADS_FILE, 'utf-8'));
      adsData = { ...adsData, ...raw };
      if (raw.pricing) adsData.pricing = { ...DEFAULT_PRICING, ...raw.pricing };
      // Migrate old ads without status
      adsData.ads = adsData.ads.map(a => ({ ...a, status: a.status || 'active' }));
    }
  } catch (err) {
    console.error('[Ads] Error loading data:', err);
  }
}

function saveData() {
  try {
    writeFileSync(ADS_FILE, JSON.stringify(adsData, null, 2));
  } catch (err) {
    console.error('[Ads] Error saving data:', err);
  }
}

loadData();

// ─── Public API ───

export function getActiveAds(placement?: string): Ad[] {
  const now = new Date().toISOString();
  return adsData.ads
    .filter(a => {
      if (!a.isActive) return false;
      if (placement && a.placement !== placement) return false;
      if (a.startDate && a.startDate > now) return false;
      if (a.endDate && a.endDate < now) return false;
      return true;
    })
    .sort((a, b) => a.priority - b.priority);
}

export function getAllAds(): Ad[] {
  return adsData.ads.sort((a, b) => a.priority - b.priority);
}

export function getAd(id: string): Ad | undefined {
  return adsData.ads.find(a => a.id === id);
}

export function createAd(data: Omit<Ad, 'id' | 'createdAt' | 'updatedAt' | 'impressions' | 'clicks'>): Ad {
  const ad: Ad = {
    ...data,
    id: `ad_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    impressions: 0,
    clicks: 0,
    status: data.status || 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  adsData.ads.push(ad);
  adsData.lastUpdated = new Date().toISOString();
  saveData();
  return ad;
}

export function updateAd(id: string, updates: Partial<Ad>): Ad | null {
  const idx = adsData.ads.findIndex(a => a.id === id);
  if (idx === -1) return null;
  adsData.ads[idx] = {
    ...adsData.ads[idx],
    ...updates,
    id, // prevent id overwrite
    updatedAt: new Date().toISOString(),
  };
  adsData.lastUpdated = new Date().toISOString();
  saveData();
  return adsData.ads[idx];
}

export function deleteAd(id: string): boolean {
  const idx = adsData.ads.findIndex(a => a.id === id);
  if (idx === -1) return false;
  adsData.ads.splice(idx, 1);
  adsData.lastUpdated = new Date().toISOString();
  saveData();
  return true;
}

export function trackImpression(id: string): void {
  const ad = adsData.ads.find(a => a.id === id);
  if (ad) {
    ad.impressions++;
    saveData();
  }
}

export function trackClick(id: string): void {
  const ad = adsData.ads.find(a => a.id === id);
  if (ad) {
    ad.clicks++;
    saveData();
  }
}

// ─── Pricing Config ───

export function getAdPricing(): AdPricingConfig {
  // Always use centralized wallet from financialStore
  const centralWallet = getWalletByPurpose('ads');
  if (centralWallet) {
    adsData.pricing.paymentWallet = centralWallet.address;
  }
  return adsData.pricing;
}

export function updateAdPricing(updates: Partial<AdPricingConfig>): AdPricingConfig {
  adsData.pricing = { ...adsData.pricing, ...updates };
  adsData.lastUpdated = new Date().toISOString();
  saveData();
  return adsData.pricing;
}

// ─── Self-Service Ad Submission ───

export interface AdSubmission {
  title: string;
  description: string;
  ctaText: string;
  ctaUrl: string;
  imageUrl?: string;
  placement: string;
  advertiserAddress: string;
  advertiserName: string;
  advertiserEmail: string;
  purchasedImpressions: number;
}

export function submitAd(data: AdSubmission): Ad {
  const cost = Math.ceil((data.purchasedImpressions / 1000) * adsData.pricing.costPer1000Impressions);
  const ad: Ad = {
    id: `ad_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    title: data.title,
    description: data.description,
    ctaText: data.ctaText || 'Learn More →',
    ctaUrl: data.ctaUrl,
    imageUrl: data.imageUrl,
    placement: data.placement as Ad['placement'],
    isActive: false,
    priority: 10,
    impressions: 0,
    clicks: 0,
    status: 'pending_payment',
    advertiserAddress: data.advertiserAddress,
    advertiserName: data.advertiserName,
    advertiserEmail: data.advertiserEmail,
    purchasedImpressions: data.purchasedImpressions,
    paidAmount: cost,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  adsData.ads.push(ad);

  // Upsert advertiser profile
  let profile = adsData.advertisers.find(a => a.address === data.advertiserAddress);
  if (!profile) {
    profile = {
      address: data.advertiserAddress,
      name: data.advertiserName,
      email: data.advertiserEmail,
      totalSpent: 0,
      totalAds: 0,
      totalImpressions: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    adsData.advertisers.push(profile);
  }
  profile.name = data.advertiserName;
  profile.email = data.advertiserEmail;
  profile.totalAds++;
  profile.updatedAt = new Date().toISOString();

  adsData.lastUpdated = new Date().toISOString();
  saveData();
  return ad;
}

export function confirmAdPayment(adId: string, txHash: string): Ad | null {
  const ad = adsData.ads.find(a => a.id === adId);
  if (!ad || ad.status !== 'pending_payment') return null;
  ad.paymentTxHash = txHash;
  ad.status = adsData.pricing.autoApprove ? 'approved' : 'pending_review';
  if (ad.status === 'approved') ad.isActive = true;
  ad.updatedAt = new Date().toISOString();

  // Update advertiser spend
  const profile = adsData.advertisers.find(a => a.address === ad.advertiserAddress);
  if (profile) {
    profile.totalSpent += ad.paidAmount || 0;
    profile.updatedAt = new Date().toISOString();
  }

  adsData.lastUpdated = new Date().toISOString();
  saveData();
  return ad;
}

export function reviewAd(adId: string, decision: 'approved' | 'rejected', notes?: string): Ad | null {
  const ad = adsData.ads.find(a => a.id === adId);
  if (!ad) return null;
  ad.status = decision;
  if (decision === 'approved') ad.isActive = true;
  if (decision === 'rejected') {
    ad.isActive = false;
    ad.rejectionReason = notes;
  }
  ad.reviewNotes = notes;
  ad.updatedAt = new Date().toISOString();
  adsData.lastUpdated = new Date().toISOString();
  saveData();
  return ad;
}

export function getAdsByAdvertiser(address: string): Ad[] {
  return adsData.ads.filter(a => a.advertiserAddress === address)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function getAdvertiserProfile(address: string): AdvertiserProfile | undefined {
  return adsData.advertisers.find(a => a.address === address);
}

export function getAllAdvertisers(): AdvertiserProfile[] {
  return adsData.advertisers.sort((a, b) => b.totalSpent - a.totalSpent);
}

export function calculateAdCost(impressions: number): number {
  return Math.ceil((impressions / 1000) * adsData.pricing.costPer1000Impressions);
}
