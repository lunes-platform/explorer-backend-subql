// Ads Store - Manages promotional ads displayed across the explorer
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

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
}

interface AdsData {
  ads: Ad[];
  lastUpdated: string;
}

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
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

let adsData: AdsData = {
  ads: DEFAULT_ADS,
  lastUpdated: new Date().toISOString(),
};

function loadData() {
  try {
    if (existsSync(ADS_FILE)) {
      const raw = JSON.parse(readFileSync(ADS_FILE, 'utf-8'));
      adsData = { ...adsData, ...raw };
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
