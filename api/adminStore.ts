import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import 'dotenv/config';

const DATA_DIR = path.join(process.cwd(), 'data');
const ADMIN_FILE = path.join(DATA_DIR, 'admins.json');

export interface AdminUser {
  id: number;
  email: string;
  password: string; // hashed
  full_name: string;
  role: 'owner' | 'admin' | 'editor';
  is_active: boolean;
  created_at: string;
  updated_at: string;
  last_login?: string;
}

interface AdminData {
  users: AdminUser[];
  nextId: number;
}

const SALT = process.env.ADMIN_SALT || 'lunes-explorer-2024';
const TOKEN_SECRET = process.env.ADMIN_TOKEN_SECRET || crypto.randomBytes(32).toString('hex');

const BCRYPT_ROUNDS = 12;

function hashPassword(password: string): string {
  return bcrypt.hashSync(password, BCRYPT_ROUNDS);
}

// Legacy hashes for migration (HMAC-SHA256 and plain SHA-256)
function hashPasswordHmac(password: string): string {
  return crypto.createHmac('sha256', SALT).update(password).digest('hex');
}
function hashPasswordLegacy(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

export function verifyPassword(password: string, hash: string): boolean {
  // Try bcrypt first (new format)
  if (hash.startsWith('$2a$') || hash.startsWith('$2b$')) {
    return bcrypt.compareSync(password, hash);
  }
  // Fall back to legacy HMAC-SHA256 and plain SHA-256 for migration
  return hashPasswordHmac(password) === hash || hashPasswordLegacy(password) === hash;
}

// Auto-upgrade legacy hash to bcrypt on successful login
function upgradeHashIfNeeded(user: AdminUser, password: string): void {
  if (!user.password.startsWith('$2a$') && !user.password.startsWith('$2b$')) {
    user.password = hashPassword(password);
    user.updated_at = new Date().toISOString();
    saveData(adminData);
    console.log(`[Security] Upgraded password hash to bcrypt for user ${user.email}`);
  }
}

function loadData(): AdminData {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(ADMIN_FILE)) {
    const defaultData: AdminData = {
      users: [
        {
          id: 1,
          email: 'admin@lunes.io',
          password: hashPassword(process.env.ADMIN_DEFAULT_PASSWORD || 'lunes2024'),
          full_name: 'Admin',
          role: 'owner',
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
      ],
      nextId: 2,
    };
    fs.writeFileSync(ADMIN_FILE, JSON.stringify(defaultData, null, 2));
    return defaultData;
  }
  return JSON.parse(fs.readFileSync(ADMIN_FILE, 'utf-8'));
}

function saveData(data: AdminData): void {
  fs.writeFileSync(ADMIN_FILE, JSON.stringify(data, null, 2));
}

let adminData = loadData();

// ─── Auth ───

export function authenticateUser(email: string, password: string): AdminUser | null {
  const user = adminData.users.find(u => u.email === email && u.is_active);
  if (!user) return null;
  if (!verifyPassword(password, user.password)) return null;
  // Auto-upgrade legacy hash to bcrypt
  upgradeHashIfNeeded(user, password);
  user.last_login = new Date().toISOString();
  saveData(adminData);
  return user;
}

export function generateToken(user: AdminUser): string {
  const payload = `${user.id}:${user.email}:${Date.now()}:${TOKEN_SECRET}`;
  return 'lunes-admin-' + crypto.createHmac('sha256', TOKEN_SECRET).update(payload).digest('hex').slice(0, 48);
}

// Token store with expiration (in-memory)
const TOKEN_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const tokenStore = new Map<string, { userId: number; expiresAt: number }>(); // token -> { userId, expiresAt }

// Cleanup expired tokens every 30 minutes
const tokenCleanup = setInterval(() => {
  const now = Date.now();
  for (const [token, entry] of tokenStore) {
    if (now > entry.expiresAt) tokenStore.delete(token);
  }
}, 30 * 60_000);
if (tokenCleanup.unref) tokenCleanup.unref();

export function storeToken(token: string, userId: number): void {
  tokenStore.set(token, { userId, expiresAt: Date.now() + TOKEN_TTL_MS });
}

export function getUserByToken(token: string): AdminUser | null {
  const entry = tokenStore.get(token);
  if (!entry) return null;
  // Check expiration
  if (Date.now() > entry.expiresAt) {
    tokenStore.delete(token);
    return null;
  }
  return adminData.users.find(u => u.id === entry.userId && u.is_active) || null;
}

// ─── Password Management ───

export function changePassword(userId: number, currentPassword: string, newPassword: string): { success: boolean; error?: string } {
  const user = adminData.users.find(u => u.id === userId);
  if (!user) return { success: false, error: 'User not found' };
  if (!verifyPassword(currentPassword, user.password)) {
    return { success: false, error: 'Current password is incorrect' };
  }
  if (newPassword.length < 6) {
    return { success: false, error: 'New password must be at least 6 characters' };
  }
  user.password = hashPassword(newPassword);
  user.updated_at = new Date().toISOString();
  saveData(adminData);
  return { success: true };
}

// ─── Team Management ───

export function getTeamMembers(): Omit<AdminUser, 'password'>[] {
  return adminData.users.map(({ password, ...rest }) => rest);
}

export function addTeamMember(data: {
  email: string;
  full_name: string;
  password: string;
  role: 'admin' | 'editor';
}): { success: boolean; user?: Omit<AdminUser, 'password'>; error?: string } {
  if (adminData.users.find(u => u.email === data.email)) {
    return { success: false, error: 'Email already exists' };
  }
  if (!data.email || !data.full_name || !data.password) {
    return { success: false, error: 'Email, name and password are required' };
  }
  if (data.password.length < 6) {
    return { success: false, error: 'Password must be at least 6 characters' };
  }

  const now = new Date().toISOString();
  const newUser: AdminUser = {
    id: adminData.nextId++,
    email: data.email,
    password: hashPassword(data.password),
    full_name: data.full_name,
    role: data.role || 'editor',
    is_active: true,
    created_at: now,
    updated_at: now,
  };

  adminData.users.push(newUser);
  saveData(adminData);

  const { password, ...userWithoutPassword } = newUser;
  return { success: true, user: userWithoutPassword };
}

export function updateTeamMember(id: number, updates: {
  full_name?: string;
  email?: string;
  role?: 'admin' | 'editor';
  is_active?: boolean;
}): { success: boolean; user?: Omit<AdminUser, 'password'>; error?: string } {
  const user = adminData.users.find(u => u.id === id);
  if (!user) return { success: false, error: 'User not found' };
  if (user.role === 'owner' && updates.role) {
    return { success: false, error: 'Cannot change the role of the owner' };
  }

  if (updates.email && updates.email !== user.email) {
    if (adminData.users.find(u => u.email === updates.email && u.id !== id)) {
      return { success: false, error: 'Email already in use' };
    }
    user.email = updates.email;
  }
  if (updates.full_name) user.full_name = updates.full_name;
  if (updates.role && user.role !== 'owner') user.role = updates.role;
  if (typeof updates.is_active === 'boolean' && user.role !== 'owner') {
    user.is_active = updates.is_active;
  }
  user.updated_at = new Date().toISOString();
  saveData(adminData);

  const { password, ...userWithoutPassword } = user;
  return { success: true, user: userWithoutPassword };
}

export function resetTeamMemberPassword(id: number, newPassword: string): { success: boolean; error?: string } {
  const user = adminData.users.find(u => u.id === id);
  if (!user) return { success: false, error: 'User not found' };
  if (newPassword.length < 6) {
    return { success: false, error: 'Password must be at least 6 characters' };
  }
  user.password = hashPassword(newPassword);
  user.updated_at = new Date().toISOString();
  saveData(adminData);
  return { success: true };
}

export function deleteTeamMember(id: number): { success: boolean; error?: string } {
  const user = adminData.users.find(u => u.id === id);
  if (!user) return { success: false, error: 'User not found' };
  if (user.role === 'owner') return { success: false, error: 'Cannot delete the owner account' };
  adminData.users = adminData.users.filter(u => u.id !== id);
  saveData(adminData);
  return { success: true };
}
