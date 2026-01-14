import express from 'express';
import {
  createBook,
  deleteBook,
  getBookById,
  getBooks,
  getGenres,
  updateBook,
} from '../controllers/bookController.js';

const router = express.Router();

router.get('/genres', getGenres);
router.get('/', getBooks);
router.get('/:id', getBookById);
router.post('/', createBook);
router.put('/:id', updateBook);
router.delete('/:id', deleteBook);

export default router;
