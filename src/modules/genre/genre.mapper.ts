import type {
  GenreResponseDto,
  GenreWithCountDto,
  IGenrePlainDBResponse,
} from '@src/modules/genre/genre.types.js';
import { GENRE_EXCLUDED_FIELDS } from '@src/modules/genre/genre.types.js';
import { excludeFields } from '@src/shared/utils/excludeFields.js';

export const toGenreResponseDto = (
  genre: IGenrePlainDBResponse,
): GenreResponseDto => {
  return excludeFields(genre, GENRE_EXCLUDED_FIELDS);
};

export const toGenreWithCountDto = (
  genre: IGenrePlainDBResponse,
  bookCount: number = 0,
): GenreWithCountDto => {
  return {
    ...toGenreResponseDto(genre),
    bookCount,
  };
};

