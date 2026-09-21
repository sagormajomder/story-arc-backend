import type { IUser } from '@src/modules/user/user.types.js';
import { VALIDATIONS } from '@src/shared/utils/constants.js';
import bcrypt from 'bcryptjs';
import mongoose, { Document, Model } from 'mongoose';

interface IUserDocuments extends IUser, Document {}

const userSchema = new mongoose.Schema<IUserDocuments>(
  {
    fullName: {
      type: String,
      required: [true, 'Full Name is required'],
      trim: true,
      minLength: [
        VALIDATIONS.FULLNAME_MIN_LENGTH,
        `Full name should be at least ${VALIDATIONS.FULLNAME_MIN_LENGTH} characters`,
      ],
      maxLength: [
        VALIDATIONS.FULLNAME_MAX_LENGTH,
        `Full Name can't exceed ${VALIDATIONS.FULLNAME_MAX_LENGTH} characters`,
      ],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      trim: true,
      lowercase: true,
      match: [
        VALIDATIONS.EMAIL_REGEX_PATTERN,
        'Please provide valid email address',
      ],
      unique: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minLength: [
        VALIDATIONS.PASSWORD_MIN_LENGTH,
        `Password Must be at least ${VALIDATIONS.PASSWORD_MIN_LENGTH} characters`,
      ],
      select: false,
    },
    profileImage: {
      type: String,
      default: VALIDATIONS.DEFAULT_PROFILE_IMAGE,
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
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  },
);

userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;

  if (this.password.length > VALIDATIONS.PASSWORD_MAX_LENGTH) {
    throw new Error(
      `Password can't exceed ${VALIDATIONS.PASSWORD_MAX_LENGTH} characters`,
    );
  }

  this.password = await bcrypt.hash(
    this.password,
    VALIDATIONS.PASSWORD_HASH_SALT_ROUNDS,
  );
});

export const User: Model<IUserDocuments> =
  mongoose.models.User || mongoose.model<IUserDocuments>('User', userSchema);
