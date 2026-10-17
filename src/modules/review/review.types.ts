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
  rejectionReason?: string;
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

export interface IUpdateReviewInput {
  rating?: number | undefined;
  comment?: string | undefined;
  status?: ReviewStatus | undefined;
  rejectionReason?: string | undefined;
}

export interface IFindAllReviewsOptions {
  page: number;
  limit: number;
  status?: ReviewStatus | undefined;
  bookId?: string | undefined;
  userId?: string | undefined;
}

export interface IGetReviewsResult {
  reviews: AdminReviewResponseDto[];
  total: number;
  totalPages: number;
  page: number;
  limit: number;
}
