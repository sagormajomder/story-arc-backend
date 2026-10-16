import type { IBook } from '@src/modules/book/book.types.js';
import { BOOK_VALIDATIONS } from '@src/shared/utils/constants.js';
import mongoose, { Document, Model } from 'mongoose';

export interface IBookDocument extends IBook, Document {}

const bookSchema = new mongoose.Schema<IBookDocument>(
  {
    title: {
      type: String,
      required: [true, 'Book title is required'],
      trim: true,
      minLength: [
        BOOK_VALIDATIONS.TITLE_MIN_LENGTH,
        `Title must be at least ${BOOK_VALIDATIONS.TITLE_MIN_LENGTH} character`,
      ],
      maxLength: [
        BOOK_VALIDATIONS.TITLE_MAX_LENGTH,
        `Title cannot exceed ${BOOK_VALIDATIONS.TITLE_MAX_LENGTH} characters`,
      ],
    },
    author: {
      type: String,
      required: [true, 'Book author is required'],
      trim: true,
      minLength: [
        BOOK_VALIDATIONS.AUTHOR_MIN_LENGTH,
        `Author name must be at least ${BOOK_VALIDATIONS.AUTHOR_MIN_LENGTH} character`,
      ],
      maxLength: [
        BOOK_VALIDATIONS.AUTHOR_MAX_LENGTH,
        `Author name cannot exceed ${BOOK_VALIDATIONS.AUTHOR_MAX_LENGTH} characters`,
      ],
    },
    cover: {
      type: String,
      default: '',
      trim: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
      maxLength: [
        BOOK_VALIDATIONS.DESCRIPTION_MAX_LENGTH,
        `Description cannot exceed ${BOOK_VALIDATIONS.DESCRIPTION_MAX_LENGTH} characters`,
      ],
    },
    genre: {
      type: String,
      default: '',
      trim: true,
      index: true,
    },
    rating: {
      type: Number,
      default: 0,
      min: [BOOK_VALIDATIONS.MIN_RATING, 'Rating cannot be negative'],
      max: [BOOK_VALIDATIONS.MAX_RATING, 'Rating cannot exceed 5'],
    },
    totalRatings: {
      type: Number,
      default: 0,
      min: [0, 'Total ratings cannot be negative'],
    },
    shelvedCount: {
      type: Number,
      default: 0,
      min: [0, 'Shelved count cannot be negative'],
    },
    publishedDate: {
      type: String,
      trim: true,
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

bookSchema.index({ title: 'text', author: 'text' });
bookSchema.index({ rating: -1 });
bookSchema.index({ createdAt: -1 });

export const Book: Model<IBookDocument> =
  mongoose.models.Book || mongoose.model<IBookDocument>('Book', bookSchema);

