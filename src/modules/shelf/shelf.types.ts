import type { BookResponseDto } from '@src/modules/book/book.index.js';
import type {
  ShelfSortOption,
  ShelfStatus,
} from '@src/shared/utils/constants.js';

export interface IShelfItem {
  userId: string;
  bookId: string;
  status: ShelfStatus;
  progress: number;
  totalPages: number;
  startedAt?: Date | null | undefined;
  finishedAt?: Date | null | undefined;
  addedAt: Date;
}

export interface IShelfItemPlainDBResponse extends IShelfItem {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  book?: BookResponseDto | undefined;
}

export interface ShelfItemResponseDto {
  id: string;
  userId: string;
  bookId: string;
  status: ShelfStatus;
  progress: number;
  totalPages: number;
  startedAt: Date | null;
  finishedAt: Date | null;
  addedAt: Date;
  createdAt: Date;
  updatedAt: Date;
  book?: BookResponseDto | undefined;
}

export interface IReadingGoal {
  userId: string;
  year: number;
  target: number;
}

export interface IReadingGoalPlainDBResponse extends IReadingGoal {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IReadingStreak {
  userId: string;
  streak: number;
  longestStreak: number;
  lastReadingDate: Date | null;
}

export interface IReadingStreakPlainDBResponse extends IReadingStreak {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ReadingGoalResponseDto {
  year: number;
  target: number;
  current: number;
}

export interface IUserReadingStats {
  booksReadThisYear: number;
  totalPagesRead: number;
  totalBooksRead: number;
  streak: number;
  averageRating: number;
  totalUserRatings: number;
}

export interface IReadingStatsResponse {
  stats: IUserReadingStats;
  goal: ReadingGoalResponseDto;
}

export interface ICheckShelfResponse {
  isInShelf: boolean;
  shelfItem: ShelfItemResponseDto | null;
}

export interface IAddToShelfInput {
  bookId: string;
  status?: ShelfStatus | undefined;
  progress?: number | undefined;
  totalPages?: number | undefined;
}

export interface IUpdateShelfProgressInput {
  progress?: number | undefined;
  totalPages?: number | undefined;
  status?: ShelfStatus | undefined;
}

export interface IFindShelfOptions {
  userId: string;
  status?: ShelfStatus | 'all' | undefined;
  page: number;
  limit: number;
  sort?: ShelfSortOption | undefined;
}

export interface IGetShelfResult {
  items: ShelfItemResponseDto[];
  total: number;
  totalPages: number;
  page: number;
  limit: number;
}
