import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, 'data');

if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });

function filePath(name) { return join(DATA_DIR, `${name}.json`); }

function read(name) {
  const p = filePath(name);
  if (!existsSync(p)) return [];
  try { return JSON.parse(readFileSync(p, 'utf-8')); } catch { return []; }
}

function write(name, data) {
  writeFileSync(filePath(name), JSON.stringify(data, null, 2), 'utf-8');
}

// ─── Projects ───
export function getProjects() { return read('projects'); }

export function getProject(slug) {
  return getProjects().find(p => p.slug === slug) || null;
}

export function createProject(project) {
  const projects = getProjects();
  const slug = project.slug || project.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  const existing = projects.find(p => p.slug === slug);
  if (existing) return { error: 'Project with this slug already exists', status: 409 };

  const now = new Date().toISOString();
  const newProject = {
    id: `proj-${Date.now()}`,
    slug,
    name: project.name || 'Unnamed',
    ticker: project.ticker || '',
    logo: project.logo || '',
    category: project.category || 'other',
    description: project.description || '',
    longDescription: project.longDescription || '',
    status: project.status || 'development',
    launchDate: project.launchDate || '',
    links: project.links || [],
    team: project.team || [],
    milestones: project.milestones || [],
    tags: project.tags || [],
    contractAddresses: project.contractAddresses || [],
    tokenIds: project.tokenIds || [],
    nftCollectionIds: project.nftCollectionIds || [],
    assetIds: project.assetIds || [],
    tokenSymbol: project.tokenSymbol || '',
    coingeckoId: project.coingeckoId || '',
    donationAddress: project.donationAddress || '',
    verification: project.verification || { status: 'unverified' },
    ownerAddress: project.ownerAddress || '',
    createdAt: now,
    updatedAt: now,
  };

  projects.push(newProject);
  write('projects', projects);
  return newProject;
}

export function updateProject(slug, updates) {
  const projects = getProjects();
  const idx = projects.findIndex(p => p.slug === slug);
  if (idx === -1) return { error: 'Project not found', status: 404 };

  projects[idx] = {
    ...projects[idx],
    ...updates,
    slug: projects[idx].slug,
    id: projects[idx].id,
    createdAt: projects[idx].createdAt,
    updatedAt: new Date().toISOString(),
  };
  write('projects', projects);
  return projects[idx];
}

export function deleteProject(slug) {
  const projects = getProjects();
  const filtered = projects.filter(p => p.slug !== slug);
  if (filtered.length === projects.length) return { error: 'Not found', status: 404 };
  write('projects', filtered);
  return { ok: true };
}

// ─── Verification ───
export function submitVerification(slug, data) {
  const projects = getProjects();
  const idx = projects.findIndex(p => p.slug === slug);
  if (idx === -1) return { error: 'Project not found', status: 404 };

  projects[idx].verification = {
    status: 'pending',
    submittedAt: new Date().toISOString(),
    paymentTxHash: data.paymentTxHash || '',
    payerAddress: data.payerAddress || '',
    responsibleName: data.responsibleName || '',
    responsibleEmail: data.responsibleEmail || '',
    responsibleDocument: data.responsibleDocument || '',
    proofOfOwnership: data.proofOfOwnership || '',
    projectWebsite: data.projectWebsite || '',
  };
  projects[idx].updatedAt = new Date().toISOString();
  write('projects', projects);
  return projects[idx];
}

export function reviewVerification(slug, decision, reviewedBy, notes) {
  const projects = getProjects();
  const idx = projects.findIndex(p => p.slug === slug);
  if (idx === -1) return { error: 'Project not found', status: 404 };

  projects[idx].verification.status = decision;
  if (decision === 'verified') projects[idx].verification.verifiedAt = new Date().toISOString();
  projects[idx].verification.reviewedBy = reviewedBy;
  projects[idx].verification.reviewNotes = notes;
  projects[idx].updatedAt = new Date().toISOString();
  write('projects', projects);
  return projects[idx];
}

// ─── Comments ───
const MAX_COMMENT_LENGTH = 350;

export function getComments(projectSlug) {
  return read('comments').filter(c => c.projectSlug === projectSlug);
}

export function addComment(projectSlug, userAddress, content, metadata = {}) {
  if (!content || !content.trim()) {
    return { error: 'Comment content is required', status: 400 };
  }
  if (content.length > MAX_COMMENT_LENGTH) {
    return { error: `Comment exceeds ${MAX_COMMENT_LENGTH} characters`, status: 400 };
  }
  
  const comments = read('comments');
  const newComment = {
    id: `cmt-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    projectSlug,
    userAddress,
    content: content.trim(),
    metadata: {
      reactions: metadata.reactions || [],
      gif: metadata.gif || null,
      ...metadata,
    },
    createdAt: new Date().toISOString(),
  };
  comments.push(newComment);
  write('comments', comments);
  return newComment;
}

export function deleteComment(commentId, userAddress) {
  const comments = read('comments');
  const idx = comments.findIndex(c => c.id === commentId && c.userAddress === userAddress);
  if (idx === -1) return { error: 'Comment not found or not authorized', status: 404 };
  comments.splice(idx, 1);
  write('comments', comments);
  return { ok: true };
}

export function addReaction(commentId, userAddress, emoji) {
  const comments = read('comments');
  const comment = comments.find(c => c.id === commentId);
  if (!comment) return { error: 'Comment not found', status: 404 };
  
  if (!comment.metadata) comment.metadata = {};
  if (!comment.metadata.reactions) comment.metadata.reactions = [];
  
  // Toggle reaction
  const existingIdx = comment.metadata.reactions.findIndex(
    r => r.userAddress === userAddress && r.emoji === emoji
  );
  if (existingIdx !== -1) {
    comment.metadata.reactions.splice(existingIdx, 1);
  } else {
    comment.metadata.reactions.push({ userAddress, emoji, createdAt: new Date().toISOString() });
  }
  
  write('comments', comments);
  return { comment, action: existingIdx !== -1 ? 'removed' : 'added' };
}

// ─── Social Interactions ───
function getSocial() { return read('social'); }

export function getLikes(projectSlug) {
  return getSocial().filter(s => s.type === 'like' && s.projectSlug === projectSlug);
}

export function getFollows(projectSlug) {
  return getSocial().filter(s => s.type === 'follow' && s.projectSlug === projectSlug);
}

export function getUserInteractions(address) {
  return getSocial().filter(s => s.userAddress === address);
}

export function toggleInteraction(type, projectSlug, userAddress) {
  const social = getSocial();
  const idx = social.findIndex(s => s.type === type && s.projectSlug === projectSlug && s.userAddress === userAddress);

  if (idx !== -1) {
    social.splice(idx, 1);
    write('social', social);
    return { action: 'removed' };
  }

  social.push({ type, projectSlug, userAddress, createdAt: new Date().toISOString() });
  write('social', social);
  return { action: 'added' };
}

export function getProjectStats(slug) {
  const social = getSocial();
  const comments = read('comments').filter(c => c.projectSlug === slug);
  return {
    likes: social.filter(s => s.type === 'like' && s.projectSlug === slug).length,
    follows: social.filter(s => s.type === 'follow' && s.projectSlug === slug).length,
    comments: comments.length,
  };
}
