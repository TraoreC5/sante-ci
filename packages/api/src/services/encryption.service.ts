/**
 * Service de chiffrement des documents médicaux
 * Utilise AES-256-GCM pour le chiffrement au repos
 * Architecture envelope encryption: les clés de chiffrement sont isolées
 */

import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const SALT_LENGTH = 32;
const TAG_LENGTH = 16;
const KEY_LENGTH = 32;

/**
 * Dérive une clé de chiffrement à partir d'un secret maître.
 */
function deriveKey(masterSecret: string, salt: Buffer): Buffer {
  return scryptSync(masterSecret, salt, KEY_LENGTH);
}

/**
 * Chiffre des données avec AES-256-GCM.
 * Retourne: salt (32 bytes) + iv (16 bytes) + authTag (16 bytes) + ciphertext
 */
export function encrypt(data: Buffer, masterSecret: string): Buffer {
  const salt = randomBytes(SALT_LENGTH);
  const key = deriveKey(masterSecret, salt);
  const iv = randomBytes(IV_LENGTH);
  
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(data), cipher.final()]);
  const authTag = cipher.getAuthTag();
  
  // Format: salt + iv + authTag + ciphertext
  return Buffer.concat([salt, iv, authTag, encrypted]);
}

/**
 * Déchiffre des données chiffrées avec AES-256-GCM.
 */
export function decrypt(encryptedData: Buffer, masterSecret: string): Buffer {
  const salt = encryptedData.subarray(0, SALT_LENGTH);
  const iv = encryptedData.subarray(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
  const authTag = encryptedData.subarray(SALT_LENGTH + IV_LENGTH, SALT_LENGTH + IV_LENGTH + TAG_LENGTH);
  const ciphertext = encryptedData.subarray(SALT_LENGTH + IV_LENGTH + TAG_LENGTH);
  
  const key = deriveKey(masterSecret, salt);
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]);
}

/**
 * Génère une clé d'enveloppe unique pour un document.
 * Cette clé sera elle-même chiffrée avec la clé maître.
 */
export function generateDocumentKey(): string {
  return randomBytes(KEY_LENGTH).toString('hex');
}
