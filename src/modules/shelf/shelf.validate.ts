import {
  PAGINATION,
  SHELF_SORT_OPTIONS,
  SHELF_STATUS,
  SHELF_VALIDATIONS,
  VALIDATIONS,
} from '@src/shared/utils/constants.js';
import { emptyStringToUndefined } from '@src/shared/utils/transformers.js';
import z from 'zod';

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

export const bookIdShelfParamSchema = z.object({
  params: bookIdParam,
});

export const addToShelfSchema = z.object({
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
    status: z
      .enum(
        [
          SHELF_STATUS.WANT_TO_READ,
          SHELF_STATUS.CURRENTLY_READING,
          SHELF_STATUS.READ,
        ],
        {
          error:
            "Status must be one of: 'Want to Read', 'Currently Reading', 'Read'",
        },
      )
      .optional()
      .default(SHELF_STATUS.WANT_TO_READ),
    progress: z
      .number({ error: 'Progress must be a number' })
      .int({ error: 'Progress must be an integer' })
      .min(SHELF_VALIDATIONS.MIN_PROGRESS, {
        error: `Progress must be at least ${SHELF_VALIDATIONS.MIN_PROGRESS}`,
      })
      .optional()
      .default(0),
    totalPages: z
      .number({ error: 'Total pages must be a number' })
      .int({ error: 'Total pages must be an integer' })
      .min(SHELF_VALIDATIONS.MIN_TOTAL_PAGES, {
        error: `Total pages must be at least ${SHELF_VALIDATIONS.MIN_TOTAL_PAGES}`,
      })
      .optional()
      .default(0),
  }),
});

export const updateShelfProgressSchema = z.object({
  params: bookIdParam,
  body: z
    .strictObject({
      progress: z
        .number({ error: 'Progress must be a number' })
        .int({ error: 'Progress must be an integer' })
        .min(SHELF_VALIDATIONS.MIN_PROGRESS, {
          error: `Progress must be at least ${SHELF_VALIDATIONS.MIN_PROGRESS}`,
        })
        .optional(),
      totalPages: z
        .number({ error: 'Total pages must be a number' })
        .int({ error: 'Total pages must be an integer' })
        .min(SHELF_VALIDATIONS.MIN_TOTAL_PAGES, {
          error: `Total pages must be at least ${SHELF_VALIDATIONS.MIN_TOTAL_PAGES}`,
        })
        .optional(),
      status: z
        .enum(
          [
            SHELF_STATUS.WANT_TO_READ,
            SHELF_STATUS.CURRENTLY_READING,
            SHELF_STATUS.READ,
          ],
          {
            error:
              "Status must be one of: 'Want to Read', 'Currently Reading', 'Read'",
          },
        )
        .optional(),
    })
    .refine(
      data =>
        data.progress !== undefined ||
        data.totalPages !== undefined ||
        data.status !== undefined,
      {
        message:
          'At least one field (progress, totalPages, or status) must be provided',
      },
    ),
});

export const getShelfQuerySchema = z.object({
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
            SHELF_STATUS.WANT_TO_READ,
            SHELF_STATUS.CURRENTLY_READING,
            SHELF_STATUS.READ,
            'all',
          ],
          {
            error:
              "Status filter must be one of: 'Want to Read', 'Currently Reading', 'Read', or 'all'",
          },
        )
        .optional(),
    ),
    sort: z.preprocess(
      emptyStringToUndefined,
      z
        .enum(
          [
            SHELF_SORT_OPTIONS.NEWEST,
            SHELF_SORT_OPTIONS.OLDEST,
            SHELF_SORT_OPTIONS.PROGRESS_DESC,
            SHELF_SORT_OPTIONS.PROGRESS_ASC,
          ],
          {
            error: 'Invalid sort option',
          },
        )
        .optional()
        .default(SHELF_SORT_OPTIONS.NEWEST),
    ),
  }),
});

export const updateReadingGoalSchema = z.object({
  body: z.strictObject({
    target: z
      .number({
        error: iss =>
          iss.input === undefined
            ? 'Goal target is required'
            : 'Goal target must be a number',
      })
      .int({ error: 'Goal target must be an integer' })
      .min(SHELF_VALIDATIONS.MIN_GOAL_TARGET, {
        error: `Goal target must be at least ${SHELF_VALIDATIONS.MIN_GOAL_TARGET}`,
      })
      .max(SHELF_VALIDATIONS.MAX_GOAL_TARGET, {
        error: `Goal target cannot exceed ${SHELF_VALIDATIONS.MAX_GOAL_TARGET}`,
      }),
    year: z
      .number({ error: 'Year must be a number' })
      .int({ error: 'Year must be an integer' })
      .min(2000, { error: 'Year must be after 2000' })
      .max(2100, { error: 'Year cannot exceed 2100' })
      .optional(),
  }),
});

export type BookIdShelfParamDto = z.infer<
  typeof bookIdShelfParamSchema
>['params'];
export type AddToShelfDto = z.infer<typeof addToShelfSchema>['body'];
export type UpdateShelfProgressDto = z.infer<
  typeof updateShelfProgressSchema
>['body'];
export type GetShelfQueryDto = z.infer<typeof getShelfQuerySchema>['query'];
export type UpdateReadingGoalDto = z.infer<
  typeof updateReadingGoalSchema
>['body'];

