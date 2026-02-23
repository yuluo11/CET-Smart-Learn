import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { wordsApi, userWordsApi, articlesApi, mistakesApi, statsApi } from '../lib/api';
import type { DbWord, DbArticle, DbUserMistake, DbUserStats, DbUserWord } from '../lib/types';
import { MOCK_WORDS, MOCK_MISTAKES, MOCK_ARTICLE } from '../constants';
import type { Word, Mistake, Article } from '../types';

interface DataContextType {
    // 词汇
    words: Word[];
    wordsLoading: boolean;
    refreshWords: () => Promise<void>;
    updateWordMastered: (wordId: string, mastered: boolean) => Promise<void>;

    // 收藏
    collectedWords: Word[];
    collectionsLoading: boolean;
    refreshCollections: () => Promise<void>;
    toggleCollect: (wordId: string, collected: boolean) => Promise<void>;

    // 文章
    articles: Article[];
    currentArticle: Article;
    articlesLoading: boolean;
    refreshArticles: () => Promise<void>;

    // 错题
    mistakes: Mistake[];
    mistakesLoading: boolean;
    unpracticedCount: number;
    practicedCount: number;
    refreshMistakes: () => Promise<void>;

    // 统计
    stats: {
        streakDays: number;
        totalWords: number;
        totalHours: number;
        todayWords: number;
        todayHours: number;
        dailyGoal: number;
    };
    statsLoading: boolean;
    refreshStats: () => Promise<void>;
}

const defaultStats = {
    streakDays: 0,
    totalWords: 0,
    totalHours: 0,
    todayWords: 0,
    todayHours: 0,
    dailyGoal: 50,
};

const DataContext = createContext<DataContextType | null>(null);

/** 将数据库词汇转换为前端类型 */
function dbWordToWord(dbWord: DbWord, userWord?: DbUserWord): Word {
    return {
        id: dbWord.id,
        word: dbWord.word,
        phonetic: dbWord.phonetic,
        definitionEn: dbWord.definition_en,
        definitionCn: dbWord.definition_cn,
        exampleEn: dbWord.example_en,
        exampleCn: dbWord.example_cn,
        source: dbWord.source,
        mastered: userWord?.mastered ?? false,
        lastReviewed: userWord?.last_reviewed
            ? formatRelativeTime(userWord.last_reviewed)
            : undefined,
    };
}

/** 将数据库文章转换为前端类型 */
function dbArticleToArticle(dbArticle: DbArticle): Article {
    return {
        id: dbArticle.id,
        title: dbArticle.title,
        level: dbArticle.level,
        readTime: dbArticle.read_time,
        difficulty: dbArticle.difficulty,
        content: dbArticle.content,
        keywords: dbArticle.keywords,
    };
}

/** 将数据库错题转换为前端类型 */
function dbMistakeToMistake(dbMistake: DbUserMistake): Mistake {
    return {
        id: dbMistake.id,
        title: dbMistake.title,
        type: dbMistake.type as 'spelling' | 'grammar' | 'meaning',
        description: dbMistake.description,
        time: formatRelativeTime(dbMistake.created_at),
        category: dbMistake.category,
    };
}

/** 格式化相对时间 */
function formatRelativeTime(isoString: string): string {
    const now = new Date();
    const past = new Date(isoString);
    const diffMs = now.getTime() - past.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return '刚刚';
    if (diffMins < 60) return `${diffMins}分钟前`;
    if (diffHours < 24) return `${diffHours}小时前`;
    if (diffDays < 7) return `${diffDays}天前`;
    return past.toLocaleDateString('zh-CN');
}

export function DataProvider({ children }: { children: ReactNode }) {
    const { user } = useAuth();

    // 词汇状态
    const [words, setWords] = useState<Word[]>(MOCK_WORDS);
    const [wordsLoading, setWordsLoading] = useState(false);

    // 收藏状态
    const [collectedWords, setCollectedWords] = useState<Word[]>([]);
    const [collectionsLoading, setCollectionsLoading] = useState(false);

    // 文章状态
    const [articles, setArticles] = useState<Article[]>([MOCK_ARTICLE]);
    const [articlesLoading, setArticlesLoading] = useState(false);

    // 错题状态
    const [mistakes, setMistakes] = useState<Mistake[]>(MOCK_MISTAKES);
    const [mistakesLoading, setMistakesLoading] = useState(false);
    const [unpracticedCount, setUnpracticedCount] = useState(24);
    const [practicedCount, setPracticedCount] = useState(12);

    // 统计状态
    const [stats, setStats] = useState(defaultStats);
    const [statsLoading, setStatsLoading] = useState(false);

    // 刷新词汇
    const refreshWords = useCallback(async () => {
        if (!user) return;
        setWordsLoading(true);
        try {
            const [dbWords, userWordsList] = await Promise.all([
                wordsApi.getWords(),
                userWordsApi.getUserWords(user.id),
            ]);

            const userWordMap = new Map(
                userWordsList.map((uw) => [uw.word_id, uw])
            );

            setWords(dbWords.map((w) => dbWordToWord(w, userWordMap.get(w.id))));
        } catch (err) {
            console.error('加载词汇失败:', err);
        } finally {
            setWordsLoading(false);
        }
    }, [user]);

    // 刷新收藏
    const refreshCollections = useCallback(async () => {
        if (!user) return;
        setCollectionsLoading(true);
        try {
            const collected = await userWordsApi.getCollectedWords(user.id);
            setCollectedWords(
                collected.map((uw) => dbWordToWord(uw.word, uw))
            );
        } catch (err) {
            console.error('加载收藏失败:', err);
        } finally {
            setCollectionsLoading(false);
        }
    }, [user]);

    // 刷新文章
    const refreshArticles = useCallback(async () => {
        setArticlesLoading(true);
        try {
            const dbArticles = await articlesApi.getArticles();
            if (dbArticles.length > 0) {
                setArticles(dbArticles.map(dbArticleToArticle));
            }
        } catch (err) {
            console.error('加载文章失败:', err);
        } finally {
            setArticlesLoading(false);
        }
    }, []);

    // 刷新错题
    const refreshMistakes = useCallback(async () => {
        if (!user) return;
        setMistakesLoading(true);
        try {
            const [dbMistakes, count] = await Promise.all([
                mistakesApi.getMistakes(user.id),
                mistakesApi.getUnpracticedCount(user.id),
            ]);
            setMistakes(dbMistakes.map(dbMistakeToMistake));
            setUnpracticedCount(count);
            setPracticedCount(dbMistakes.length - count);
        } catch (err) {
            console.error('加载错题失败:', err);
        } finally {
            setMistakesLoading(false);
        }
    }, [user]);

    // 刷新统计
    const refreshStats = useCallback(async () => {
        if (!user) return;
        setStatsLoading(true);
        try {
            const dbStats = await statsApi.getUserStats(user.id);
            if (dbStats) {
                setStats({
                    streakDays: dbStats.streak_days,
                    totalWords: dbStats.total_words,
                    totalHours: Number(dbStats.total_hours),
                    todayWords: dbStats.today_words,
                    todayHours: Number(dbStats.today_hours),
                    dailyGoal: dbStats.daily_goal,
                });
            }
        } catch (err) {
            console.error('加载统计失败:', err);
        } finally {
            setStatsLoading(false);
        }
    }, [user]);

    // 更新掌握状态
    const updateWordMastered = useCallback(
        async (wordId: string, mastered: boolean) => {
            if (!user) return;
            try {
                await userWordsApi.updateMastered(user.id, wordId, mastered);
                setWords((prev) =>
                    prev.map((w) => (w.id === wordId ? { ...w, mastered } : w))
                );
            } catch (err) {
                console.error('更新掌握状态失败:', err);
            }
        },
        [user]
    );

    // 切换收藏
    const toggleCollect = useCallback(
        async (wordId: string, collected: boolean) => {
            if (!user) return;
            try {
                await userWordsApi.toggleCollect(user.id, wordId, collected);
                await refreshCollections();
            } catch (err) {
                console.error('更新收藏失败:', err);
            }
        },
        [user, refreshCollections]
    );

    // 用户登录后自动加载数据
    useEffect(() => {
        if (user) {
            refreshWords();
            refreshArticles();
            refreshMistakes();
            refreshStats();
            refreshCollections();
        }
    }, [user, refreshWords, refreshArticles, refreshMistakes, refreshStats, refreshCollections]);

    const currentArticle = articles[0] || MOCK_ARTICLE;

    return (
        <DataContext.Provider
            value={{
                words,
                wordsLoading,
                refreshWords,
                updateWordMastered,
                collectedWords,
                collectionsLoading,
                refreshCollections,
                toggleCollect,
                articles,
                currentArticle,
                articlesLoading,
                refreshArticles,
                mistakes,
                mistakesLoading,
                unpracticedCount,
                practicedCount,
                refreshMistakes,
                stats,
                statsLoading,
                refreshStats,
            }}
        >
            {children}
        </DataContext.Provider>
    );
}

export function useData() {
    const ctx = useContext(DataContext);
    if (!ctx) throw new Error('useData must be used within DataProvider');
    return ctx;
}
