// Ads Store - Manages promotional ads displayed across the explorer
import prisma from './prismaClient.ts';
import { getWalletByPurpose } from './financialStore.ts';

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

const ADS_STATE_KEY = 'ads';

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

function createDefaultState(): AdsData {
  return {
    ads: JSON.parse(JSON.stringify(DEFAULT_ADS)),
    pricing: { ...DEFAULT_PRICING },
    advertisers: [],
    lastUpdated: new Date().toISOString(),
  };
}

function normalizeState(data: Partial<AdsData>): AdsData {
  const ads = (Array.isArray(data.ads) ? data.ads : DEFAULT_ADS).map((a) => ({
    ...a,
    status: a.status || 'active',
  }));

  return {
    ads,
    pricing: { ...DEFAULT_PRICING, ...(data.pricing || {}) },
    advertisers: Array.isArray(data.advertisers) ? data.advertisers : [],
    lastUpdated: data.lastUpdated || new Date().toISOString(),
  };
}

async function loadState(): Promise<AdsData> {
  const row = await prisma.adminDataState.findUnique({ where: { key: ADS_STATE_KEY } });
  if (!row) {
    const initial = createDefaultState();
    await prisma.adminDataState.create({
      data: { key: ADS_STATE_KEY, data: initial },
    });
    return initial;
  }

  return normalizeState((row.data as Partial<AdsData>) || {});
}

async function saveState(state: AdsData): Promise<void> {
  state.lastUpdated = new Date().toISOString();
  await prisma.adminDataState.upsert({
    where: { key: ADS_STATE_KEY },
    update: { data: state },
    create: { key: ADS_STATE_KEY, data: state },
  });
}

// ─── Public API ───

export async function getActiveAds(placement?: string): Promise<Ad[]> {
  const adsData = await loadState();
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

export async function getAllAds(): Promise<Ad[]> {
  const adsData = await loadState();
  return adsData.ads.sort((a, b) => a.priority - b.priority);
}

export async function getAd(id: string): Promise<Ad | undefined> {
  const adsData = await loadState();
  return adsData.ads.find(a => a.id === id);
}

export async function createAd(data: Omit<Ad, 'id' | 'createdAt' | 'updatedAt' | 'impressions' | 'clicks'>): Promise<Ad> {
  const adsData = await loadState();
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
  await saveState(adsData);
  return ad;
}

export async function updateAd(id: string, updates: Partial<Ad>): Promise<Ad | null> {
  const adsData = await loadState();
  const idx = adsData.ads.findIndex(a => a.id === id);
  if (idx === -1) return null;
  adsData.ads[idx] = {
    ...adsData.ads[idx],
    ...updates,
    id, // prevent id overwrite
    updatedAt: new Date().toISOString(),
  };
  await saveState(adsData);
  return adsData.ads[idx];
}

export async function deleteAd(id: string): Promise<boolean> {
  const adsData = await loadState();
  const idx = adsData.ads.findIndex(a => a.id === id);
  if (idx === -1) return false;
  adsData.ads.splice(idx, 1);
  await saveState(adsData);
  return true;
}

export async function trackImpression(id: string): Promise<void> {
  const adsData = await loadState();
  const ad = adsData.ads.find(a => a.id === id);
  if (ad) {
    ad.impressions++;
    await saveState(adsData);
  }
}

export async function trackClick(id: string): Promise<void> {
  const adsData = await loadState();
  const ad = adsData.ads.find(a => a.id === id);
  if (ad) {
    ad.clicks++;
    await saveState(adsData);
  }
}

// ─── Pricing Config ───

export async function getAdPricing(): Promise<AdPricingConfig> {
  const adsData = await loadState();
  // Always use centralized wallet from financialStore
  const centralWallet = await getWalletByPurpose('ads');
  if (centralWallet) {
    adsData.pricing.paymentWallet = centralWallet.address;
    await saveState(adsData);
  }
  return adsData.pricing;
}

export async function updateAdPricing(updates: Partial<AdPricingConfig>): Promise<AdPricingConfig> {
  const adsData = await loadState();
  adsData.pricing = { ...adsData.pricing, ...updates };
  await saveState(adsData);
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

export async function submitAd(data: AdSubmission): Promise<Ad> {
  const adsData = await loadState();
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

  await saveState(adsData);
  return ad;
}

export async function confirmAdPayment(adId: string, txHash: string): Promise<Ad | null> {
  const adsData = await loadState();
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

  await saveState(adsData);
  return ad;
}

export async function reviewAd(adId: string, decision: 'approved' | 'rejected', notes?: string): Promise<Ad | null> {
  const adsData = await loadState();
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
  await saveState(adsData);
  return ad;
}

export async function getAdsByAdvertiser(address: string): Promise<Ad[]> {
  const adsData = await loadState();
  return adsData.ads.filter(a => a.advertiserAddress === address)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function getAdvertiserProfile(address: string): Promise<AdvertiserProfile | undefined> {
  const adsData = await loadState();
  return adsData.advertisers.find(a => a.address === address);
}

export async function getAllAdvertisers(): Promise<AdvertiserProfile[]> {
  const adsData = await loadState();
  return adsData.advertisers.sort((a, b) => b.totalSpent - a.totalSpent);
}

export async function calculateAdCost(impressions: number): Promise<number> {
  const pricing = await getAdPricing();
  return Math.ceil((impressions / 1000) * pricing.costPer1000Impressions);
}
