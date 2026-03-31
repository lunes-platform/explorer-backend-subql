import { useState, useEffect, useCallback } from 'react';
import { ADMIN_STORAGE_KEYS } from '../config/admin';

// --- Announcement types ---
export interface Announcement {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'critical';
  active: boolean;
  createdAt: number;
  expiresAt?: number;
  createdBy: string;
}

// --- Project review types ---
export type ReviewDecision = 'pending' | 'approved' | 'rejected';

export interface ProjectReview {
  projectSlug: string;
  decision: ReviewDecision;
  reviewedBy: string;
  reviewedAt: number;
  notes: string;
}

// --- Token info types ---
export interface TokenInfoOverride {
  description?: string;
  website?: string;
  twitter?: string;
  telegram?: string;
  discord?: string;
  github?: string;
  logoUrl?: string;
  coingeckoId?: string;
  updatedAt: number;
  updatedBy: string;
}

// --- Generic localStorage helper ---
function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function saveToStorage<T>(key: string, data: T): void {
  localStorage.setItem(key, JSON.stringify(data));
}

// --- Announcements hook ---
export function useAdminAnnouncements() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setAnnouncements(loadFromStorage(ADMIN_STORAGE_KEYS.ANNOUNCEMENTS, []));
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) saveToStorage(ADMIN_STORAGE_KEYS.ANNOUNCEMENTS, announcements);
  }, [announcements, loaded]);

  const addAnnouncement = useCallback((ann: Omit<Announcement, 'id' | 'createdAt'>) => {
    const newAnn: Announcement = {
      ...ann,
      id: `ann-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      createdAt: Date.now(),
    };
    setAnnouncements((prev) => [newAnn, ...prev]);
    return newAnn.id;
  }, []);

  const updateAnnouncement = useCallback((id: string, updates: Partial<Announcement>) => {
    setAnnouncements((prev) =>
      prev.map((a) => (a.id === id ? { ...a, ...updates } : a))
    );
  }, []);

  const removeAnnouncement = useCallback((id: string) => {
    setAnnouncements((prev) => prev.filter((a) => a.id !== id));
  }, []);

  const toggleActive = useCallback((id: string) => {
    setAnnouncements((prev) =>
      prev.map((a) => (a.id === id ? { ...a, active: !a.active } : a))
    );
  }, []);

  const activeAnnouncements = announcements.filter(
    (a) => a.active && (!a.expiresAt || a.expiresAt > Date.now())
  );

  return {
    announcements,
    activeAnnouncements,
    loaded,
    addAnnouncement,
    updateAnnouncement,
    removeAnnouncement,
    toggleActive,
  };
}

// --- Project reviews hook ---
export function useAdminProjectReviews() {
  const [reviews, setReviews] = useState<ProjectReview[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setReviews(loadFromStorage(ADMIN_STORAGE_KEYS.PROJECT_REVIEWS, []));
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) saveToStorage(ADMIN_STORAGE_KEYS.PROJECT_REVIEWS, reviews);
  }, [reviews, loaded]);

  const reviewProject = useCallback(
    (slug: string, decision: ReviewDecision, reviewedBy: string, notes: string) => {
      setReviews((prev) => {
        const existing = prev.findIndex((r) => r.projectSlug === slug);
        const review: ProjectReview = {
          projectSlug: slug,
          decision,
          reviewedBy,
          reviewedAt: Date.now(),
          notes,
        };
        if (existing >= 0) {
          const updated = [...prev];
          updated[existing] = review;
          return updated;
        }
        return [...prev, review];
      });
    },
    []
  );

  const getReview = useCallback(
    (slug: string) => reviews.find((r) => r.projectSlug === slug) || null,
    [reviews]
  );

  return { reviews, loaded, reviewProject, getReview };
}

// --- Token info override hook ---
export function useAdminTokenInfo() {
  const [tokenInfo, setTokenInfo] = useState<TokenInfoOverride | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setTokenInfo(loadFromStorage(ADMIN_STORAGE_KEYS.TOKEN_INFO, null));
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded && tokenInfo) saveToStorage(ADMIN_STORAGE_KEYS.TOKEN_INFO, tokenInfo);
  }, [tokenInfo, loaded]);

  const updateTokenInfo = useCallback((updates: Partial<TokenInfoOverride>, updatedBy: string) => {
    setTokenInfo((prev) => ({
      ...(prev || {}),
      ...updates,
      updatedAt: Date.now(),
      updatedBy,
    } as TokenInfoOverride));
  }, []);

  return { tokenInfo, loaded, updateTokenInfo };
}

// --- Verified tokens hook ---
export function useAdminVerifiedTokens() {
  const [verifiedTokens, setVerifiedTokens] = useState<string[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setVerifiedTokens(loadFromStorage(ADMIN_STORAGE_KEYS.VERIFIED_TOKENS, []));
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) saveToStorage(ADMIN_STORAGE_KEYS.VERIFIED_TOKENS, verifiedTokens);
  }, [verifiedTokens, loaded]);

  const toggleVerified = useCallback((tokenId: string) => {
    setVerifiedTokens((prev) =>
      prev.includes(tokenId) ? prev.filter((t) => t !== tokenId) : [...prev, tokenId]
    );
  }, []);

  const isVerified = useCallback(
    (tokenId: string) => verifiedTokens.includes(tokenId),
    [verifiedTokens]
  );

  return { verifiedTokens, loaded, toggleVerified, isVerified };
}
