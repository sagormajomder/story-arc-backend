import {
  bookService as defaultBookService,
  type BookResponseDto,
  type IBookService,
} from '@src/modules/book/book.index.js';
import { reviewService as defaultReviewService, type IReviewService } from '@src/modules/review/review.index.js';
import { toShelfItemResponseDto } from '@src/modules/shelf/shelf.mapper.js';
import {
  shelfRepository as defaultShelfRepository,
  type IShelfRepository,
} from '@src/modules/shelf/shelf.repository.js';
import type {
  IAddToShelfInput,
  ICheckShelfResponse,
  IFindShelfOptions,
  IGetShelfResult,
  IReadingStatsResponse,
  IUpdateShelfProgressInput,
  ReadingGoalResponseDto,
  ShelfItemResponseDto,
} from '@src/modules/shelf/shelf.types.js';
import {
  calculateReadingStreak,
  getActiveStreak,
} from '@src/modules/shelf/shelf.utils.js';
import { AppError } from '@src/shared/errors/appError.js';
import { HTTP_STATUS, SHELF_STATUS } from '@src/shared/utils/constants.js';

export interface IShelfService {
  addToShelf(
    userId: string,
    input: IAddToShelfInput,
  ): Promise<ShelfItemResponseDto>;
  updateShelfProgress(
    userId: string,
    bookId: string,
    input: IUpdateShelfProgressInput,
  ): Promise<ShelfItemResponseDto>;
  removeFromShelf(userId: string, bookId: string): Promise<void>;
  getMyShelf(options: IFindShelfOptions): Promise<IGetShelfResult>;
  checkBookInShelf(
    userId: string,
    bookId: string,
  ): Promise<ICheckShelfResponse>;
  getUserReadingStats(userId: string): Promise<IReadingStatsResponse>;
  updateReadingGoal(
    userId: string,
    target: number,
    year?: number,
  ): Promise<ReadingGoalResponseDto>;
  getRecommendations(userId: string): Promise<BookResponseDto[]>;
}

export class ShelfService implements IShelfService {
  constructor(
    private readonly repo: IShelfRepository = defaultShelfRepository,
    private readonly bookService: IBookService = defaultBookService,
    private readonly reviewService: IReviewService = defaultReviewService,
  ) {}

  async addToShelf(
    userId: string,
    input: IAddToShelfInput,
  ): Promise<ShelfItemResponseDto> {
    const book = await this.bookService.getBookById(input.bookId);

    const existing = await this.repo.findByUserAndBook(userId, input.bookId);

    if (existing) {
      const status = input.status || existing.status;
      let startedAt = existing.startedAt;
      let finishedAt = existing.finishedAt;

      if (status === SHELF_STATUS.CURRENTLY_READING && !startedAt) {
        startedAt = new Date();
      }
      if (status === SHELF_STATUS.READ && !finishedAt) {
        finishedAt = new Date();
      }

      const updated = await this.repo.update(userId, input.bookId, {
        status,
        ...(input.progress !== undefined ? { progress: input.progress } : {}),
        ...(input.totalPages !== undefined
          ? { totalPages: input.totalPages }
          : {}),
        startedAt,
        finishedAt,
      });

      if (
        (input.progress !== undefined && input.progress > 0) ||
        status === SHELF_STATUS.READ
      ) {
        await this.updateReadingStreak(userId);
      }

      if (!updated) {
        throw new AppError(
          'Failed to update shelf item',
          HTTP_STATUS.INTERNAL_SERVER_ERROR,
        );
      }

      return toShelfItemResponseDto(updated);
    }

    const status = input.status || SHELF_STATUS.WANT_TO_READ;
    const startedAt =
      status === SHELF_STATUS.CURRENTLY_READING
        ? new Date()
        : status === SHELF_STATUS.READ
          ? new Date()
          : null;
    const finishedAt = status === SHELF_STATUS.READ ? new Date() : null;

    try {
      const created = await this.repo.create({
        userId,
        bookId: input.bookId,
        status,
        progress: input.progress ?? 0,
        totalPages: input.totalPages ?? 0,
        startedAt,
        finishedAt,
        addedAt: new Date(),
      });

      await this.bookService.adjustShelvedCount(input.bookId, 1);

      if (
        (input.progress !== undefined && input.progress > 0) ||
        status === SHELF_STATUS.READ
      ) {
        await this.updateReadingStreak(userId);
      }

      created.book = book;
      return toShelfItemResponseDto(created);
    } catch (error: unknown) {
      // Handle concurrent creation race condition gracefully
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        (error as { code: number }).code === 11000
      ) {
        const updated = await this.repo.update(userId, input.bookId, {
          status,
          ...(input.progress !== undefined ? { progress: input.progress } : {}),
          ...(input.totalPages !== undefined
            ? { totalPages: input.totalPages }
            : {}),
          startedAt,
          finishedAt,
        });

        if (!updated) {
          throw new AppError(
            'Failed to add book to shelf',
            HTTP_STATUS.INTERNAL_SERVER_ERROR,
          );
        }

        return toShelfItemResponseDto(updated);
      }
      throw error;
    }
  }

  async updateShelfProgress(
    userId: string,
    bookId: string,
    input: IUpdateShelfProgressInput,
  ): Promise<ShelfItemResponseDto> {
    const existing = await this.repo.findByUserAndBook(userId, bookId);
    if (!existing) {
      throw new AppError(
        'Book not found in your shelf',
        HTTP_STATUS.NOT_FOUND,
      );
    }

    let newStatus = input.status ?? existing.status;
    let finishedAt = existing.finishedAt;
    const progress =
      input.progress !== undefined ? input.progress : existing.progress;
    const totalPages =
      input.totalPages !== undefined ? input.totalPages : existing.totalPages;

    if (totalPages > 0 && progress >= totalPages) {
      newStatus = SHELF_STATUS.READ;
      if (!finishedAt) {
        finishedAt = new Date();
      }
    }

    let startedAt = existing.startedAt;
    if (newStatus === SHELF_STATUS.CURRENTLY_READING && !startedAt) {
      startedAt = new Date();
    }
    if (newStatus === SHELF_STATUS.READ && !finishedAt) {
      finishedAt = new Date();
    }

    const updated = await this.repo.update(userId, bookId, {
      progress,
      totalPages,
      status: newStatus,
      startedAt,
      finishedAt,
    });

    if (
      (input.progress !== undefined && input.progress > 0) ||
      newStatus === SHELF_STATUS.READ
    ) {
      await this.updateReadingStreak(userId);
    }

    if (!updated) {
      throw new AppError(
        'Book not found in your shelf',
        HTTP_STATUS.NOT_FOUND,
      );
    }

    return toShelfItemResponseDto(updated);
  }

  async removeFromShelf(userId: string, bookId: string): Promise<void> {
    const deleted = await this.repo.deleteByUserAndBook(userId, bookId);
    if (!deleted) {
      throw new AppError(
        'Book not found in your shelf',
        HTTP_STATUS.NOT_FOUND,
      );
    }

    await this.bookService.adjustShelvedCount(bookId, -1);
  }

  async getMyShelf(options: IFindShelfOptions): Promise<IGetShelfResult> {
    const { items, total } = await this.repo.findUserShelf(options);
    const totalPages = Math.ceil(total / options.limit) || 1;

    return {
      items: items.map(toShelfItemResponseDto),
      total,
      totalPages,
      page: options.page,
      limit: options.limit,
    };
  }

  async checkBookInShelf(
    userId: string,
    bookId: string,
  ): Promise<ICheckShelfResponse> {
    const existing = await this.repo.findByUserAndBook(userId, bookId);
    return {
      isInShelf: !!existing,
      shelfItem: existing ? toShelfItemResponseDto(existing) : null,
    };
  }

  async getUserReadingStats(userId: string): Promise<IReadingStatsResponse> {
    const currentYear = new Date().getFullYear();
    const { booksReadThisYear, totalPagesRead, totalBooksRead } =
      await this.repo.getUserShelfStats(userId, currentYear);
    const streak = await this.getReadingStreak(userId);

    const userReviews = await this.reviewService.getMyReviews(userId);
    const totalUserRatings = userReviews.length;
    const sumRatings = userReviews.reduce(
      (acc, r) => acc + (r.rating || 0),
      0,
    );
    const averageRating =
      totalUserRatings > 0
        ? parseFloat((sumRatings / totalUserRatings).toFixed(1))
        : 0;

    const goalDoc = await this.repo.findReadingGoal(userId, currentYear);
    const target = goalDoc?.target ?? 20;

    const goal: ReadingGoalResponseDto = {
      year: currentYear,
      target,
      current: booksReadThisYear,
    };

    return {
      stats: {
        booksReadThisYear,
        totalPagesRead,
        totalBooksRead,
        streak,
        averageRating,
        totalUserRatings,
      },
      goal,
    };
  }

  async updateReadingGoal(
    userId: string,
    target: number,
    year?: number,
  ): Promise<ReadingGoalResponseDto> {
    const targetYear = year ?? new Date().getFullYear();
    await this.repo.upsertReadingGoal(userId, targetYear, target);

    const booksReadThisYear = await this.repo.countBooksReadInYear(
      userId,
      targetYear,
    );

    return {
      year: targetYear,
      target,
      current: booksReadThisYear,
    };
  }

  async getRecommendations(userId: string): Promise<BookResponseDto[]> {
    const shelvedBookIds = await this.repo.getShelvedBookIds(userId);
    return this.bookService.getTopRecommendations(shelvedBookIds, 15);
  }

  private async getReadingStreak(userId: string): Promise<number> {
    const streakDoc = await this.repo.findReadingStreak(userId);
    if (!streakDoc) {
      return 0;
    }

    const currentStreak = streakDoc.streak ?? 0;
    const activeStreak = getActiveStreak(
      currentStreak,
      streakDoc.lastReadingDate,
    );

    // If streak has broken/expired, update in database to keep state in sync
    if (currentStreak > 0 && activeStreak === 0) {
      await this.repo.upsertReadingStreak(
        userId,
        0,
        streakDoc.longestStreak ?? 0,
        streakDoc.lastReadingDate,
      );
    }

    return activeStreak;
  }

  private async updateReadingStreak(userId: string): Promise<number> {
    const streakDoc = await this.repo.findReadingStreak(userId);

    const result = calculateReadingStreak(
      streakDoc?.streak ?? 0,
      streakDoc?.longestStreak ?? 0,
      streakDoc?.lastReadingDate,
    );

    await this.repo.upsertReadingStreak(
      userId,
      result.streak,
      result.longestStreak,
      result.lastReadingDate,
    );

    return result.streak;
  }
}

export const shelfService = new ShelfService();

