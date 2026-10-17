import {
  bookService as defaultBookService,
  type IBookService,
} from '@src/modules/book/book.service.js';
import {
  toAdminReviewResponseDto,
  toReviewResponseDto,
} from '@src/modules/review/review.mapper.js';
import {
  reviewRepository,
  type IReviewRepository,
} from '@src/modules/review/review.repository.js';
import type {
  ICreateReviewInput,
  IGetAdminReviewsResult,
  ReviewResponseDto,
} from '@src/modules/review/review.types.js';
import type { GetAdminReviewsQueryDto } from '@src/modules/review/review.validate.js';
import {
  userService as defaultUserService,
  type IUserService,
} from '@src/modules/user/user.service.js';
import { AppError } from '@src/shared/errors/appError.js';
import { HTTP_STATUS, REVIEW_STATUS } from '@src/shared/utils/constants.js';

export interface IReviewService {
  submitReview(input: ICreateReviewInput): Promise<ReviewResponseDto>;
  getBookReviews(bookId: string): Promise<ReviewResponseDto[]>;
  getAdminReviews(
    query: GetAdminReviewsQueryDto,
  ): Promise<IGetAdminReviewsResult>;
  approveReview(reviewId: string): Promise<void>;
  deleteReview(reviewId: string): Promise<void>;
}

export class ReviewService implements IReviewService {
  constructor(
    private readonly repo: IReviewRepository = reviewRepository,
    private readonly bookService: IBookService = defaultBookService,
    private readonly userService: IUserService = defaultUserService,
  ) {}

  private async recalculateBookRating(bookId: string): Promise<void> {
    const approvedReviews = await this.repo.findApprovedByBookId(bookId);
    const totalRatings = approvedReviews.length;
    const sumRatings = approvedReviews.reduce((sum, r) => sum + r.rating, 0);
    const averageRating =
      totalRatings > 0 ? parseFloat((sumRatings / totalRatings).toFixed(1)) : 0;

    await this.bookService.updateBookRating(bookId, averageRating, totalRatings);
  }

  async submitReview(input: ICreateReviewInput): Promise<ReviewResponseDto> {
    // 1. Fetch user details via UserService
    const user = await this.userService.getProfile(input.userId);

    // 2. Fetch book details via BookService
    const book = await this.bookService.getBookById(input.bookId);

    // 3. Check for duplicate review
    const alreadyReviewed = await this.repo.existsByBookAndUser(
      input.bookId,
      input.userId,
    );
    if (alreadyReviewed) {
      throw new AppError(
        'You have already submitted a review for this book',
        HTTP_STATUS.CONFLICT,
      );
    }

    // 4. Create review with denormalized fields
    const createdReview = await this.repo.create({
      bookId: input.bookId,
      userId: input.userId,
      userName: user.fullName,
      userEmail: user.email,
      userImage: user.profileImage,
      bookTitle: book.title,
      bookAuthor: book.author,
      bookCover: book.cover || '',
      rating: input.rating,
      comment: input.comment,
    });

    return toReviewResponseDto(createdReview);
  }

  async getBookReviews(bookId: string): Promise<ReviewResponseDto[]> {
    // Verify book exists
    await this.bookService.getBookById(bookId);
    const reviews = await this.repo.findByBookId(bookId);
    return reviews.map(toReviewResponseDto);
  }

  async getAdminReviews(
    query: GetAdminReviewsQueryDto,
  ): Promise<IGetAdminReviewsResult> {
    const { reviews, total } = await this.repo.findAll({
      page: query.page,
      limit: query.limit,
      status: query.status,
    });

    const totalPages = Math.ceil(total / query.limit) || 1;

    return {
      reviews: reviews.map(toAdminReviewResponseDto),
      total,
      totalPages,
      page: query.page,
      limit: query.limit,
    };
  }

  async approveReview(reviewId: string): Promise<void> {
    const updatedReview = await this.repo.updateStatus(
      reviewId,
      REVIEW_STATUS.APPROVED,
    );
    if (!updatedReview) {
      throw new AppError('Review not found', HTTP_STATUS.NOT_FOUND);
    }

    await this.recalculateBookRating(updatedReview.bookId);
  }

  async deleteReview(reviewId: string): Promise<void> {
    const deletedReview = await this.repo.delete(reviewId);
    if (!deletedReview) {
      throw new AppError('Review not found', HTTP_STATUS.NOT_FOUND);
    }

    if (deletedReview.status === REVIEW_STATUS.APPROVED) {
      await this.recalculateBookRating(deletedReview.bookId);
    }
  }
}

export const reviewService = new ReviewService();
