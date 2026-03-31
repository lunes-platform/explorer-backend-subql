import { useState, useEffect, useCallback } from 'react';

export type VerificationStatus = 'pending' | 'approved' | 'rejected';

export interface ProjectVerificationRequest {
  id: string;
  projectName: string;
  description: string;
  website?: string;
  twitter?: string;
  telegram?: string;
  discord?: string;
  github?: string;
  contractAddress?: string;
  tokenSymbol?: string;
  contactEmail: string;
  logoUrl?: string;
  status: VerificationStatus;
  submittedAt: number;
  reviewedAt?: number;
  reviewNotes?: string;
}

const STORAGE_KEY = 'lunes-explorer-project-verifications';

export function useProjectVerification() {
  const [requests, setRequests] = useState<ProjectVerificationRequest[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setRequests(JSON.parse(stored));
      }
    } catch {
      // ignore
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(requests));
    }
  }, [requests, isLoaded]);

  const submitRequest = useCallback((data: Omit<ProjectVerificationRequest, 'id' | 'status' | 'submittedAt'>) => {
    const id = `proj-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const newRequest: ProjectVerificationRequest = {
      ...data,
      id,
      status: 'pending',
      submittedAt: Date.now(),
    };
    setRequests(prev => [newRequest, ...prev]);
    return id;
  }, []);

  const getUserRequests = useCallback((email: string) => {
    return requests.filter(r => r.contactEmail.toLowerCase() === email.toLowerCase());
  }, [requests]);

  const getPendingRequests = useCallback(() => {
    return requests.filter(r => r.status === 'pending');
  }, [requests]);

  return {
    requests,
    isLoaded,
    submitRequest,
    getUserRequests,
    getPendingRequests,
  };
}
