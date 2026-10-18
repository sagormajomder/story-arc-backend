import type {
  IShelfItemPlainDBResponse,
  ShelfItemResponseDto,
} from '@src/modules/shelf/shelf.types.js';

export const toShelfItemResponseDto = (
  item: IShelfItemPlainDBResponse,
): ShelfItemResponseDto => {
  return {
    id: item.id,
    userId: item.userId,
    bookId: item.bookId,
    status: item.status,
    progress: item.progress,
    totalPages: item.totalPages,
    startedAt: item.startedAt ?? null,
    finishedAt: item.finishedAt ?? null,
    addedAt: item.addedAt,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    ...(item.book ? { book: item.book } : {}),
  };
};

