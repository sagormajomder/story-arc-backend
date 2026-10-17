export interface IGenre {
  name: string;
}

export interface IGenrePlainDBResponse {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export const GENRE_EXCLUDED_FIELDS = [] as const;

export type GenreExcludedField = (typeof GENRE_EXCLUDED_FIELDS)[number];

export type GenreResponseDto = IGenrePlainDBResponse;

export interface GenreWithCountDto extends GenreResponseDto {
  bookCount: number;
}

export interface ICreateGenreInput {
  name: string;
}

export interface IUpdateGenreInput {
  name: string;
}

export interface IFindAllGenresOptions {
  page: number;
  limit: number;
}

export interface IGetGenresResult {
  genres: GenreWithCountDto[];
  total: number;
  totalPages: number;
  page: number;
  limit: number;
}

