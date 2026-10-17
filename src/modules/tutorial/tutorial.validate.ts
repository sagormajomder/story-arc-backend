import { extractYouTubeVideoId } from '@src/modules/tutorial/tutorial.utils.js';
import {
  PAGINATION,
  TUTORIAL_VALIDATIONS,
  VALIDATIONS,
} from '@src/shared/utils/constants.js';
import { emptyStringToUndefined } from '@src/shared/utils/transformers.js';
import z from 'zod';

// ============================================================================
// Reusable Field Validators
// ============================================================================

const tutorialIdParams = z.object({
  id: z
    .string({
      error: iss =>
        iss.input === undefined
          ? 'Tutorial ID is required'
          : 'Tutorial ID must be a string',
    })
    .trim()
    .regex(VALIDATIONS.OBJECT_ID_REGEX_PATTERN, {
      error: 'Invalid Tutorial ID format',
    }),
});

// ============================================================================
// Tutorial Schemas
// ============================================================================

export const tutorialIdParamSchema = z.object({
  params: tutorialIdParams,
});

export type TutorialIdParamDto = z.infer<
  typeof tutorialIdParamSchema
>['params'];

export const createTutorialSchema = z.object({
  body: z.strictObject({
    title: z
      .string({ error: 'Tutorial title is required' })
      .trim()
      .min(TUTORIAL_VALIDATIONS.TITLE_MIN_LENGTH, {
        error: `Title must be at least ${TUTORIAL_VALIDATIONS.TITLE_MIN_LENGTH} characters`,
      })
      .max(TUTORIAL_VALIDATIONS.TITLE_MAX_LENGTH, {
        error: `Title cannot exceed ${TUTORIAL_VALIDATIONS.TITLE_MAX_LENGTH} characters`,
      }),
    url: z
      .string({ error: 'Tutorial URL is required' })
      .trim()
      .refine(val => extractYouTubeVideoId(val) !== null, {
        message: 'Invalid YouTube URL',
      }),
    category: z
      .string({ error: 'Category is required' })
      .trim()
      .min(TUTORIAL_VALIDATIONS.CATEGORY_MIN_LENGTH, {
        error: `Category must be at least ${TUTORIAL_VALIDATIONS.CATEGORY_MIN_LENGTH} characters`,
      })
      .max(TUTORIAL_VALIDATIONS.CATEGORY_MAX_LENGTH, {
        error: `Category cannot exceed ${TUTORIAL_VALIDATIONS.CATEGORY_MAX_LENGTH} characters`,
      }),
  }),
});

export type CreateTutorialDto = z.infer<typeof createTutorialSchema>['body'];

export const updateTutorialSchema = z.object({
  params: tutorialIdParams,
  body: z
    .strictObject({
      title: z
        .string({ error: 'Tutorial title must be a string' })
        .trim()
        .min(TUTORIAL_VALIDATIONS.TITLE_MIN_LENGTH, {
          error: `Title must be at least ${TUTORIAL_VALIDATIONS.TITLE_MIN_LENGTH} characters`,
        })
        .max(TUTORIAL_VALIDATIONS.TITLE_MAX_LENGTH, {
          error: `Title cannot exceed ${TUTORIAL_VALIDATIONS.TITLE_MAX_LENGTH} characters`,
        })
        .optional(),
      url: z
        .string({ error: 'Tutorial URL must be a string' })
        .trim()
        .refine(val => extractYouTubeVideoId(val) !== null, {
          message: 'Invalid YouTube URL',
        })
        .optional(),
      category: z
        .string({ error: 'Category must be a string' })
        .trim()
        .min(TUTORIAL_VALIDATIONS.CATEGORY_MIN_LENGTH, {
          error: `Category must be at least ${TUTORIAL_VALIDATIONS.CATEGORY_MIN_LENGTH} characters`,
        })
        .max(TUTORIAL_VALIDATIONS.CATEGORY_MAX_LENGTH, {
          error: `Category cannot exceed ${TUTORIAL_VALIDATIONS.CATEGORY_MAX_LENGTH} characters`,
        })
        .optional(),
    })
    .refine(
      data =>
        data.title !== undefined ||
        data.url !== undefined ||
        data.category !== undefined,
      {
        message: 'At least one field to update must be provided',
      },
    ),
});

export type UpdateTutorialDto = z.infer<typeof updateTutorialSchema>['body'];

export const getTutorialsQuerySchema = z.object({
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
    category: z.preprocess(
      emptyStringToUndefined,
      z.string({ error: 'Category must be a string' }).trim().optional(),
    ),
    search: z.preprocess(
      emptyStringToUndefined,
      z.string({ error: 'Search query must be a string' }).trim().optional(),
    ),
  }),
});

export type GetTutorialsQueryDto = z.infer<
  typeof getTutorialsQuerySchema
>['query'];

