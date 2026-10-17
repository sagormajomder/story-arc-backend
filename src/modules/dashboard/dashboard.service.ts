import {
  bookService as defaultBookService,
  type IBookService,
} from '@src/modules/book/book.index.js';
import type {
  IDashboardCharts,
  IDashboardStats,
} from '@src/modules/dashboard/dashboard.types.js';
import {
  reviewService as defaultReviewService,
  type IReviewService,
} from '@src/modules/review/review.index.js';
import {
  userService as defaultUserService,
  type IUserService,
} from '@src/modules/user/user.index.js';
import { REVIEW_STATUS, USER_ROLES } from '@src/shared/utils/constants.js';

export interface IDashboardService {
  getDashboardStats(): Promise<IDashboardStats>;
  getDashboardCharts(): Promise<IDashboardCharts>;
}

export class DashboardService implements IDashboardService {
  constructor(
    private readonly bookService: IBookService = defaultBookService,
    private readonly userService: IUserService = defaultUserService,
    private readonly reviewService: IReviewService = defaultReviewService,
  ) {}

  async getDashboardStats(): Promise<IDashboardStats> {
    const [totalBooks, totalUsers, pendingReviews] = await Promise.all([
      this.bookService.countBooks(),
      this.userService.countUsers(USER_ROLES.USER),
      this.reviewService.countReviews(REVIEW_STATUS.PENDING),
    ]);

    return {
      totalBooks,
      totalUsers,
      pendingReviews,
    };
  }

  async getDashboardCharts(): Promise<IDashboardCharts> {
    const genreData = await this.bookService.getGenreDistribution();

    return {
      genreData,
    };
  }
}

export const dashboardService = new DashboardService();

