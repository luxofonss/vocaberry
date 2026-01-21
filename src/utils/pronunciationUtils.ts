import { colors } from '../theme/colors';

/**
 * Returns the appropriate color for a given pronunciation accuracy score
 * based on the configured thresholds.
 * 
 * Config:
 * 0 - 50%   : Light Red
 * 50 - 70%  : Light Red
 * 70 - 85%  : Light Red
 * 85 - 95%  : Green
 * > 95%     : Green
 */
export const getPronunciationColor = (score: number): string => {
     if (score <= 50) return colors.pronunciation.lightRed;
     if (score <= 60) return colors.pronunciation.lightRed;
     if (score <= 75) return colors.pronunciation.lightRed;
     if (score <= 90) return colors.pronunciation.green;
     return colors.pronunciation.green;
};
