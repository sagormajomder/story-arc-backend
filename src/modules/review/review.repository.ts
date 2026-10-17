import { Review } from '@src/modules/review/review.model.js';
import type {
  IFindAllReviewsOptions,
  IReview,
  IReviewPlainDBResponse,
  IUpdateReviewInput,
} from '@src/modules/review/review.types.js';
import type { ReviewStatus } from '@src/shared/utils/constants.js';

export interface IReviewRepository {
  create(data: IReview): Promise<IReviewPlainDBResponse>;
  findById(reviewId: string): Promise<IReviewPlainDBResponse | null>;
  findByBookId(
    bookId: string,
    status?: ReviewStatus,
  ): Promise<IReviewPlainDBResponse[]>;
  findByUserId(userId: string): Promise<IReviewPlainDBResponse[]>;
  findAll(options: IFindAllReviewsOptions): Promise<{
    reviews: IReviewPlainDBResponse[];
    total: number;
  }>;
  update(
    reviewId: string,
    data: IUpdateReviewInput,
  ): Promise<IReviewPlainDBResponse | null>;
  delete(reviewId: string): Promise<IReviewPlainDBResponse | null>;
  existsByBookAndUser(bookId: string, userId: string): Promise<boolean>;
  countReviews(status?: ReviewStatus): Promise<number>;
}

export class ReviewRepository implements IReviewRepository {
  constructor(private readonly model = Review) {}

  async create(data: IReview): Promise<IReviewPlainDBResponse> {
    const doc = await this.model.create(data);
    return doc.toObject() as unknown as IReviewPlainDBResponse;
  }

  async findById(reviewId: string): Promise<IReviewPlainDBResponse | null> {
    const doc = await this.model.findById(reviewId).exec();
    if (!doc) {
      return null;
    }
    return doc.toObject() as unknown as IReviewPlainDBResponse;
  }

  async findByBookId(
    bookId: string,
    status?: ReviewStatus,
  ): Promise<IReviewPlainDBResponse[]> {
    const filter: Record<string, unknown> = { bookId };
    if (status) {
      filter.status = status;
    }

    const docs = await this.model.find(filter).sort({ createdAt: -1 }).exec();
    return docs.map(d => d.toObject() as unknown as IReviewPlainDBResponse);
  }

  async findByUserId(userId: string): Promise<IReviewPlainDBResponse[]> {
    const docs = await this.model
      .find({ userId })
      .sort({ createdAt: -1 })
      .exec();

    return docs.map(d => d.toObject() as unknown as IReviewPlainDBResponse);
  }

  async findAll(options: IFindAllReviewsOptions): Promise<{
    reviews: IReviewPlainDBResponse[];
    total: number;
  }> {
    const filter: Record<string, unknown> = {};
    if (options.status) {
      filter.status = options.status;
    }
    if (options.bookId) {
      filter.bookId = options.bookId;
    }
    if (options.userId) {
      filter.userId = options.userId;
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

  async update(
    reviewId: string,
    data: IUpdateReviewInput,
  ): Promise<IReviewPlainDBResponse | null> {
    const doc = await this.model
      .findByIdAndUpdate(
        reviewId,
        { $set: data },
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
    const count = await this.model.countDocuments({ bookId, userId }).exec();
    return count > 0;
  }

  async countReviews(status?: ReviewStatus): Promise<number> {
    const filter: Record<string, unknown> = {};
    if (status) {
      filter.status = status;
    }
    return this.model.countDocuments(filter).exec();
  }
}

export const reviewRepository = new ReviewRepository();
