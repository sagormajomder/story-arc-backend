import { reviewService } from '@src/modules/review/review.service.js';
import type {
  CreateReviewDto,
  GetAdminReviewsQueryDto,
  UpdateMyReviewDto,
  UpdateReviewStatusDto,
} from '@src/modules/review/review.validate.js';
import asyncCatch from '@src/shared/utils/asyncCatch.js';
import { HTTP_STATUS } from '@src/shared/utils/constants.js';
import sendResponse from '@src/shared/utils/sendResponse.js';
import type { Request, Response } from 'express';

// GET /api/v1/reviews/book/:bookId
export const getBookReviewsCntlr = asyncCatch(
  async (req: Request, res: Response) => {
    const { bookId } = req.params as { bookId: string };
    const reviews = await reviewService.getBookReviews(bookId);

    sendResponse(res, {
      statusCode: HTTP_STATUS.OK,
      success: true,
      message: 'Reviews retrieved successfully',
      data: reviews,
    });
  },
);

// GET /api/v1/reviews/me
export const getMyReviewsCntlr = asyncCatch(
  async (req: Request, res: Response) => {
    const authUser = req.user!;
    const reviews = await reviewService.getMyReviews(authUser.userId);

    sendResponse(res, {
      statusCode: HTTP_STATUS.OK,
      success: true,
      message: 'My reviews retrieved successfully',
      data: reviews,
    });
  },
);

// POST /api/v1/reviews
export const submitReviewCntlr = asyncCatch(
  async (req: Request, res: Response) => {
    const authUser = req.user!;
    const body: CreateReviewDto = req.body;

    const review = await reviewService.submitReview({
      bookId: body.bookId,
      userId: authUser.userId,
      rating: body.rating,
      comment: body.comment,
    });

    sendResponse(res, {
      statusCode: HTTP_STATUS.CREATED,
      success: true,
      message: 'Review submitted for moderation',
      data: review,
    });
  },
);

// GET /api/v1/reviews/admin
export const getAdminReviewsCntlr = asyncCatch(
  async (req: Request, res: Response) => {
    const query = req.query as unknown as GetAdminReviewsQueryDto;
    const result = await reviewService.getAdminReviews(query);

    sendResponse(res, {
      statusCode: HTTP_STATUS.OK,
      success: true,
      message: 'Admin reviews retrieved successfully',
      meta: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
      },
      data: result.reviews,
    });
  },
);

// PATCH /api/v1/reviews/:id/status
export const updateReviewStatusCntlr = asyncCatch(
  async (req: Request, res: Response) => {
    const { id } = req.params as { id: string };
    const body: UpdateReviewStatusDto = req.body;
    const updatedReview = await reviewService.updateReviewStatus(
      id,
      body.status,
      body.rejectionReason,
    );

    sendResponse(res, {
      statusCode: HTTP_STATUS.OK,
      success: true,
      message: `Review status updated to ${body.status}`,
      data: updatedReview,
    });
  },
);

// PATCH /api/v1/reviews/:id
export const updateMyReviewCntlr = asyncCatch(
  async (req: Request, res: Response) => {
    const authUser = req.user!;
    const { id } = req.params as { id: string };
    const body: UpdateMyReviewDto = req.body;

    const updatedReview = await reviewService.updateMyReview(
      id,
      authUser.userId,
      body,
    );

    sendResponse(res, {
      statusCode: HTTP_STATUS.OK,
      success: true,
      message: 'Review updated and submitted for moderation',
      data: updatedReview,
    });
  },
);

// DELETE /api/v1/reviews/:id
export const deleteReviewCntlr = asyncCatch(
  async (req: Request, res: Response) => {
    const { id } = req.params as { id: string };
    await reviewService.deleteReview(id);

    sendResponse(res, {
      statusCode: HTTP_STATUS.OK,
      success: true,
      message: 'Review deleted successfully',
    });
  },
);
