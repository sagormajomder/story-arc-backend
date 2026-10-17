import { toTutorialResponseDto } from '@src/modules/tutorial/tutorial.mapper.js';
import {
  tutorialRepository,
  type ITutorialRepository,
} from '@src/modules/tutorial/tutorial.repository.js';
import type {
  ICreateTutorialInput,
  IGetTutorialsResult,
  ITutorial,
  IUpdateTutorialInput,
  TutorialResponseDto,
} from '@src/modules/tutorial/tutorial.types.js';
import {
  extractYouTubeVideoId,
  getYouTubeThumbnailUrl,
} from '@src/modules/tutorial/tutorial.utils.js';
import type { GetTutorialsQueryDto } from '@src/modules/tutorial/tutorial.validate.js';
import { AppError } from '@src/shared/errors/appError.js';
import { HTTP_STATUS } from '@src/shared/utils/constants.js';

export interface ITutorialService {
  createTutorial(data: ICreateTutorialInput): Promise<TutorialResponseDto>;
  getTutorialById(id: string): Promise<TutorialResponseDto>;
  getAllTutorials(query: GetTutorialsQueryDto): Promise<IGetTutorialsResult>;
  updateTutorial(
    id: string,
    data: IUpdateTutorialInput,
  ): Promise<TutorialResponseDto>;
  deleteTutorial(id: string): Promise<void>;
}

export class TutorialService implements ITutorialService {
  constructor(private readonly repo: ITutorialRepository = tutorialRepository) {}

  async createTutorial(data: ICreateTutorialInput): Promise<TutorialResponseDto> {
    const videoId = extractYouTubeVideoId(data.url);
    if (!videoId) {
      throw new AppError('Invalid YouTube URL', HTTP_STATUS.BAD_REQUEST);
    }

    const thumbnail = getYouTubeThumbnailUrl(videoId);

    const created = await this.repo.create({
      title: data.title.trim(),
      url: data.url.trim(),
      videoId,
      category: data.category.trim(),
      thumbnail,
    });

    return toTutorialResponseDto(created);
  }

  async getTutorialById(id: string): Promise<TutorialResponseDto> {
    const tutorial = await this.repo.findById(id);
    if (!tutorial) {
      throw new AppError('Tutorial not found', HTTP_STATUS.NOT_FOUND);
    }

    return toTutorialResponseDto(tutorial);
  }

  async getAllTutorials(
    query: GetTutorialsQueryDto,
  ): Promise<IGetTutorialsResult> {
    const { tutorials, total } = await this.repo.findAll({
      page: query.page,
      limit: query.limit,
      category: query.category,
      search: query.search,
    });

    const totalPages = Math.ceil(total / query.limit) || 1;

    return {
      tutorials: tutorials.map(toTutorialResponseDto),
      total,
      totalPages,
      page: query.page,
      limit: query.limit,
    };
  }

  async updateTutorial(
    id: string,
    data: IUpdateTutorialInput,
  ): Promise<TutorialResponseDto> {
    const existing = await this.repo.findById(id);
    if (!existing) {
      throw new AppError('Tutorial not found', HTTP_STATUS.NOT_FOUND);
    }

    const updateData: Partial<ITutorial> = {};

    if (data.title !== undefined) {
      updateData.title = data.title.trim();
    }

    if (data.category !== undefined) {
      updateData.category = data.category.trim();
    }

    if (data.url !== undefined) {
      const videoId = extractYouTubeVideoId(data.url);
      if (!videoId) {
        throw new AppError('Invalid YouTube URL', HTTP_STATUS.BAD_REQUEST);
      }
      updateData.url = data.url.trim();
      updateData.videoId = videoId;
      updateData.thumbnail = getYouTubeThumbnailUrl(videoId);
    }

    const updated = await this.repo.update(id, updateData);
    if (!updated) {
      throw new AppError('Tutorial not found', HTTP_STATUS.NOT_FOUND);
    }

    return toTutorialResponseDto(updated);
  }

  async deleteTutorial(id: string): Promise<void> {
    const deleted = await this.repo.delete(id);
    if (!deleted) {
      throw new AppError('Tutorial not found', HTTP_STATUS.NOT_FOUND);
    }
  }
}

export const tutorialService = new TutorialService();

