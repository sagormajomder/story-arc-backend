import {
  getAllUsersCntlr,
  getMeCntlr,
  getUserByIdCntlr,
  updateMeCntlr,
  updateUserRoleCntlr,
} from '@src/modules/user/user.controller.js';
import {
  getUsersQuerySchema,
  updateProfileSchema,
  updateUserRoleSchema,
  userIdParamSchema,
} from '@src/modules/user/user.validate.js';
import {
  authenticate,
  authorize,
} from '@src/shared/middlewares/auth.middleware.js';
import { csrfGuard } from '@src/shared/middlewares/security.middleware.js';
import { validate } from '@src/shared/middlewares/validate.middleware.js';
import { USER_ROLES } from '@src/shared/utils/constants.js';
import express from 'express';

const userRoutes = express.Router();

// Current user profile routes
userRoutes.get('/me', authenticate, getMeCntlr);
userRoutes.patch(
  '/me',
  csrfGuard,
  authenticate,
  validate(updateProfileSchema),
  updateMeCntlr,
);

// Admin user management routes
userRoutes.get(
  '/',
  authenticate,
  authorize(USER_ROLES.ADMIN),
  validate(getUsersQuerySchema),
  getAllUsersCntlr,
);

userRoutes.get(
  '/:id',
  authenticate,
  authorize(USER_ROLES.ADMIN),
  validate(userIdParamSchema),
  getUserByIdCntlr,
);

userRoutes.patch(
  '/:id/role',
  csrfGuard,
  authenticate,
  authorize(USER_ROLES.ADMIN),
  validate(updateUserRoleSchema),
  updateUserRoleCntlr,
);

export default userRoutes;

