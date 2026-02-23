import { GoogleGenAI } from '@google/genai';

// 检查是否在环境变量中提供了 Gemini API Key
const apiKey = import.meta.env.VITE_GEMINI_API_KEY as string;

if (!apiKey) {
    console.warn('⚠️ 未找到 VITE_GEMINI_API_KEY 环境变量，请在 .env.local 中配置它以启用人工智能功能。');
}

// 实例化 Gemini 客户端
export const aiClient = new GoogleGenAI(apiKey ? { apiKey } : {});

/**
 * 通用对话接口
 * @param prompt 用户的提示词 
 * @param systemInstruction (可选) 设定的助手人设或上下文
 */
export async function generateContent(prompt: string, systemInstruction?: string) {
    try {
        const response = await aiClient.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: systemInstruction ? { systemInstruction } : undefined,
        });
        return response.text;
    } catch (error) {
        console.error('Gemini generateContent error:', error);
        throw new Error('AI 生成失败，请检查网络或 API Key 设置。');
    }
}

/**
 * （核心功能）生成四六级阅读文章
 * @param level 'CET-4' 或 'CET-6'
 * @param topic 文章主题
 */
export async function generateArticle(level: 'CET-4' | 'CET-6', topic: string) {
    const systemInstruction = `
你是一位专门为中国大学生编写英语等级考试阅读理解的权威命题组专家。
请根据用户的要求（级别和主题），生成一篇地道、纯正的英文阅读文章。
要求：
1. 词汇量：${level === 'CET-4' ? '250-300' : '350-450'} 词左右。
2. 词汇难度：严格限制在 ${level} 考试大纲词汇范围内。
3. 必须返回一份合法的 JSON 格式。
4. JSON 结构必须包含以下字段：
  - title (文章英文标题)
  - content (文章纯英文正文，分段请使用换行符)
  - read_time (格式如 "3 分钟阅读")
  - difficulty ("Easy", "Medium", 或 "Hard")
  - keywords (包含 5-8 个本文的重点考察四六级核心单词的数组)
`;

    const prompt = `请生成一篇关于主题“${topic}”的 ${level} 阅读文章。`;

    try {
        const response = await aiClient.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: prompt,
            config: {
                systemInstruction,
                // 强制模型按照 JSON 结构约束输出
                responseMimeType: 'application/json',
            }
        });

        if (!response.text) {
            throw new Error('AI Failed to return text content.');
        }

        const jsonResult = JSON.parse(response.text);
        return jsonResult;
    } catch (error) {
        console.error('Gemini generateArticle error:', error);
        throw new Error('未能成功生成文章，请稍后再试。');
    }
}

/**
 * （新需求）生成带有考试大纲词汇的趣味英文小文（悬疑、科幻等）
 * @param level 'CET-4' 或 'CET-6'
 * @param genre 选取的体裁风格（如 'Suspense', 'Sci-Fi', 'Romance' 等）
 * @param keywords (可选) 用户自定义的主题词
 */
export async function generateStory(level: 'CET-4' | 'CET-6', genre: string, keywords: string = '') {
    const systemInstruction = `
你是一位专门为中国大学生编写英语原版兴趣读物的小说家。
请根据用户要求的“体裁”和“核心等级”，创作一篇引人入胜的英文小故事。
要求：
1. 词汇量：300-400 词左右，故事需情节跌宕起伏或引人入胜。
2. 词汇难度：必须极其密集地使用 ${level} 考试大纲中的高频核心词汇。
3. 返回合法的 JSON 格式。
4. JSON 结构必须包含以下字段：
  - title (故事英文标题)
  - content (故事纯英文正文，分段使用换行符)
  - genre (故事体裁，例："Suspense")
  - target_words (包含 5-10 个文章中使用到的四六级重点大纲单词，用作高亮解析的数组)
  - words_translation (一个键值对对象，key 是你提取的重点单词，value 是它的中文释义和词性，例如 {"abandon": "v. 抛弃"})
`;

    const prompt = `请写一篇扣人心弦的 ${genre} （${genre === 'Suspense' ? '悬疑' : genre === 'Sci-Fi' ? '科幻' : '趣味'}）小故事，词汇严格限制在 ${level} 范围内。${keywords ? `文章需包含或围绕以下元素展开：${keywords}` : ''}`;

    try {
        const response = await aiClient.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: prompt,
            config: {
                systemInstruction,
                responseMimeType: 'application/json',
            }
        });

        if (!response.text) throw new Error('Empty story result');
        return JSON.parse(response.text);
    } catch (error) {
        console.error('Gemini generateStory error:', error);
        throw new Error('AI 小说生成失败，可能是网络波动或接口限制，请稍后再试。');
    }
}

