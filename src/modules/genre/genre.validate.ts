import {
  GENRE_VALIDATIONS,
  PAGINATION,
  VALIDATIONS,
} from '@src/shared/utils/constants.js';
import { emptyStringToUndefined } from '@src/shared/utils/transformers.js';
import z from 'zod';

// ============================================================================
// Reusable Field Validators
// ============================================================================

const genreIdParams = z.object({
  id: z
    .string({
      error: iss =>
        iss.input === undefined
          ? 'Genre ID is required'
          : 'Genre ID must be a string',
    })
    .trim()
    .regex(VALIDATIONS.OBJECT_ID_REGEX_PATTERN, {
      error: 'Invalid Genre ID format',
    }),
});

// ============================================================================
// Genre Schemas
// ============================================================================

export const genreIdParamSchema = z.object({
  params: genreIdParams,
});

export type GenreIdParamDto = z.infer<typeof genreIdParamSchema>['params'];

export const createGenreSchema = z.object({
  body: z.strictObject({
    name: z
      .string({ error: 'Genre name is required' })
      .trim()
      .min(GENRE_VALIDATIONS.NAME_MIN_LENGTH, {
        error: `Genre name must be at least ${GENRE_VALIDATIONS.NAME_MIN_LENGTH} character`,
      })
      .max(GENRE_VALIDATIONS.NAME_MAX_LENGTH, {
        error: `Genre name cannot exceed ${GENRE_VALIDATIONS.NAME_MAX_LENGTH} characters`,
      }),
  }),
});

export type CreateGenreDto = z.infer<typeof createGenreSchema>['body'];

export const updateGenreSchema = z.object({
  params: genreIdParams,
  body: z.strictObject({
    name: z
      .string({ error: 'Genre name is required' })
      .trim()
      .min(GENRE_VALIDATIONS.NAME_MIN_LENGTH, {
        error: `Genre name must be at least ${GENRE_VALIDATIONS.NAME_MIN_LENGTH} character`,
      })
      .max(GENRE_VALIDATIONS.NAME_MAX_LENGTH, {
        error: `Genre name cannot exceed ${GENRE_VALIDATIONS.NAME_MAX_LENGTH} characters`,
      }),
  }),
});

export type UpdateGenreDto = z.infer<typeof updateGenreSchema>['body'];

export const getGenresQuerySchema = z.object({
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
  }),
});

export type GetGenresQueryDto = z.infer<typeof getGenresQuerySchema>['query'];

