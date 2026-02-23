-- ============================================================
-- 四六级智学 (CET Smart Learn) - Supabase 数据库初始化脚本
-- 请在 Supabase Dashboard -> SQL Editor 中执行此脚本
-- ============================================================

-- 启用 UUID 扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 1. 词汇表 (words)
-- ============================================================
CREATE TABLE IF NOT EXISTS words (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  word TEXT NOT NULL,
  phonetic TEXT NOT NULL DEFAULT '',
  definition_en TEXT NOT NULL DEFAULT '',
  definition_cn TEXT NOT NULL DEFAULT '',
  example_en TEXT NOT NULL DEFAULT '',
  example_cn TEXT NOT NULL DEFAULT '',
  source TEXT NOT NULL DEFAULT '',
  level TEXT NOT NULL DEFAULT 'CET-4' CHECK (level IN ('CET-4', 'CET-6')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE words ENABLE ROW LEVEL SECURITY;
CREATE POLICY "words_read_all" ON words FOR SELECT USING (true);

-- ============================================================
-- 2. 文章表 (articles)
-- ============================================================
CREATE TABLE IF NOT EXISTS articles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  level TEXT NOT NULL DEFAULT 'CET-4' CHECK (level IN ('CET-4', 'CET-6')),
  read_time TEXT NOT NULL DEFAULT '',
  difficulty TEXT NOT NULL DEFAULT 'Medium' CHECK (difficulty IN ('Easy', 'Medium', 'Hard')),
  content TEXT NOT NULL DEFAULT '',
  keywords TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "articles_read_all" ON articles FOR SELECT USING (true);

-- ============================================================
-- 3. 用户词汇关系表 (user_words)
-- ============================================================
CREATE TABLE IF NOT EXISTS user_words (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  word_id UUID NOT NULL REFERENCES words(id) ON DELETE CASCADE,
  mastered BOOLEAN NOT NULL DEFAULT false,
  collected BOOLEAN NOT NULL DEFAULT false,
  last_reviewed TIMESTAMPTZ,
  review_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, word_id)
);

ALTER TABLE user_words ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_words_own" ON user_words FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- 4. 用户错题表 (user_mistakes)
-- ============================================================
CREATE TABLE IF NOT EXISTS user_mistakes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('spelling', 'grammar', 'meaning')),
  description TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT '',
  practiced BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE user_mistakes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_mistakes_own" ON user_mistakes FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- 5. 用户统计表 (user_stats)
-- ============================================================
CREATE TABLE IF NOT EXISTS user_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  streak_days INTEGER NOT NULL DEFAULT 0,
  total_words INTEGER NOT NULL DEFAULT 0,
  total_hours NUMERIC(10, 2) NOT NULL DEFAULT 0,
  today_words INTEGER NOT NULL DEFAULT 0,
  today_hours NUMERIC(10, 2) NOT NULL DEFAULT 0,
  daily_goal INTEGER NOT NULL DEFAULT 50,
  last_check_in DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_stats_own" ON user_stats FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- 6. 写作记录表 (writing_essays)
-- ============================================================
CREATE TABLE IF NOT EXISTS writing_essays (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  level TEXT NOT NULL DEFAULT 'CET-4' CHECK (level IN ('CET-4', 'CET-6')),
  topic TEXT NOT NULL DEFAULT '',
  generated_title TEXT NOT NULL DEFAULT '',
  generated_content TEXT NOT NULL DEFAULT '',
  structure_analysis TEXT,
  key_phrases TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE writing_essays ENABLE ROW LEVEL SECURITY;
CREATE POLICY "writing_essays_own" ON writing_essays FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- 7. 触发器：自动更新 updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_user_words_updated
  BEFORE UPDATE ON user_words
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_user_stats_updated
  BEFORE UPDATE ON user_stats
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- 8. 触发器：注册用户时自动创建 user_stats 记录
-- ============================================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_stats (user_id) VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- 9. 种子数据 - 词汇
-- ============================================================
INSERT INTO words (word, phonetic, definition_en, definition_cn, example_en, example_cn, source, level) VALUES
(
  'Resilient',
  '/rɪˈzɪliənt/',
  'Able to withstand or recover quickly from difficult conditions; strong enough to survive.',
  '有弹性的；能迅速恢复活力的；适应性强的。',
  'Economists remain optimistic that the global market is resilient enough to withstand current fluctuations.',
  '经济学家仍持乐观态度，认为全球市场有足够的韧性来抵御当前的波动。',
  '历年六级真题',
  'CET-6'
),
(
  'Acknowledge',
  '/əkˈnɒl.ɪdʒ/',
  'Accept or admit the existence or truth of.',
  'v. 承认；致谢；报偿',
  'The government acknowledged that the tax was unfair.',
  '政府承认这项税收是不公平的。',
  'CET-6 核心词汇',
  'CET-6'
),
(
  'Consistent',
  '/kənˈsɪs.tənt/',
  'Acting or done in the same way over time, especially so as to be fair or accurate.',
  'adj. 一致的；连续的；始终如一的',
  'The results are consistent with earlier research.',
  '这些结果与早期的研究一致。',
  'CET-4 核心词汇',
  'CET-4'
),
(
  'Sustainable',
  '/səˈsteɪnəbl/',
  'Involving the use of natural products and energy in a way that does not harm the environment.',
  'adj. 可持续的；可维持的',
  'The company is committed to sustainable development.',
  '该公司致力于可持续发展。',
  'CET-6 核心词汇',
  'CET-6'
),
(
  'Infrastructure',
  '/ˈɪnfrəstrʌktʃər/',
  'The basic physical and organizational structures and facilities needed for the operation of a society.',
  'n. 基础设施；基本建设',
  'The country needs to invest in its infrastructure.',
  '该国需要投资其基础设施。',
  'CET-6 核心词汇',
  'CET-6'
),
(
  'Paradigm',
  '/ˈpærədaɪm/',
  'A typical example or pattern of something; a model.',
  'n. 范例；典范；范式',
  'This discovery will shift the


 


 


 paradigm of modern medicine.',
  '这一发现将改变现代医学的范式。',
  'CET-6 核心词汇',
  'CET-6'
);

-- ============================================================
-- 10. 种子数据 - 文章
-- ============================================================
INSERT INTO articles (title, level, read_time, difficulty, content, keywords) VALUES
(
  'The Future of Renewable Energy',
  'CET-6',
  '12 分钟阅读',
  'Hard',
  'The global shift toward renewable energy resources, such as solar and wind power, is becoming increasingly sustainable in modern infrastructure. The integration of advanced technology ensures that power grids can handle fluctuating energy inputs efficiently.

"As we transition away from fossil fuels, the global economy faces both challenges and opportunities. Innovative solutions are required to store energy for periods when the sun is not shining."

Engineers are exploring ways to mitigate the environmental impact of battery production. While the transition presents considerable hurdles, the potential for a carbon-neutral future remains the primary incentive for international cooperation.

Furthermore, the implementation of smart grids allows for real-time monitoring of energy consumption. This paradigm shift in how we distribute electricity is pivotal to achieving long-term climate goals.',
  ARRAY['renewable', 'sustainable', 'infrastructure', 'efficiently', 'mitigate', 'considerable', 'incentive', 'implementation', 'paradigm', 'pivotal']
),
    'Artificial Intelligence in Healthcare',
  'CET-6',
  '8 分钟阅读',
  'Medium',
  'Artificial intelligence has emerged as a transformative force in the healthcare industry. From diagnosing diseases to personalizing treatment plans, AI algorithms are reshaping how medical professionals approach patient care.

Machine learning models can now analyze medical images with remarkable accuracy, often surpassing human experts in detecting early signs of conditions such as cancer. This capability has profound implications for preventive medicine.

However, the integration of AI into healthcare raises important ethical questions about data privacy, algorithmic bias, and the role of human judgment in medical decision-making.',
  ARRAY['transformative', 'algorithms', 'diagnosing', 'remarkable', 'surpassing', 'profound', 'implications', 'preventive', 'integration', 'algorithmic']
);

-- ============================================================
-- 6. Storage 头像存储桶 (avatars) 与安全策略
-- ============================================================

-- （注：如果不熟悉 SQL，推荐您直接在 Supabase -> Storage -> New Bucket 手动创建一个开启 "Public" 权限、名为 avatars 的存储桶）
-- 1) 创建名为 avatars 的公共存储桶用来当相册图床
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- 2) 为 storage.objects 表设置公开读取（任何人都能看到头像图片内容）
CREATE POLICY "Public Access for avatars"
  ON storage.objects FOR SELECT
  USING ( bucket_id = 'avatars' );

-- 3) 允许已登录用户向自己的 user_id 目录下传头像图片
CREATE POLICY "Users can upload their own avatars"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars' 
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- 4) 允许用户修改自己的头像文件
CREATE POLICY "Users can update their own avatars"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'avatars' 
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- 5) 允许用户删除自己的头像
CREATE POLICY "Users can delete their own avatars"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'avatars' 
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
