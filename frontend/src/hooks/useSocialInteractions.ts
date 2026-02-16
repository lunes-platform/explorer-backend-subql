import { useState, useCallback, useEffect } from 'react';
import { toggleLike as apiToggleLike, toggleFollow as apiToggleFollow, fetchProjectSocial, fetchComments as apiFetchComments, createComment as apiCreateComment, addReaction as apiAddReaction } from '../services/projectsApi';

export interface ProjectSocialData {
  likes: number;
  loves: number;
  followers: number;
  donations: number;
  donatedAmount: number;
  comments: ProjectComment[];
}

export interface ProjectComment {
  id: string;
  author: string;
  text: string;
  timestamp: number;
  metadata?: {
    reactions?: { userAddress: string; emoji: string; createdAt: string }[];
    gif?: string | null;
  };
}

interface UserInteractions {
  liked: boolean;
  loved: boolean;
  following: boolean;
}

const STORAGE_KEY = 'lunes_social';

function loadAllData(): Record<string, ProjectSocialData> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveAllData(data: Record<string, ProjectSocialData>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function loadUserInteractions(projectId: string, userAddr: string): UserInteractions {
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY}_user_${userAddr}_${projectId}`);
    return raw ? JSON.parse(raw) : { liked: false, loved: false, following: false };
  } catch {
    return { liked: false, loved: false, following: false };
  }
}

function saveUserInteractions(projectId: string, userAddr: string, interactions: UserInteractions) {
  localStorage.setItem(`${STORAGE_KEY}_user_${userAddr}_${projectId}`, JSON.stringify(interactions));
}

function getDefaultSocial(): ProjectSocialData {
  return { likes: 0, loves: 0, followers: 0, donations: 0, donatedAmount: 0, comments: [] };
}

function getOrCreate(all: Record<string, ProjectSocialData>, projectId: string): ProjectSocialData {
  if (all[projectId]) return all[projectId];
  const data = getDefaultSocial();
  all[projectId] = data;
  saveAllData(all);
  return data;
}

export function useSocialInteractions(projectId: string, userAddress?: string | null) {
  const [socialData, setSocialData] = useState<ProjectSocialData>(() => {
    const all = loadAllData();
    return getOrCreate(all, projectId);
  });

  const [userInteractions, setUserInteractions] = useState<UserInteractions>(() => {
    if (!userAddress) return { liked: false, loved: false, following: false };
    return loadUserInteractions(projectId, userAddress);
  });

  useEffect(() => {
    if (userAddress) {
      setUserInteractions(loadUserInteractions(projectId, userAddress));
    }
  }, [projectId, userAddress]);

  // Sync with backend API (best-effort)
  useEffect(() => {
    fetchProjectSocial(projectId)
      .then(data => {
        setSocialData(prev => ({
          ...prev,
          likes: Math.max(prev.likes, data.stats.likes),
          followers: Math.max(prev.followers, data.stats.follows),
        }));
        if (userAddress) {
          const apiLiked = data.likes.some(l => l.userAddress === userAddress);
          const apiFollowed = data.follows.some(f => f.userAddress === userAddress);
          if (apiLiked || apiFollowed) {
            setUserInteractions(prev => ({
              ...prev,
              liked: prev.liked || apiLiked,
              following: prev.following || apiFollowed,
            }));
          }
        }
      })
      .catch(() => { /* API unavailable, use localStorage */ });
  }, [projectId, userAddress]);

  // Sync comments from backend
  useEffect(() => {
    apiFetchComments(projectId)
      .then(apiComments => {
        const mapped: ProjectComment[] = apiComments.map(c => ({
          id: c.id,
          author: c.userAddress,
          text: c.content,
          timestamp: new Date(c.createdAt).getTime(),
          metadata: c.metadata,
        }));
        setSocialData(prev => ({ ...prev, comments: mapped }));
      })
      .catch(() => { /* API unavailable, use localStorage */ });
  }, [projectId]);

  const updateSocial = useCallback((updater: (prev: ProjectSocialData) => ProjectSocialData) => {
    setSocialData(prev => {
      const next = updater(prev);
      const all = loadAllData();
      all[projectId] = next;
      saveAllData(all);
      return next;
    });
  }, [projectId]);

  const updateUser = useCallback((updater: (prev: UserInteractions) => UserInteractions) => {
    if (!userAddress) return;
    setUserInteractions(prev => {
      const next = updater(prev);
      saveUserInteractions(projectId, userAddress, next);
      return next;
    });
  }, [projectId, userAddress]);

  const toggleLike = useCallback(() => {
    if (!userAddress) return;
    const wasLiked = userInteractions.liked;
    updateUser(prev => ({ ...prev, liked: !wasLiked }));
    updateSocial(prev => ({ ...prev, likes: prev.likes + (wasLiked ? -1 : 1) }));
    // Sync to backend
    apiToggleLike(projectId, userAddress).catch(() => {});
  }, [projectId, userAddress, userInteractions.liked, updateUser, updateSocial]);

  const toggleLove = useCallback(() => {
    if (!userAddress) return;
    const wasLoved = userInteractions.loved;
    updateUser(prev => ({ ...prev, loved: !wasLoved }));
    updateSocial(prev => ({ ...prev, loves: prev.loves + (wasLoved ? -1 : 1) }));
  }, [userAddress, userInteractions.loved, updateUser, updateSocial]);

  const toggleFollow = useCallback(() => {
    if (!userAddress) return;
    const wasFollowing = userInteractions.following;
    updateUser(prev => ({ ...prev, following: !wasFollowing }));
    updateSocial(prev => ({ ...prev, followers: prev.followers + (wasFollowing ? -1 : 1) }));
    // Sync to backend
    apiToggleFollow(projectId, userAddress).catch(() => {});
  }, [projectId, userAddress, userInteractions.following, updateUser, updateSocial]);

  const recordDonation = useCallback((amount: number) => {
    updateSocial(prev => ({
      ...prev,
      donations: prev.donations + 1,
      donatedAmount: prev.donatedAmount + amount,
    }));
  }, [updateSocial]);

  const addComment = useCallback(async (text: string, metadata?: { gif?: string | null }) => {
    if (!userAddress || !text.trim()) return;
    const trimmedText = text.trim();
    if (trimmedText.length > 350) return; // Max 350 chars
    
    // Optimistic update
    const tempId = Date.now().toString(36);
    const comment: ProjectComment = {
      id: tempId,
      author: userAddress,
      text: trimmedText,
      timestamp: Date.now(),
      metadata,
    };
    updateSocial(prev => ({
      ...prev,
      comments: [comment, ...prev.comments].slice(0, 50),
    }));
    
    // Sync to backend
    try {
      const apiComment = await apiCreateComment(projectId, userAddress, trimmedText, metadata);
      // Replace temp ID with real ID
      setSocialData(prev => ({
        ...prev,
        comments: prev.comments.map(c => c.id === tempId ? {
          id: apiComment.id,
          author: apiComment.userAddress,
          text: apiComment.content,
          timestamp: new Date(apiComment.createdAt).getTime(),
          metadata: apiComment.metadata,
        } : c),
      }));
    } catch {
      // Keep local comment if API fails
    }
  }, [userAddress, projectId, updateSocial]);

  const addCommentReaction = useCallback(async (commentId: string, emoji: string) => {
    if (!userAddress) return;
    
    // Optimistic update
    setSocialData(prev => ({
      ...prev,
      comments: prev.comments.map(c => {
        if (c.id !== commentId) return c;
        const reactions = c.metadata?.reactions || [];
        const existing = reactions.find(r => r.userAddress === userAddress && r.emoji === emoji);
        const newReactions = existing
          ? reactions.filter(r => !(r.userAddress === userAddress && r.emoji === emoji))
          : [...reactions, { userAddress, emoji, createdAt: new Date().toISOString() }];
        return {
          ...c,
          metadata: { ...c.metadata, reactions: newReactions },
        };
      }),
    }));
    
    // Sync to backend
    try {
      await apiAddReaction(commentId, userAddress, emoji);
    } catch {
      // Revert on error would require more complex state management
    }
  }, [userAddress]);

  return {
    socialData,
    userInteractions,
    toggleLike,
    toggleLove,
    toggleFollow,
    recordDonation,
    addComment,
    addCommentReaction,
    isConnected: !!userAddress,
  };
}

// Get social data for list view without hooks
export function getProjectSocialData(projectId: string): ProjectSocialData {
  const all = loadAllData();
  return getOrCreate(all, projectId);
}
