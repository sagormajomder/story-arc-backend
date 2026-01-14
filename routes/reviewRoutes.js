import express from 'express';
import {
  addReview,
  approveReview,
  deleteReview,
  getAdminReviews,
  getReviews,
} from '../controllers/reviewController.js';

import {
  verifyAdmin,
  verifyToken,
  verifyUser,
} from '../middleware/authMiddleware.js';

const router = express.Router();

// Public
router.get('/:bookId', getReviews);

// User
router.post('/', verifyToken, verifyUser, addReview);

// Admin
router.get('/admin/all', verifyToken, verifyAdmin, getAdminReviews);
router.patch('/:id/approve', verifyToken, verifyAdmin, approveReview);
router.delete('/:id', verifyToken, verifyAdmin, deleteReview);

export default router;
