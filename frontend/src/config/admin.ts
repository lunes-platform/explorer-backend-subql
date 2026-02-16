// Admin wallet addresses authorized to access the admin panel.
// Add team wallet addresses here. These are the only addresses that can access /admin routes.
export const ADMIN_ADDRESSES: string[] = [
  '5C8Kq8Wd1ZqQJSdZiGNAcbYGmyJy5cKjFg2BgPFEH2EFeXZU', // Lunes Team Main
];

// Storage keys for admin-managed data (persisted in localStorage until backend is available)
export const ADMIN_STORAGE_KEYS = {
  ANNOUNCEMENTS: 'lunes-admin-announcements',
  PROJECT_REVIEWS: 'lunes-admin-project-reviews',
  TOKEN_INFO: 'lunes-admin-token-info',
  VERIFIED_TOKENS: 'lunes-admin-verified-tokens',
} as const;
