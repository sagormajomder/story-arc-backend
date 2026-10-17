import type { ITutorial } from '@src/modules/tutorial/tutorial.types.js';
import { TUTORIAL_VALIDATIONS } from '@src/shared/utils/constants.js';
import mongoose, { Document, Model } from 'mongoose';

export interface ITutorialDocument extends ITutorial, Document {}

const tutorialSchema = new mongoose.Schema<ITutorialDocument>(
  {
    title: {
      type: String,
      required: [true, 'Tutorial title is required'],
      trim: true,
      minLength: [
        TUTORIAL_VALIDATIONS.TITLE_MIN_LENGTH,
        `Title must be at least ${TUTORIAL_VALIDATIONS.TITLE_MIN_LENGTH} characters`,
      ],
      maxLength: [
        TUTORIAL_VALIDATIONS.TITLE_MAX_LENGTH,
        `Title cannot exceed ${TUTORIAL_VALIDATIONS.TITLE_MAX_LENGTH} characters`,
      ],
    },
    url: {
      type: String,
      required: [true, 'Tutorial URL is required'],
      trim: true,
    },
    videoId: {
      type: String,
      required: [true, 'Video ID is required'],
      trim: true,
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
      minLength: [
        TUTORIAL_VALIDATIONS.CATEGORY_MIN_LENGTH,
        `Category must be at least ${TUTORIAL_VALIDATIONS.CATEGORY_MIN_LENGTH} characters`,
      ],
      maxLength: [
        TUTORIAL_VALIDATIONS.CATEGORY_MAX_LENGTH,
        `Category cannot exceed ${TUTORIAL_VALIDATIONS.CATEGORY_MAX_LENGTH} characters`,
      ],
    },
    thumbnail: {
      type: String,
      required: [true, 'Thumbnail is required'],
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

tutorialSchema.index({ category: 1 });
tutorialSchema.index({ createdAt: -1 });

export const Tutorial: Model<ITutorialDocument> =
  mongoose.models.Tutorial ||
  mongoose.model<ITutorialDocument>('Tutorial', tutorialSchema);

