/**
 * ПРОСТАЯ СИСТЕМА АУТЕНТИФИКАЦИИ
 * Без внешних библиотек - только встроенные Node.js модули
 */

import { nanoid } from 'nanoid';

// ============================================
// ТИПЫ
// ============================================

export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
  SUPER_ADMIN = 'super_admin'
}

export interface AuthToken {
  userId: string;
  email: string;
  role: UserRole;
  sessionId: string;
  createdAt: number;
  expiresAt: number;
}

// ============================================
// КОНФИГУРАЦИЯ
// ============================================

const SECRET = process.env.JWT_SECRET || 'change-this-secret-key-in-production';
const TOKEN_EXPIRATION = 24 * 60 * 60 * 1000; // 24 часа

// ============================================
// ХЕШИРОВАНИЕ ПАРОЛЕЙ
// ============================================

/**
 * Хеширование пароля (только для Node.js API routes)
 */
export async function hashPassword(password: string): Promise<string> {
  const bcrypt = await import('bcryptjs');
  return bcrypt.hash(password, 12);
}

/**
 * Проверка пароля
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const bcrypt = await import('bcryptjs');
  return bcrypt.compare(password, hash);
}

// ============================================
// ТОКЕНЫ
// ============================================

/**
 * Создание токена аутентификации
 */
export async function createAuthToken(userId: string, email: string, role: UserRole): Promise<string> {
  const crypto = await import('crypto');
  
  const token: AuthToken = {
    userId,
    email,
    role,
    sessionId: nanoid(32),
    createdAt: Date.now(),
    expiresAt: Date.now() + TOKEN_EXPIRATION
  };
  
  const payload = Buffer.from(JSON.stringify(token)).toString('base64');
  const signature = crypto.createHmac('sha256', SECRET).update(payload).digest('base64');
  
  return `${payload}.${signature}`;
}

/**
 * Верификация токена
 */
export async function verifyAuthToken(token: string): Promise<AuthToken | null> {
  try {
    const crypto = await import('crypto');
    const [payload, signature] = token.split('.');
    
    if (!payload || !signature) return null;
    
    // Проверяем подпись
    const expectedSignature = crypto.createHmac('sha256', SECRET).update(payload).digest('base64');
    if (signature !== expectedSignature) return null;
    
    // Декодируем payload
    const authToken: AuthToken = JSON.parse(Buffer.from(payload, 'base64').toString());
    
    // Проверяем срок действия
    if (authToken.expiresAt < Date.now()) return null;
    
    return authToken;
  } catch {
    return null;
  }
}

// ============================================
// RATE LIMITING (простая in-memory версия)
// ============================================

const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(key: string, maxRequests: number, windowMs: number): boolean {
  const now = Date.now();
  const entry = rateLimitStore.get(key);
  
  if (!entry || entry.resetAt < now) {
    rateLimitStore.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  
  if (entry.count >= maxRequests) {
    return false;
  }
  
  entry.count++;
  return true;
}

// ============================================
// ПРОВЕРКА ПРАВ
// ============================================

export function isAdmin(role: UserRole): boolean {
  return role === UserRole.ADMIN || role === UserRole.SUPER_ADMIN;
}

export function isSuperAdmin(role: UserRole): boolean {
  return role === UserRole.SUPER_ADMIN;
}

// ============================================
// САНИТИЗАЦИЯ
// ============================================

export function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, '')
    .trim();
}

// ============================================
// ИЗВЛЕЧЕНИЕ IP
// ============================================

export function getClientIp(headers: Headers): string {
  return (
    headers.get('x-forwarded-for')?.split(',')[0] ||
    headers.get('x-real-ip') ||
    headers.get('cf-connecting-ip') ||
    'unknown'
  );
}
