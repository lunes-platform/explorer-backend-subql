/**
 * React hooks for the Projects API.
 * Provides data fetching, caching, and mutation helpers for projects & social.
 * Falls back to hardcoded KNOWN_PROJECTS when the API is unavailable.
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  fetchProjects, fetchProject, createProject, updateProject, deleteProject,
  submitVerification, reviewVerification,
  toggleLike, toggleFollow, fetchProjectSocial, fetchUserInteractions,
  checkApiHealth, toKnownProject,
  type ApiProject, type CreateProjectPayload, type UpdateProjectPayload,
  type VerificationPayload, type ReviewPayload, type SocialInteraction,
} from '../services/projectsApi';
import { KNOWN_PROJECTS, type KnownProject } from '../data/knownProjects';

// ─── API availability ───

let _apiOnline: boolean | null = null;

async function isApiOnline(): Promise<boolean> {
  if (_apiOnline !== null) return _apiOnline;
  _apiOnline = await checkApiHealth();
  // Recheck every 30s
  setTimeout(() => { _apiOnline = null; }, 30_000);
  return _apiOnline;
}

// ─── useProjects: list all projects ───

export function useProjects() {
  const [projects, setProjects] = useState<KnownProject[]>([]);
  const [apiProjects, setApiProjects] = useState<ApiProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isApi, setIsApi] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const online = await isApiOnline();
      if (online) {
        const data = await fetchProjects();
        setApiProjects(data);
        setProjects(data.map(toKnownProject));
        setIsApi(true);
      } else {
        setProjects([...KNOWN_PROJECTS]);
        setApiProjects([]);
        setIsApi(false);
      }
    } catch (err: any) {
      setProjects([...KNOWN_PROJECTS]);
      setApiProjects([]);
      setIsApi(false);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return { projects, apiProjects, loading, error, refetch: load, isApi };
}

// ─── useProject: single project by slug ───

export function useProject(slug: string | undefined) {
  const [project, setProject] = useState<KnownProject | null>(null);
  const [apiProject, setApiProject] = useState<ApiProject | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isApi, setIsApi] = useState(false);

  const load = useCallback(async () => {
    if (!slug) { setProject(null); setLoading(false); return; }
    setLoading(true);
    setError(null);
    try {
      const online = await isApiOnline();
      if (online) {
        const data = await fetchProject(slug);
        setApiProject(data);
        setProject(toKnownProject(data));
        setIsApi(true);
      } else {
        const found = KNOWN_PROJECTS.find(p => p.slug === slug) || null;
        setProject(found);
        setApiProject(null);
        setIsApi(false);
      }
    } catch (err: any) {
      const found = KNOWN_PROJECTS.find(p => p.slug === slug) || null;
      setProject(found);
      setApiProject(null);
      setIsApi(false);
      if (!found) setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => { load(); }, [load]);

  return { project, apiProject, loading, error, refetch: load, isApi };
}

// ─── useMyProjects: projects owned by address ───

export function useMyProjects(address: string) {
  const [projects, setProjects] = useState<ApiProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isApi, setIsApi] = useState(false);

  const load = useCallback(async () => {
    if (!address) { setProjects([]); setLoading(false); return; }
    setLoading(true);
    setError(null);
    try {
      const online = await isApiOnline();
      if (online) {
        const all = await fetchProjects();
        setProjects(all.filter(p => p.ownerAddress === address));
        setIsApi(true);
      } else {
        setProjects([]);
        setIsApi(false);
      }
    } catch (err: any) {
      setError(err.message);
      setProjects([]);
      setIsApi(false);
    } finally {
      setLoading(false);
    }
  }, [address]);

  useEffect(() => { load(); }, [load]);

  return { projects, loading, error, refetch: load, isApi };
}

// ─── useProjectMutations: CRUD operations ───

export function useProjectMutations() {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const create = useCallback(async (payload: CreateProjectPayload) => {
    setSaving(true); setError(null);
    try { return await createProject(payload); }
    catch (err: any) { setError(err.message); return null; }
    finally { setSaving(false); }
  }, []);

  const update = useCallback(async (slug: string, payload: UpdateProjectPayload) => {
    setSaving(true); setError(null);
    try { return await updateProject(slug, payload); }
    catch (err: any) { setError(err.message); return null; }
    finally { setSaving(false); }
  }, []);

  const remove = useCallback(async (slug: string) => {
    setSaving(true); setError(null);
    try { await deleteProject(slug); return true; }
    catch (err: any) { setError(err.message); return false; }
    finally { setSaving(false); }
  }, []);

  const verify = useCallback(async (slug: string, payload: VerificationPayload) => {
    setSaving(true); setError(null);
    try { return await submitVerification(slug, payload); }
    catch (err: any) { setError(err.message); return null; }
    finally { setSaving(false); }
  }, []);

  const review = useCallback(async (slug: string, payload: ReviewPayload) => {
    setSaving(true); setError(null);
    try { return await reviewVerification(slug, payload); }
    catch (err: any) { setError(err.message); return null; }
    finally { setSaving(false); }
  }, []);

  return { create, update, remove, verify, review, saving, error };
}

// ─── useSocial: likes/follows for a project ───

export function useProjectSocial(slug: string | undefined, userAddress?: string) {
  const [likes, setLikes] = useState(0);
  const [follows, setFollows] = useState(0);
  const [userLiked, setUserLiked] = useState(false);
  const [userFollowed, setUserFollowed] = useState(false);
  const [loading, setLoading] = useState(false);
  const mountedRef = useRef(true);

  useEffect(() => { mountedRef.current = true; return () => { mountedRef.current = false; }; }, []);

  const load = useCallback(async () => {
    if (!slug) return;
    setLoading(true);
    try {
      const online = await isApiOnline();
      if (!online) { setLoading(false); return; }
      const data = await fetchProjectSocial(slug);
      if (!mountedRef.current) return;
      setLikes(data.stats.likes);
      setFollows(data.stats.follows);
      if (userAddress) {
        setUserLiked(data.likes.some((l: SocialInteraction) => l.userAddress === userAddress));
        setUserFollowed(data.follows.some((f: SocialInteraction) => f.userAddress === userAddress));
      }
    } catch { /* silent */ }
    finally { if (mountedRef.current) setLoading(false); }
  }, [slug, userAddress]);

  useEffect(() => { load(); }, [load]);

  const like = useCallback(async () => {
    if (!slug || !userAddress) return;
    try {
      const res = await toggleLike(slug, userAddress);
      setUserLiked(res.action === 'added');
      setLikes(prev => res.action === 'added' ? prev + 1 : Math.max(0, prev - 1));
    } catch { /* silent */ }
  }, [slug, userAddress]);

  const follow = useCallback(async () => {
    if (!slug || !userAddress) return;
    try {
      const res = await toggleFollow(slug, userAddress);
      setUserFollowed(res.action === 'added');
      setFollows(prev => res.action === 'added' ? prev + 1 : Math.max(0, prev - 1));
    } catch { /* silent */ }
  }, [slug, userAddress]);

  return { likes, follows, userLiked, userFollowed, like, follow, loading, refetch: load };
}

// ─── useUserInteractions: all interactions for a user ───

export function useUserInteractions(address: string | undefined) {
  const [interactions, setInteractions] = useState<SocialInteraction[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!address) { setInteractions([]); return; }
    setLoading(true);
    isApiOnline().then(online => {
      if (!online) { setLoading(false); return; }
      fetchUserInteractions(address)
        .then(setInteractions)
        .catch(() => setInteractions([]))
        .finally(() => setLoading(false));
    });
  }, [address]);

  return { interactions, loading };
}

// ─── useProjectLookup: asset-id lookup using API data (with admin logos) ───

export function useProjectLookup() {
  const { projects, loading } = useProjects();

  const byAssetId = useMemo(() => {
    const map = new Map<string, KnownProject>();
    for (const p of projects) {
      for (const aid of p.assetIds) {
        map.set(aid, p);
      }
    }
    return map;
  }, [projects]);

  const getByAssetId = useCallback(
    (assetId: string): KnownProject | undefined => byAssetId.get(assetId),
    [byAssetId],
  );

  return { getByAssetId, projects, loading };
}
