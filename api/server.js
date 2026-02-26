import express from 'express';
import cors from 'cors';
import { rateLimit, writeRateLimit, readRateLimit } from './rateLimit.js';
import {
  getProjects, getProject, createProject, updateProject, deleteProject,
  submitVerification, reviewVerification,
  getLikes, getFollows, getUserInteractions, toggleInteraction, getProjectStats,
  getComments, addComment, deleteComment, addReaction,
} from './store.js';
import { generateExplanation } from './aiExplain.js';
import { getAIConfigSafe, updateAIConfig, testAPIKey, FREE_MODELS } from './aiConfigStore.ts';
import { detectAnomalies } from './anomalyDetection.ts';
import {
  getActiveBanners, getAllBanners, getBanner,
  createBanner, updateBanner, deleteBanner, reorderBanners
} from './bannerStore.ts';
import {
  getActiveAds, getAllAds, getAd,
  createAd, updateAd, deleteAd,
  trackImpression, trackClick,
  getAdPricing, updateAdPricing,
  submitAd, confirmAdPayment, reviewAd,
  getAdsByAdvertiser, getAdvertiserProfile, getAllAdvertisers,
  calculateAdCost
} from './adsStore.ts';
import {
  authenticateUser, generateToken, storeToken, getUserByToken,
  changePassword, getTeamMembers, addTeamMember, updateTeamMember,
  resetTeamMemberPassword, deleteTeamMember
} from './adminStore.ts';
import {
  getUserRewards,
  getOrCreateUserRewards,
  addPoints,
  updateUserStats,
  claimRewards,
  getLeaderboard,
  seedFromIndexer,
  getWallet,
  updateWallet,
  refillWallet,
  getConfig,
  updateConfig,
  getStats,
  resetDailyCounters,
  changeWalletAddress,
  changeWalletName,
  toggleWalletActive,
  getWalletChangeLog
} from './rewardsStore.ts';
import { getPrice, getPriceStats } from './priceCache.ts';
import { getTokenPrices, getTokenPriceStats } from './tokenPriceCache.ts';
import {
  getFinancialConfig, updateFinancialConfig,
  recordVerificationPayment, updatePaymentStatus,
  getVerificationPayments, getFinancialSummary,
  getAllWallets, getWalletByPurpose, updateWalletAddress,
  toggleWallet, getAuditLog, isValidSS58Address
} from './financialStore.ts';

import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { join, extname } from 'path';

const app = express();
const PORT = process.env.API_PORT || 4000;

// Ensure uploads directory exists
const UPLOADS_DIR = join(process.cwd(), 'data', 'uploads');
if (!existsSync(UPLOADS_DIR)) mkdirSync(UPLOADS_DIR, { recursive: true });

const ALLOWED_ORIGINS = (process.env.CORS_ORIGINS || 'http://localhost:5173,http://localhost:5174,http://localhost:5175,http://localhost:3000').split(',').map(s => s.trim());
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (curl, server-to-server, mobile apps)
    if (!origin || ALLOWED_ORIGINS.includes(origin)) {
      callback(null, true);
    } else {
      // Reject: don't set CORS headers (browser will block), but don't crash server
      callback(null, false);
    }
  },
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));

// ─── Security Headers ───
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  next();
});

// Serve uploaded images as static files (with security headers)
app.use('/uploads', express.static(UPLOADS_DIR, {
  maxAge: '7d',
  setHeaders: (res, filePath) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'public, max-age=604800');
    // Prevent script execution in uploaded files
    res.setHeader('Content-Security-Policy', "default-src 'none'; img-src 'self'; style-src 'unsafe-inline'");
    res.setHeader('X-Content-Type-Options', 'nosniff');
  }
}));

// ─── Rate Limiting ───
app.use('/api', readRateLimit);                    // General: 120 req/min per IP
app.use('/api/projects', writeRateLimit);          // Writes: 30 req/min per IP
app.use('/api/social', writeRateLimit);
app.use('/api/comments', writeRateLimit);
app.post('/api/rewards', writeRateLimit);
app.use('/api/admin', writeRateLimit);

// ─── Health ───
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── Image Upload ───
const uploadRateLimit = rateLimit({ windowMs: 60_000, max: 10, message: 'Too many uploads, please slow down.' });
app.post('/api/upload', uploadRateLimit, (req, res) => {
  try {
    const { image, filename } = req.body;
    if (!image || !filename) {
      return res.status(400).json({ error: 'Missing image or filename' });
    }

    // Validate filename (prevent path traversal)
    if (typeof filename !== 'string' || filename.length > 200 || /[\/\\]/.test(filename)) {
      return res.status(400).json({ error: 'Invalid filename' });
    }

    // Validate extension
    const ext = extname(filename).toLowerCase();
    const ALLOWED = ['.png', '.jpg', '.jpeg', '.svg', '.webp', '.gif'];
    if (!ALLOWED.includes(ext)) {
      return res.status(400).json({ error: `Invalid file type. Allowed: ${ALLOWED.join(', ')}` });
    }

    // Decode base64
    if (typeof image !== 'string' || image.length > 15_000_000) {
      return res.status(400).json({ error: 'Invalid or oversized image data' });
    }
    const matches = image.match(/^data:([^;]+);base64,(.+)$/);
    if (!matches) {
      return res.status(400).json({ error: 'Invalid base64 image format. Expected data:mime;base64,...' });
    }

    const buffer = Buffer.from(matches[2], 'base64');

    // Limit to 5MB
    if (buffer.length > 5 * 1024 * 1024) {
      return res.status(400).json({ error: 'Image too large. Maximum 5MB.' });
    }

    // Sanitize filename: slug + timestamp + ext
    const safeName = filename
      .replace(ext, '')
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .toLowerCase()
      .slice(0, 50);
    const finalName = `${safeName}_${Date.now()}${ext}`;

    // Sanitize SVG to prevent XSS
    if (ext === '.svg') {
      const svgContent = buffer.toString('utf-8');
      if (/<script/i.test(svgContent) || /on\w+\s*=/i.test(svgContent) || /javascript:/i.test(svgContent) || /<iframe/i.test(svgContent) || /<embed/i.test(svgContent) || /<object/i.test(svgContent)) {
        return res.status(400).json({ error: 'SVG contains potentially malicious content' });
      }
    }

    writeFileSync(join(UPLOADS_DIR, finalName), buffer);

    const API_PUBLIC_URL = process.env.API_PUBLIC_URL || `http://localhost:${PORT}`;
    const url = `${API_PUBLIC_URL}/uploads/${finalName}`;
    console.log(`[Upload] Saved ${finalName} (${(buffer.length / 1024).toFixed(1)}KB)`);
    res.json({ url, filename: finalName });
  } catch (err) {
    console.error('[Upload] Error:', err);
    res.status(500).json({ error: 'Upload failed' });
  }
});

// ─── Projects CRUD ───
app.get('/api/projects', (_req, res) => {
  const projects = getProjects();
  // Attach social stats to each project
  const enriched = projects.map(p => ({
    ...p,
    social: getProjectStats(p.slug),
  }));
  res.json(enriched);
});

app.get('/api/projects/:slug', (req, res) => {
  const project = getProject(req.params.slug);
  if (!project) return res.status(404).json({ error: 'Project not found' });
  res.json({ ...project, social: getProjectStats(project.slug) });
});

app.post('/api/projects', (req, res) => {
  // Require minimum fields to prevent spam
  if (!req.body.name || typeof req.body.name !== 'string' || req.body.name.trim().length < 2) {
    return res.status(400).json({ error: 'Project name is required (min 2 characters)' });
  }
  if (!req.body.ownerAddress || typeof req.body.ownerAddress !== 'string' || req.body.ownerAddress.length < 10) {
    return res.status(400).json({ error: 'Valid ownerAddress is required' });
  }
  const result = createProject(req.body);
  if (result.error) return res.status(result.status).json({ error: result.error });
  res.status(201).json(result);
});

app.put('/api/projects/:slug', (req, res) => {
  // Ownership check: admin token OR matching ownerAddress required
  const existing = getProject(req.params.slug);
  if (!existing) return res.status(404).json({ error: 'Project not found' });

  // Check if caller is authenticated admin
  const authHeader = req.headers.authorization;
  const isAdmin = authHeader && authHeader.startsWith('Bearer ') && getUserByToken(authHeader.replace('Bearer ', ''));

  if (!isAdmin) {
    // Non-admin: require ownerAddress match
    if (!req.body.ownerAddress) {
      return res.status(400).json({ error: 'ownerAddress is required' });
    }
    if (existing.ownerAddress && existing.ownerAddress !== req.body.ownerAddress) {
      return res.status(403).json({ error: 'Not the project owner' });
    }
  }
  const result = updateProject(req.params.slug, req.body);
  if (result.error) return res.status(result.status).json({ error: result.error });
  res.json(result);
});

app.delete('/api/projects/:slug', (req, res) => {
  // Ownership check: admin token OR matching ownerAddress required
  const existing = getProject(req.params.slug);
  if (!existing) return res.status(404).json({ error: 'Project not found' });

  const authHeader = req.headers.authorization;
  const isAdmin = authHeader && authHeader.startsWith('Bearer ') && getUserByToken(authHeader.replace('Bearer ', ''));

  if (!isAdmin) {
    const ownerAddress = req.body.ownerAddress || req.query.ownerAddress;
    if (!ownerAddress) {
      return res.status(400).json({ error: 'ownerAddress is required' });
    }
    if (existing.ownerAddress && existing.ownerAddress !== ownerAddress) {
      return res.status(403).json({ error: 'Not the project owner' });
    }
  }
  const result = deleteProject(req.params.slug);
  if (result.error) return res.status(result.status).json({ error: result.error });
  res.json(result);
});

// ─── Verification ───
app.post('/api/projects/:slug/verify', (req, res) => {
  const result = submitVerification(req.params.slug, req.body);
  if (result.error) return res.status(result.status).json({ error: result.error });
  res.json(result);
});

app.post('/api/projects/:slug/review', requireAuth, (req, res) => {
  const { decision, reviewedBy, notes } = req.body;
  if (!['verified', 'rejected', 'pending'].includes(decision)) {
    return res.status(400).json({ error: 'Invalid decision' });
  }
  const result = reviewVerification(req.params.slug, decision, reviewedBy, notes);
  if (result.error) return res.status(result.status).json({ error: result.error });
  res.json(result);
});

// ─── Social Interactions ───
app.post('/api/social/like', (req, res) => {
  const { projectSlug, userAddress } = req.body;
  if (!projectSlug || !userAddress) return res.status(400).json({ error: 'Missing projectSlug or userAddress' });
  res.json(toggleInteraction('like', projectSlug, userAddress));
});

app.post('/api/social/follow', (req, res) => {
  const { projectSlug, userAddress } = req.body;
  if (!projectSlug || !userAddress) return res.status(400).json({ error: 'Missing projectSlug or userAddress' });
  res.json(toggleInteraction('follow', projectSlug, userAddress));
});

app.get('/api/social/project/:slug', (req, res) => {
  const slug = req.params.slug;
  res.json({
    likes: getLikes(slug),
    follows: getFollows(slug),
    comments: getComments(slug),
    stats: getProjectStats(slug),
  });
});

// ─── Comments ───
app.get('/api/comments/:projectSlug', (req, res) => {
  res.json(getComments(req.params.projectSlug));
});

app.post('/api/comments', (req, res) => {
  const { projectSlug, userAddress, content, metadata } = req.body;
  if (!projectSlug || !userAddress || !content) {
    return res.status(400).json({ error: 'Missing projectSlug, userAddress, or content' });
  }
  // Sanitize HTML to prevent XSS
  const sanitized = String(content).replace(/[<>]/g, c => c === '<' ? '&lt;' : '&gt;');
  const result = addComment(projectSlug, userAddress, sanitized, metadata);
  if (result.error) return res.status(result.status).json({ error: result.error });
  res.status(201).json(result);
});

app.delete('/api/comments/:commentId', (req, res) => {
  const { userAddress } = req.body;
  if (!userAddress) return res.status(400).json({ error: 'userAddress required' });
  const result = deleteComment(req.params.commentId, userAddress);
  if (result.error) return res.status(result.status).json({ error: result.error });
  res.json(result);
});

app.post('/api/comments/:commentId/react', (req, res) => {
  const { userAddress, emoji } = req.body;
  if (!userAddress || !emoji) {
    return res.status(400).json({ error: 'userAddress and emoji required' });
  }
  const result = addReaction(req.params.commentId, userAddress, emoji);
  if (result.error) return res.status(result.status).json({ error: result.error });
  res.json(result);
});

app.get('/api/social/user/:address', (req, res) => {
  res.json(getUserInteractions(req.params.address));
});

// ─── AI Explanation (Pilar C) ───
app.post('/api/explain', async (req, res) => {
  const { type, data } = req.body;
  
  if (!type || !data) {
    return res.status(400).json({ error: 'Missing type or data' });
  }

  const supportedTypes = ['transaction', 'account', 'block', 'extrinsic'];
  if (!supportedTypes.includes(type)) {
    return res.status(400).json({ error: `Unsupported type. Use: ${supportedTypes.join(', ')}` });
  }

  try {
    const explanation = await generateExplanation(type, data);
    
    res.json({
      type,
      explanation,
      sources: data.sources || [],
      confidence: 'high',
      generatedAt: new Date().toISOString(),
      aiAssisted: true,
    });
  } catch (err) {
    console.error('[AI Explain] Error:', err);
    res.status(500).json({ error: 'Failed to generate explanation' });
  }
});

// ─── Anomaly Detection (Pilar C) ───
app.post('/api/anomalies', async (req, res) => {
  const { transfers, blocks } = req.body;
  
  try {
    const anomalies = detectAnomalies(transfers || [], blocks || []);
    res.json({
      anomalies,
      count: anomalies.length,
      generatedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[Anomaly Detection] Error:', err);
    res.status(500).json({ error: 'Failed to detect anomalies' });
  }
});

// Server-side scan: fetches data from SubQuery GraphQL (fast, local) and runs detection
app.post('/api/anomalies/scan', async (req, res) => {
  const { blockCount = 20, transferCount = 50 } = req.body;
  const GRAPHQL_URL = process.env.INDEXER_URL || 'http://graphql-engine:3000';
  const TIMEOUT_MS = 10000;
  
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
    
    // Fetch recent blocks and transfers from SubQuery GraphQL in parallel
    const [blocksRes, transfersRes] = await Promise.all([
      fetch(GRAPHQL_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `{ blocks(first: ${Math.min(blockCount, 50)}, orderBy: NUMBER_DESC) { nodes { number timestamp } } }`
        }),
        signal: controller.signal,
      }),
      fetch(GRAPHQL_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `{ transfers(first: ${Math.min(transferCount, 100)}, orderBy: BLOCK_NUMBER_DESC) { nodes { id fromId toId amount blockNumber } } }`
        }),
        signal: controller.signal,
      }),
    ]);
    
    clearTimeout(timeout);
    
    const blocksData = await blocksRes.json();
    const transfersData = await transfersRes.json();
    
    const rawBlocks = blocksData?.data?.blocks?.nodes || [];
    const rawTransfers = transfersData?.data?.transfers?.nodes || [];
    
    // Count transfers per block to estimate activity
    const txPerBlock = {};
    rawTransfers.forEach(t => { txPerBlock[t.blockNumber] = (txPerBlock[t.blockNumber] || 0) + 1; });
    
    const blocks = rawBlocks.map(b => ({
      number: Number(b.number),
      extrinsicCount: txPerBlock[b.number] || 0,
      timestamp: Number(b.timestamp) || Date.now(),
    }));
    
    const transfers = rawTransfers.map(t => ({
      from: t.fromId,
      to: t.toId,
      amountFormatted: Number(BigInt(t.amount || '0')) / 1e8,
      blockNumber: Number(t.blockNumber),
      hash: t.id,
    }));
    
    const latestBlock = blocks.length > 0 ? blocks[0].number : 0;
    const anomalies = detectAnomalies(transfers, blocks);
    
    res.json({
      anomalies,
      blocksScanned: blocks.length,
      transfersFound: transfers.length,
      latestBlock,
      generatedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[Anomaly Scan] Error:', err);
    // Fallback: return empty scan instead of 500
    res.json({
      anomalies: [],
      blocksScanned: 0,
      transfersFound: 0,
      latestBlock: 0,
      generatedAt: new Date().toISOString(),
      warning: 'Indexer unavailable, no data to scan',
    });
  }
});

// ─── Financial Config ───

// Public: get verification wallet + fee
app.get('/api/config/financial', (_req, res) => {
  res.json(getFinancialConfig());
});

// Admin: update financial config
app.put('/api/admin/config/financial', requireAuth, (req, res) => {
  const config = updateFinancialConfig(req.body, req.adminUser?.email || 'admin');
  res.json({ success: true, config });
});

// Admin: get financial summary
app.get('/api/admin/financial/summary', requireAuth, (_req, res) => {
  res.json(getFinancialSummary());
});

// ─── Unified Wallet Management (Admin) ───

app.get('/api/admin/wallets', requireAuth, (_req, res) => {
  res.json(getAllWallets());
});

app.get('/api/admin/wallets/:purpose', requireAuth, (req, res) => {
  const wallet = getWalletByPurpose(req.params.purpose);
  if (!wallet) return res.status(404).json({ error: 'Wallet not found' });
  res.json(wallet);
});

app.put('/api/admin/wallets/:purpose/address', requireAuth, (req, res) => {
  const { address } = req.body;
  if (!address) return res.status(400).json({ error: 'Address is required' });
  const result = updateWalletAddress(req.params.purpose, address, req.adminUser?.email || 'admin');
  if (!result.success) return res.status(400).json({ error: result.error });
  res.json({ success: true, wallet: result.wallet });
});

app.put('/api/admin/wallets/:purpose/toggle', requireAuth, (req, res) => {
  const result = toggleWallet(req.params.purpose, req.adminUser?.email || 'admin');
  if (!result.success) return res.status(404).json({ error: 'Wallet not found' });
  res.json({ success: true, wallet: result.wallet });
});

app.get('/api/admin/wallets-audit', requireAuth, (req, res) => {
  const limit = parseInt(req.query.limit) || 50;
  const purpose = req.query.purpose || undefined;
  res.json(getAuditLog(limit, purpose));
});

// Admin: get verification payments
app.get('/api/admin/financial/payments', requireAuth, (req, res) => {
  const limit = parseInt(req.query.limit) || 50;
  res.json(getVerificationPayments(limit));
});

// Record a verification payment (called by frontend after tx)
app.post('/api/financial/verification-payment', (req, res) => {
  try {
    const payment = recordVerificationPayment(req.body);
    res.json({ success: true, payment });
  } catch (err) {
    res.status(400).json({ error: 'Failed to record payment' });
  }
});

// Admin: update payment status
app.put('/api/admin/financial/payments/:id/status', requireAuth, (req, res) => {
  const { status } = req.body;
  const payment = updatePaymentStatus(req.params.id, status);
  if (!payment) return res.status(404).json({ error: 'Payment not found' });
  res.json({ success: true, payment });
});

// ─── Price Cache ───
// LUNES price: BitStorage (primary), CoinGecko (fallback)
// Project token prices: CoinGecko (for tokens with coingeckoId)

app.get('/api/prices', async (_req, res) => {
  try {
    const data = await getPrice();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch price', price: 0 });
  }
});

// Token prices for registered project tokens via CoinGecko
app.get('/api/prices/tokens', async (_req, res) => {
  try {
    const projects = getProjects();
    const coingeckoIds = projects
      .map(p => p.coingeckoId)
      .filter(id => id && id.trim());

    if (coingeckoIds.length === 0) {
      return res.json({ tokens: [], source: 'coingecko', message: 'No projects with coingeckoId found' });
    }

    const prices = await getTokenPrices(coingeckoIds);

    // Map prices back to project data for richer response
    const tokens = projects
      .filter(p => p.coingeckoId)
      .map(p => {
        const price = prices.find(tp => tp.coingeckoId === p.coingeckoId);
        return {
          projectSlug: p.slug,
          projectName: p.name,
          ticker: p.ticker,
          coingeckoId: p.coingeckoId,
          assetIds: p.assetIds || [],
          price: price?.price || 0,
          change24h: price?.change24h || 0,
          volume24h: price?.volume24h || 0,
          marketCap: price?.marketCap || 0,
          image: price?.image || p.logo || '',
          lastUpdated: price?.lastUpdated || null,
        };
      });

    res.json({ tokens, source: 'coingecko' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch token prices', tokens: [] });
  }
});

// Get price for a specific CoinGecko token ID
app.get('/api/prices/token/:coingeckoId', async (req, res) => {
  try {
    const { coingeckoId } = req.params;
    if (!coingeckoId || !coingeckoId.trim()) {
      return res.status(400).json({ error: 'coingeckoId is required' });
    }
    const prices = await getTokenPrices([coingeckoId]);
    if (prices.length === 0) {
      return res.status(404).json({ error: 'Token not found on CoinGecko' });
    }
    res.json(prices[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch token price' });
  }
});

app.get('/api/prices/stats', (_req, res) => {
  res.json({ lunes: getPriceStats(), tokens: getTokenPriceStats() });
});

// ─── Rewards System ───

// Get public rewards config (tiers, conversion rates, limits)
app.get('/api/rewards/config', (_req, res) => {
  res.json(getConfig());
});

// Get leaderboard (MUST be before :address route to avoid shadowing)
app.get('/api/rewards/leaderboard', async (req, res) => {
  const limit = parseInt(req.query.limit) || 50;
  let leaderboard = getLeaderboard(limit);
  // Auto-seed from indexer if leaderboard is empty or has no meaningful data
  const hasRealData = leaderboard.some(e => e.totalPoints > 0 || e.transactions > 0);
  if (!hasRealData) {
    await seedFromIndexer();
    leaderboard = getLeaderboard(limit);
  }
  res.json({ leaderboard, count: leaderboard.length });
});

// Get user rewards
app.get('/api/rewards/:address', (req, res) => {
  const user = getOrCreateUserRewards(req.params.address);
  res.json(user);
});

// Add points to user (internal/admin only)
app.post('/api/rewards/:address/points', requireAuth, (req, res) => {
  const { category, basePoints, description, metadata } = req.body;
  
  if (!category || !basePoints) {
    return res.status(400).json({ error: 'Missing category or basePoints' });
  }

  // Cap basePoints to prevent abuse
  const safePoints = Math.min(Math.max(Number(basePoints) || 0, 0), 10000);
  
  const user = addPoints(
    req.params.address,
    category,
    safePoints,
    description || 'Points earned',
    metadata
  );
  
  res.json({ success: true, user });
});

// Update user stats — caller must prove ownership via matching callerAddress
app.post('/api/rewards/:address/stats', (req, res) => {
  const { transactionCount, stakeAmount, callerAddress } = req.body;
  // Verify the caller claims to be the address owner
  if (!callerAddress || callerAddress !== req.params.address) {
    return res.status(403).json({ error: 'callerAddress must match the target address' });
  }
  const user = updateUserStats(req.params.address, { transactionCount, stakeAmount });
  res.json({ success: true, user });
});

// Claim rewards — caller must prove ownership via matching callerAddress
// Token is determined by admin config (rewardToken), not by the user
app.post('/api/rewards/:address/claim', (req, res) => {
  const { callerAddress } = req.body;

  if (!callerAddress || callerAddress !== req.params.address) {
    return res.status(403).json({ error: 'callerAddress must match the target address' });
  }
  
  const result = claimRewards(req.params.address);
  res.json(result);
});

// ─── Admin: Rewards Management ───

// Get wallet status
app.get('/api/admin/rewards/wallet', requireAuth, (req, res) => {
  const wallet = getWallet();
  res.json(wallet);
});

// Refill wallet
app.post('/api/admin/rewards/wallet/refill', requireAuth, (req, res) => {
  const { tokenId, amount } = req.body;
  
  if (!tokenId || !amount || amount <= 0) {
    return res.status(400).json({ error: 'Missing tokenId or valid amount' });
  }
  
  const wallet = refillWallet(tokenId, amount);
  res.json({ success: true, wallet });
});

// Update wallet
app.put('/api/admin/rewards/wallet', requireAuth, (req, res) => {
  const wallet = updateWallet(req.body);
  res.json({ success: true, wallet });
});

// Get reward stats
app.get('/api/admin/rewards/stats', requireAuth, (req, res) => {
  const stats = getStats();
  res.json(stats);
});

// Update reward config
app.put('/api/admin/rewards/config', requireAuth, (req, res) => {
  const config = updateConfig(req.body);
  res.json({ success: true, config });
});

// Reset daily counters (admin only)
app.post('/api/admin/rewards/reset', requireAuth, (req, res) => {
  resetDailyCounters();
  res.json({ success: true, message: 'Daily counters reset' });
});

// ─── Secure Wallet Management (requires auth) ───
app.post('/api/admin/rewards/wallet/change-address', requireAuth, (req, res) => {
  if (req.adminUser.role !== 'owner' && req.adminUser.role !== 'admin') {
    return res.status(403).json({ error: 'Only owners and admins can change the wallet address' });
  }
  const { address, password } = req.body;
  if (!address) return res.status(400).json({ error: 'Address is required' });
  const result = changeWalletAddress(address, req.adminUser.email, password);
  if (!result.success) return res.status(400).json({ error: result.error });
  res.json({ success: true, wallet: result.wallet });
});

app.post('/api/admin/rewards/wallet/change-name', requireAuth, (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'Name is required' });
  const result = changeWalletName(name, req.adminUser.email);
  res.json({ success: true, wallet: result.wallet });
});

app.post('/api/admin/rewards/wallet/toggle-active', requireAuth, (req, res) => {
  if (req.adminUser.role !== 'owner' && req.adminUser.role !== 'admin') {
    return res.status(403).json({ error: 'Only owners and admins can toggle wallet status' });
  }
  const result = toggleWalletActive(req.adminUser.email);
  res.json({ success: true, wallet: result.wallet });
});

app.get('/api/admin/rewards/wallet/changelog', requireAuth, (req, res) => {
  res.json(getWalletChangeLog());
});

// ─── Admin Project Management ───
app.get('/api/admin/projects', requireAuth, (_req, res) => {
  const projects = getProjects();
  const enriched = projects.map(p => ({
    ...p,
    social: getProjectStats(p.slug),
  }));
  res.json(enriched);
});

app.put('/api/admin/projects/:slug', requireAuth, (req, res) => {
  const existing = getProject(req.params.slug);
  if (!existing) return res.status(404).json({ error: 'Project not found' });
  // Admin can edit any project — no ownership check
  const { ownerAddress, ...updates } = req.body;
  // Normalize tokenSymbolImage -> logo so the frontend can read project.logo
  if (updates.tokenSymbolImage !== undefined) {
    updates.logo = updates.tokenSymbolImage;
    delete updates.tokenSymbolImage;
  }
  // Normalize bannerImage -> banner so the frontend can read project.banner
  if (updates.bannerImage !== undefined) {
    updates.banner = updates.bannerImage;
    delete updates.bannerImage;
  }
  const result = updateProject(req.params.slug, updates);
  if (result.error) return res.status(result.status).json({ error: result.error });
  res.json(result);
});

app.delete('/api/admin/projects/:slug', requireAuth, (req, res) => {
  if (req.adminUser.role !== 'owner' && req.adminUser.role !== 'admin') {
    return res.status(403).json({ error: 'Only owners and admins can delete projects' });
  }
  const result = deleteProject(req.params.slug);
  if (result.error) return res.status(result.status).json({ error: result.error });
  res.json(result);
});

// ─── Auth Middleware ───
function requireAuth(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const token = auth.replace('Bearer ', '');
  const user = getUserByToken(token);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });
  req.adminUser = user;
  next();
}

// ─── Admin Auth ───
const loginAttempts = new Map(); // ip -> { count, resetAt }
const LOGIN_WINDOW_MS = 15 * 60_000; // 15 minutes
const LOGIN_MAX_ATTEMPTS = 5;

app.post('/api/auth/login', (req, res) => {
  // Brute force protection
  const ip = req.ip || req.connection?.remoteAddress || 'unknown';
  const now = Date.now();
  let attempt = loginAttempts.get(ip);
  if (!attempt || now > attempt.resetAt) {
    attempt = { count: 0, resetAt: now + LOGIN_WINDOW_MS };
    loginAttempts.set(ip, attempt);
  }
  attempt.count++;
  if (attempt.count > LOGIN_MAX_ATTEMPTS) {
    const retryAfter = Math.ceil((attempt.resetAt - now) / 1000);
    return res.status(429).json({
      error: 'Too many login attempts. Try again later.',
      retryAfter,
    });
  }

  const { username, password } = req.body;
  const user = authenticateUser(username, password);
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  // Reset attempts on successful login
  loginAttempts.delete(ip);
  const token = generateToken(user);
  storeToken(token, user.id);
  return res.json({ access_token: token, token_type: 'bearer' });
});

app.get('/api/auth/me', requireAuth, (req, res) => {
  const { email, id, full_name, is_active, role } = req.adminUser;
  return res.json({ email, id, full_name, is_active, role });
});

// ─── Password Management ───
app.post('/api/auth/change-password', requireAuth, (req, res) => {
  const { current_password, new_password } = req.body;
  if (!current_password || !new_password) {
    return res.status(400).json({ error: 'Current and new password are required' });
  }
  const result = changePassword(req.adminUser.id, current_password, new_password);
  if (!result.success) {
    return res.status(400).json({ error: result.error });
  }
  res.json({ success: true, message: 'Password changed successfully' });
});

// ─── Team Management ───
app.get('/api/admin/team', requireAuth, (req, res) => {
  if (req.adminUser.role !== 'owner' && req.adminUser.role !== 'admin') {
    return res.status(403).json({ error: 'Only owners and admins can manage team' });
  }
  res.json(getTeamMembers());
});

app.post('/api/admin/team', requireAuth, (req, res) => {
  if (req.adminUser.role !== 'owner' && req.adminUser.role !== 'admin') {
    return res.status(403).json({ error: 'Only owners and admins can add team members' });
  }
  const { email, full_name, password, role } = req.body;
  const result = addTeamMember({ email, full_name, password, role: role || 'editor' });
  if (!result.success) {
    return res.status(400).json({ error: result.error });
  }
  res.status(201).json(result.user);
});

app.put('/api/admin/team/:id', requireAuth, (req, res) => {
  if (req.adminUser.role !== 'owner' && req.adminUser.role !== 'admin') {
    return res.status(403).json({ error: 'Only owners and admins can update team members' });
  }
  const id = parseInt(req.params.id);
  const result = updateTeamMember(id, req.body);
  if (!result.success) {
    return res.status(400).json({ error: result.error });
  }
  res.json(result.user);
});

app.post('/api/admin/team/:id/reset-password', requireAuth, (req, res) => {
  if (req.adminUser.role !== 'owner' && req.adminUser.role !== 'admin') {
    return res.status(403).json({ error: 'Only owners and admins can reset passwords' });
  }
  const id = parseInt(req.params.id);
  const { new_password } = req.body;
  if (!new_password) return res.status(400).json({ error: 'New password is required' });
  const result = resetTeamMemberPassword(id, new_password);
  if (!result.success) {
    return res.status(400).json({ error: result.error });
  }
  res.json({ success: true, message: 'Password reset successfully' });
});

app.delete('/api/admin/team/:id', requireAuth, (req, res) => {
  if (req.adminUser.role !== 'owner') {
    return res.status(403).json({ error: 'Only the owner can delete team members' });
  }
  const id = parseInt(req.params.id);
  const result = deleteTeamMember(id);
  if (!result.success) {
    return res.status(400).json({ error: result.error });
  }
  res.json({ success: true });
});

// ─── Banners (Public) ───
app.get('/api/banners', (_req, res) => {
  res.json(getActiveBanners());
});

// ─── Banners (Admin) ───
app.get('/api/admin/banners', requireAuth, (_req, res) => {
  res.json(getAllBanners());
});

app.post('/api/admin/banners', requireAuth, (req, res) => {
  const { title, subtitle, imageUrl, gradient, linkUrl, linkLabel, isActive, order } = req.body;
  if (!title) return res.status(400).json({ error: 'Title is required' });
  const banner = createBanner({
    title, subtitle, imageUrl, gradient, linkUrl, linkLabel,
    isActive: isActive !== false,
    order: order ?? 99,
  });
  res.status(201).json(banner);
});

app.put('/api/admin/banners/:id', requireAuth, (req, res) => {
  const banner = updateBanner(req.params.id, req.body);
  if (!banner) return res.status(404).json({ error: 'Banner not found' });
  res.json(banner);
});

app.delete('/api/admin/banners/:id', requireAuth, (req, res) => {
  const deleted = deleteBanner(req.params.id);
  if (!deleted) return res.status(404).json({ error: 'Banner not found' });
  res.json({ success: true });
});

app.post('/api/admin/banners/reorder', requireAuth, (req, res) => {
  const { orderedIds } = req.body;
  if (!Array.isArray(orderedIds)) return res.status(400).json({ error: 'orderedIds array required' });
  const banners = reorderBanners(orderedIds);
  res.json(banners);
});

// ─── Ads (Public) ───
app.get('/api/ads', (req, res) => {
  const placement = req.query.placement || undefined;
  res.json(getActiveAds(placement));
});

app.post('/api/ads/:id/impression', (req, res) => {
  trackImpression(req.params.id);
  res.json({ success: true });
});

app.post('/api/ads/:id/click', (req, res) => {
  trackClick(req.params.id);
  res.json({ success: true });
});

// ─── Public: Donations Wallet ───
app.get('/api/wallets/donations', (_req, res) => {
  const wallet = getWalletByPurpose('donations');
  res.json({ address: wallet?.address || '', isActive: wallet?.isActive ?? true });
});

// ─── Ads Pricing (Public) ───
app.get('/api/ads/pricing', (_req, res) => {
  res.json(getAdPricing());
});

app.get('/api/ads/calculate', (req, res) => {
  const impressions = parseInt(req.query.impressions) || 1000;
  const cost = calculateAdCost(impressions);
  res.json({ impressions, cost, currency: 'LUNES' });
});

// ─── Ads Self-Service ───
app.post('/api/ads/submit', (req, res) => {
  try {
    const { title, description, ctaText, ctaUrl, imageUrl, placement,
            advertiserAddress, advertiserName, advertiserEmail, purchasedImpressions } = req.body;
    if (!title || !ctaUrl || !advertiserAddress || !advertiserName || !advertiserEmail || !purchasedImpressions) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    const pricing = getAdPricing();
    if (purchasedImpressions < pricing.minImpressions || purchasedImpressions > pricing.maxImpressions) {
      return res.status(400).json({ error: `Impressions must be between ${pricing.minImpressions} and ${pricing.maxImpressions}` });
    }
    const ad = submitAd({ title, description, ctaText, ctaUrl, imageUrl, placement,
                          advertiserAddress, advertiserName, advertiserEmail, purchasedImpressions });
    res.status(201).json(ad);
  } catch (err) {
    res.status(500).json({ error: 'Failed to submit ad' });
  }
});

app.get('/api/ads/my/:address', (req, res) => {
  res.json(getAdsByAdvertiser(req.params.address));
});

app.get('/api/ads/advertiser/:address', (req, res) => {
  const profile = getAdvertiserProfile(req.params.address);
  if (!profile) return res.status(404).json({ error: 'Advertiser not found' });
  const ads = getAdsByAdvertiser(req.params.address);
  res.json({ profile, ads });
});

app.post('/api/ads/:id/pay', (req, res) => {
  const { txHash } = req.body;
  if (!txHash) return res.status(400).json({ error: 'txHash is required' });
  const ad = confirmAdPayment(req.params.id, txHash);
  if (!ad) return res.status(404).json({ error: 'Ad not found or not pending payment' });
  res.json({ success: true, ad });
});

// ─── Ads (Admin) ───
// NOTE: Specific routes (/pricing, /review, /advertisers) MUST come before generic /:id routes
app.get('/api/admin/ads', requireAuth, (_req, res) => {
  res.json(getAllAds());
});

app.put('/api/admin/ads/pricing', requireAuth, (req, res) => {
  const pricing = updateAdPricing(req.body);
  res.json({ success: true, pricing });
});

app.get('/api/admin/advertisers', requireAuth, (_req, res) => {
  res.json(getAllAdvertisers());
});

app.post('/api/admin/ads', requireAuth, (req, res) => {
  const { title, description, ctaText, ctaUrl, imageUrl, placement, isActive, priority, startDate, endDate } = req.body;
  if (!title || !ctaUrl) return res.status(400).json({ error: 'Title and CTA URL are required' });
  const ad = createAd({
    title, description: description || '', ctaText: ctaText || 'Learn More', ctaUrl,
    imageUrl, placement: placement || 'home_stats',
    isActive: isActive !== false, priority: priority ?? 0,
    startDate, endDate, status: 'active',
  });
  res.status(201).json(ad);
});

app.put('/api/admin/ads/:id/review', requireAuth, (req, res) => {
  const { decision, notes } = req.body;
  if (!['approved', 'rejected'].includes(decision)) {
    return res.status(400).json({ error: 'Decision must be approved or rejected' });
  }
  const ad = reviewAd(req.params.id, decision, notes);
  if (!ad) return res.status(404).json({ error: 'Ad not found' });
  res.json({ success: true, ad });
});

app.put('/api/admin/ads/:id', requireAuth, (req, res) => {
  const ad = updateAd(req.params.id, req.body);
  if (!ad) return res.status(404).json({ error: 'Ad not found' });
  res.json(ad);
});

app.delete('/api/admin/ads/:id', requireAuth, (req, res) => {
  const deleted = deleteAd(req.params.id);
  if (!deleted) return res.status(404).json({ error: 'Ad not found' });
  res.json({ success: true });
});

// ─── AI Config (Admin) ───
app.get('/api/admin/ai/config', requireAuth, (_req, res) => {
  res.json(getAIConfigSafe());
});

app.put('/api/admin/ai/config', requireAuth, (req, res) => {
  const updated = updateAIConfig(req.body, req.adminUser?.email || 'admin');
  res.json(updated);
});

app.post('/api/admin/ai/test-key', requireAuth, async (req, res) => {
  const { apiKey } = req.body;
  if (!apiKey) return res.status(400).json({ success: false, message: 'API key is required' });
  const result = await testAPIKey(apiKey);
  res.json(result);
});

app.get('/api/admin/ai/models', requireAuth, (_req, res) => {
  res.json(FREE_MODELS);
});

// ─── Start ───
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`Lunes Explorer API running on http://localhost:${PORT}`);
  });
}

export default app;
