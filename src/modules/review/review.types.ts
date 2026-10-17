import type { ReviewStatus } from '@src/shared/utils/constants.js';

export interface IReview {
  bookId: string;
  userId: string;
  userName: string;
  userEmail: string;
  userImage: string;
  bookTitle: string;
  bookAuthor: string;
  bookCover: string;
  rating: number;
  comment: string;
  status: ReviewStatus;
}

export interface IReviewPlainDBResponse extends IReview {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

export const REVIEW_EXCLUDED_FIELDS = ['userEmail'] as const;

export type ReviewExcludedField = (typeof REVIEW_EXCLUDED_FIELDS)[number];

export type ReviewResponseDto = Omit<
  IReviewPlainDBResponse,
  ReviewExcludedField
>;

export type AdminReviewResponseDto = IReviewPlainDBResponse;

export interface ICreateReviewInput {
  bookId: string;
  userId: string;
  rating: number;
  comment: string;
}

export interface IFindAdminReviewsOptions {
  page: number;
  limit: number;
  status?: ReviewStatus | undefined;
}

export interface IGetAdminReviewsResult {
  reviews: AdminReviewResponseDto[];
  total: number;
  totalPages: number;
  page: number;
  limit: number;
}

