import express from 'express';
import {
  getDashboardCharts,
  getDashboardStats,
} from '../controllers/dashboardController.js';
import { verifyAdmin, verifyToken } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/stats', verifyToken, verifyAdmin, getDashboardStats);
router.get('/charts', verifyToken, verifyAdmin, getDashboardCharts);

export default router;
