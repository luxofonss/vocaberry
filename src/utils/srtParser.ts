/**
 * Utility to parse SRT (SubRip) subtitle files into a structured array
 */

export interface Subtitle {
     id: number;
     start: number; // in seconds
     end: number;   // in seconds
     text: string;
}

export const parseSRT = (srtContent: string): Subtitle[] => {
     const segments = srtContent.trim().split(/\n\s*\n/);
     return segments.map((segment, index) => {
          const lines = segment.split('\n');
          const id = parseInt(lines[0], 10) || index + 1;
          const timeMatch = lines[1]?.match(/(\d{2}:\d{2}:\d{2},\d{3}) --> (\d{2}:\d{2}:\d{2},\d{3})/);

          if (!timeMatch) return null;

          const toSeconds = (timeStr: string): number => {
               const [hms, ms] = timeStr.split(',');
               const [h, m, s] = hms.split(':').map(Number);
               return h * 3600 + m * 60 + s + parseInt(ms, 10) / 1000;
          };

          const text = lines.slice(2).join(' ').replace(/<[^>]*>/g, '').trim();

          return {
               id,
               start: toSeconds(timeMatch[1]),
               end: toSeconds(timeMatch[2]),
               text
          };
     }).filter((s): s is Subtitle => s !== null);
};
