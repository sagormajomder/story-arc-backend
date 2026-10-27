import { Genre } from '@src/modules/genre/genre.model.js';
import { escapeRegex } from '@src/shared/utils/regex.js';
import type {
  ICreateGenreInput,
  IFindAllGenresOptions,
  IGenrePlainDBResponse,
  IUpdateGenreInput,
} from '@src/modules/genre/genre.types.js';

export interface IGenreRepository {
  create(genreData: ICreateGenreInput): Promise<IGenrePlainDBResponse>;
  findById(genreId: string): Promise<IGenrePlainDBResponse | null>;
  findByName(name: string): Promise<IGenrePlainDBResponse | null>;
  findAll(options: IFindAllGenresOptions): Promise<{
    genres: IGenrePlainDBResponse[];
    total: number;
  }>;
  update(
    genreId: string,
    data: IUpdateGenreInput,
  ): Promise<IGenrePlainDBResponse | null>;
  delete(genreId: string): Promise<IGenrePlainDBResponse | null>;
}

export class GenreRepository implements IGenreRepository {
  constructor(private readonly model = Genre) {}

  async create(genreData: ICreateGenreInput): Promise<IGenrePlainDBResponse> {
    const genreDoc = await this.model.create(genreData);
    return genreDoc.toObject() as unknown as IGenrePlainDBResponse;
  }

  async findById(genreId: string): Promise<IGenrePlainDBResponse | null> {
    const genreDoc = await this.model.findById(genreId).exec();
    if (!genreDoc) {
      return null;
    }
    return genreDoc.toObject() as unknown as IGenrePlainDBResponse;
  }

  async findByName(name: string): Promise<IGenrePlainDBResponse | null> {
    const escapedName = escapeRegex(name.trim());
    const genreDoc = await this.model
      .findOne({ name: { $regex: new RegExp(`^${escapedName}$`, 'i') } })
      .exec();
    if (!genreDoc) {
      return null;
    }
    return genreDoc.toObject() as unknown as IGenrePlainDBResponse;
  }

  async findAll(options: IFindAllGenresOptions): Promise<{
    genres: IGenrePlainDBResponse[];
    total: number;
  }> {
    const skip = (options.page - 1) * options.limit;

    const [genreDocs, total] = await Promise.all([
      this.model
        .find()
        .sort({ name: 1 })
        .skip(skip)
        .limit(options.limit)
        .exec(),
      this.model.countDocuments().exec(),
    ]);

    const genres = genreDocs.map(
      doc => doc.toObject() as unknown as IGenrePlainDBResponse,
    );

    return { genres, total };
  }

  async update(
    genreId: string,
    data: IUpdateGenreInput,
  ): Promise<IGenrePlainDBResponse | null> {
    const genreDoc = await this.model
      .findByIdAndUpdate(
        genreId,
        { $set: data },
        { new: true, runValidators: true },
      )
      .exec();

    if (!genreDoc) {
      return null;
    }

    return genreDoc.toObject() as unknown as IGenrePlainDBResponse;
  }

  async delete(genreId: string): Promise<IGenrePlainDBResponse | null> {
    const genreDoc = await this.model.findByIdAndDelete(genreId).exec();
    if (!genreDoc) {
      return null;
    }
    return genreDoc.toObject() as unknown as IGenrePlainDBResponse;
  }
}

export const genreRepository = new GenreRepository();

