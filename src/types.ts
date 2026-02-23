export type Screen = 'splash' | 'login' | 'register' | 'home' | 'vocabulary' | 'reading' | 'mistakes' | 'practice' | 'writing' | 'collections' | 'profile' | 'settings';

export interface Word {
  id: string;
  word: string;
  phonetic: string;
  definitionEn: string;
  definitionCn: string;
  exampleEn: string;
  exampleCn: string;
  source: string;
  mastered: boolean;
  lastReviewed?: string;
}

export interface Mistake {
  id: string;
  title: string;
  type: 'spelling' | 'grammar' | 'meaning';
  description: string;
  time: string;
  category: string;
}

export interface Article {
  id: string;
  title: string;
  level: 'CET-4' | 'CET-6';
  readTime: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  content: string;
  keywords: string[];
}
