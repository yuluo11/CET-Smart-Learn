import { Word, Mistake, Article } from './types';

export const MOCK_WORDS: Word[] = [
  {
    id: '1',
    word: 'Resilient',
    phonetic: '/rɪˈzɪliənt/',
    definitionEn: 'Able to withstand or recover quickly from difficult conditions; strong enough to survive.',
    definitionCn: '有弹性的；能迅速恢复活力的；适应性强的。',
    exampleEn: 'Economists remain optimistic that the global market is resilient enough to withstand current fluctuations.',
    exampleCn: '经济学家仍持乐观态度，认为全球市场有足够的韧性来抵御当前的波动。',
    source: '历年六级真题',
    mastered: false,
    lastReviewed: '3天前'
  },
  {
    id: '2',
    word: 'Acknowledge',
    phonetic: '/əkˈnɒl.ɪdʒ/',
    definitionEn: 'Accept or admit the existence or truth of.',
    definitionCn: 'v. 承认；致谢；报偿',
    exampleEn: 'The government acknowledged that the tax was unfair.',
    exampleCn: '政府承认这项税收是不公平的。',
    source: 'CET-6 核心词汇',
    mastered: true
  },
  {
    id: '3',
    word: 'Consistent',
    phonetic: '/kənˈsɪs.tənt/',
    definitionEn: 'Acting or done in the same way over time, especially so as to be fair or accurate.',
    definitionCn: 'adj. 一致的；连续的；始终如一的',
    exampleEn: 'The results are consistent with earlier research.',
    exampleCn: '这些结果与早期的研究一致。',
    source: 'CET-4 核心词汇',
    mastered: true
  }
];

export const MOCK_MISTAKES: Mistake[] = [
  {
    id: '1',
    title: 'Accommodate',
    type: 'spelling',
    description: 'Your spelling: "Acomodate". Needs double \'c\' and \'m\'.',
    time: '2小时前',
    category: 'CET-4 词汇'
  },
  {
    id: '2',
    title: 'Subject-Verb Agreement',
    type: 'grammar',
    description: '"The team are..." -> "The team is..."',
    time: '昨天',
    category: 'CET-4 词汇'
  },
  {
    id: '3',
    title: 'Affect vs Effect',
    type: 'meaning',
    description: "Confused verb 'affect' with noun 'effect'.",
    time: '昨天',
    category: 'CET-4 词汇'
  }
];

export const MOCK_ARTICLE: Article = {
  id: '1',
  title: 'The Future of Renewable Energy',
  level: 'CET-6',
  readTime: '12 分钟阅读',
  difficulty: 'Hard',
  content: `The global shift toward renewable energy resources, such as solar and wind power, is becoming increasingly sustainable in modern infrastructure. The integration of advanced technology ensures that power grids can handle fluctuating energy inputs efficiently.

"As we transition away from fossil fuels, the global economy faces both challenges and opportunities. Innovative solutions are required to store energy for periods when the sun is not shining."

Engineers are exploring ways to mitigate the environmental impact of battery production. While the transition presents considerable hurdles, the potential for a carbon-neutral future remains the primary incentive for international cooperation.

Furthermore, the implementation of smart grids allows for real-time monitoring of energy consumption. This paradigm shift in how we distribute electricity is pivotal to achieving long-term climate goals.`,
  keywords: ['renewable', 'sustainable', 'infrastructure', 'efficiently', 'mitigate', 'considerable', 'incentive', 'implementation', 'paradigm', 'pivotal']
};
