import { Tutorial } from '@src/modules/tutorial/tutorial.model.js';
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
      filter.category = {
        $regex: new RegExp(`^${options.category.trim()}$`, 'i'),
      };
    }

    if (options.search) {
      filter.title = {
        $regex: options.search.trim(),
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

