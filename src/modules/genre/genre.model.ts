import type { IGenre } from '@src/modules/genre/genre.types.js';
import { GENRE_VALIDATIONS } from '@src/shared/utils/constants.js';
import mongoose, { Document, Model } from 'mongoose';

export interface IGenreDocument extends IGenre, Document {}

const genreSchema = new mongoose.Schema<IGenreDocument>(
  {
    name: {
      type: String,
      required: [true, 'Genre name is required'],
      unique: true,
      trim: true,
      minLength: [
        GENRE_VALIDATIONS.NAME_MIN_LENGTH,
        `Genre name must be at least ${GENRE_VALIDATIONS.NAME_MIN_LENGTH} character`,
      ],
      maxLength: [
        GENRE_VALIDATIONS.NAME_MAX_LENGTH,
        `Genre name cannot exceed ${GENRE_VALIDATIONS.NAME_MAX_LENGTH} characters`,
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

genreSchema.index({ name: 1 });

export const Genre: Model<IGenreDocument> =
  mongoose.models.Genre || mongoose.model<IGenreDocument>('Genre', genreSchema);

