import express from 'express';
import {
  createTutorial,
  deleteTutorial,
  getTutorials,
  updateTutorial,
} from '../controllers/tutorialController.js';

const router = express.Router();

router.get('/', getTutorials);
router.post('/', createTutorial);
router.put('/:id', updateTutorial);
router.delete('/:id', deleteTutorial);

export default router;
