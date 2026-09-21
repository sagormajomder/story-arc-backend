import express from 'express';
import {
  createBook,
  deleteBook,
  getBookById,
  getBooks,
  getGenres,
  updateBook,
} from '../controllers/bookController.js';

import { verifyAdmin, verifyToken } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/genres', getGenres);
router.get('/', getBooks);
router.get('/:id', getBookById);
router.post('/', verifyToken, verifyAdmin, createBook);
router.put('/:id', verifyToken, verifyAdmin, updateBook);
router.delete('/:id', verifyToken, verifyAdmin, deleteBook);

export default router;
