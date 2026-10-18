import {
  addToShelfCntlr,
  checkBookInShelfCntlr,
  getMyShelfCntlr,
  getMyShelfStatsCntlr,
  getShelfRecommendationsCntlr,
  removeFromShelfCntlr,
  updateReadingGoalCntlr,
  updateShelfProgressCntlr,
} from '@src/modules/shelf/shelf.controller.js';
import {
  addToShelfSchema,
  bookIdShelfParamSchema,
  getShelfQuerySchema,
  updateReadingGoalSchema,
  updateShelfProgressSchema,
} from '@src/modules/shelf/shelf.validate.js';
import { authenticate } from '@src/shared/middlewares/auth.middleware.js';
import { csrfGuard } from '@src/shared/middlewares/security.middleware.js';
import { validate } from '@src/shared/middlewares/validate.middleware.js';
import express from 'express';

const shelfRoutes = express.Router();

// 1. Reading Stats & Goals
shelfRoutes.get('/stats', authenticate, getMyShelfStatsCntlr);
shelfRoutes.post(
  '/goal',
  csrfGuard,
  authenticate,
  validate(updateReadingGoalSchema),
  updateReadingGoalCntlr,
);
shelfRoutes.patch(
  '/goal',
  csrfGuard,
  authenticate,
  validate(updateReadingGoalSchema),
  updateReadingGoalCntlr,
);

// 2. Recommendations (Books not on shelf)
shelfRoutes.get(
  '/recommendations',
  authenticate,
  getShelfRecommendationsCntlr,
);

// 3. Check specific book in shelf
shelfRoutes.get(
  '/book/:bookId',
  authenticate,
  validate(bookIdShelfParamSchema),
  checkBookInShelfCntlr,
);

// 4. Update progress/status of a specific book in shelf
shelfRoutes.patch(
  '/book/:bookId',
  csrfGuard,
  authenticate,
  validate(updateShelfProgressSchema),
  updateShelfProgressCntlr,
);

// 5. Remove a specific book from shelf
shelfRoutes.delete(
  '/book/:bookId',
  csrfGuard,
  authenticate,
  validate(bookIdShelfParamSchema),
  removeFromShelfCntlr,
);

// 6. User Shelf Collection: List & Add
shelfRoutes.get('/', authenticate, validate(getShelfQuerySchema), getMyShelfCntlr);
shelfRoutes.post(
  '/',
  csrfGuard,
  authenticate,
  validate(addToShelfSchema),
  addToShelfCntlr,
);

export default shelfRoutes;

