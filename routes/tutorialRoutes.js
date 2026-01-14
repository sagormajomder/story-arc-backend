import express from 'express';
import {
  createTutorial,
  deleteTutorial,
  getTutorials,
  updateTutorial,
} from '../controllers/tutorialController.js';

import { verifyAdmin, verifyToken } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', getTutorials);
router.post('/', verifyToken, verifyAdmin, createTutorial);
router.put('/:id', verifyToken, verifyAdmin, updateTutorial);
router.delete('/:id', verifyToken, verifyAdmin, deleteTutorial);

export default router;
