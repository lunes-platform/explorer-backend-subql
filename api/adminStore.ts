import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import 'dotenv/config';
import prisma from './prismaClient.ts';

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

const SALT = process.env.ADMIN_SALT || 'lunes-explorer-2024';
const TOKEN_SECRET = process.env.ADMIN_TOKEN_SECRET || crypto.randomBytes(32).toString('hex');

const BCRYPT_ROUNDS = 12;

function hashPassword(password: string): string {
  return bcrypt.hashSync(password, BCRYPT_ROUNDS);
}

function hashPasswordHmac(password: string): string {
  return crypto.createHmac('sha256', SALT).update(password).digest('hex');
}
function hashPasswordLegacy(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

export function verifyPassword(password: string, hash: string): boolean {
  return bcrypt.compareSync(password, hash);
}

function toAdminUser(user: {
  id: number;
  email: string;
  password: string;
  fullName: string;
  role: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastLogin: Date | null;
}): AdminUser {
  return {
    id: user.id,
    email: user.email,
    password: user.password,
    full_name: user.fullName,
    role: user.role as AdminUser['role'],
    is_active: user.isActive,
    created_at: user.createdAt.toISOString(),
    updated_at: user.updatedAt.toISOString(),
    last_login: user.lastLogin?.toISOString(),
  };
}

let initialized = false;

async function ensureDefaultAdmin(): Promise<void> {
  if (initialized) return;
  const count = await prisma.adminUser.count();
  if (count === 0) {
    await prisma.adminUser.create({
      data: {
        email: 'admin@lunes.io',
        password: hashPassword(process.env.ADMIN_DEFAULT_PASSWORD || 'lunes2024'),
        fullName: 'Admin',
        role: 'owner',
        isActive: true,
      },
    });
  }
  initialized = true;
}

function comparePassword(password: string, hash: string): boolean {
  if (hash.startsWith('$2a$') || hash.startsWith('$2b$')) {
    return verifyPassword(password, hash);
  }
  return hash === hashPasswordHmac(password) || hash === hashPasswordLegacy(password);
}

// ─── Auth ───

export async function authenticateUser(email: string, password: string): Promise<AdminUser | null> {
  await ensureDefaultAdmin();
  const user = await prisma.adminUser.findUnique({ where: { email } });
  if (!user || !user.isActive) return null;
  if (!comparePassword(password, user.password)) return null;

  // Upgrade legacy hash to bcrypt automatically.
  if (!user.password.startsWith('$2a$') && !user.password.startsWith('$2b$')) {
    await prisma.adminUser.update({
      where: { id: user.id },
      data: { password: hashPassword(password) },
    });
  }

  const updated = await prisma.adminUser.update({
    where: { id: user.id },
    data: { lastLogin: new Date() },
  });

  return toAdminUser(updated);
}

export function generateToken(user: AdminUser): string {
  const payload = `${user.id}:${user.email}:${Date.now()}:${TOKEN_SECRET}`;
  return 'lunes-admin-' + crypto.createHmac('sha256', TOKEN_SECRET).update(payload).digest('hex').slice(0, 48);
}

const TOKEN_TTL_MS = 24 * 60 * 60 * 1000;

export async function storeToken(token: string, userId: number): Promise<void> {
  await prisma.adminSession.upsert({
    where: { token },
    update: { userId, expiresAt: new Date(Date.now() + TOKEN_TTL_MS) },
    create: {
      token,
      userId,
      expiresAt: new Date(Date.now() + TOKEN_TTL_MS),
    },
  });
}

export async function getUserByToken(token: string): Promise<AdminUser | null> {
  await ensureDefaultAdmin();
  const session = await prisma.adminSession.findUnique({
    where: { token },
    include: { user: true },
  });

  if (!session) return null;
  if (session.expiresAt.getTime() < Date.now()) {
    await prisma.adminSession.delete({ where: { token } }).catch(() => undefined);
    return null;
  }

  if (!session.user.isActive) return null;
  return toAdminUser(session.user);
}

// ─── Password Management ───

export async function changePassword(userId: number, currentPassword: string, newPassword: string): Promise<{ success: boolean; error?: string }> {
  const user = await prisma.adminUser.findUnique({ where: { id: userId } });
  if (!user) return { success: false, error: 'User not found' };
  if (!comparePassword(currentPassword, user.password)) {
    return { success: false, error: 'Current password is incorrect' };
  }
  if (newPassword.length < 6) {
    return { success: false, error: 'New password must be at least 6 characters' };
  }

  await prisma.adminUser.update({
    where: { id: userId },
    data: { password: hashPassword(newPassword) },
  });

  // Force re-login after password change.
  await prisma.adminSession.deleteMany({ where: { userId } });

  return { success: true };
}

// ─── Team Management ───

type PublicAdminUser = Omit<AdminUser, 'password'>;

export async function getTeamMembers(): Promise<PublicAdminUser[]> {
  await ensureDefaultAdmin();
  const users = await prisma.adminUser.findMany({ orderBy: { id: 'asc' } });
  return users.map((user: any) => {
    const mapped = toAdminUser(user);
    const { password: _password, ...rest } = mapped;
    return rest;
  });
}

export async function addTeamMember(data: {
  email: string;
  full_name: string;
  password: string;
  role: 'admin' | 'editor';
}): Promise<{ success: boolean; user?: PublicAdminUser; error?: string }> {
  if (!data.email || !data.full_name || !data.password) {
    return { success: false, error: 'Email, name and password are required' };
  }
  if (data.password.length < 6) {
    return { success: false, error: 'Password must be at least 6 characters' };
  }

  try {
    const user = await prisma.adminUser.create({
      data: {
        email: data.email,
        password: hashPassword(data.password),
        fullName: data.full_name,
        role: data.role || 'editor',
        isActive: true,
      },
    });

    const mapped = toAdminUser(user);
    const { password: _password, ...userWithoutPassword } = mapped;
    return { success: true, user: userWithoutPassword };
  } catch {
    return { success: false, error: 'Email already exists' };
  }
}

export async function updateTeamMember(id: number, updates: {
  full_name?: string;
  email?: string;
  role?: 'admin' | 'editor';
  is_active?: boolean;
}): Promise<{ success: boolean; user?: PublicAdminUser; error?: string }> {
  const user = await prisma.adminUser.findUnique({ where: { id } });
  if (!user) return { success: false, error: 'User not found' };
  if (user.role === 'owner' && updates.role) {
    return { success: false, error: 'Cannot change the role of the owner' };
  }

  try {
    const updated = await prisma.adminUser.update({
      where: { id },
      data: {
        email: updates.email,
        fullName: updates.full_name,
        role: updates.role && user.role !== 'owner' ? updates.role : undefined,
        isActive: typeof updates.is_active === 'boolean' && user.role !== 'owner' ? updates.is_active : undefined,
      },
    });
    const mapped = toAdminUser(updated);
    const { password: _password, ...userWithoutPassword } = mapped;
    return { success: true, user: userWithoutPassword };
  } catch {
    return { success: false, error: 'Email already in use' };
  }
}

export async function resetTeamMemberPassword(id: number, newPassword: string): Promise<{ success: boolean; error?: string }> {
  const user = await prisma.adminUser.findUnique({ where: { id } });
  if (!user) return { success: false, error: 'User not found' };
  if (newPassword.length < 6) {
    return { success: false, error: 'Password must be at least 6 characters' };
  }

  await prisma.adminUser.update({
    where: { id },
    data: { password: hashPassword(newPassword) },
  });
  await prisma.adminSession.deleteMany({ where: { userId: id } });

  return { success: true };
}

export async function deleteTeamMember(id: number): Promise<{ success: boolean; error?: string }> {
  const user = await prisma.adminUser.findUnique({ where: { id } });
  if (!user) return { success: false, error: 'User not found' };
  if (user.role === 'owner') return { success: false, error: 'Cannot delete the owner account' };

  await prisma.adminSession.deleteMany({ where: { userId: id } });
  await prisma.adminUser.delete({ where: { id } });

  return { success: true };
}
