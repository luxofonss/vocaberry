import { colors } from '../theme/colors';

/**
 * Returns the appropriate color for a given pronunciation accuracy score
 * based on the configured thresholds.
 * 
 * Config:
 * 0 - 50%   : Dark Red
 * 50 - 70%  : Light Red
 * 70 - 85%  : Dark Yellow
 * 85 - 95%  : Yellow Green
 * > 95%     : Green
 */
export const getPronunciationColor = (score: number): string => {
     if (score <= 50) return colors.pronunciation.darkRed;
     if (score <= 70) return colors.pronunciation.lightRed;
     if (score <= 85) return colors.pronunciation.darkYellow;
     if (score <= 95) return colors.pronunciation.yellowGreen;
     return colors.pronunciation.green;
};
