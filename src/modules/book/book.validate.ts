import {
  BOOK_SORT_OPTIONS,
  BOOK_VALIDATIONS,
  PAGINATION,
  VALIDATIONS,
} from '@src/shared/utils/constants.js';
import { emptyStringToUndefined } from '@src/shared/utils/transformers.js';
import z from 'zod';

// ============================================================================
// Reusable Field Validators
// ============================================================================

const bookIdParams = z.object({
  id: z
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

const bookSortEnum = z.enum(
  [
    BOOK_SORT_OPTIONS.NEWEST,
    BOOK_SORT_OPTIONS.RATING_DESC,
    BOOK_SORT_OPTIONS.SHELVED_DESC,
    BOOK_SORT_OPTIONS.TITLE_ASC,
    BOOK_SORT_OPTIONS.TITLE_DESC,
  ],
  {
    error: 'Invalid sort option',
  },
);

// ============================================================================
// Book Schemas
// ============================================================================

export const bookIdParamSchema = z.object({
  params: bookIdParams,
});

export type BookIdParamDto = z.infer<typeof bookIdParamSchema>['params'];

export const createBookSchema = z.object({
  body: z.strictObject({
    title: z
      .string({ error: 'Book title is required' })
      .trim()
      .min(BOOK_VALIDATIONS.TITLE_MIN_LENGTH, {
        error: `Title must be at least ${BOOK_VALIDATIONS.TITLE_MIN_LENGTH} character`,
      })
      .max(BOOK_VALIDATIONS.TITLE_MAX_LENGTH, {
        error: `Title cannot exceed ${BOOK_VALIDATIONS.TITLE_MAX_LENGTH} characters`,
      }),
    author: z
      .string({ error: 'Author is required' })
      .trim()
      .min(BOOK_VALIDATIONS.AUTHOR_MIN_LENGTH, {
        error: `Author must be at least ${BOOK_VALIDATIONS.AUTHOR_MIN_LENGTH} character`,
      })
      .max(BOOK_VALIDATIONS.AUTHOR_MAX_LENGTH, {
        error: `Author cannot exceed ${BOOK_VALIDATIONS.AUTHOR_MAX_LENGTH} characters`,
      }),
    cover: z.preprocess(
      emptyStringToUndefined,
      z
        .string({ error: 'Cover must be a string' })
        .pipe(z.url({ error: 'Cover must be a valid URL' }))
        .optional(),
    ),
    description: z.preprocess(
      emptyStringToUndefined,
      z
        .string({ error: 'Description must be a string' })
        .trim()
        .max(BOOK_VALIDATIONS.DESCRIPTION_MAX_LENGTH, {
          error: `Description cannot exceed ${BOOK_VALIDATIONS.DESCRIPTION_MAX_LENGTH} characters`,
        })
        .optional(),
    ),
    genre: z.preprocess(
      emptyStringToUndefined,
      z.string({ error: 'Genre must be a string' }).trim().optional(),
    ),
    publishedDate: z.preprocess(
      emptyStringToUndefined,
      z.string({ error: 'Published date must be a string' }).trim().optional(),
    ),
  }),
});

export type CreateBookDto = z.infer<typeof createBookSchema>['body'];

export const updateBookSchema = z.object({
  params: bookIdParams,
  body: z
    .strictObject({
      title: z
        .string({ error: 'Book title must be a string' })
        .trim()
        .min(BOOK_VALIDATIONS.TITLE_MIN_LENGTH, {
          error: `Title must be at least ${BOOK_VALIDATIONS.TITLE_MIN_LENGTH} character`,
        })
        .max(BOOK_VALIDATIONS.TITLE_MAX_LENGTH, {
          error: `Title cannot exceed ${BOOK_VALIDATIONS.TITLE_MAX_LENGTH} characters`,
        })
        .optional(),
      author: z
        .string({ error: 'Author must be a string' })
        .trim()
        .min(BOOK_VALIDATIONS.AUTHOR_MIN_LENGTH, {
          error: `Author must be at least ${BOOK_VALIDATIONS.AUTHOR_MIN_LENGTH} character`,
        })
        .max(BOOK_VALIDATIONS.AUTHOR_MAX_LENGTH, {
          error: `Author cannot exceed ${BOOK_VALIDATIONS.AUTHOR_MAX_LENGTH} characters`,
        })
        .optional(),
      cover: z.preprocess(
        emptyStringToUndefined,
        z
          .string({ error: 'Cover must be a string' })
          .pipe(z.url({ error: 'Cover must be a valid URL' }))
          .optional(),
      ),
      description: z.preprocess(
        emptyStringToUndefined,
        z
          .string({ error: 'Description must be a string' })
          .trim()
          .max(BOOK_VALIDATIONS.DESCRIPTION_MAX_LENGTH, {
            error: `Description cannot exceed ${BOOK_VALIDATIONS.DESCRIPTION_MAX_LENGTH} characters`,
          })
          .optional(),
      ),
      genre: z.preprocess(
        emptyStringToUndefined,
        z.string({ error: 'Genre must be a string' }).trim().optional(),
      ),
      publishedDate: z.preprocess(
        emptyStringToUndefined,
        z
          .string({ error: 'Published date must be a string' })
          .trim()
          .optional(),
      ),
    })
    .refine(
      data =>
        data.title !== undefined ||
        data.author !== undefined ||
        data.cover !== undefined ||
        data.description !== undefined ||
        data.genre !== undefined ||
        data.publishedDate !== undefined,
      {
        message: 'At least one field to update must be provided',
      },
    ),
});

export type UpdateBookDto = z.infer<typeof updateBookSchema>['body'];

export const getBooksQuerySchema = z.object({
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
    search: z.preprocess(emptyStringToUndefined, z.string().optional()),
    genre: z.preprocess(emptyStringToUndefined, z.string().optional()),
    minRating: z.preprocess(
      emptyStringToUndefined,
      z.coerce
        .number({ error: 'minRating must be a number' })
        .min(BOOK_VALIDATIONS.MIN_RATING, {
          error: `minRating must be at least ${BOOK_VALIDATIONS.MIN_RATING}`,
        })
        .max(BOOK_VALIDATIONS.MAX_RATING, {
          error: `minRating cannot exceed ${BOOK_VALIDATIONS.MAX_RATING}`,
        })
        .optional(),
    ),
    maxRating: z.preprocess(
      emptyStringToUndefined,
      z.coerce
        .number({ error: 'maxRating must be a number' })
        .min(BOOK_VALIDATIONS.MIN_RATING, {
          error: `maxRating must be at least ${BOOK_VALIDATIONS.MIN_RATING}`,
        })
        .max(BOOK_VALIDATIONS.MAX_RATING, {
          error: `maxRating cannot exceed ${BOOK_VALIDATIONS.MAX_RATING}`,
        })
        .optional(),
    ),
    sort: z.preprocess(emptyStringToUndefined, bookSortEnum.optional()),
    ids: z.preprocess(emptyStringToUndefined, z.string().optional()),
  }),
});

export type GetBooksQueryDto = z.infer<typeof getBooksQuerySchema>['query'];

