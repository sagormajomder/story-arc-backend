export interface ITutorial {
  title: string;
  url: string;
  videoId: string;
  category: string;
  thumbnail: string;
}

export interface ITutorialPlainDBResponse {
  id: string;
  title: string;
  url: string;
  videoId: string;
  category: string;
  thumbnail: string;
  createdAt: Date;
  updatedAt: Date;
}

export const TUTORIAL_EXCLUDED_FIELDS = [] as const;

export type TutorialExcludedField = (typeof TUTORIAL_EXCLUDED_FIELDS)[number];

export type TutorialResponseDto = ITutorialPlainDBResponse;

export interface ICreateTutorialInput {
  title: string;
  url: string;
  category: string;
}

export interface IUpdateTutorialInput {
  title?: string | undefined;
  url?: string | undefined;
  category?: string | undefined;
}

export interface IFindAllTutorialsOptions {
  page: number;
  limit: number;
  category?: string | undefined;
  search?: string | undefined;
}

export interface IGetTutorialsResult {
  tutorials: TutorialResponseDto[];
  total: number;
  totalPages: number;
  page: number;
  limit: number;
}

