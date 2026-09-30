import type { IDeviceInfo } from '@src/modules/auth/auth.types.js';
import mongoose, { type Document, type Model, type Types } from 'mongoose';

export interface IRefreshTokenCreateDoc {
  userId: Types.ObjectId | string;
  familyId: string;
  tokenHash: string;
  expiresAt: Date;
  deviceInfo?: IDeviceInfo;
  isRevoked?: boolean;
}

export interface IRefreshTokenDocument
  extends IRefreshTokenCreateDoc, Document {
  isRevoked: boolean;
}

const deviceInfoSchema = new mongoose.Schema<IDeviceInfo>(
  {
    userAgent: { type: String },
    ip: { type: String },
  },
  { _id: false },
);

const refreshTokenSchema = new mongoose.Schema<IRefreshTokenDocument>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    familyId: {
      type: String,
      required: true,
      index: true,
    },
    tokenHash: {
      type: String,
      required: true,
      unique: true,
    },
    isRevoked: {
      type: Boolean,
      default: false,
      index: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 },
    },
    deviceInfo: {
      type: deviceInfoSchema,
      default: undefined,
    },
  },
  {
    timestamps: true,
    versionKey: false,
    toObject: {
      transform(_doc: Document, ret: Record<string, unknown>) {
        if (ret._id) {
          ret.id = ret._id.toString();
        }
        if (ret.userId && typeof ret.userId === 'object') {
          ret.userId = ret.userId.toString();
        }
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  },
);

export const RefreshToken: Model<IRefreshTokenDocument> =
  mongoose.models.RefreshToken ||
  mongoose.model<IRefreshTokenDocument>('RefreshToken', refreshTokenSchema);
