import {
  ReadingGoal,
  ReadingStreak,
  Shelf,
  type IReadingGoalDocument,
  type IReadingStreakDocument,
  type IShelfDocument,
} from '@src/modules/shelf/shelf.model.js';
import type {
  IFindShelfOptions,
  IReadingGoalPlainDBResponse,
  IReadingStreakPlainDBResponse,
  IShelfItem,
  IShelfItemPlainDBResponse,
} from '@src/modules/shelf/shelf.types.js';
import { SHELF_SORT_OPTIONS } from '@src/shared/utils/constants.js';
import type { Model } from 'mongoose';

export interface IShelfRepository {
  create(data: IShelfItem): Promise<IShelfItemPlainDBResponse>;
  findByUserAndBook(
    userId: string,
    bookId: string,
  ): Promise<IShelfItemPlainDBResponse | null>;
  findUserShelf(options: IFindShelfOptions): Promise<{
    items: IShelfItemPlainDBResponse[];
    total: number;
  }>;
  update(
    userId: string,
    bookId: string,
    data: Partial<IShelfItem>,
  ): Promise<IShelfItemPlainDBResponse | null>;
  deleteByUserAndBook(userId: string, bookId: string): Promise<boolean>;
  findAllByUserId(userId: string): Promise<IShelfItemPlainDBResponse[]>;
  getShelvedBookIds(userId: string): Promise<string[]>;
  findReadingGoal(
    userId: string,
    year: number,
  ): Promise<IReadingGoalPlainDBResponse | null>;
  upsertReadingGoal(
    userId: string,
    year: number,
    target: number,
  ): Promise<IReadingGoalPlainDBResponse>;
  findReadingStreak(
    userId: string,
  ): Promise<IReadingStreakPlainDBResponse | null>;
  upsertReadingStreak(
    userId: string,
    streak: number,
    longestStreak: number,
    lastReadingDate?: Date | null,
  ): Promise<IReadingStreakPlainDBResponse>;
}

export class ShelfRepository implements IShelfRepository {
  constructor(
    private readonly shelfModel: Model<IShelfDocument> = Shelf,
    private readonly goalModel: Model<IReadingGoalDocument> = ReadingGoal,
    private readonly streakModel: Model<IReadingStreakDocument> = ReadingStreak,
  ) {}

  async create(data: IShelfItem): Promise<IShelfItemPlainDBResponse> {
    const doc = await this.shelfModel.create(data);
    return doc.toObject() as unknown as IShelfItemPlainDBResponse;
  }

  async findByUserAndBook(
    userId: string,
    bookId: string,
  ): Promise<IShelfItemPlainDBResponse | null> {
    const doc = await this.shelfModel
      .findOne({ userId, bookId })
      .populate('bookId')
      .exec();
    if (!doc) {
      return null;
    }
    return doc.toObject() as unknown as IShelfItemPlainDBResponse;
  }

  async findUserShelf(options: IFindShelfOptions): Promise<{
    items: IShelfItemPlainDBResponse[];
    total: number;
  }> {
    const filter: Record<string, unknown> = { userId: options.userId };

    if (options.status && options.status !== 'all') {
      filter.status = options.status;
    }

    let sortOptions: Record<string, 1 | -1> = { createdAt: -1 };
    if (options.sort === SHELF_SORT_OPTIONS.OLDEST) {
      sortOptions = { createdAt: 1 };
    } else if (options.sort === SHELF_SORT_OPTIONS.PROGRESS_DESC) {
      sortOptions = { progress: -1 };
    } else if (options.sort === SHELF_SORT_OPTIONS.PROGRESS_ASC) {
      sortOptions = { progress: 1 };
    }

    const skip = (options.page - 1) * options.limit;

    const [docs, total] = await Promise.all([
      this.shelfModel
        .find(filter)
        .populate('bookId')
        .sort(sortOptions)
        .skip(skip)
        .limit(options.limit)
        .exec(),
      this.shelfModel.countDocuments(filter).exec(),
    ]);

    const items = docs.map(
      doc => doc.toObject() as unknown as IShelfItemPlainDBResponse,
    );

    return { items, total };
  }

  async update(
    userId: string,
    bookId: string,
    data: Partial<IShelfItem>,
  ): Promise<IShelfItemPlainDBResponse | null> {
    const doc = await this.shelfModel
      .findOneAndUpdate(
        { userId, bookId },
        { $set: data },
        { returnDocument: 'after', runValidators: true },
      )
      .populate('bookId')
      .exec();

    if (!doc) {
      return null;
    }

    return doc.toObject() as unknown as IShelfItemPlainDBResponse;
  }

  async deleteByUserAndBook(userId: string, bookId: string): Promise<boolean> {
    const result = await this.shelfModel
      .deleteOne({ userId, bookId })
      .exec();
    return result.deletedCount > 0;
  }

  async findAllByUserId(userId: string): Promise<IShelfItemPlainDBResponse[]> {
    const docs = await this.shelfModel
      .find({ userId })
      .sort({ createdAt: -1 })
      .exec();

    return docs.map(
      doc => doc.toObject() as unknown as IShelfItemPlainDBResponse,
    );
  }

  async getShelvedBookIds(userId: string): Promise<string[]> {
    const docs = await this.shelfModel
      .find({ userId }, { bookId: 1 })
      .lean()
      .exec();

    return docs.map(doc => doc.bookId.toString());
  }

  async findReadingGoal(
    userId: string,
    year: number,
  ): Promise<IReadingGoalPlainDBResponse | null> {
    const doc = await this.goalModel.findOne({ userId, year }).exec();
    if (!doc) {
      return null;
    }
    return doc.toObject() as unknown as IReadingGoalPlainDBResponse;
  }

  async upsertReadingGoal(
    userId: string,
    year: number,
    target: number,
  ): Promise<IReadingGoalPlainDBResponse> {
    const doc = await this.goalModel
      .findOneAndUpdate(
        { userId, year },
        { $set: { target } },
        { returnDocument: 'after', upsert: true, runValidators: true },
      )
      .exec();

    return doc.toObject() as unknown as IReadingGoalPlainDBResponse;
  }

  async findReadingStreak(
    userId: string,
  ): Promise<IReadingStreakPlainDBResponse | null> {
    const doc = await this.streakModel.findOne({ userId }).exec();
    if (!doc) {
      return null;
    }
    return doc.toObject() as unknown as IReadingStreakPlainDBResponse;
  }

  async upsertReadingStreak(
    userId: string,
    streak: number,
    longestStreak: number,
    lastReadingDate?: Date | null,
  ): Promise<IReadingStreakPlainDBResponse> {
    const doc = await this.streakModel
      .findOneAndUpdate(
        { userId },
        {
          $set: {
            streak,
            longestStreak,
            lastReadingDate: lastReadingDate ?? null,
          },
        },
        { returnDocument: 'after', upsert: true, runValidators: true },
      )
      .exec();

    return doc.toObject() as unknown as IReadingStreakPlainDBResponse;
  }
}

export const shelfRepository = new ShelfRepository();

