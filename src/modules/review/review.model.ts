import type { IReview } from '@src/modules/review/review.types.js';
import {
  REVIEW_STATUS,
  REVIEW_VALIDATIONS,
} from '@src/shared/utils/constants.js';
import mongoose, { Document, Model } from 'mongoose';

export interface IReviewDocument extends IReview, Document {}

const reviewSchema = new mongoose.Schema<IReviewDocument>(
  {
    bookId: {
      type: String,
      required: [true, 'Book ID is required'],
      ref: 'Book',
    },
    userId: {
      type: String,
      required: [true, 'User ID is required'],
      ref: 'User',
    },
    userName: {
      type: String,
      required: [true, 'User name is required'],
      trim: true,
    },
    userEmail: {
      type: String,
      required: [true, 'User email is required'],
      trim: true,
      lowercase: true,
    },
    userImage: {
      type: String,
      default: '',
      trim: true,
    },
    bookTitle: {
      type: String,
      required: [true, 'Book title is required'],
      trim: true,
    },
    bookAuthor: {
      type: String,
      required: [true, 'Book author is required'],
      trim: true,
    },
    bookCover: {
      type: String,
      default: '',
      trim: true,
    },
    rating: {
      type: Number,
      required: [true, 'Rating is required'],
      min: [
        REVIEW_VALIDATIONS.MIN_RATING,
        `Rating must be at least ${REVIEW_VALIDATIONS.MIN_RATING}`,
      ],
      max: [
        REVIEW_VALIDATIONS.MAX_RATING,
        `Rating cannot exceed ${REVIEW_VALIDATIONS.MAX_RATING}`,
      ],
    },
    comment: {
      type: String,
      required: [true, 'Review comment is required'],
      trim: true,
      minLength: [
        REVIEW_VALIDATIONS.COMMENT_MIN_LENGTH,
        `Comment must be at least ${REVIEW_VALIDATIONS.COMMENT_MIN_LENGTH} characters`,
      ],
      maxLength: [
        REVIEW_VALIDATIONS.COMMENT_MAX_LENGTH,
        `Comment cannot exceed ${REVIEW_VALIDATIONS.COMMENT_MAX_LENGTH} characters`,
      ],
    },
    status: {
      type: String,
      enum: Object.values(REVIEW_STATUS),
      default: REVIEW_STATUS.PENDING,
    },
    rejectionReason: {
      type: String,
      default: '',
      trim: true,
      maxLength: [500, 'Rejection reason cannot exceed 500 characters'],
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

// Compound index: A user can review a book at most once
reviewSchema.index({ bookId: 1, userId: 1 }, { unique: true });
reviewSchema.index({ bookId: 1, status: 1, createdAt: -1 });
reviewSchema.index({ userId: 1, createdAt: -1 });
reviewSchema.index({ status: 1, createdAt: -1 });

export const Review: Model<IReviewDocument> =
  mongoose.models.Review ||
  mongoose.model<IReviewDocument>('Review', reviewSchema);

