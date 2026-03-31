/**
 * Projects API client — connects to the Lunes Explorer REST API
 * for CRUD operations on projects and social interactions.
 *
 * Falls back to hardcoded data (knownProjects.ts) when API is unavailable.
 */

import type {
  KnownProject,
  ProjectLink,
  ProjectTeam,
  ProjectMilestone,
  VerificationData,
  VerificationStatus,
} from '../data/knownProjects';
import { API_BASE } from '../config';

// ─── Types ───

export interface ApiProject {
  id: string;
  slug: string;
  name: string;
  ticker: string;
  logo: string;
  banner?: string;
  category: KnownProject['category'];
  description: string;
  longDescription: string;
  status: KnownProject['status'];
  launchDate: string;
  links: ProjectLink[];
  team: ProjectTeam[];
  milestones: ProjectMilestone[];
  tags: string[];
  contractAddresses: string[];
  tokenIds: string[];
  nftCollectionIds: string[];
  assetIds: string[];
  tokenSymbol?: string;
  donationAddress?: string;
  verification: VerificationData;
  ownerAddress: string;
  createdAt: string;
  updatedAt: string;
  social?: { likes: number; follows: number };
}

export interface CreateProjectPayload {
  name: string;
  ticker?: string;
  logo?: string;
  banner?: string;
  category?: KnownProject['category'];
  description?: string;
  longDescription?: string;
  status?: KnownProject['status'];
  launchDate?: string;
  links?: ProjectLink[];
  team?: ProjectTeam[];
  milestones?: ProjectMilestone[];
  tags?: string[];
  contractAddresses?: string[];
  tokenIds?: string[];
  nftCollectionIds?: string[];
  assetIds?: string[];
  tokenSymbol?: string;
  donationAddress?: string;
  ownerAddress: string;
}

export interface UpdateProjectPayload extends Partial<CreateProjectPayload> {
  ownerAddress: string;
}

export interface VerificationPayload {
  paymentTxHash?: string;
  payerAddress: string;
  responsibleName: string;
  responsibleEmail: string;
  responsibleDocument?: string;
  proofOfOwnership?: string;
  projectWebsite?: string;
}

export interface ReviewPayload {
  decision: VerificationStatus;
  reviewedBy: string;
  notes?: string;
}

export interface Comment {
  id: string;
  projectSlug: string;
  userAddress: string;
  content: string;
  metadata?: {
    reactions?: { userAddress: string; emoji: string; createdAt: string }[];
    gif?: string | null;
  };
  createdAt: string;
}

export interface SocialInteraction {
  type: 'like' | 'follow';
  projectSlug: string;
  userAddress: string;
  createdAt: string;
}

// ─── HTTP helpers ───

async function apiFetch<T>(path: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      ...opts?.headers,
    },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(body.error || `HTTP ${res.status}`, res.status);
  }
  return res.json();
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = 'ApiError';
  }
}

// ─── Projects CRUD ───

export async function fetchProjects(): Promise<ApiProject[]> {
  return apiFetch<ApiProject[]>('/api/projects');
}

export async function fetchProject(slug: string): Promise<ApiProject> {
  return apiFetch<ApiProject>(`/api/projects/${encodeURIComponent(slug)}`);
}

export async function createProject(payload: CreateProjectPayload): Promise<ApiProject> {
  return apiFetch<ApiProject>('/api/projects', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateProject(slug: string, payload: UpdateProjectPayload): Promise<ApiProject> {
  return apiFetch<ApiProject>(`/api/projects/${encodeURIComponent(slug)}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function deleteProject(slug: string): Promise<{ ok: boolean }> {
  return apiFetch<{ ok: boolean }>(`/api/projects/${encodeURIComponent(slug)}`, {
    method: 'DELETE',
  });
}

// ─── Verification ───

export async function submitVerification(slug: string, payload: VerificationPayload): Promise<ApiProject> {
  return apiFetch<ApiProject>(`/api/projects/${encodeURIComponent(slug)}/verify`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function reviewVerification(slug: string, payload: ReviewPayload): Promise<ApiProject> {
  return apiFetch<ApiProject>(`/api/projects/${encodeURIComponent(slug)}/review`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

// ─── Social ───

export async function toggleLike(projectSlug: string, userAddress: string): Promise<{ action: 'added' | 'removed' }> {
  return apiFetch('/api/social/like', {
    method: 'POST',
    body: JSON.stringify({ projectSlug, userAddress }),
  });
}

export async function toggleFollow(projectSlug: string, userAddress: string): Promise<{ action: 'added' | 'removed' }> {
  return apiFetch('/api/social/follow', {
    method: 'POST',
    body: JSON.stringify({ projectSlug, userAddress }),
  });
}

export async function fetchProjectSocial(slug: string): Promise<{
  likes: SocialInteraction[];
  follows: SocialInteraction[];
  stats: { likes: number; follows: number };
}> {
  return apiFetch(`/api/social/project/${encodeURIComponent(slug)}`);
}

export async function fetchUserInteractions(address: string): Promise<SocialInteraction[]> {
  return apiFetch<SocialInteraction[]>(`/api/social/user/${encodeURIComponent(address)}`);
}

// ─── Comments ───

export async function fetchComments(projectSlug: string): Promise<Comment[]> {
  return apiFetch<Comment[]>(`/api/comments/${encodeURIComponent(projectSlug)}`);
}

export async function createComment(
  projectSlug: string,
  userAddress: string,
  content: string,
  metadata?: { gif?: string | null }
): Promise<Comment> {
  return apiFetch<Comment>('/api/comments', {
    method: 'POST',
    body: JSON.stringify({ projectSlug, userAddress, content, metadata }),
  });
}

export async function deleteComment(commentId: string, userAddress: string): Promise<{ ok: boolean }> {
  return apiFetch<{ ok: boolean }>(`/api/comments/${encodeURIComponent(commentId)}`, {
    method: 'DELETE',
    body: JSON.stringify({ userAddress }),
  });
}

export async function addReaction(commentId: string, userAddress: string, emoji: string): Promise<{ comment: Comment; action: 'added' | 'removed' }> {
  return apiFetch<{ comment: Comment; action: 'added' | 'removed' }>(`/api/comments/${encodeURIComponent(commentId)}/react`, {
    method: 'POST',
    body: JSON.stringify({ userAddress, emoji }),
  });
}

// ─── Health ───

export async function checkApiHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/api/health`, { signal: AbortSignal.timeout(3000) });
    return res.ok;
  } catch {
    return false;
  }
}

// ─── Adapter: ApiProject → KnownProject ───

export function toKnownProject(api: ApiProject): KnownProject {
  return {
    id: api.id,
    name: api.name,
    slug: api.slug,
    logo: api.logo || (api as any).tokenSymbolImage || undefined,
    banner: api.banner || (api as any).bannerImage || undefined,
    category: api.category,
    description: api.description,
    longDescription: api.longDescription || undefined,
    status: api.status,
    launchDate: api.launchDate || undefined,
    links: api.links || [],
    team: api.team || [],
    milestones: api.milestones || [],
    tags: api.tags || [],
    contractAddresses: api.contractAddresses || [],
    tokenIds: api.tokenIds || [],
    nftCollectionIds: api.nftCollectionIds || [],
    assetIds: api.assetIds || [],
    tokenSymbol: api.tokenSymbol || undefined,
    donationAddress: api.donationAddress || undefined,
    verification: api.verification || { status: 'unverified' },
  };
}
