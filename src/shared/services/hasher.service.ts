import { ARGON2_CONFIG } from '@src/shared/utils/constants.js';
import argon2 from 'argon2';

export interface IPasswordHasher {
  hash(password: string): Promise<string>;
  compare(raw: string, hashed?: string | null): Promise<boolean>;
}

export class Argon2PasswordHasher implements IPasswordHasher {
  private readonly dummyHash =
    '$argon2id$v=19$m=19456,t=2,p=1$c29tZXNhbHQ$P/d2G86bV8g8f5i8J17mCQ';

  async hash(password: string): Promise<string> {
    return argon2.hash(password, {
      type: argon2.argon2id,
      memoryCost: ARGON2_CONFIG.memoryCost,
      timeCost: ARGON2_CONFIG.timeCost,
      parallelism: ARGON2_CONFIG.parallelism,
    });
  }

  async compare(raw: string, hashed?: string | null): Promise<boolean> {
    try {
      const targetHash = hashed ?? this.dummyHash;
      return await argon2.verify(targetHash, raw);
    } catch {
      return false;
    }
  }
}

export const argon2PasswordHasher = new Argon2PasswordHasher();
