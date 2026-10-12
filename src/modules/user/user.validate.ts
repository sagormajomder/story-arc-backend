import {
  PAGINATION,
  USER_ROLES,
  VALIDATIONS,
} from '@src/shared/utils/constants.js';
import { emptyStringToUndefined } from '@src/shared/utils/transformers.js';
import z from 'zod';

// ============================================================================
// Reusable Field Validators
// ============================================================================

const userIdParams = z.object({
  id: z
    .string({
      error: iss =>
        iss.input === undefined
          ? 'User ID is required'
          : 'User ID must be a string',
    })
    .trim()
    .regex(VALIDATIONS.OBJECT_ID_REGEX_PATTERN, {
      error: 'Invalid User ID format',
    }),
});

const userRoleSchema = z.enum([USER_ROLES.USER, USER_ROLES.ADMIN], {
  error: iss =>
    iss.input === undefined
      ? 'Role is required'
      : 'Invalid role. Role must be either "user" or "admin"',
});

// ============================================================================
// User Schemas
// ============================================================================

export const userIdParamSchema = z.object({
  params: userIdParams,
});

export type UserIdParamDto = z.infer<typeof userIdParamSchema>['params'];

export const updateProfileSchema = z.object({
  body: z
    .strictObject({
      fullName: z
        .string({ error: 'Full Name must be a string' })
        .trim()
        .min(VALIDATIONS.FULLNAME_MIN_LENGTH, {
          error: `Full name should be at least ${VALIDATIONS.FULLNAME_MIN_LENGTH} characters`,
        })
        .max(VALIDATIONS.FULLNAME_MAX_LENGTH, {
          error: `Full Name can't exceed ${VALIDATIONS.FULLNAME_MAX_LENGTH} characters`,
        })
        .optional(),
      profileImage: z.preprocess(
        emptyStringToUndefined,
        z
          .string({ error: 'Profile image must be a string' })
          .pipe(z.url({ error: 'Profile image must be a valid URL' }))
          .optional(),
      ),
    })
    .refine(
      data => data.fullName !== undefined || data.profileImage !== undefined,
      {
        message:
          'At least one field (fullName or profileImage) must be provided',
      },
    ),
});

export type UpdateProfileDto = z.infer<typeof updateProfileSchema>['body'];

export const updateUserRoleSchema = z.object({
  params: userIdParams,
  body: z.strictObject({
    role: z.preprocess(emptyStringToUndefined, userRoleSchema),
  }),
});

export type UpdateUserRoleDto = z.infer<typeof updateUserRoleSchema>['body'];

export const getUsersQuerySchema = z.object({
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
    role: z.preprocess(emptyStringToUndefined, userRoleSchema.optional()),
  }),
});

export type GetUsersQueryDto = z.infer<typeof getUsersQuerySchema>['query'];
