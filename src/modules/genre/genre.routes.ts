import {
  createGenreCntlr,
  deleteGenreCntlr,
  getAllGenresCntlr,
  getGenreByIdCntlr,
  updateGenreCntlr,
} from '@src/modules/genre/genre.controller.js';
import {
  createGenreSchema,
  genreIdParamSchema,
  getGenresQuerySchema,
  updateGenreSchema,
} from '@src/modules/genre/genre.validate.js';
import {
  authenticate,
  authorize,
} from '@src/shared/middlewares/auth.middleware.js';
import { csrfGuard } from '@src/shared/middlewares/security.middleware.js';
import { validate } from '@src/shared/middlewares/validate.middleware.js';
import { USER_ROLES } from '@src/shared/utils/constants.js';
import express from 'express';

const genreRoutes = express.Router();

// Routes accessible by authenticated users
genreRoutes.get(
  '/',
  authenticate,
  validate(getGenresQuerySchema),
  getAllGenresCntlr,
);

genreRoutes.get(
  '/:id',
  authenticate,
  validate(genreIdParamSchema),
  getGenreByIdCntlr,
);

// Admin-only management routes (requires CSRF protection and Admin role)
genreRoutes.post(
  '/',
  csrfGuard,
  authenticate,
  authorize(USER_ROLES.ADMIN),
  validate(createGenreSchema),
  createGenreCntlr,
);

genreRoutes.patch(
  '/:id',
  csrfGuard,
  authenticate,
  authorize(USER_ROLES.ADMIN),
  validate(updateGenreSchema),
  updateGenreCntlr,
);

genreRoutes.delete(
  '/:id',
  csrfGuard,
  authenticate,
  authorize(USER_ROLES.ADMIN),
  validate(genreIdParamSchema),
  deleteGenreCntlr,
);

export default genreRoutes;

