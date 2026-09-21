import express from 'express';
import {
  createGenre,
  deleteGenre,
  getGenres,
  updateGenre,
} from '../controllers/genreController.js';

import { verifyAdmin, verifyToken } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', getGenres);
router.post('/', verifyToken, verifyAdmin, createGenre);
router.put('/:id', verifyToken, verifyAdmin, updateGenre);
router.delete('/:id', verifyToken, verifyAdmin, deleteGenre);

export default router;
