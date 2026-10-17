import type { BookSortOption } from '@src/shared/utils/constants.js';

export interface IBook {
  title: string;
  author: string;
  cover?: string | undefined;
  description?: string | undefined;
  genre?: string | undefined;
  rating?: number | undefined;
  totalRatings?: number | undefined;
  shelvedCount?: number | undefined;
  publishedDate?: string | undefined;
}

export interface IBookPlainDBResponse {
  id: string;
  title: string;
  author: string;
  cover: string;
  description: string;
  genre: string;
  rating: number;
  totalRatings: number;
  shelvedCount: number;
  publishedDate?: string | undefined;
  createdAt: Date;
  updatedAt: Date;
}

export const BOOK_EXCLUDED_FIELDS = [] as const;

export type BookExcludedField = (typeof BOOK_EXCLUDED_FIELDS)[number];

export type BookResponseDto = IBookPlainDBResponse;

export interface ICreateBookInput {
  title: string;
  author: string;
  cover?: string | undefined;
  description?: string | undefined;
  genre?: string | undefined;
  publishedDate?: string | undefined;
}

export interface IUpdateBookInput {
  title?: string | undefined;
  author?: string | undefined;
  cover?: string | undefined;
  description?: string | undefined;
  genre?: string | undefined;
  publishedDate?: string | undefined;
}

export interface IFindAllBooksOptions {
  page: number;
  limit: number;
  search?: string | undefined;
  genre?: string | undefined;
  minRating?: number | undefined;
  maxRating?: number | undefined;
  sort?: BookSortOption | undefined;
  ids?: string[] | undefined;
}

export interface IGetBooksResult {
  books: BookResponseDto[];
  total: number;
  totalPages: number;
  page: number;
  limit: number;
}

export interface IGenreDistribution {
  name: string;
  value: number;
}


