export { toShelfItemResponseDto } from '@src/modules/shelf/shelf.mapper.js';
export { default as shelfRoutes } from '@src/modules/shelf/shelf.routes.js';
export {
  shelfService,
  type IShelfService,
} from '@src/modules/shelf/shelf.service.js';
export type {
  IAddToShelfInput,
  ICheckShelfResponse,
  IFindShelfOptions,
  IGetShelfResult,
  IReadingGoal,
  IReadingGoalPlainDBResponse,
  IReadingStatsResponse,
  IReadingStreak,
  IReadingStreakPlainDBResponse,
  IShelfItem,
  IShelfItemPlainDBResponse,
  IUpdateShelfProgressInput,
  IUserReadingStats,
  ReadingGoalResponseDto,
  ShelfItemResponseDto,
} from '@src/modules/shelf/shelf.types.js';
export {
  calculateReadingStreak,
  getActiveStreak,
  getUtcDayDiff,
  type IReadingStreakResult,
} from '@src/modules/shelf/shelf.utils.js';
export type {
  AddToShelfDto,
  BookIdShelfParamDto,
  GetShelfQueryDto,
  UpdateReadingGoalDto,
  UpdateShelfProgressDto,
} from '@src/modules/shelf/shelf.validate.js';

