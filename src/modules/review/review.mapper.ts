import type {
  AdminReviewResponseDto,
  IReviewPlainDBResponse,
  ReviewResponseDto,
} from '@src/modules/review/review.types.js';
import { REVIEW_EXCLUDED_FIELDS } from '@src/modules/review/review.types.js';
import { excludeFields } from '@src/shared/utils/excludeFields.js';

export const toReviewResponseDto = (
  review: IReviewPlainDBResponse,
): ReviewResponseDto => {
  return excludeFields(review, REVIEW_EXCLUDED_FIELDS);
};

export const toAdminReviewResponseDto = (
  review: IReviewPlainDBResponse,
): AdminReviewResponseDto => {
  return review;
};

