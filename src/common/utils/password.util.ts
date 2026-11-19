import * as crypto from 'crypto';

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${derivedKey}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  const [salt, key] = storedHash.split(':');
  if (!salt || !key) {
    return false;
  }
  const derivedKey = crypto.scryptSync(password, salt, 64).toString('hex');
  const keyBuffer = Buffer.from(key, 'hex');
  const derivedBuffer = Buffer.from(derivedKey, 'hex');
  if (keyBuffer.length !== derivedBuffer.length) {
    return false;
  }
  return crypto.timingSafeEqual(keyBuffer, derivedBuffer);
}
