import { toBookResponseDto } from '@src/modules/book/book.mapper.js';
import {
  bookRepository,
  type IBookRepository,
} from '@src/modules/book/book.repository.js';
import type {
  BookResponseDto,
  ICreateBookInput,
  IGetBooksResult,
  IUpdateBookInput,
} from '@src/modules/book/book.types.js';
import type { GetBooksQueryDto } from '@src/modules/book/book.validate.js';
import { AppError } from '@src/shared/errors/appError.js';
import { HTTP_STATUS } from '@src/shared/utils/constants.js';

export interface IBookService {
  createBook(data: ICreateBookInput): Promise<BookResponseDto>;
  getBookById(bookId: string): Promise<BookResponseDto>;
  getAllBooks(query: GetBooksQueryDto): Promise<IGetBooksResult>;
  updateBook(bookId: string, data: IUpdateBookInput): Promise<BookResponseDto>;
  deleteBook(bookId: string): Promise<void>;
  getDistinctGenres(): Promise<string[]>;
  countBooksByGenres(genres: string[]): Promise<Record<string, number>>;
  renameGenreInBooks(oldName: string, newName: string): Promise<number>;
  clearGenreFromBooks(genreName: string): Promise<number>;
}

export class BookService implements IBookService {
  constructor(private readonly repo: IBookRepository = bookRepository) {}

  async createBook(data: ICreateBookInput): Promise<BookResponseDto> {
    const book = await this.repo.create(data);
    return toBookResponseDto(book);
  }

  async getBookById(bookId: string): Promise<BookResponseDto> {
    const book = await this.repo.findById(bookId);
    if (!book) {
      throw new AppError('Book not found', HTTP_STATUS.NOT_FOUND);
    }
    return toBookResponseDto(book);
  }

  async getAllBooks(query: GetBooksQueryDto): Promise<IGetBooksResult> {
    const ids = query.ids
      ? query.ids
          .split(',')
          .map(id => id.trim())
          .filter(Boolean)
      : undefined;

    const { books, total } = await this.repo.findAll({
      page: query.page,
      limit: query.limit,
      search: query.search,
      genre: query.genre,
      minRating: query.minRating,
      maxRating: query.maxRating,
      sort: query.sort,
      ids,
    });

    const totalPages = Math.ceil(total / query.limit) || 1;

    return {
      books: books.map(toBookResponseDto),
      total,
      totalPages,
      page: query.page,
      limit: query.limit,
    };
  }

  async updateBook(
    bookId: string,
    data: IUpdateBookInput,
  ): Promise<BookResponseDto> {
    const updatedBook = await this.repo.update(bookId, data);
    if (!updatedBook) {
      throw new AppError('Book not found', HTTP_STATUS.NOT_FOUND);
    }
    return toBookResponseDto(updatedBook);
  }

  async deleteBook(bookId: string): Promise<void> {
    const deleted = await this.repo.delete(bookId);
    if (!deleted) {
      throw new AppError('Book not found', HTTP_STATUS.NOT_FOUND);
    }
  }

  async getDistinctGenres(): Promise<string[]> {
    return this.repo.getDistinctGenres();
  }

  async countBooksByGenres(
    genres: string[],
  ): Promise<Record<string, number>> {
    return this.repo.countBooksByGenres(genres);
  }

  async renameGenreInBooks(
    oldName: string,
    newName: string,
  ): Promise<number> {
    return this.repo.renameGenre(oldName, newName);
  }

  async clearGenreFromBooks(genreName: string): Promise<number> {
    return this.repo.clearGenre(genreName);
  }
}

export const bookService = new BookService();

