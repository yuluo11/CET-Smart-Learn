export interface Database {
    public: {
        Tables: {
            words: {
                Row: DbWord;
                Insert: Omit<DbWord, 'id' | 'created_at'>;
                Update: Partial<Omit<DbWord, 'id'>>;
                Relationships: any[];
            };
            articles: {
                Row: DbArticle;
                Insert: Omit<DbArticle, 'id' | 'created_at'>;
                Update: Partial<Omit<DbArticle, 'id'>>;
                Relationships: any[];
            };
            user_words: {
                Row: DbUserWord;
                Insert: Omit<DbUserWord, 'id' | 'created_at' | 'updated_at'>;
                Update: Partial<Omit<DbUserWord, 'id'>>;
                Relationships: any[];
            };
            user_mistakes: {
                Row: DbUserMistake;
                Insert: Omit<DbUserMistake, 'id' | 'created_at'>;
                Update: Partial<Omit<DbUserMistake, 'id'>>;
                Relationships: any[];
            };
            user_stats: {
                Row: DbUserStats;
                Insert: Omit<DbUserStats, 'id' | 'created_at' | 'updated_at'>;
                Update: Partial<Omit<DbUserStats, 'id'>>;
                Relationships: any[];
            };
            writing_essays: {
                Row: DbWritingEssay;
                Insert: Omit<DbWritingEssay, 'id' | 'created_at'>;
                Update: Partial<Omit<DbWritingEssay, 'id'>>;
                Relationships: any[];
            };
        };
        Views: {
            [_ in never]: never;
        };
        Functions: {
            [_ in never]: never;
        };
        Enums: {
            [_ in never]: never;
        };
        CompositeTypes: {
            [_ in never]: never;
        };
    };
}

export interface DbWord {
    id: string;
    word: string;
    phonetic: string;
    definition_en: string;
    definition_cn: string;
    example_en: string;
    example_cn: string;
    source: string;
    level: 'CET-4' | 'CET-6';
    created_at: string;
}

export interface DbArticle {
    id: string;
    title: string;
    level: 'CET-4' | 'CET-6';
    read_time: string;
    difficulty: 'Easy' | 'Medium' | 'Hard';
    content: string;
    keywords: string[];
    created_at: string;
}

export interface DbUserWord {
    id: string;
    user_id: string;
    word_id: string;
    mastered: boolean;
    collected: boolean;
    last_reviewed: string | null;
    review_count: number;
    created_at: string;
    updated_at: string;
}

export interface DbUserMistake {
    id: string;
    user_id: string;
    title: string;
    type: 'spelling' | 'grammar' | 'meaning';
    description: string;
    category: string;
    practiced: boolean;
    created_at: string;
}

export interface DbUserStats {
    id: string;
    user_id: string;
    streak_days: number;
    total_words: number;
    total_hours: number;
    today_words: number;
    today_hours: number;
    daily_goal: number;
    last_check_in: string | null;
    created_at: string;
    updated_at: string;
}

export interface DbWritingEssay {
    id: string;
    user_id: string;
    level: 'CET-4' | 'CET-6';
    topic: string;
    generated_title: string;
    generated_content: string;
    structure_analysis: string | null;
    key_phrases: string[] | null;
    created_at: string;
}
