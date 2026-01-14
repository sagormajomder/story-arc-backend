import express from 'express';
import { addReview, getReviews } from '../controllers/reviewController.js';

const router = express.Router();

router.get('/:bookId', getReviews);
router.post('/', addReview);

export default router;
