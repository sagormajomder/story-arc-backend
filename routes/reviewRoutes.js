import express from 'express';
import { addReview, getReviews } from '../controllers/reviewController.js';

import { verifyToken, verifyUser } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/:bookId', getReviews);
router.post('/', verifyToken, verifyUser, addReview);

export default router;
