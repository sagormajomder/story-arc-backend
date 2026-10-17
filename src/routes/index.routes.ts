import authRoutes from '@src/modules/auth/auth.routes.js';
import bookRoutes from '@src/modules/book/book.routes.js';
import dashboardRoutes from '@src/modules/dashboard/dashboard.routes.js';
import genreRoutes from '@src/modules/genre/genre.routes.js';
import reviewRoutes from '@src/modules/review/review.routes.js';
import tutorialRoutes from '@src/modules/tutorial/tutorial.routes.js';
import userRoutes from '@src/modules/user/user.routes.js';
import express from 'express';
const router = express.Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/books', bookRoutes);
router.use('/genres', genreRoutes);
router.use('/reviews', reviewRoutes);
router.use('/tutorials', tutorialRoutes);
router.use('/dashboard', dashboardRoutes);

export default router;

