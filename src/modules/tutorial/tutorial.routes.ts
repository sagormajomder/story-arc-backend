import {
  createTutorialCntlr,
  deleteTutorialCntlr,
  getAllTutorialsCntlr,
  getTutorialByIdCntlr,
  updateTutorialCntlr,
} from '@src/modules/tutorial/tutorial.controller.js';
import {
  createTutorialSchema,
  getTutorialsQuerySchema,
  tutorialIdParamSchema,
  updateTutorialSchema,
} from '@src/modules/tutorial/tutorial.validate.js';
import {
  authenticate,
  authorize,
} from '@src/shared/middlewares/auth.middleware.js';
import { csrfGuard } from '@src/shared/middlewares/security.middleware.js';
import { validate } from '@src/shared/middlewares/validate.middleware.js';
import { USER_ROLES } from '@src/shared/utils/constants.js';
import express from 'express';

const tutorialRoutes = express.Router();

// Routes accessible by all authenticated users
tutorialRoutes.get(
  '/',
  authenticate,
  validate(getTutorialsQuerySchema),
  getAllTutorialsCntlr,
);

tutorialRoutes.get(
  '/:id',
  authenticate,
  validate(tutorialIdParamSchema),
  getTutorialByIdCntlr,
);

// Admin-only management routes (requires CSRF protection and Admin role)
tutorialRoutes.post(
  '/',
  csrfGuard,
  authenticate,
  authorize(USER_ROLES.ADMIN),
  validate(createTutorialSchema),
  createTutorialCntlr,
);

tutorialRoutes.patch(
  '/:id',
  csrfGuard,
  authenticate,
  authorize(USER_ROLES.ADMIN),
  validate(updateTutorialSchema),
  updateTutorialCntlr,
);

tutorialRoutes.delete(
  '/:id',
  csrfGuard,
  authenticate,
  authorize(USER_ROLES.ADMIN),
  validate(tutorialIdParamSchema),
  deleteTutorialCntlr,
);

export default tutorialRoutes;

