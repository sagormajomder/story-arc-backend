import { tutorialService } from '@src/modules/tutorial/tutorial.service.js';
import type {
  CreateTutorialDto,
  GetTutorialsQueryDto,
  UpdateTutorialDto,
} from '@src/modules/tutorial/tutorial.validate.js';
import asyncCatch from '@src/shared/utils/asyncCatch.js';
import { HTTP_STATUS } from '@src/shared/utils/constants.js';
import sendResponse from '@src/shared/utils/sendResponse.js';
import type { Request, Response } from 'express';

export const getAllTutorialsCntlr = asyncCatch(
  async (req: Request, res: Response) => {
    const query = req.query as unknown as GetTutorialsQueryDto;
    const result = await tutorialService.getAllTutorials(query);

    sendResponse(res, {
      statusCode: HTTP_STATUS.OK,
      success: true,
      message: 'Tutorials retrieved successfully',
      meta: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
      },
      data: result.tutorials,
    });
  },
);

export const getTutorialByIdCntlr = asyncCatch(
  async (req: Request, res: Response) => {
    const { id } = req.params as { id: string };
    const tutorial = await tutorialService.getTutorialById(id);

    sendResponse(res, {
      statusCode: HTTP_STATUS.OK,
      success: true,
      message: 'Tutorial retrieved successfully',
      data: tutorial,
    });
  },
);

export const createTutorialCntlr = asyncCatch(
  async (req: Request, res: Response) => {
    const tutorialData: CreateTutorialDto = req.body;
    const tutorial = await tutorialService.createTutorial(tutorialData);

    sendResponse(res, {
      statusCode: HTTP_STATUS.CREATED,
      success: true,
      message: 'Tutorial created successfully',
      data: tutorial,
    });
  },
);

export const updateTutorialCntlr = asyncCatch(
  async (req: Request, res: Response) => {
    const { id } = req.params as { id: string };
    const updateData: UpdateTutorialDto = req.body;
    const updatedTutorial = await tutorialService.updateTutorial(id, updateData);

    sendResponse(res, {
      statusCode: HTTP_STATUS.OK,
      success: true,
      message: 'Tutorial updated successfully',
      data: updatedTutorial,
    });
  },
);

export const deleteTutorialCntlr = asyncCatch(
  async (req: Request, res: Response) => {
    const { id } = req.params as { id: string };
    await tutorialService.deleteTutorial(id);

    sendResponse(res, {
      statusCode: HTTP_STATUS.OK,
      success: true,
      message: 'Tutorial deleted successfully',
    });
  },
);

