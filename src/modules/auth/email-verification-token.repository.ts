import {
  EmailVerificationToken,
  type IEmailVerificationTokenCreateDoc,
} from '@src/modules/auth/email-verification-token.model.js';

export interface IEmailVerificationTokenPlainResponse {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IEmailVerificationTokenRepository {
  create(data: IEmailVerificationTokenCreateDoc): Promise<void>;
  findByTokenHash(
    tokenHash: string,
  ): Promise<IEmailVerificationTokenPlainResponse | null>;
  deleteAllByUserId(userId: string): Promise<void>;
  deleteByTokenHash(tokenHash: string): Promise<void>;
}

export class MongooseEmailVerificationTokenRepository
  implements IEmailVerificationTokenRepository
{
  constructor(private readonly model = EmailVerificationToken) {}

  async create(data: IEmailVerificationTokenCreateDoc): Promise<void> {
    await this.model.create(data);
  }

  async findByTokenHash(
    tokenHash: string,
  ): Promise<IEmailVerificationTokenPlainResponse | null> {
    const doc = await this.model.findOne({
      tokenHash,
      expiresAt: { $gt: new Date() },
    });
    if (!doc) {
      return null;
    }
    return doc.toObject() as unknown as IEmailVerificationTokenPlainResponse;
  }

  async deleteAllByUserId(userId: string): Promise<void> {
    await this.model.deleteMany({ userId });
  }

  async deleteByTokenHash(tokenHash: string): Promise<void> {
    await this.model.deleteOne({ tokenHash });
  }
}

export const emailVerificationTokenRepository =
  new MongooseEmailVerificationTokenRepository();
