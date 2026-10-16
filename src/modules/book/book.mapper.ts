import type {
  BookResponseDto,
  IBookPlainDBResponse,
} from '@src/modules/book/book.types.js';
import { BOOK_EXCLUDED_FIELDS } from '@src/modules/book/book.types.js';
import { excludeFields } from '@src/shared/utils/excludeFields.js';

export const toBookResponseDto = (
  book: IBookPlainDBResponse,
): BookResponseDto => {
  return excludeFields(book, BOOK_EXCLUDED_FIELDS);
};

