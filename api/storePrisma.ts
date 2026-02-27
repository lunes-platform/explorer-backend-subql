import prisma from './prismaClient.ts';

const PROJECT_STATE_KEY = 'projects';
const SOCIAL_STATE_KEY = 'social';
const COMMENTS_STATE_KEY = 'comments';

// ─── Helpers ───
async function loadState(key: string, defaultValue: any) {
  const row = await prisma.adminDataState.findUnique({ where: { key } });
  if (!row) {
    await prisma.adminDataState.create({ data: { key, data: defaultValue } });
    return defaultValue;
  }
  return row.data || defaultValue;
}

async function saveState(key: string, data: any) {
  await prisma.adminDataState.upsert({
    where: { key },
    update: { data },
    create: { key, data },
  });
}

// ─── Projects ───
export async function getProjects() {
  return await loadState(PROJECT_STATE_KEY, []);
}

export async function getProject(slug: string) {
  const projects = await getProjects();
  return projects.find((p: any) => p.slug === slug) || null;
}

export async function createProject(project: any) {
  const projects = await getProjects();
  const slug = project.slug || project.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  if (projects.find((p: any) => p.slug === slug)) {
    return { error: 'Project with this slug already exists', status: 409 };
  }

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
  await saveState(PROJECT_STATE_KEY, projects);
  return newProject;
}

export async function updateProject(slug: string, updates: any) {
  const projects = await getProjects();
  const idx = projects.findIndex((p: any) => p.slug === slug);
  if (idx === -1) return { error: 'Project not found', status: 404 };

  projects[idx] = {
    ...projects[idx],
    ...updates,
    slug: projects[idx].slug,
    id: projects[idx].id,
    createdAt: projects[idx].createdAt,
    updatedAt: new Date().toISOString(),
  };
  await saveState(PROJECT_STATE_KEY, projects);
  return projects[idx];
}

export async function deleteProject(slug: string) {
  const projects = await getProjects();
  const filtered = projects.filter((p: any) => p.slug !== slug);
  if (filtered.length === projects.length) return { error: 'Not found', status: 404 };
  await saveState(PROJECT_STATE_KEY, filtered);
  return { ok: true };
}

// ─── Verification ───
export async function submitVerification(slug: string, data: any) {
  const projects = await getProjects();
  const idx = projects.findIndex((p: any) => p.slug === slug);
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
  await saveState(PROJECT_STATE_KEY, projects);
  return projects[idx];
}

export async function reviewVerification(slug: string, decision: string, reviewedBy: string, notes: string) {
  const projects = await getProjects();
  const idx = projects.findIndex((p: any) => p.slug === slug);
  if (idx === -1) return { error: 'Project not found', status: 404 };

  projects[idx].verification.status = decision;
  if (decision === 'verified') projects[idx].verification.verifiedAt = new Date().toISOString();
  projects[idx].verification.reviewedBy = reviewedBy;
  projects[idx].verification.reviewNotes = notes;
  projects[idx].updatedAt = new Date().toISOString();
  await saveState(PROJECT_STATE_KEY, projects);
  return projects[idx];
}

// ─── Comments ───
const MAX_COMMENT_LENGTH = 350;

export async function getComments(projectSlug: string) {
  const comments = await loadState(COMMENTS_STATE_KEY, []);
  return comments.filter((c: any) => c.projectSlug === projectSlug);
}

export async function addComment(projectSlug: string, userAddress: string, content: string, metadata: any = {}) {
  if (!content || !content.trim()) return { error: 'Comment content is required', status: 400 };
  if (content.length > MAX_COMMENT_LENGTH) return { error: `Comment exceeds ${MAX_COMMENT_LENGTH} characters`, status: 400 };

  const comments = await loadState(COMMENTS_STATE_KEY, []);
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
  await saveState(COMMENTS_STATE_KEY, comments);
  return newComment;
}

export async function deleteComment(commentId: string, userAddress: string) {
  const comments = await loadState(COMMENTS_STATE_KEY, []);
  const idx = comments.findIndex((c: any) => c.id === commentId && c.userAddress === userAddress);
  if (idx === -1) return { error: 'Comment not found or not authorized', status: 404 };
  comments.splice(idx, 1);
  await saveState(COMMENTS_STATE_KEY, comments);
  return { ok: true };
}

export async function addReaction(commentId: string, userAddress: string, emoji: string) {
  const comments = await loadState(COMMENTS_STATE_KEY, []);
  const comment = comments.find((c: any) => c.id === commentId);
  if (!comment) return { error: 'Comment not found', status: 404 };

  if (!comment.metadata) comment.metadata = {};
  if (!comment.metadata.reactions) comment.metadata.reactions = [];

  const existingIdx = comment.metadata.reactions.findIndex((r: any) => r.userAddress === userAddress && r.emoji === emoji);
  if (existingIdx !== -1) {
    comment.metadata.reactions.splice(existingIdx, 1);
  } else {
    comment.metadata.reactions.push({ userAddress, emoji, createdAt: new Date().toISOString() });
  }

  await saveState(COMMENTS_STATE_KEY, comments);
  return { comment, action: existingIdx !== -1 ? 'removed' : 'added' };
}

// ─── Social Interactions ───
export async function getSocial() {
  return await loadState(SOCIAL_STATE_KEY, []);
}

export async function getLikes(projectSlug: string) {
  const social = await getSocial();
  return social.filter((s: any) => s.type === 'like' && s.projectSlug === projectSlug);
}

export async function getFollows(projectSlug: string) {
  const social = await getSocial();
  return social.filter((s: any) => s.type === 'follow' && s.projectSlug === projectSlug);
}

export async function getUserInteractions(address: string) {
  const social = await getSocial();
  return social.filter((s: any) => s.userAddress === address);
}

export async function toggleInteraction(type: string, projectSlug: string, userAddress: string) {
  const social = await getSocial();
  const idx = social.findIndex((s: any) => s.type === type && s.projectSlug === projectSlug && s.userAddress === userAddress);

  if (idx !== -1) {
    social.splice(idx, 1);
    await saveState(SOCIAL_STATE_KEY, social);
    return { action: 'removed' };
  }

  social.push({ type, projectSlug, userAddress, createdAt: new Date().toISOString() });
  await saveState(SOCIAL_STATE_KEY, social);
  return { action: 'added' };
}

export async function getProjectStats(slug: string) {
  const social = await getSocial();
  const comments = await getComments(slug);
  return {
    likes: social.filter((s: any) => s.type === 'like' && s.projectSlug === slug).length,
    follows: social.filter((s: any) => s.type === 'follow' && s.projectSlug === slug).length,
    comments: comments.length,
  };
}
