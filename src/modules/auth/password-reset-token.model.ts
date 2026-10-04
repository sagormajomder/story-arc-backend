import mongoose, { type Document, type Model, type Types } from 'mongoose';

export interface IPasswordResetTokenCreateDoc {
  userId: Types.ObjectId | string;
  tokenHash: string;
  expiresAt: Date;
}

export interface IPasswordResetTokenDocument
  extends IPasswordResetTokenCreateDoc,
    Document {}

const passwordResetTokenSchema =
  new mongoose.Schema<IPasswordResetTokenDocument>(
    {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
      },
      tokenHash: {
        type: String,
        required: true,
        unique: true,
      },
      expiresAt: {
        type: Date,
        required: true,
        index: { expires: 0 },
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

export const PasswordResetToken: Model<IPasswordResetTokenDocument> =
  mongoose.models.PasswordResetToken ||
  mongoose.model<IPasswordResetTokenDocument>(
    'PasswordResetToken',
    passwordResetTokenSchema,
  );
