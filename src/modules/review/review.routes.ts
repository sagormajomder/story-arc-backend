import {
  deleteReviewCntlr,
  getAdminReviewsCntlr,
  getBookReviewsCntlr,
  getMyReviewsCntlr,
  submitReviewCntlr,
  updateMyReviewCntlr,
  updateReviewStatusCntlr,
} from '@src/modules/review/review.controller.js';
import {
  bookIdReviewParamSchema,
  createReviewSchema,
  getAdminReviewsQuerySchema,
  reviewIdParamSchema,
  updateMyReviewSchema,
  updateReviewStatusSchema,
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

// 1. Current User: View all reviews submitted by me
reviewRoutes.get(
  '/me',
  authenticate,
  getMyReviewsCntlr,
);

// 2. Authenticated Users: View approved reviews for a specific book
reviewRoutes.get(
  '/book/:bookId',
  authenticate,
  validate(bookIdReviewParamSchema),
  getBookReviewsCntlr,
);

// 3. Admin: View all reviews (filter by status: pending / approved / rejected)
reviewRoutes.get(
  '/admin',
  authenticate,
  authorize(USER_ROLES.ADMIN),
  validate(getAdminReviewsQuerySchema),
  getAdminReviewsCntlr,
);

// 4. Admin: Update review status (approved / rejected / pending)
reviewRoutes.patch(
  '/:id/status',
  csrfGuard,
  authenticate,
  authorize(USER_ROLES.ADMIN),
  validate(updateReviewStatusSchema),
  updateReviewStatusCntlr,
);

// 5. Authenticated User: Update / resubmit own review (Resets status to pending moderation)
reviewRoutes.patch(
  '/:id',
  csrfGuard,
  authenticate,
  validate(updateMyReviewSchema),
  updateMyReviewCntlr,
);

// 6. Admin: Delete review (Recalculates book rating if approved)
reviewRoutes.delete(
  '/:id',
  csrfGuard,
  authenticate,
  authorize(USER_ROLES.ADMIN),
  validate(reviewIdParamSchema),
  deleteReviewCntlr,
);

// 7. Authenticated User / Admin: Submit new review (Defaults to pending moderation)
reviewRoutes.post(
  '/',
  csrfGuard,
  authenticate,
  validate(createReviewSchema),
  submitReviewCntlr,
);

export default reviewRoutes;
