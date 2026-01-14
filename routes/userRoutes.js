import express from 'express';
import {
  addToShelf,
  getUserById,
  getUsers,
  googleLogin,
  loginUser,
  registerUser,
  updateUserRole,
} from '../controllers/userController.js';
import { validateUserRegistration } from '../middleware/userValidator.js';

const router = express.Router();

router.post('/users', validateUserRegistration, registerUser);
router.post('/users/login', loginUser);
router.post('/users/google', googleLogin);
router.get('/users', getUsers);
router.get('/users/:id', getUserById);
router.patch('/users/:id/role', updateUserRole);
router.post('/users/:id/shelf', addToShelf);

export default router;
