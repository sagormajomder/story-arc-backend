import express from 'express';
import {
  addToShelf,
  getRecommendations,
  getUserById,
  getUsers,
  getUserStats,
  googleLogin,
  loginUser,
  registerUser,
  updateReadingGoal,
  updateShelfProgress,
  updateUserRole,
} from '../controllers/userController.js';
import { validateUserRegistration } from '../middleware/userValidator.js';

import {
  verifyAdmin,
  verifyToken,
  verifyUser,
} from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/users', validateUserRegistration, registerUser);
router.post('/users/login', loginUser);
router.post('/users/google', googleLogin);
router.get('/users', verifyToken, verifyAdmin, getUsers);
router.get('/users/:id', verifyToken, verifyUser, getUserById);
router.patch('/users/:id/role', verifyToken, verifyAdmin, updateUserRole);
router.post('/users/:id/shelf', verifyToken, verifyUser, addToShelf);
router.patch(
  '/users/:id/shelf/:bookId',
  verifyToken,
  verifyUser,
  updateShelfProgress
);
router.get('/users/:id/stats', verifyToken, verifyUser, getUserStats);
router.get(
  '/users/:id/recommendations',
  verifyToken,
  verifyUser,
  getRecommendations
);
router.post('/users/:id/goal', verifyToken, verifyUser, updateReadingGoal);

export default router;
