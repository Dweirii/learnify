import { createCipheriv, createDecipheriv, randomBytes, scrypt, createHash } from 'crypto';
import { promisify } from 'util';
import { logger } from '@/lib/logger';

const scryptAsync = promisify(scrypt);

export interface EncryptedStreamKey {
  encrypted: string;
  iv: string;
  salt: string;
}

export interface StreamKeyData {
  streamId: string;
  userId: string;
  permissions: string[];
  expiresAt: number;
  metadata?: Record<string, unknown>;
}

export class StreamKeyEncryptionService {
  private static instance: StreamKeyEncryptionService;
  private readonly algorithm = 'aes-256-gcm';
  private readonly keyLength = 32; // 256 bits
  private readonly ivLength = 16; // 128 bits
  private readonly saltLength = 16; // 128 bits
  private readonly tagLength = 16; // 128 bits

  private constructor() {
    this.validateEnvironment();
  }

  static getInstance(): StreamKeyEncryptionService {
    if (!StreamKeyEncryptionService.instance) {
      StreamKeyEncryptionService.instance = new StreamKeyEncryptionService();
    }
    return StreamKeyEncryptionService.instance;
  }

  private validateEnvironment(): void {
    const encryptionKey = process.env.STREAM_KEY_ENCRYPTION_KEY;
    if (!encryptionKey) {
      logger.warn('[StreamKeyEncryption] No encryption key found in environment variables');
    } else if (encryptionKey.length < 32) {
      logger.warn('[StreamKeyEncryption] Encryption key should be at least 32 characters long');
    }
  }

  private async deriveKey(password: string, salt: Buffer): Promise<Buffer> {
    const key = await scryptAsync(password, salt, this.keyLength) as Buffer;
    return key;
  }

  async encryptStreamKey(data: StreamKeyData): Promise<EncryptedStreamKey> {
    try {
      const encryptionKey = process.env.STREAM_KEY_ENCRYPTION_KEY || 'default-key-change-in-production';
      const salt = randomBytes(this.saltLength);
      const iv = randomBytes(this.ivLength);
      
      const key = await this.deriveKey(encryptionKey, salt);
      const cipher = createCipheriv(this.algorithm, key, iv);
      
      // Add authentication tag
      cipher.setAAD(Buffer.from(data.streamId));
      
      const plaintext = JSON.stringify(data);
      let encrypted = cipher.update(plaintext, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      const tag = cipher.getAuthTag();
      
      const result: EncryptedStreamKey = {
        encrypted: encrypted + tag.toString('hex'),
        iv: iv.toString('hex'),
        salt: salt.toString('hex'),
      };
      
      logger.debug('[StreamKeyEncryption] Stream key encrypted', {
        streamId: data.streamId,
        userId: data.userId,
      });
      
      return result;
    } catch (error) {
      logger.error('[StreamKeyEncryption] Error encrypting stream key', error as Error);
      throw new Error('Failed to encrypt stream key');
    }
  }

  async decryptStreamKey(encryptedKey: EncryptedStreamKey, streamId: string): Promise<StreamKeyData> {
    try {
      const encryptionKey = process.env.STREAM_KEY_ENCRYPTION_KEY || 'default-key-change-in-production';
      const salt = Buffer.from(encryptedKey.salt, 'hex');
      const iv = Buffer.from(encryptedKey.iv, 'hex');
      
      const key = await this.deriveKey(encryptionKey, salt);
      const decipher = createDecipheriv(this.algorithm, key, iv);
      
      // Extract tag from encrypted data
      const encryptedData = encryptedKey.encrypted;
      const tag = Buffer.from(encryptedData.slice(-32), 'hex'); // Last 32 hex chars = 16 bytes
      const encrypted = encryptedData.slice(0, -32);
      
      decipher.setAuthTag(tag);
      decipher.setAAD(Buffer.from(streamId));
      
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      const data: StreamKeyData = JSON.parse(decrypted);
      
      // Validate expiration
      if (data.expiresAt && Date.now() > data.expiresAt) {
        throw new Error('Stream key has expired');
      }
      
      logger.debug('[StreamKeyEncryption] Stream key decrypted', {
        streamId: data.streamId,
        userId: data.userId,
      });
      
      return data;
    } catch (error) {
      logger.error('[StreamKeyEncryption] Error decrypting stream key', error as Error);
      throw new Error('Failed to decrypt stream key');
    }
  }

  async generateStreamKey(streamId: string, userId: string, permissions: string[] = ['view']): Promise<string> {
    try {
      const data: StreamKeyData = {
        streamId,
        userId,
        permissions,
        expiresAt: Date.now() + (24 * 60 * 60 * 1000), // 24 hours
        metadata: {
          generatedAt: Date.now(),
          version: '1.0',
        },
      };
      
      const encryptedKey = await this.encryptStreamKey(data);
      
      // Encode as base64 for URL safety
      const keyString = JSON.stringify(encryptedKey);
      const base64Key = Buffer.from(keyString).toString('base64');
      
      logger.info('[StreamKeyEncryption] Stream key generated', {
        streamId,
        userId,
        permissions,
      });
      
      return base64Key;
    } catch (error) {
      logger.error('[StreamKeyEncryption] Error generating stream key', error as Error);
      throw new Error('Failed to generate stream key');
    }
  }

  async validateStreamKey(key: string, streamId: string): Promise<StreamKeyData | null> {
    try {
      // Decode from base64
      const keyString = Buffer.from(key, 'base64').toString('utf8');
      const encryptedKey: EncryptedStreamKey = JSON.parse(keyString);
      
      const data = await this.decryptStreamKey(encryptedKey, streamId);
      
      // Additional validation
      if (data.streamId !== streamId) {
        throw new Error('Stream ID mismatch');
      }
      
      return data;
    } catch (error) {
      logger.warn('[StreamKeyEncryption] Invalid stream key', {
        streamId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return null;
    }
  }

  async refreshStreamKey(oldKey: string, streamId: string): Promise<string> {
    try {
      const data = await this.validateStreamKey(oldKey, streamId);
      if (!data) {
        throw new Error('Invalid stream key');
      }
      
      // Generate new key with extended expiration
      return this.generateStreamKey(streamId, data.userId, data.permissions);
    } catch (error) {
      logger.error('[StreamKeyEncryption] Error refreshing stream key', error as Error);
      throw new Error('Failed to refresh stream key');
    }
  }

  async revokeStreamKey(key: string, streamId: string): Promise<boolean> {
    try {
      const data = await this.validateStreamKey(key, streamId);
      if (!data) {
        return false;
      }
      
      // In a real implementation, you would add the key to a revocation list
      // For now, we'll just log the revocation
      logger.info('[StreamKeyEncryption] Stream key revoked', {
        streamId,
        userId: data.userId,
      });
      
      return true;
    } catch (error) {
      logger.error('[StreamKeyEncryption] Error revoking stream key', error as Error);
      return false;
    }
  }

  // Utility methods
  generateRandomKey(): string {
    return randomBytes(32).toString('hex');
  }

  hashKey(key: string): string {
    return createHash('sha256').update(key).digest('hex');
  }

  // Security audit
  async performSecurityAudit(): Promise<{
    encryptionKeyPresent: boolean;
    encryptionKeyLength: number;
    recommendations: string[];
    score: number;
  }> {
    const encryptionKey = process.env.STREAM_KEY_ENCRYPTION_KEY;
    const recommendations: string[] = [];
    let score = 100;

    if (!encryptionKey) {
      recommendations.push('Set STREAM_KEY_ENCRYPTION_KEY environment variable');
      score -= 50;
    } else if (encryptionKey.length < 32) {
      recommendations.push('Use encryption key with at least 32 characters');
      score -= 25;
    }

    if (encryptionKey === 'default-key-change-in-production') {
      recommendations.push('Change default encryption key in production');
      score -= 30;
    }

    return {
      encryptionKeyPresent: !!encryptionKey,
      encryptionKeyLength: encryptionKey?.length || 0,
      recommendations,
      score: Math.max(0, score),
    };
  }
}

export const streamKeyEncryptionService = StreamKeyEncryptionService.getInstance();
