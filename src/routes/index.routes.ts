import authRoutes from '@/src/modules/auth/auth.routes.js';
import express from 'express';
const router = express.Router();

router.use('/auth', authRoutes);

export default router;
