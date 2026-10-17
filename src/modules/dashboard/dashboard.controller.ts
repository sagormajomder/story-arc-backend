import { dashboardService } from '@src/modules/dashboard/dashboard.service.js';
import asyncCatch from '@src/shared/utils/asyncCatch.js';
import { HTTP_STATUS } from '@src/shared/utils/constants.js';
import sendResponse from '@src/shared/utils/sendResponse.js';
import type { Request, Response } from 'express';

export const getDashboardStatsCntlr = asyncCatch(
  async (_req: Request, res: Response) => {
    const stats = await dashboardService.getDashboardStats();

    sendResponse(res, {
      statusCode: HTTP_STATUS.OK,
      success: true,
      message: 'Dashboard stats retrieved successfully',
      data: stats,
    });
  },
);

export const getDashboardChartsCntlr = asyncCatch(
  async (_req: Request, res: Response) => {
    const charts = await dashboardService.getDashboardCharts();

    sendResponse(res, {
      statusCode: HTTP_STATUS.OK,
      success: true,
      message: 'Dashboard chart data retrieved successfully',
      data: charts,
    });
  },
);

