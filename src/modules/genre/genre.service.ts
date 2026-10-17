import {
  bookService as defaultBookService,
  type IBookService,
} from '@src/modules/book/book.service.js';
import {
  toGenreResponseDto,
  toGenreWithCountDto,
} from '@src/modules/genre/genre.mapper.js';
import {
  genreRepository,
  type IGenreRepository,
} from '@src/modules/genre/genre.repository.js';
import type {
  GenreResponseDto,
  ICreateGenreInput,
  IGetGenresResult,
  IUpdateGenreInput,
} from '@src/modules/genre/genre.types.js';
import type { GetGenresQueryDto } from '@src/modules/genre/genre.validate.js';
import { AppError } from '@src/shared/errors/appError.js';
import { HTTP_STATUS } from '@src/shared/utils/constants.js';

export interface IGenreService {
  createGenre(data: ICreateGenreInput): Promise<GenreResponseDto>;
  getGenreById(genreId: string): Promise<GenreResponseDto>;
  getAllGenres(query: GetGenresQueryDto): Promise<IGetGenresResult>;
  updateGenre(
    genreId: string,
    data: IUpdateGenreInput,
  ): Promise<GenreResponseDto>;
  deleteGenre(genreId: string): Promise<void>;
}

export class GenreService implements IGenreService {
  constructor(
    private readonly repo: IGenreRepository = genreRepository,
    private readonly bookService: IBookService = defaultBookService,
  ) {}

  async createGenre(data: ICreateGenreInput): Promise<GenreResponseDto> {
    const trimmedName = data.name.trim();

    const existingGenre = await this.repo.findByName(trimmedName);
    if (existingGenre) {
      throw new AppError('Genre already exists', HTTP_STATUS.CONFLICT);
    }

    const createdGenre = await this.repo.create({ name: trimmedName });
    return toGenreResponseDto(createdGenre);
  }

  async getGenreById(genreId: string): Promise<GenreResponseDto> {
    const genre = await this.repo.findById(genreId);
    if (!genre) {
      throw new AppError('Genre not found', HTTP_STATUS.NOT_FOUND);
    }
    return toGenreResponseDto(genre);
  }

  async getAllGenres(query: GetGenresQueryDto): Promise<IGetGenresResult> {
    const { genres, total } = await this.repo.findAll({
      page: query.page,
      limit: query.limit,
    });

    const genreNames = genres.map(g => g.name);
    const bookCounts = await this.bookService.countBooksByGenres(genreNames);

    const genresWithCount = genres.map(g =>
      toGenreWithCountDto(g, bookCounts[g.name] ?? 0),
    );

    const totalPages = Math.ceil(total / query.limit) || 1;

    return {
      genres: genresWithCount,
      total,
      totalPages,
      page: query.page,
      limit: query.limit,
    };
  }

  async updateGenre(
    genreId: string,
    data: IUpdateGenreInput,
  ): Promise<GenreResponseDto> {
    const existingGenre = await this.repo.findById(genreId);
    if (!existingGenre) {
      throw new AppError('Genre not found', HTTP_STATUS.NOT_FOUND);
    }

    const newName = data.name.trim();

    if (existingGenre.name.toLowerCase() !== newName.toLowerCase()) {
      const duplicate = await this.repo.findByName(newName);
      if (duplicate && duplicate.id !== genreId) {
        throw new AppError('Genre already exists', HTTP_STATUS.CONFLICT);
      }
    }

    const updatedGenre = await this.repo.update(genreId, { name: newName });
    if (!updatedGenre) {
      throw new AppError('Genre not found', HTTP_STATUS.NOT_FOUND);
    }

    if (existingGenre.name !== newName) {
      await this.bookService.renameGenreInBooks(existingGenre.name, newName);
    }

    return toGenreResponseDto(updatedGenre);
  }

  async deleteGenre(genreId: string): Promise<void> {
    const deletedGenre = await this.repo.delete(genreId);
    if (!deletedGenre) {
      throw new AppError('Genre not found', HTTP_STATUS.NOT_FOUND);
    }

    await this.bookService.clearGenreFromBooks(deletedGenre.name);
  }
}

export const genreService = new GenreService();

