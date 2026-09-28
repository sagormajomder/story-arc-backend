import type {
  ICreateRefreshTokenInput,
  IRefreshTokenPlainResponse,
} from '@src/modules/auth/auth.types.js';
import {
  RefreshToken,
  type IRefreshTokenCreateDoc,
} from '@src/modules/auth/refresh-token.model.js';

export interface IRefreshTokenRepository {
  create(data: ICreateRefreshTokenInput): Promise<void>;
  findByTokenHash(
    tokenHash: string,
  ): Promise<IRefreshTokenPlainResponse | null>;
  deleteByTokenHash(tokenHash: string): Promise<void>;
  findAllByUserId(userId: string): Promise<IRefreshTokenPlainResponse[]>;
  deleteAllByUserId(userId: string): Promise<void>;
  countByUserId(userId: string): Promise<number>;
}

export class MongooseRefreshTokenRepository implements IRefreshTokenRepository {
  constructor(private readonly model = RefreshToken) {}

  async create(data: ICreateRefreshTokenInput): Promise<void> {
    const doc: IRefreshTokenCreateDoc = {
      userId: data.userId,
      tokenHash: data.tokenHash,
      expiresAt: data.expiresAt,
    };
    if (data.deviceInfo) {
      doc.deviceInfo = data.deviceInfo;
    }
    await this.model.create(doc);
  }

  async findByTokenHash(
    tokenHash: string,
  ): Promise<IRefreshTokenPlainResponse | null> {
    const doc = await this.model.findOne({ tokenHash });
    if (!doc) {
      return null;
    }
    return doc.toObject() as unknown as IRefreshTokenPlainResponse;
  }

  async deleteByTokenHash(tokenHash: string): Promise<void> {
    await this.model.deleteOne({ tokenHash });
  }

  async findAllByUserId(userId: string): Promise<IRefreshTokenPlainResponse[]> {
    const docs = await this.model.find({ userId });
    return docs.map(
      doc => doc.toObject() as unknown as IRefreshTokenPlainResponse,
    );
  }

  async deleteAllByUserId(userId: string): Promise<void> {
    await this.model.deleteMany({ userId });
  }

  async countByUserId(userId: string): Promise<number> {
    return this.model.countDocuments({ userId });
  }
}

export const refreshTokenRepository = new MongooseRefreshTokenRepository();
