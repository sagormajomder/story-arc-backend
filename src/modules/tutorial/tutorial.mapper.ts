import type {
  ITutorialPlainDBResponse,
  TutorialResponseDto,
} from '@src/modules/tutorial/tutorial.types.js';
import { TUTORIAL_EXCLUDED_FIELDS } from '@src/modules/tutorial/tutorial.types.js';
import { excludeFields } from '@src/shared/utils/excludeFields.js';

export const toTutorialResponseDto = (
  tutorial: ITutorialPlainDBResponse,
): TutorialResponseDto => {
  return excludeFields(tutorial, TUTORIAL_EXCLUDED_FIELDS);
};

