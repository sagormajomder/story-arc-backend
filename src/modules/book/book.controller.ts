import { bookService } from '@src/modules/book/book.service.js';
import type {
  CreateBookDto,
  GetBooksQueryDto,
  UpdateBookDto,
} from '@src/modules/book/book.validate.js';
import asyncCatch from '@src/shared/utils/asyncCatch.js';
import { HTTP_STATUS } from '@src/shared/utils/constants.js';
import sendResponse from '@src/shared/utils/sendResponse.js';
import type { Request, Response } from 'express';

export const getAllBooksCntlr = asyncCatch(
  async (req: Request, res: Response) => {
    const query = req.query as unknown as GetBooksQueryDto;
    const result = await bookService.getAllBooks(query);

    sendResponse(res, {
      statusCode: HTTP_STATUS.OK,
      success: true,
      message: 'Books retrieved successfully',
      meta: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
      },
      data: result.books,
    });
  },
);

export const getBookByIdCntlr = asyncCatch(
  async (req: Request, res: Response) => {
    const { id } = req.params as { id: string };
    const book = await bookService.getBookById(id);

    sendResponse(res, {
      statusCode: HTTP_STATUS.OK,
      success: true,
      message: 'Book retrieved successfully',
      data: book,
    });
  },
);

export const getGenresCntlr = asyncCatch(
  async (_req: Request, res: Response) => {
    const genres = await bookService.getDistinctGenres();

    sendResponse(res, {
      statusCode: HTTP_STATUS.OK,
      success: true,
      message: 'Genres retrieved successfully',
      data: genres,
    });
  },
);

export const createBookCntlr = asyncCatch(
  async (req: Request, res: Response) => {
    const bookData: CreateBookDto = req.body;
    const book = await bookService.createBook(bookData);

    sendResponse(res, {
      statusCode: HTTP_STATUS.CREATED,
      success: true,
      message: 'Book created successfully',
      data: book,
    });
  },
);

export const updateBookCntlr = asyncCatch(
  async (req: Request, res: Response) => {
    const { id } = req.params as { id: string };
    const updateData: UpdateBookDto = req.body;
    const updatedBook = await bookService.updateBook(id, updateData);

    sendResponse(res, {
      statusCode: HTTP_STATUS.OK,
      success: true,
      message: 'Book updated successfully',
      data: updatedBook,
    });
  },
);

export const deleteBookCntlr = asyncCatch(
  async (req: Request, res: Response) => {
    const { id } = req.params as { id: string };
    await bookService.deleteBook(id);

    sendResponse(res, {
      statusCode: HTTP_STATUS.OK,
      success: true,
      message: 'Book deleted successfully',
    });
  },
);

