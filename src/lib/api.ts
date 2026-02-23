import { supabase } from './supabase';
import type { DbWord, DbArticle, DbUserWord, DbUserMistake, DbUserStats, DbWritingEssay } from './types';

// ============================================================
// 认证 API
// ============================================================

export const authApi = {
    /** 邮箱+密码注册，支持写入用户名 */
    async signUp(email: string, password: string, username?: string) {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: username ? {
                data: { username }
            } : undefined
        });
        if (error) throw error;
        return data;
    },

    /** 验证邮箱验证码 (OTP) */
    async verifyOtp(email: string, token: string, type: 'signup' | 'magiclink' = 'signup') {
        const { data, error } = await supabase.auth.verifyOtp({
            email,
            token,
            type,
        });
        if (error) throw error;
        return data;
    },

    /** 邮箱+密码登录 */
    async signIn(email: string, password: string) {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        return data;
    },

    /** 登出 */
    async signOut() {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
    },

    /** 更新用户元数据 (包含用户名、头像 seed 等) */
    async updateUserMetadata(data: Record<string, any>) {
        const { data: result, error } = await supabase.auth.updateUser({
            data
        });
        if (error) throw error;
        return result.user;
    },

    /** 获取当前用户 */
    async getUser() {
        const { data: { user } } = await supabase.auth.getUser();
        return user;
    },

    /** 上传头像图片到 storage */
    async uploadAvatar(file: File) {
        const user = await this.getUser();
        if (!user) throw new Error('Not authenticated');

        // 使用固定的文件名从而在一台设备上覆盖旧头像，防止存储桶体积无限增长
        const fileName = `${user.id}/avatar`;

        // 覆盖模式上行文件，显式声明 content-type 非常关键，因为去掉了后缀名
        const { error: uploadError } = await supabase.storage
            .from('avatars')
            .upload(fileName, file, {
                upsert: true,
                contentType: file.type
            });

        if (uploadError) throw uploadError;

        // 获取该文件的公开访问链接供保存
        const { data: { publicUrl } } = supabase.storage
            .from('avatars')
            .getPublicUrl(fileName);

        // 加上时间戳防止浏览器图像缓存
        return `${publicUrl}?t=${Date.now()}`;
    },

    /** 获取当前 session */
    async getSession() {
        const { data: { session } } = await supabase.auth.getSession();
        return session;
    },
};

// ============================================================
// 词汇 API
// ============================================================

export const wordsApi = {
    /** 获取词汇列表，可按等级筛选 */
    async getWords(level?: 'CET-4' | 'CET-6'): Promise<DbWord[]> {
        let query = supabase.from('words').select('*').order('created_at', { ascending: true });
        if (level) query = query.eq('level', level);
        const { data, error } = await query;
        if (error) throw error;
        return data || [];
    },

    /** 获取单个词汇 */
    async getWordById(id: string): Promise<DbWord | null> {
        const { data, error } = await supabase.from('words').select('*').eq('id', id).single();
        if (error) throw error;
        return data;
    },
};

// ============================================================
// 用户词汇关系 API（掌握状态、收藏）
// ============================================================

export const userWordsApi = {
    /** 获取用户所有词汇状态 */
    async getUserWords(userId: string): Promise<(DbUserWord & { word: DbWord })[]> {
        const { data, error } = await supabase
            .from('user_words')
            .select('*, word:words(*)')
            .eq('user_id', userId)
            .order('updated_at', { ascending: false });
        if (error) throw error;
        return (data || []) as any;
    },

    /** 获取用户收藏的词汇 */
    async getCollectedWords(userId: string): Promise<(DbUserWord & { word: DbWord })[]> {
        const { data, error } = await supabase
            .from('user_words')
            .select('*, word:words(*)')
            .eq('user_id', userId)
            .eq('collected', true)
            .order('updated_at', { ascending: false });
        if (error) throw error;
        return (data || []) as any;
    },

    /** 更新或创建用户词汇状态 (upsert) */
    async upsertUserWord(
        userId: string,
        wordId: string,
        updates: { mastered?: boolean; collected?: boolean; last_reviewed?: string; review_count?: number }
    ): Promise<DbUserWord> {
        const { data, error } = await supabase
            .from('user_words')
            .upsert(
                {
                    user_id: userId,
                    word_id: wordId,
                    ...updates,
                },
                { onConflict: 'user_id,word_id' }
            )
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    /** 切换收藏状态 */
    async toggleCollect(userId: string, wordId: string, collected: boolean): Promise<DbUserWord> {
        return this.upsertUserWord(userId, wordId, { collected });
    },

    /** 更新掌握状态 */
    async updateMastered(userId: string, wordId: string, mastered: boolean): Promise<DbUserWord> {
        return this.upsertUserWord(userId, wordId, {
            mastered,
            last_reviewed: new Date().toISOString(),
        });
    },
};

// ============================================================
// 文章 API
// ============================================================

export const articlesApi = {
    /** 获取文章列表 */
    async getArticles(level?: 'CET-4' | 'CET-6'): Promise<DbArticle[]> {
        let query = supabase.from('articles').select('*').order('created_at', { ascending: false });
        if (level) query = query.eq('level', level);
        const { data, error } = await query;
        if (error) throw error;
        return data || [];
    },

    /** 获取单篇文章 */
    async getArticleById(id: string): Promise<DbArticle | null> {
        const { data, error } = await supabase.from('articles').select('*').eq('id', id).single();
        if (error) throw error;
        return data;
    },
};

// ============================================================
// 错题 API
// ============================================================

export const mistakesApi = {
    /** 获取用户错题列表 */
    async getMistakes(userId: string): Promise<DbUserMistake[]> {
        const { data, error } = await supabase
            .from('user_mistakes')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });
        if (error) throw error;
        return data || [];
    },

    /** 添加错题 */
    async addMistake(
        userId: string,
        mistake: { title: string; type: 'spelling' | 'grammar' | 'meaning'; description: string; category: string }
    ): Promise<DbUserMistake> {
        const { data, error } = await supabase
            .from('user_mistakes')
            .insert({ user_id: userId, ...mistake })
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    /** 标记错题已练习 */
    async markPracticed(id: string): Promise<void> {
        const { error } = await supabase
            .from('user_mistakes')
            .update({ practiced: true })
            .eq('id', id);
        if (error) throw error;
    },

    /** 获取待复习错题数量 */
    async getUnpracticedCount(userId: string): Promise<number> {
        const { count, error } = await supabase
            .from('user_mistakes')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
            .eq('practiced', false);
        if (error) throw error;
        return count || 0;
    },
};

// ============================================================
// 用户统计 API
// ============================================================

export const statsApi = {
    /** 获取用户统计 */
    async getUserStats(userId: string): Promise<DbUserStats | null> {
        const { data, error } = await supabase
            .from('user_stats')
            .select('*')
            .eq('user_id', userId)
            .single();
        if (error && error.code !== 'PGRST116') throw error; // PGRST116 = not found
        return data;
    },

    /** 更新用户统计 */
    async updateStats(
        userId: string,
        updates: Partial<Pick<DbUserStats, 'streak_days' | 'total_words' | 'total_hours' | 'today_words' | 'today_hours' | 'daily_goal' | 'last_check_in'>>
    ): Promise<DbUserStats> {
        const { data, error } = await supabase
            .from('user_stats')
            .update(updates)
            .eq('user_id', userId)
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    /** 每日打卡 */
    async checkIn(userId: string): Promise<DbUserStats> {
        const stats = await this.getUserStats(userId);
        if (!stats) throw new Error('用户统计记录不存在');

        const today = new Date().toISOString().split('T')[0];
        const lastCheckIn = stats.last_check_in;

        let newStreak = stats.streak_days;
        if (lastCheckIn !== today) {
            // 检查是否是连续的
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayStr = yesterday.toISOString().split('T')[0];

            if (lastCheckIn === yesterdayStr) {
                newStreak += 1;
            } else if (lastCheckIn !== today) {
                newStreak = 1; // 重置连续
            }
        }

        return this.updateStats(userId, {
            streak_days: newStreak,
            last_check_in: today,
            today_words: lastCheckIn === today ? stats.today_words : 0,
            today_hours: lastCheckIn === today ? stats.today_hours : 0,
        });
    },
};

// ============================================================
// 写作 API
// ============================================================

export const writingApi = {
    /** 保存写作记录 */
    async saveEssay(
        userId: string,
        essay: {
            level: 'CET-4' | 'CET-6';
            topic: string;
            generated_title: string;
            generated_content: string;
            structure_analysis?: string;
            key_phrases?: string[];
        }
    ): Promise<DbWritingEssay> {
        const { data, error } = await supabase
            .from('writing_essays')
            .insert({ user_id: userId, ...essay })
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    /** 获取写作历史 */
    async getEssays(userId: string): Promise<DbWritingEssay[]> {
        const { data, error } = await supabase
            .from('writing_essays')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });
        if (error) throw error;
        return data || [];
    },
};
