import { Review } from '@src/modules/review/review.model.js';
import type {
  IFindAdminReviewsOptions,
  IReview,
  IReviewPlainDBResponse,
} from '@src/modules/review/review.types.js';
import {
  REVIEW_STATUS,
  type ReviewStatus,
} from '@src/shared/utils/constants.js';

export interface IReviewRepository {
  create(data: Omit<IReview, 'status'>): Promise<IReviewPlainDBResponse>;
  findById(reviewId: string): Promise<IReviewPlainDBResponse | null>;
  findByBookId(bookId: string): Promise<IReviewPlainDBResponse[]>;
  findApprovedByBookId(bookId: string): Promise<IReviewPlainDBResponse[]>;
  findAll(options: IFindAdminReviewsOptions): Promise<{
    reviews: IReviewPlainDBResponse[];
    total: number;
  }>;
  updateStatus(
    reviewId: string,
    status: ReviewStatus,
  ): Promise<IReviewPlainDBResponse | null>;
  delete(reviewId: string): Promise<IReviewPlainDBResponse | null>;
  existsByBookAndUser(bookId: string, userId: string): Promise<boolean>;
}

export class ReviewRepository implements IReviewRepository {
  constructor(private readonly model = Review) {}

  async create(data: Omit<IReview, 'status'>): Promise<IReviewPlainDBResponse> {
    const doc = await this.model.create({
      ...data,
      status: REVIEW_STATUS.PENDING,
    });
    return doc.toObject() as unknown as IReviewPlainDBResponse;
  }

  async findById(reviewId: string): Promise<IReviewPlainDBResponse | null> {
    const doc = await this.model.findById(reviewId).exec();
    if (!doc) {
      return null;
    }
    return doc.toObject() as unknown as IReviewPlainDBResponse;
  }

  async findByBookId(bookId: string): Promise<IReviewPlainDBResponse[]> {
    const docs = await this.model
      .find({ bookId, status: REVIEW_STATUS.APPROVED })
      .sort({ createdAt: -1 })
      .exec();

    return docs.map(d => d.toObject() as unknown as IReviewPlainDBResponse);
  }

  async findApprovedByBookId(
    bookId: string,
  ): Promise<IReviewPlainDBResponse[]> {
    const docs = await this.model
      .find({ bookId, status: REVIEW_STATUS.APPROVED })
      .exec();

    return docs.map(d => d.toObject() as unknown as IReviewPlainDBResponse);
  }

  async findAll(options: IFindAdminReviewsOptions): Promise<{
    reviews: IReviewPlainDBResponse[];
    total: number;
  }> {
    const filter: Record<string, unknown> = {};
    if (options.status) {
      filter.status = options.status;
    }

    const skip = (options.page - 1) * options.limit;

    const [docs, total] = await Promise.all([
      this.model
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(options.limit)
        .exec(),
      this.model.countDocuments(filter).exec(),
    ]);

    return {
      reviews: docs.map(d => d.toObject() as unknown as IReviewPlainDBResponse),
      total,
    };
  }

  async updateStatus(
    reviewId: string,
    status: ReviewStatus,
  ): Promise<IReviewPlainDBResponse | null> {
    const doc = await this.model
      .findByIdAndUpdate(
        reviewId,
        { $set: { status } },
        { returnDocument: 'after', runValidators: true },
      )
      .exec();

    if (!doc) {
      return null;
    }

    return doc.toObject() as unknown as IReviewPlainDBResponse;
  }

  async delete(reviewId: string): Promise<IReviewPlainDBResponse | null> {
    const doc = await this.model.findByIdAndDelete(reviewId).exec();
    if (!doc) {
      return null;
    }

    return doc.toObject() as unknown as IReviewPlainDBResponse;
  }

  async existsByBookAndUser(bookId: string, userId: string): Promise<boolean> {
    const count = await this.model
      .countDocuments({ bookId, userId })
      .exec();
    return count > 0;
  }
}

export const reviewRepository = new ReviewRepository();
