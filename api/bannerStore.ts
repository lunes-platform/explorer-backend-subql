// Banner Store - Manages promotional banners for the home page slider
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

const DATA_DIR = './data';
const BANNERS_FILE = join(DATA_DIR, 'banners.json');

if (!existsSync(DATA_DIR)) {
  mkdirSync(DATA_DIR, { recursive: true });
}

export interface Banner {
  id: string;
  title: string;
  subtitle?: string;
  imageUrl?: string;
  gradient?: string;
  linkUrl?: string;
  linkLabel?: string;
  isActive: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}

interface BannerData {
  banners: Banner[];
  lastUpdated: string;
}

const DEFAULT_BANNERS: Banner[] = [
  {
    id: 'banner_1',
    title: 'Welcome to Lunes Explorer',
    subtitle: 'Explore blocks, transactions, tokens and smart contracts on Lunes Network',
    gradient: 'linear-gradient(135deg, #1a0533 0%, #2d1b69 40%, #0d1520 100%)',
    linkUrl: '/blocks',
    linkLabel: 'Explore Blocks',
    isActive: true,
    order: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'banner_2',
    title: 'Stake LUNES & Earn Rewards',
    subtitle: 'Nominate validators and earn staking rewards on the Lunes blockchain',
    gradient: 'linear-gradient(135deg, #0a1628 0%, #1b3a4b 40%, #0d2818 100%)',
    linkUrl: '/staking',
    linkLabel: 'Start Staking',
    isActive: true,
    order: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'banner_3',
    title: 'Rewards Program',
    subtitle: 'Earn points by transacting on Lunes — claim LUNES, LUSDT and PIDCHAT tokens',
    gradient: 'linear-gradient(135deg, #1a0a2e 0%, #3b1d8e 40%, #1a0533 100%)',
    linkUrl: '/rewards',
    linkLabel: 'Earn Rewards',
    isActive: true,
    order: 2,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'banner_4',
    title: 'NFT Collections',
    subtitle: 'Discover and explore NFT collections minted on Lunes Network',
    gradient: 'linear-gradient(135deg, #0d1520 0%, #2a1a4e 40%, #1a0533 100%)',
    linkUrl: '/nfts',
    linkLabel: 'View NFTs',
    isActive: true,
    order: 3,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'banner_5',
    title: 'Submit Your Project',
    subtitle: 'Register your dApp or token built on Lunes and get verified by the community',
    gradient: 'linear-gradient(135deg, #0d2818 0%, #1a3a2a 40%, #0a1628 100%)',
    linkUrl: '/project/register',
    linkLabel: 'Register Project',
    isActive: true,
    order: 4,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

let bannerData: BannerData = {
  banners: DEFAULT_BANNERS,
  lastUpdated: new Date().toISOString(),
};

function loadData() {
  try {
    if (existsSync(BANNERS_FILE)) {
      const raw = JSON.parse(readFileSync(BANNERS_FILE, 'utf-8'));
      bannerData = { ...bannerData, ...raw };
    }
  } catch (err) {
    console.error('[Banners] Error loading data:', err);
  }
}

function saveData() {
  try {
    writeFileSync(BANNERS_FILE, JSON.stringify(bannerData, null, 2));
  } catch (err) {
    console.error('[Banners] Error saving data:', err);
  }
}

loadData();

// ─── Public API ───

export function getActiveBanners(): Banner[] {
  return bannerData.banners
    .filter(b => b.isActive)
    .sort((a, b) => a.order - b.order);
}

export function getAllBanners(): Banner[] {
  return bannerData.banners.sort((a, b) => a.order - b.order);
}

export function getBanner(id: string): Banner | undefined {
  return bannerData.banners.find(b => b.id === id);
}

export function createBanner(data: Omit<Banner, 'id' | 'createdAt' | 'updatedAt'>): Banner {
  const banner: Banner = {
    ...data,
    id: `banner_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  bannerData.banners.push(banner);
  bannerData.lastUpdated = new Date().toISOString();
  saveData();
  return banner;
}

export function updateBanner(id: string, updates: Partial<Banner>): Banner | null {
  const idx = bannerData.banners.findIndex(b => b.id === id);
  if (idx === -1) return null;
  bannerData.banners[idx] = {
    ...bannerData.banners[idx],
    ...updates,
    id, // prevent id overwrite
    updatedAt: new Date().toISOString(),
  };
  bannerData.lastUpdated = new Date().toISOString();
  saveData();
  return bannerData.banners[idx];
}

export function deleteBanner(id: string): boolean {
  const idx = bannerData.banners.findIndex(b => b.id === id);
  if (idx === -1) return false;
  bannerData.banners.splice(idx, 1);
  bannerData.lastUpdated = new Date().toISOString();
  saveData();
  return true;
}

export function reorderBanners(orderedIds: string[]): Banner[] {
  orderedIds.forEach((id, index) => {
    const banner = bannerData.banners.find(b => b.id === id);
    if (banner) banner.order = index;
  });
  bannerData.lastUpdated = new Date().toISOString();
  saveData();
  return getAllBanners();
}
