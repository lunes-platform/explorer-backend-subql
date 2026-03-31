// Banner Store - Manages promotional banners for the home page slider
import prisma from './prismaClient.ts';

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

const BANNERS_STATE_KEY = 'banners';

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

function createDefaultState(): BannerData {
  return {
    banners: JSON.parse(JSON.stringify(DEFAULT_BANNERS)),
    lastUpdated: new Date().toISOString(),
  };
}

async function loadState(): Promise<BannerData> {
  const row = await prisma.adminDataState.findUnique({ where: { key: BANNERS_STATE_KEY } });
  if (!row) {
    const initial = createDefaultState();
    await prisma.adminDataState.create({
      data: {
        key: BANNERS_STATE_KEY,
        data: initial,
      },
    });
    return initial;
  }

  const data = row.data as BannerData;
  return {
    banners: Array.isArray(data?.banners) ? data.banners : JSON.parse(JSON.stringify(DEFAULT_BANNERS)),
    lastUpdated: data?.lastUpdated || new Date().toISOString(),
  };
}

async function saveState(state: BannerData): Promise<void> {
  await prisma.adminDataState.upsert({
    where: { key: BANNERS_STATE_KEY },
    update: { data: state },
    create: { key: BANNERS_STATE_KEY, data: state },
  });
}

// ─── Public API ───

export async function getActiveBanners(): Promise<Banner[]> {
  const bannerData = await loadState();
  return bannerData.banners
    .filter(b => b.isActive)
    .sort((a, b) => a.order - b.order);
}

export async function getAllBanners(): Promise<Banner[]> {
  const bannerData = await loadState();
  return bannerData.banners.sort((a, b) => a.order - b.order);
}

export async function getBanner(id: string): Promise<Banner | undefined> {
  const bannerData = await loadState();
  return bannerData.banners.find(b => b.id === id);
}

export async function createBanner(data: Omit<Banner, 'id' | 'createdAt' | 'updatedAt'>): Promise<Banner> {
  const bannerData = await loadState();
  const banner: Banner = {
    ...data,
    id: `banner_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  bannerData.banners.push(banner);
  bannerData.lastUpdated = new Date().toISOString();
  await saveState(bannerData);
  return banner;
}

export async function updateBanner(id: string, updates: Partial<Banner>): Promise<Banner | null> {
  const bannerData = await loadState();
  const idx = bannerData.banners.findIndex(b => b.id === id);
  if (idx === -1) return null;
  bannerData.banners[idx] = {
    ...bannerData.banners[idx],
    ...updates,
    id, // prevent id overwrite
    updatedAt: new Date().toISOString(),
  };
  bannerData.lastUpdated = new Date().toISOString();
  await saveState(bannerData);
  return bannerData.banners[idx];
}

export async function deleteBanner(id: string): Promise<boolean> {
  const bannerData = await loadState();
  const idx = bannerData.banners.findIndex(b => b.id === id);
  if (idx === -1) return false;
  bannerData.banners.splice(idx, 1);
  bannerData.lastUpdated = new Date().toISOString();
  await saveState(bannerData);
  return true;
}

export async function reorderBanners(orderedIds: string[]): Promise<Banner[]> {
  const bannerData = await loadState();
  orderedIds.forEach((id, index) => {
    const banner = bannerData.banners.find(b => b.id === id);
    if (banner) banner.order = index;
  });
  bannerData.lastUpdated = new Date().toISOString();
  await saveState(bannerData);
  return bannerData.banners.sort((a, b) => a.order - b.order);
}
