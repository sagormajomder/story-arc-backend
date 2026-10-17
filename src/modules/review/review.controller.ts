import { reviewService } from '@src/modules/review/review.service.js';
import type {
  CreateReviewDto,
  GetAdminReviewsQueryDto,
} from '@src/modules/review/review.validate.js';
import asyncCatch from '@src/shared/utils/asyncCatch.js';
import { HTTP_STATUS } from '@src/shared/utils/constants.js';
import sendResponse from '@src/shared/utils/sendResponse.js';
import type { Request, Response } from 'express';

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

export const approveReviewCntlr = asyncCatch(
  async (req: Request, res: Response) => {
    const { id } = req.params as { id: string };
    await reviewService.approveReview(id);

    sendResponse(res, {
      statusCode: HTTP_STATUS.OK,
      success: true,
      message: 'Review approved and ratings updated',
    });
  },
);

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

