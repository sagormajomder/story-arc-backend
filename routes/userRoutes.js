import express from 'express';
import {
  googleLogin,
  loginUser,
  registerUser,
} from '../controllers/userController.js';
import { validateUserRegistration } from '../middleware/userValidator.js';

const router = express.Router();

router.post('/users', validateUserRegistration, registerUser);
router.post('/users/login', loginUser);
router.post('/users/google', googleLogin);

export default router;
