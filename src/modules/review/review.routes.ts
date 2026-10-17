import {
  approveReviewCntlr,
  deleteReviewCntlr,
  getAdminReviewsCntlr,
  getBookReviewsCntlr,
  submitReviewCntlr,
} from '@src/modules/review/review.controller.js';
import {
  bookIdReviewParamSchema,
  createReviewSchema,
  getAdminReviewsQuerySchema,
  reviewIdParamSchema,
} from '@src/modules/review/review.validate.js';
import {
  authenticate,
  authorize,
} from '@src/shared/middlewares/auth.middleware.js';
import { csrfGuard } from '@src/shared/middlewares/security.middleware.js';
import { validate } from '@src/shared/middlewares/validate.middleware.js';
import { USER_ROLES } from '@src/shared/utils/constants.js';
import express from 'express';

const reviewRoutes = express.Router();

// 1. Admin: View all reviews (filterable by status: pending / approved)
reviewRoutes.get(
  '/admin/all',
  authenticate,
  authorize(USER_ROLES.ADMIN),
  validate(getAdminReviewsQuerySchema),
  getAdminReviewsCntlr,
);

// 2. Admin: Approve review (Updates book rating & totalRatings)
reviewRoutes.patch(
  '/:id/approve',
  csrfGuard,
  authenticate,
  authorize(USER_ROLES.ADMIN),
  validate(reviewIdParamSchema),
  approveReviewCntlr,
);

// 3. Admin: Delete review (Recalculates book rating if approved)
reviewRoutes.delete(
  '/:id',
  csrfGuard,
  authenticate,
  authorize(USER_ROLES.ADMIN),
  validate(reviewIdParamSchema),
  deleteReviewCntlr,
);

// 4. User: Submit new review (Defaults to pending moderation)
reviewRoutes.post(
  '/',
  csrfGuard,
  authenticate,
  authorize(USER_ROLES.USER),
  validate(createReviewSchema),
  submitReviewCntlr,
);

// 5. Authenticated Users: View approved reviews for a specific book
reviewRoutes.get(
  '/:bookId',
  authenticate,
  validate(bookIdReviewParamSchema),
  getBookReviewsCntlr,
);

export default reviewRoutes;

