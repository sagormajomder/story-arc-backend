import express from 'express';
import { registerUser } from '../controllers/userController.js';

const router = express.Router();

import { validateUserRegistration } from '../middleware/userValidator.js';

router.post('/users', validateUserRegistration, registerUser);

export default router;
