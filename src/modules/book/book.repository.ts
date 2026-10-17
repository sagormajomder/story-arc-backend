import { Book } from '@src/modules/book/book.model.js';
import type {
  IBookPlainDBResponse,
  ICreateBookInput,
  IFindAllBooksOptions,
  IUpdateBookInput,
} from '@src/modules/book/book.types.js';
import { BOOK_SORT_OPTIONS } from '@src/shared/utils/constants.js';

export interface IBookRepository {
  create(bookData: ICreateBookInput): Promise<IBookPlainDBResponse>;
  findById(bookId: string): Promise<IBookPlainDBResponse | null>;
  findAll(options: IFindAllBooksOptions): Promise<{
    books: IBookPlainDBResponse[];
    total: number;
  }>;
  update(
    bookId: string,
    data: IUpdateBookInput,
  ): Promise<IBookPlainDBResponse | null>;
  delete(bookId: string): Promise<boolean>;
  getDistinctGenres(): Promise<string[]>;
  countBooksByGenres(genres: string[]): Promise<Record<string, number>>;
  renameGenre(oldName: string, newName: string): Promise<number>;
  clearGenre(genreName: string): Promise<number>;
  updateRating(
    bookId: string,
    rating: number,
    totalRatings: number,
  ): Promise<IBookPlainDBResponse | null>;
}

export class BookRepository implements IBookRepository {
  constructor(private readonly model = Book) {}

  async create(bookData: ICreateBookInput): Promise<IBookPlainDBResponse> {
    const bookDoc = await this.model.create(bookData);
    return bookDoc.toObject() as unknown as IBookPlainDBResponse;
  }

  async findById(bookId: string): Promise<IBookPlainDBResponse | null> {
    const bookDoc = await this.model.findById(bookId).exec();
    if (!bookDoc) {
      return null;
    }
    return bookDoc.toObject() as unknown as IBookPlainDBResponse;
  }

  async findAll(options: IFindAllBooksOptions): Promise<{
    books: IBookPlainDBResponse[];
    total: number;
  }> {
    const filter: Record<string, unknown> = {};
    const andConditions: Record<string, unknown>[] = [];

    // Filter by specific IDs (e.g. for user shelf/library)
    if (options.ids && options.ids.length > 0) {
      andConditions.push({ _id: { $in: options.ids } });
    }

    // Search by title or author
    if (options.search) {
      andConditions.push({
        $or: [
          { title: { $regex: options.search, $options: 'i' } },
          { author: { $regex: options.search, $options: 'i' } },
        ],
      });
    }

    // Genre filter with support for comma-separated multiple genres & Uncategorized
    if (options.genre && options.genre !== 'All Genres') {
      const genres = options.genre
        .split(',')
        .map(g => g.trim())
        .filter(Boolean);

      const genreOrConditions: Record<string, unknown>[] = [];
      const realGenres = genres.filter(g => g !== 'Uncategorized');

      if (realGenres.length > 0) {
        genreOrConditions.push({ genre: { $in: realGenres } });
      }

      if (genres.includes('Uncategorized')) {
        genreOrConditions.push({ genre: { $in: [null, ''] } });
        genreOrConditions.push({ genre: { $exists: false } });
      }

      if (genreOrConditions.length > 0) {
        andConditions.push({ $or: genreOrConditions });
      }
    }

    // Rating range filter
    if (options.minRating !== undefined || options.maxRating !== undefined) {
      const ratingFilter: Record<string, number> = {};
      if (options.minRating !== undefined) {
        ratingFilter.$gte = options.minRating;
      }
      if (options.maxRating !== undefined) {
        ratingFilter.$lte = options.maxRating;
      }
      andConditions.push({ rating: ratingFilter });
    }

    if (andConditions.length > 0) {
      filter.$and = andConditions;
    }

    // Sorting
    let sortOptions: Record<string, 1 | -1> = { createdAt: -1 };
    if (options.sort === BOOK_SORT_OPTIONS.RATING_DESC) {
      sortOptions = { rating: -1 };
    } else if (options.sort === BOOK_SORT_OPTIONS.SHELVED_DESC) {
      sortOptions = { shelvedCount: -1 };
    } else if (options.sort === BOOK_SORT_OPTIONS.TITLE_ASC) {
      sortOptions = { title: 1 };
    } else if (options.sort === BOOK_SORT_OPTIONS.TITLE_DESC) {
      sortOptions = { title: -1 };
    } else if (options.sort === BOOK_SORT_OPTIONS.NEWEST) {
      sortOptions = { createdAt: -1 };
    }

    const skip = (options.page - 1) * options.limit;

    const [bookDocs, total] = await Promise.all([
      this.model
        .find(filter)
        .sort(sortOptions)
        .skip(skip)
        .limit(options.limit)
        .exec(),
      this.model.countDocuments(filter).exec(),
    ]);

    const books = bookDocs.map(
      doc => doc.toObject() as unknown as IBookPlainDBResponse,
    );

    return { books, total };
  }

  async update(
    bookId: string,
    data: IUpdateBookInput,
  ): Promise<IBookPlainDBResponse | null> {
    const bookDoc = await this.model
      .findByIdAndUpdate(
        bookId,
        { $set: data },
        { new: true, runValidators: true },
      )
      .exec();

    if (!bookDoc) {
      return null;
    }

    return bookDoc.toObject() as unknown as IBookPlainDBResponse;
  }

  async delete(bookId: string): Promise<boolean> {
    const result = await this.model.findByIdAndDelete(bookId).exec();
    return result !== null;
  }

  async getDistinctGenres(): Promise<string[]> {
    const genres = await this.model
      .aggregate<{ genre?: string | null }>([
        { $group: { _id: '$genre' } },
        { $sort: { _id: 1 } },
        { $project: { _id: 0, genre: '$_id' } },
      ])
      .exec();

    const genreStrings = genres
      .map(g => g.genre)
      .filter((g): g is string => typeof g === 'string' && g.trim() !== '');

    const hasUncategorized = genres.some(
      g => !g.genre || g.genre.trim() === '',
    );

    if (hasUncategorized && !genreStrings.includes('Uncategorized')) {
      genreStrings.push('Uncategorized');
    }

    return genreStrings;
  }

  async countBooksByGenres(genres: string[]): Promise<Record<string, number>> {
    if (genres.length === 0) {
      return {};
    }

    const counts = await this.model
      .aggregate<{ _id: string; count: number }>([
        { $match: { genre: { $in: genres } } },
        { $group: { _id: '$genre', count: { $sum: 1 } } },
      ])
      .exec();

    const result: Record<string, number> = {};
    for (const genre of genres) {
      result[genre] = 0;
    }
    for (const item of counts) {
      result[item._id] = item.count;
    }

    return result;
  }

  async renameGenre(oldName: string, newName: string): Promise<number> {
    const result = await this.model
      .updateMany({ genre: oldName }, { $set: { genre: newName } })
      .exec();
    return result.modifiedCount;
  }

  async clearGenre(genreName: string): Promise<number> {
    const result = await this.model
      .updateMany({ genre: genreName }, { $set: { genre: '' } })
      .exec();
    return result.modifiedCount;
  }

  async updateRating(
    bookId: string,
    rating: number,
    totalRatings: number,
  ): Promise<IBookPlainDBResponse | null> {
    const bookDoc = await this.model
      .findByIdAndUpdate(
        bookId,
        { $set: { rating, totalRatings } },
        { returnDocument: 'after', runValidators: true },
      )
      .exec();

    if (!bookDoc) {
      return null;
    }

    return bookDoc.toObject() as unknown as IBookPlainDBResponse;
  }
}

export const bookRepository = new BookRepository();

