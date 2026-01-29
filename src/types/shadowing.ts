
export interface ShadowingSubtitle {
     id: string;
     start: number;
     end: number;
     text: string;
}

export interface ShadowingLesson {
     id: string;
     title: string;
     description: string;
     difficulty: 'beginner' | 'intermediate' | 'advanced';
     thumbnail: string;
     category: string;
     views: number;
     video_url: string;
     created_at: string;
     updated_at: string;
     subtitles?: ShadowingSubtitle[];
}
