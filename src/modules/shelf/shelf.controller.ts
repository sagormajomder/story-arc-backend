import { shelfService } from '@src/modules/shelf/shelf.service.js';
import type {
  AddToShelfDto,
  GetShelfQueryDto,
  UpdateReadingGoalDto,
  UpdateShelfProgressDto,
} from '@src/modules/shelf/shelf.validate.js';
import asyncCatch from '@src/shared/utils/asyncCatch.js';
import { HTTP_STATUS } from '@src/shared/utils/constants.js';
import sendResponse from '@src/shared/utils/sendResponse.js';
import type { Request, Response } from 'express';

// GET /api/v1/shelf
export const getMyShelfCntlr = asyncCatch(
  async (req: Request, res: Response) => {
    const authUser = req.user!;
    const query = req.query as unknown as GetShelfQueryDto;

    const result = await shelfService.getMyShelf({
      userId: authUser.userId,
      page: query.page,
      limit: query.limit,
      status: query.status,
      sort: query.sort,
    });

    sendResponse(res, {
      statusCode: HTTP_STATUS.OK,
      success: true,
      message: 'Shelf items retrieved successfully',
      meta: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
      },
      data: result.items,
    });
  },
);

// GET /api/v1/shelf/book/:bookId
export const checkBookInShelfCntlr = asyncCatch(
  async (req: Request, res: Response) => {
    const authUser = req.user!;
    const { bookId } = req.params as { bookId: string };

    const result = await shelfService.checkBookInShelf(
      authUser.userId,
      bookId,
    );

    sendResponse(res, {
      statusCode: HTTP_STATUS.OK,
      success: true,
      message: 'Book shelf status retrieved successfully',
      data: result,
    });
  },
);

// POST /api/v1/shelf
export const addToShelfCntlr = asyncCatch(
  async (req: Request, res: Response) => {
    const authUser = req.user!;
    const body: AddToShelfDto = req.body;

    const item = await shelfService.addToShelf(authUser.userId, body);

    sendResponse(res, {
      statusCode: HTTP_STATUS.CREATED,
      success: true,
      message: 'Book added to shelf successfully',
      data: item,
    });
  },
);

// PATCH /api/v1/shelf/book/:bookId
export const updateShelfProgressCntlr = asyncCatch(
  async (req: Request, res: Response) => {
    const authUser = req.user!;
    const { bookId } = req.params as { bookId: string };
    const body: UpdateShelfProgressDto = req.body;

    const item = await shelfService.updateShelfProgress(
      authUser.userId,
      bookId,
      body,
    );

    sendResponse(res, {
      statusCode: HTTP_STATUS.OK,
      success: true,
      message: 'Shelf progress updated successfully',
      data: item,
    });
  },
);

// DELETE /api/v1/shelf/book/:bookId
export const removeFromShelfCntlr = asyncCatch(
  async (req: Request, res: Response) => {
    const authUser = req.user!;
    const { bookId } = req.params as { bookId: string };

    await shelfService.removeFromShelf(authUser.userId, bookId);

    sendResponse(res, {
      statusCode: HTTP_STATUS.OK,
      success: true,
      message: 'Book removed from shelf successfully',
    });
  },
);

// GET /api/v1/shelf/stats
export const getMyShelfStatsCntlr = asyncCatch(
  async (req: Request, res: Response) => {
    const authUser = req.user!;
    const statsResult = await shelfService.getUserReadingStats(authUser.userId);

    sendResponse(res, {
      statusCode: HTTP_STATUS.OK,
      success: true,
      message: 'Reading stats retrieved successfully',
      data: statsResult,
    });
  },
);

// POST/PATCH /api/v1/shelf/goal
export const updateReadingGoalCntlr = asyncCatch(
  async (req: Request, res: Response) => {
    const authUser = req.user!;
    const body: UpdateReadingGoalDto = req.body;

    const goal = await shelfService.updateReadingGoal(
      authUser.userId,
      body.target,
      body.year,
    );

    sendResponse(res, {
      statusCode: HTTP_STATUS.OK,
      success: true,
      message: 'Reading goal updated successfully',
      data: goal,
    });
  },
);

// GET /api/v1/shelf/recommendations
export const getShelfRecommendationsCntlr = asyncCatch(
  async (req: Request, res: Response) => {
    const authUser = req.user!;
    const recommendations = await shelfService.getRecommendations(
      authUser.userId,
    );

    sendResponse(res, {
      statusCode: HTTP_STATUS.OK,
      success: true,
      message: 'Recommendations retrieved successfully',
      data: recommendations,
    });
  },
);

