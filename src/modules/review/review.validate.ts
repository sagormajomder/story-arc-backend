import {
  PAGINATION,
  REVIEW_STATUS,
  REVIEW_VALIDATIONS,
  VALIDATIONS,
} from '@src/shared/utils/constants.js';
import { emptyStringToUndefined } from '@src/shared/utils/transformers.js';
import z from 'zod';

const reviewIdParam = z.object({
  id: z
    .string({
      error: iss =>
        iss.input === undefined
          ? 'Review ID is required'
          : 'Review ID must be a string',
    })
    .trim()
    .regex(VALIDATIONS.OBJECT_ID_REGEX_PATTERN, {
      error: 'Invalid Review ID format',
    }),
});

const bookIdParam = z.object({
  bookId: z
    .string({
      error: iss =>
        iss.input === undefined
          ? 'Book ID is required'
          : 'Book ID must be a string',
    })
    .trim()
    .regex(VALIDATIONS.OBJECT_ID_REGEX_PATTERN, {
      error: 'Invalid Book ID format',
    }),
});

export const reviewIdParamSchema = z.object({
  params: reviewIdParam,
});

export const bookIdReviewParamSchema = z.object({
  params: bookIdParam,
});

export const createReviewSchema = z.object({
  body: z.strictObject({
    bookId: z
      .string({
        error: iss =>
          iss.input === undefined
            ? 'Book ID is required'
            : 'Book ID must be a string',
      })
      .trim()
      .regex(VALIDATIONS.OBJECT_ID_REGEX_PATTERN, {
        error: 'Invalid Book ID format',
      }),
    rating: z
      .number({
        error: iss =>
          iss.input === undefined
            ? 'Rating is required'
            : 'Rating must be a number',
      })
      .int({ error: 'Rating must be an integer' })
      .min(REVIEW_VALIDATIONS.MIN_RATING, {
        error: `Rating must be at least ${REVIEW_VALIDATIONS.MIN_RATING}`,
      })
      .max(REVIEW_VALIDATIONS.MAX_RATING, {
        error: `Rating cannot exceed ${REVIEW_VALIDATIONS.MAX_RATING}`,
      }),
    comment: z
      .string({
        error: iss =>
          iss.input === undefined
            ? 'Review comment is required'
            : 'Review comment must be a string',
      })
      .trim()
      .min(REVIEW_VALIDATIONS.COMMENT_MIN_LENGTH, {
        error: `Comment must be at least ${REVIEW_VALIDATIONS.COMMENT_MIN_LENGTH} characters`,
      })
      .max(REVIEW_VALIDATIONS.COMMENT_MAX_LENGTH, {
        error: `Comment cannot exceed ${REVIEW_VALIDATIONS.COMMENT_MAX_LENGTH} characters`,
      }),
  }),
});

export const getAdminReviewsQuerySchema = z.object({
  query: z.object({
    page: z.preprocess(
      emptyStringToUndefined,
      z.coerce
        .number({ error: 'Page must be a number' })
        .int({ error: 'Page must be an integer' })
        .min(PAGINATION.MIN_PAGE, {
          error: `Page must be at least ${PAGINATION.MIN_PAGE}`,
        })
        .default(PAGINATION.DEFAULT_PAGE),
    ),
    limit: z.preprocess(
      emptyStringToUndefined,
      z.coerce
        .number({ error: 'Limit must be a number' })
        .int({ error: 'Limit must be an integer' })
        .min(PAGINATION.MIN_LIMIT, {
          error: `Limit must be at least ${PAGINATION.MIN_LIMIT}`,
        })
        .max(PAGINATION.MAX_LIMIT, {
          error: `Limit cannot exceed ${PAGINATION.MAX_LIMIT}`,
        })
        .default(PAGINATION.DEFAULT_LIMIT),
    ),
    status: z.preprocess(
      emptyStringToUndefined,
      z
        .enum(
          [
            REVIEW_STATUS.PENDING,
            REVIEW_STATUS.APPROVED,
            REVIEW_STATUS.REJECTED,
          ],
          {
            error: 'Invalid review status filter',
          },
        )
        .optional(),
    ),
  }),
});

export const updateReviewStatusSchema = z.object({
  params: reviewIdParam,
  body: z.strictObject({
    status: z.enum(
      [
        REVIEW_STATUS.PENDING,
        REVIEW_STATUS.APPROVED,
        REVIEW_STATUS.REJECTED,
      ],
      {
        error: 'Status must be one of: pending, approved, rejected',
      },
    ),
    rejectionReason: z
      .string({ error: 'Rejection reason must be a string' })
      .trim()
      .max(500, {
        error: 'Rejection reason cannot exceed 500 characters',
      })
      .optional(),
  }),
});

export const updateMyReviewSchema = z.object({
  params: reviewIdParam,
  body: z
    .strictObject({
      rating: z
        .number({ error: 'Rating must be a number' })
        .int({ error: 'Rating must be an integer' })
        .min(REVIEW_VALIDATIONS.MIN_RATING, {
          error: `Rating must be at least ${REVIEW_VALIDATIONS.MIN_RATING}`,
        })
        .max(REVIEW_VALIDATIONS.MAX_RATING, {
          error: `Rating cannot exceed ${REVIEW_VALIDATIONS.MAX_RATING}`,
        })
        .optional(),
      comment: z
        .string({ error: 'Review comment must be a string' })
        .trim()
        .min(REVIEW_VALIDATIONS.COMMENT_MIN_LENGTH, {
          error: `Comment must be at least ${REVIEW_VALIDATIONS.COMMENT_MIN_LENGTH} characters`,
        })
        .max(REVIEW_VALIDATIONS.COMMENT_MAX_LENGTH, {
          error: `Comment cannot exceed ${REVIEW_VALIDATIONS.COMMENT_MAX_LENGTH} characters`,
        })
        .optional(),
    })
    .refine(
      data => data.rating !== undefined || data.comment !== undefined,
      {
        message: 'At least one field (rating or comment) must be provided',
      },
    ),
});

export type ReviewIdParamDto = z.infer<typeof reviewIdParamSchema>['params'];
export type BookIdReviewParamDto = z.infer<
  typeof bookIdReviewParamSchema
>['params'];
export type CreateReviewDto = z.infer<typeof createReviewSchema>['body'];
export type UpdateReviewStatusDto = z.infer<
  typeof updateReviewStatusSchema
>['body'];
export type UpdateMyReviewDto = z.infer<typeof updateMyReviewSchema>['body'];
export type GetAdminReviewsQueryDto = z.infer<
  typeof getAdminReviewsQuerySchema
>['query'];

