import {
  getDashboardChartsCntlr,
  getDashboardStatsCntlr,
} from '@src/modules/dashboard/dashboard.controller.js';
import {
  authenticate,
  authorize,
} from '@src/shared/middlewares/auth.middleware.js';
import { USER_ROLES } from '@src/shared/utils/constants.js';
import express from 'express';

const dashboardRoutes = express.Router();

dashboardRoutes.get(
  '/stats',
  authenticate,
  authorize(USER_ROLES.ADMIN),
  getDashboardStatsCntlr,
);

dashboardRoutes.get(
  '/charts',
  authenticate,
  authorize(USER_ROLES.ADMIN),
  getDashboardChartsCntlr,
);

export default dashboardRoutes;

