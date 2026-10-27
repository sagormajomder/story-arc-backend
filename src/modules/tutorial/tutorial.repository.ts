import { Tutorial } from '@src/modules/tutorial/tutorial.model.js';
import { escapeRegex } from '@src/shared/utils/regex.js';
import type {
  IFindAllTutorialsOptions,
  ITutorial,
  ITutorialPlainDBResponse,
} from '@src/modules/tutorial/tutorial.types.js';

export interface ITutorialRepository {
  create(data: ITutorial): Promise<ITutorialPlainDBResponse>;
  findById(id: string): Promise<ITutorialPlainDBResponse | null>;
  findAll(options: IFindAllTutorialsOptions): Promise<{
    tutorials: ITutorialPlainDBResponse[];
    total: number;
  }>;
  update(
    id: string,
    data: Partial<ITutorial>,
  ): Promise<ITutorialPlainDBResponse | null>;
  delete(id: string): Promise<ITutorialPlainDBResponse | null>;
}

export class TutorialRepository implements ITutorialRepository {
  constructor(private readonly model = Tutorial) {}

  async create(data: ITutorial): Promise<ITutorialPlainDBResponse> {
    const doc = await this.model.create(data);
    return doc.toObject() as unknown as ITutorialPlainDBResponse;
  }

  async findById(id: string): Promise<ITutorialPlainDBResponse | null> {
    const doc = await this.model.findById(id).exec();
    if (!doc) {
      return null;
    }
    return doc.toObject() as unknown as ITutorialPlainDBResponse;
  }

  async findAll(options: IFindAllTutorialsOptions): Promise<{
    tutorials: ITutorialPlainDBResponse[];
    total: number;
  }> {
    const filter: Record<string, unknown> = {};

    if (options.category) {
      const escapedCategory = escapeRegex(options.category.trim());
      filter.category = {
        $regex: new RegExp(`^${escapedCategory}$`, 'i'),
      };
    }

    if (options.search) {
      const escapedSearch = escapeRegex(options.search.trim());
      filter.title = {
        $regex: escapedSearch,
        $options: 'i',
      };
    }

    const skip = (options.page - 1) * options.limit;

    const [docs, total] = await Promise.all([
      this.model
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(options.limit)
        .exec(),
      this.model.countDocuments(filter).exec(),
    ]);

    const tutorials = docs.map(
      doc => doc.toObject() as unknown as ITutorialPlainDBResponse,
    );

    return { tutorials, total };
  }

  async update(
    id: string,
    data: Partial<ITutorial>,
  ): Promise<ITutorialPlainDBResponse | null> {
    const doc = await this.model
      .findByIdAndUpdate(id, { $set: data }, { new: true, runValidators: true })
      .exec();

    if (!doc) {
      return null;
    }

    return doc.toObject() as unknown as ITutorialPlainDBResponse;
  }

  async delete(id: string): Promise<ITutorialPlainDBResponse | null> {
    const doc = await this.model.findByIdAndDelete(id).exec();
    if (!doc) {
      return null;
    }

    return doc.toObject() as unknown as ITutorialPlainDBResponse;
  }
}

export const tutorialRepository = new TutorialRepository();

