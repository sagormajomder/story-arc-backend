import { genreService } from '@src/modules/genre/genre.service.js';
import type {
  CreateGenreDto,
  GetGenresQueryDto,
  UpdateGenreDto,
} from '@src/modules/genre/genre.validate.js';
import asyncCatch from '@src/shared/utils/asyncCatch.js';
import { HTTP_STATUS } from '@src/shared/utils/constants.js';
import sendResponse from '@src/shared/utils/sendResponse.js';
import type { Request, Response } from 'express';

export const getAllGenresCntlr = asyncCatch(
  async (req: Request, res: Response) => {
    const query = req.query as unknown as GetGenresQueryDto;
    const result = await genreService.getAllGenres(query);

    sendResponse(res, {
      statusCode: HTTP_STATUS.OK,
      success: true,
      message: 'Genres retrieved successfully',
      meta: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
      },
      data: result.genres,
    });
  },
);

export const getGenreByIdCntlr = asyncCatch(
  async (req: Request, res: Response) => {
    const { id } = req.params as { id: string };
    const genre = await genreService.getGenreById(id);

    sendResponse(res, {
      statusCode: HTTP_STATUS.OK,
      success: true,
      message: 'Genre retrieved successfully',
      data: genre,
    });
  },
);

export const createGenreCntlr = asyncCatch(
  async (req: Request, res: Response) => {
    const genreData: CreateGenreDto = req.body;
    const genre = await genreService.createGenre(genreData);

    sendResponse(res, {
      statusCode: HTTP_STATUS.CREATED,
      success: true,
      message: 'Genre created successfully',
      data: genre,
    });
  },
);

export const updateGenreCntlr = asyncCatch(
  async (req: Request, res: Response) => {
    const { id } = req.params as { id: string };
    const updateData: UpdateGenreDto = req.body;
    const updatedGenre = await genreService.updateGenre(id, updateData);

    sendResponse(res, {
      statusCode: HTTP_STATUS.OK,
      success: true,
      message: 'Genre updated successfully',
      data: updatedGenre,
    });
  },
);

export const deleteGenreCntlr = asyncCatch(
  async (req: Request, res: Response) => {
    const { id } = req.params as { id: string };
    await genreService.deleteGenre(id);

    sendResponse(res, {
      statusCode: HTTP_STATUS.OK,
      success: true,
      message: 'Genre deleted successfully',
    });
  },
);

