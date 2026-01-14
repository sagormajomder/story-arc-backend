import express from 'express';
import {
  createGenre,
  deleteGenre,
  getGenres,
  updateGenre,
} from '../controllers/genreController.js';

const router = express.Router();

router.get('/', getGenres);
router.post('/', createGenre);
router.put('/:id', updateGenre);
router.delete('/:id', deleteGenre);

export default router;
