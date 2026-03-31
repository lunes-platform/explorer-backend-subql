// Centralized environment configuration
// All env vars should be accessed through this module

export const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:4000') + '/api';
export const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000';
export const GRAPHQL_URL = import.meta.env.VITE_GRAPHQL_URL || 'http://localhost:3000';
export const WS_ENDPOINTS = (import.meta.env.VITE_WS_ENDPOINTS || 'wss://ws-archive.lunes.io,wss://ws-lunes-main-02.lunes.io,wss://ws-lunes-main-01.lunes.io').split(',').map((s: string) => s.trim());
