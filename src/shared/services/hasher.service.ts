// src/shared/services/passwordHasher.ts (বা utils/password.ts)
import { VALIDATIONS } from '@src/shared/utils/constants.js';
import bcrypt from 'bcryptjs';

export interface IPasswordHasher {
  hash(password: string): Promise<string>;
  compare(raw: string, hashed: string): Promise<boolean>;
}

export class BcryptPasswordHasher implements IPasswordHasher {
  async hash(password: string): Promise<string> {
    return bcrypt.hash(password, VALIDATIONS.PASSWORD_HASH_SALT_ROUNDS);
  }

  async compare(raw: string, hashed: string): Promise<boolean> {
    return bcrypt.compare(raw, hashed);
  }
}

export const bcryptPasswordHasher = new BcryptPasswordHasher();
