import express from 'express';
import { loginUser, registerUser } from '../controllers/userController.js';

const router = express.Router();

import { validateUserRegistration } from '../middleware/userValidator.js';

router.post('/users', validateUserRegistration, registerUser);
router.post('/users/login', loginUser);

export default router;
