import { userService } from '@src/modules/user/user.service.js';
import type {
  GetUsersQueryDto,
  UpdateProfileDto,
  UpdateUserRoleDto,
} from '@src/modules/user/user.validate.js';
import asyncCatch from '@src/shared/utils/asyncCatch.js';
import { HTTP_STATUS } from '@src/shared/utils/constants.js';
import sendResponse from '@src/shared/utils/sendResponse.js';
import type { Request, Response } from 'express';

export const getMeCntlr = asyncCatch(
  async (req: Request, res: Response) => {
    const user = await userService.getProfile(req.user!.userId);

    sendResponse(res, {
      statusCode: HTTP_STATUS.OK,
      success: true,
      message: 'Current user profile retrieved successfully',
      data: user,
    });
  },
);

export const updateMeCntlr = asyncCatch(
  async (req: Request, res: Response) => {
    const updateDto: UpdateProfileDto = req.body;
    const updatedUser = await userService.updateProfile(
      req.user!.userId,
      updateDto,
    );

    sendResponse(res, {
      statusCode: HTTP_STATUS.OK,
      success: true,
      message: 'Profile updated successfully',
      data: updatedUser,
    });
  },
);

export const getAllUsersCntlr = asyncCatch(
  async (req: Request, res: Response) => {
    const query = req.query as unknown as GetUsersQueryDto;
    const result = await userService.getAllUsers(query);

    sendResponse(res, {
      statusCode: HTTP_STATUS.OK,
      success: true,
      message: 'Users retrieved successfully',
      meta: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
      },
      data: {
        users: result.users,
        stats: result.stats,
      },
    });
  },
);

export const getUserByIdCntlr = asyncCatch(
  async (req: Request, res: Response) => {
    const { id } = req.params as { id: string };
    const user = await userService.getProfile(id);

    sendResponse(res, {
      statusCode: HTTP_STATUS.OK,
      success: true,
      message: 'User retrieved successfully',
      data: user,
    });
  },
);

export const updateUserRoleCntlr = asyncCatch(
  async (req: Request, res: Response) => {
    const { id } = req.params as { id: string };
    const { role }: UpdateUserRoleDto = req.body;
    const updatedUser = await userService.updateUserRole(id, role);

    sendResponse(res, {
      statusCode: HTTP_STATUS.OK,
      success: true,
      message: 'User role updated successfully',
      data: updatedUser,
    });
  },
);

