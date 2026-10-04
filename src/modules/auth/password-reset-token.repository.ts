import {
  PasswordResetToken,
  type IPasswordResetTokenCreateDoc,
} from '@src/modules/auth/password-reset-token.model.js';

export interface IPasswordResetTokenPlainResponse {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IPasswordResetTokenRepository {
  create(data: IPasswordResetTokenCreateDoc): Promise<void>;
  findByTokenHash(
    tokenHash: string,
  ): Promise<IPasswordResetTokenPlainResponse | null>;
  deleteAllByUserId(userId: string): Promise<void>;
  deleteByTokenHash(tokenHash: string): Promise<void>;
}

export class MongoosePasswordResetTokenRepository
  implements IPasswordResetTokenRepository
{
  constructor(private readonly model = PasswordResetToken) {}

  async create(data: IPasswordResetTokenCreateDoc): Promise<void> {
    await this.model.create(data);
  }

  async findByTokenHash(
    tokenHash: string,
  ): Promise<IPasswordResetTokenPlainResponse | null> {
    const doc = await this.model.findOne({
      tokenHash,
      expiresAt: { $gt: new Date() },
    });
    if (!doc) {
      return null;
    }
    return doc.toObject() as unknown as IPasswordResetTokenPlainResponse;
  }

  async deleteAllByUserId(userId: string): Promise<void> {
    await this.model.deleteMany({ userId });
  }

  async deleteByTokenHash(tokenHash: string): Promise<void> {
    await this.model.deleteOne({ tokenHash });
  }
}

export const passwordResetTokenRepository =
  new MongoosePasswordResetTokenRepository();
