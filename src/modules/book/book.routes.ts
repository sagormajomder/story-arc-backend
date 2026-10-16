import {
  createBookCntlr,
  deleteBookCntlr,
  getAllBooksCntlr,
  getBookByIdCntlr,
  getGenresCntlr,
  updateBookCntlr,
} from '@src/modules/book/book.controller.js';
import {
  bookIdParamSchema,
  createBookSchema,
  getBooksQuerySchema,
  updateBookSchema,
} from '@src/modules/book/book.validate.js';
import {
  authenticate,
  authorize,
} from '@src/shared/middlewares/auth.middleware.js';
import { csrfGuard } from '@src/shared/middlewares/security.middleware.js';
import { validate } from '@src/shared/middlewares/validate.middleware.js';
import { USER_ROLES } from '@src/shared/utils/constants.js';
import express from 'express';

const bookRoutes = express.Router();

// Routes accessible by authenticated users (both users and admins)
bookRoutes.get('/genres', authenticate, getGenresCntlr);

bookRoutes.get(
  '/',
  authenticate,
  validate(getBooksQuerySchema),
  getAllBooksCntlr,
);

bookRoutes.get(
  '/:id',
  authenticate,
  validate(bookIdParamSchema),
  getBookByIdCntlr,
);

// Admin-only management routes (requires CSRF protection and Admin role)
bookRoutes.post(
  '/',
  csrfGuard,
  authenticate,
  authorize(USER_ROLES.ADMIN),
  validate(createBookSchema),
  createBookCntlr,
);

bookRoutes.patch(
  '/:id',
  csrfGuard,
  authenticate,
  authorize(USER_ROLES.ADMIN),
  validate(updateBookSchema),
  updateBookCntlr,
);

bookRoutes.delete(
  '/:id',
  csrfGuard,
  authenticate,
  authorize(USER_ROLES.ADMIN),
  validate(bookIdParamSchema),
  deleteBookCntlr,
);

export default bookRoutes;

