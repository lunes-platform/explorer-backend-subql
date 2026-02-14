import { useState, useCallback, useEffect } from 'react';

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
  }, [userAddress, userInteractions.liked, updateUser, updateSocial]);

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
  }, [userAddress, userInteractions.following, updateUser, updateSocial]);

  const recordDonation = useCallback((amount: number) => {
    updateSocial(prev => ({
      ...prev,
      donations: prev.donations + 1,
      donatedAmount: prev.donatedAmount + amount,
    }));
  }, [updateSocial]);

  const addComment = useCallback((text: string) => {
    if (!userAddress || !text.trim()) return;
    const comment: ProjectComment = {
      id: Date.now().toString(36),
      author: userAddress,
      text: text.trim(),
      timestamp: Date.now(),
    };
    updateSocial(prev => ({
      ...prev,
      comments: [comment, ...prev.comments].slice(0, 50),
    }));
  }, [userAddress, updateSocial]);

  return {
    socialData,
    userInteractions,
    toggleLike,
    toggleLove,
    toggleFollow,
    recordDonation,
    addComment,
    isConnected: !!userAddress,
  };
}

// Get social data for list view without hooks
export function getProjectSocialData(projectId: string): ProjectSocialData {
  const all = loadAllData();
  return getOrCreate(all, projectId);
}
