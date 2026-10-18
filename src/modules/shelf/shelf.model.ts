import type {
  IReadingGoal,
  IReadingStreak,
  IShelfItem,
} from '@src/modules/shelf/shelf.types.js';
import {
  SHELF_STATUS,
  SHELF_VALIDATIONS,
} from '@src/shared/utils/constants.js';
import mongoose, { Document, Model } from 'mongoose';

export interface IShelfDocument extends IShelfItem, Document {}
export interface IReadingGoalDocument extends IReadingGoal, Document {}
export interface IReadingStreakDocument extends IReadingStreak, Document {}

const shelfSchema = new mongoose.Schema<IShelfDocument>(
  {
    userId: {
      type: String,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    bookId: {
      type: String,
      ref: 'Book',
      required: [true, 'Book ID is required'],
      index: true,
    },
    status: {
      type: String,
      enum: Object.values(SHELF_STATUS),
      default: SHELF_STATUS.WANT_TO_READ,
      required: [true, 'Shelf status is required'],
    },
    progress: {
      type: Number,
      default: 0,
      min: [
        SHELF_VALIDATIONS.MIN_PROGRESS,
        'Reading progress cannot be negative',
      ],
    },
    totalPages: {
      type: Number,
      default: 0,
      min: [
        SHELF_VALIDATIONS.MIN_TOTAL_PAGES,
        'Total pages cannot be negative',
      ],
    },
    startedAt: {
      type: Date,
      default: null,
    },
    finishedAt: {
      type: Date,
      default: null,
    },
    addedAt: {
      type: Date,
      default: Date.now,
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
        if (
          ret.bookId &&
          typeof ret.bookId === 'object' &&
          ret.bookId !== null &&
          '_id' in ret.bookId
        ) {
          const populatedBook = ret.bookId as Record<string, unknown>;
          if (populatedBook._id) {
            populatedBook.id = populatedBook._id.toString();
            delete populatedBook._id;
            delete populatedBook.__v;
          }
          ret.book = populatedBook;
          ret.bookId = populatedBook.id;
        } else if (ret.bookId) {
          ret.bookId = ret.bookId.toString();
        }
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  },
);

shelfSchema.index({ userId: 1, bookId: 1 }, { unique: true });
shelfSchema.index({ userId: 1, status: 1 });
shelfSchema.index({ userId: 1, createdAt: -1 });

export const Shelf: Model<IShelfDocument> =
  mongoose.models.Shelf || mongoose.model<IShelfDocument>('Shelf', shelfSchema);

const readingGoalSchema = new mongoose.Schema<IReadingGoalDocument>(
  {
    userId: {
      type: String,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    year: {
      type: Number,
      required: [true, 'Year is required'],
    },
    target: {
      type: Number,
      required: [true, 'Target is required'],
      min: [
        SHELF_VALIDATIONS.MIN_GOAL_TARGET,
        `Target must be at least ${SHELF_VALIDATIONS.MIN_GOAL_TARGET}`,
      ],
      max: [
        SHELF_VALIDATIONS.MAX_GOAL_TARGET,
        `Target cannot exceed ${SHELF_VALIDATIONS.MAX_GOAL_TARGET}`,
      ],
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

readingGoalSchema.index({ userId: 1, year: 1 }, { unique: true });

export const ReadingGoal: Model<IReadingGoalDocument> =
  mongoose.models.ReadingGoal ||
  mongoose.model<IReadingGoalDocument>('ReadingGoal', readingGoalSchema);

const readingStreakSchema = new mongoose.Schema<IReadingStreakDocument>(
  {
    userId: {
      type: String,
      ref: 'User',
      required: [true, 'User ID is required'],
      unique: true,
      index: true,
    },
    streak: {
      type: Number,
      default: 0,
      min: [0, 'Streak cannot be negative'],
    },
    longestStreak: {
      type: Number,
      default: 0,
      min: [0, 'Longest streak cannot be negative'],
    },
    lastReadingDate: {
      type: Date,
      default: null,
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

export const ReadingStreak: Model<IReadingStreakDocument> =
  mongoose.models.ReadingStreak ||
  mongoose.model<IReadingStreakDocument>('ReadingStreak', readingStreakSchema);

