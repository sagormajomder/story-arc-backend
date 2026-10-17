import { TUTORIAL_VALIDATIONS } from '@src/shared/utils/constants.js';

/**
 * Extracts the 11-character YouTube video ID from various YouTube URL formats.
 *
 * Supported formats include:
 * - https://www.youtube.com/watch?v=VIDEO_ID
 * - https://youtu.be/VIDEO_ID
 * - https://www.youtube.com/embed/VIDEO_ID
 * - https://www.youtube.com/v/VIDEO_ID
 *
 * @param url The YouTube URL string to parse
 * @returns The 11-character video ID, or null if invalid
 */
export const extractYouTubeVideoId = (url: string): string | null => {
  if (!url || typeof url !== 'string') {
    return null;
  }

  const match = url.trim().match(TUTORIAL_VALIDATIONS.YOUTUBE_REGEX);
  if (match && match[2] && match[2].length === 11) {
    return match[2];
  }

  return null;
};

/**
 * Generates the maximum resolution thumbnail URL for a YouTube video ID.
 *
 * @param videoId The 11-character YouTube video ID
 * @returns The thumbnail URL
 */
export const getYouTubeThumbnailUrl = (videoId: string): string => {
  return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
};

