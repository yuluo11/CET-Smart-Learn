/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft,
  MoreHorizontal,
  Volume2,
  Info,
  X,
  HelpCircle,
  Check,
  Search,
  PlayCircle,
  Home,
  BookOpen,
  Sparkles,
  User,
  Bell,
  Flame,
  Timer,
  ChevronRight,
  Play,
  History,
  Bookmark,
  Download,
  Copy,
  Type as TypeIcon,
  Languages,
  Layout,
  Plus,
  ArrowLeftToLine,
  Eye,
  EyeOff,
  MessageSquare,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Screen, Word, Mistake, Article } from './types';
import { MOCK_WORDS, MOCK_MISTAKES, MOCK_ARTICLE } from './constants';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { DataProvider, useData } from './contexts/DataContext';
import { writingApi } from './lib/api';
import { generateArticle } from './lib/ai';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

function AppContent() {
  const { user, loading } = useAuth();
  const [currentScreen, setCurrentScreen] = useState<Screen>('splash');
  const [isDarkMode, setIsDarkMode] = useState(true);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  useEffect(() => {
    if (!loading && user && ['splash', 'login', 'register'].includes(currentScreen)) {
      setTimeout(() => setCurrentScreen('home'), 1500); // 给我一点点加载动画时间
    } else if (!loading && !user && !['splash', 'login', 'register'].includes(currentScreen)) {
      setCurrentScreen('login');
    }
  }, [user, loading, currentScreen]);

  const renderScreen = () => {
    switch (currentScreen) {
      case 'splash':
        return <SplashScreen onStart={() => setCurrentScreen(user ? 'home' : 'login')} />;
      case 'login':
        return <LoginScreen onLogin={() => setCurrentScreen('home')} onRegister={() => setCurrentScreen('register')} />;
      case 'register':
        return <RegisterScreen onBack={() => setCurrentScreen('login')} onRegister={() => setCurrentScreen('home')} />;
      case 'home':
        return <HomeScreen
          onNavigate={(s) => setCurrentScreen(s)}
          onStartReview={() => setCurrentScreen('vocabulary')}
          onStartReading={() => setCurrentScreen('reading')}
          onStartWriting={() => setCurrentScreen('writing')}
        />;
      case 'vocabulary':
        return <VocabularyScreen onBack={() => setCurrentScreen('home')} />;
      case 'reading':
        return <ReadingScreen onBack={() => setCurrentScreen('home')} />;
      case 'mistakes':
        return <MistakesScreen onBack={() => setCurrentScreen('home')} onPractice={() => setCurrentScreen('practice')} onNavigate={(s) => setCurrentScreen(s)} />;
      case 'practice':
        return <PracticeScreen onBack={() => setCurrentScreen('mistakes')} />;
      case 'writing':
        return <WritingScreen onBack={() => setCurrentScreen('home')} />;
      case 'collections':
        return <CollectionsScreen onBack={() => setCurrentScreen('home')} onNavigate={(s) => setCurrentScreen(s)} />;
      case 'profile':
        return <ProfileScreen onNavigate={(s) => setCurrentScreen(s)} />;
      case 'settings':
        return <SettingsScreen onBack={() => setCurrentScreen('profile')} />;
      default:
        return <HomeScreen onNavigate={(s) => setCurrentScreen(s)} onStartReview={() => { }} onStartReading={() => { }} onStartWriting={() => { }} />;
    }
  };

  const showAI = !['splash', 'login', 'register'].includes(currentScreen);

  return (
    <div className="min-h-screen font-sans relative">
      <AnimatePresence mode="wait">
        {renderScreen()}
      </AnimatePresence>

      {showAI && <FloatingAI />}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <DataProvider>
        <AppContent />
      </DataProvider>
    </AuthProvider>
  );
}

function FloatingAI() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: 'user' | 'ai', text: string }[]>([
    { role: 'ai', text: '你好！我是你的英语智学助手。有什么四六级复习或者单词语法方面的问题，随时可以问我哦！' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsLoading(true);

    try {
      const { generateContent } = await import("./lib/ai");

      const systemPrompt = "你是一个专业的四六级英语学习助教。请用生动活泼的中文回答用户的问题，提供相关的英语学习建议、词汇辨析或语法翻译。内容要求精简并且排版清晰。";

      const aiText = await generateContent(userMsg, systemPrompt);
      setMessages(prev => [...prev, { role: 'ai', text: aiText }]);
    } catch (error) {
      console.error("AI Error:", error);
      setMessages(prev => [...prev, { role: 'ai', text: "哎呀，跟助教连接断开了，请检查您的网络和 API 密钥设置后再试一下吧。" }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating Draggable Button */}
      <motion.div
        drag
        dragConstraints={{ left: -300, right: 0, top: -600, bottom: 0 }}
        className="fixed right-6 bottom-28 z-[100] touch-none"
        whileDrag={{ scale: 1.1 }}
      >
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="size-14 rounded-full bg-primary text-white shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all group"
        >
          {isOpen ? <X className="w-6 h-6" /> : <Sparkles className="w-6 h-6 fill-white group-hover:animate-pulse" />}
        </button>
      </motion.div>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed right-6 bottom-44 w-[calc(100vw-48px)] max-w-[360px] max-h-[70vh] h-[500px] bg-white dark:bg-card-dark rounded-2xl shadow-2xl z-[100] flex flex-col border border-slate-200 dark:border-white/10 overflow-hidden"
          >
            <div className="p-4 bg-primary text-white flex items-center gap-3 shrink-0">
              <div className="size-8 rounded-lg bg-white/20 flex items-center justify-center">
                <Sparkles className="w-5 h-5 fill-white" />
              </div>
              <div>
                <h3 className="font-bold text-sm">英语智学助手</h3>
                <p className="text-[10px] opacity-80">AI 实时在线解答</p>
              </div>
            </div>

            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-slate-50/50 dark:bg-transparent"
            >
              {messages.map((msg, i) => (
                <div key={i} className={cn("flex", msg.role === 'user' ? "justify-end" : "justify-start")}>
                  <div className={cn(
                    "max-w-[85%] p-3 rounded-2xl text-sm shadow-sm",
                    msg.role === 'user'
                      ? "bg-primary text-white rounded-tr-none"
                      : "bg-white dark:bg-[#232f48] text-slate-800 dark:text-slate-200 rounded-tl-none border border-slate-100 dark:border-white/5"
                  )}>
                    {msg.text}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white dark:bg-[#232f48] p-3 rounded-2xl rounded-tl-none border border-slate-100 dark:border-white/5">
                    <div className="flex gap-1">
                      <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce"></div>
                      <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:0.2s]"></div>
                      <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:0.4s]"></div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-100 dark:border-white/5 bg-white dark:bg-card-dark shrink-0">
              <div className="flex gap-2">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="输入你的问题..."
                  className="flex-1 bg-slate-100 dark:bg-[#192233] border-none rounded-xl px-4 py-2 text-sm focus:ring-1 focus:ring-primary outline-none text-slate-900 dark:text-white"
                />
                <button
                  onClick={handleSend}
                  disabled={isLoading}
                  className="size-10 rounded-xl bg-primary text-white flex items-center justify-center disabled:opacity-50 shadow-lg shadow-primary/20"
                >
                  <Play className="w-4 h-4 fill-white rotate-[-90deg]" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// --- Screens ---

function SplashScreen({ onStart }: { onStart: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="relative flex h-screen w-full flex-col justify-between overflow-hidden bg-white dark:bg-background-dark font-display"
    >
      <div className="h-12 w-full"></div>
      <div className="flex flex-col items-center justify-center flex-grow px-8 text-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="relative mb-8 flex items-center justify-center"
        >
          <div className="w-32 h-32 bg-primary/10 rounded-3xl flex items-center justify-center relative overflow-hidden">
            <BookOpen className="text-primary w-20 h-20 fill-primary/20" />
            <div className="absolute top-4 right-4 bg-white dark:bg-background-dark rounded-full p-1 shadow-sm">
              <Sparkles className="text-primary w-6 h-6 fill-primary" />
            </div>
          </div>
        </motion.div>
        <h1 className="text-slate-900 dark:text-white tracking-tight text-[36px] font-bold leading-tight pb-2">
          四六级智学
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-lg font-medium leading-normal max-w-[280px]">
          助力四六级，智学英语
        </p>
      </div>
      <div className="flex flex-col w-full px-6 pb-12 gap-6">
        <button
          onClick={onStart}
          className="flex min-w-full cursor-pointer items-center justify-center overflow-hidden rounded-xl h-14 px-5 bg-primary text-white text-lg font-bold shadow-lg shadow-primary/20 hover:opacity-90 active:scale-[0.98] transition-all"
        >
          立即开始
        </button>
        <div className="text-center">
          <p className="text-xs text-slate-400 dark:text-slate-500 tracking-wider uppercase">
            Smart Learning Powered by AI • v2.4.0
          </p>
        </div>
      </div>
      <div className="absolute -top-24 -left-24 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute top-1/2 -right-32 w-80 h-80 bg-primary/5 rounded-full blur-3xl pointer-events-none"></div>
    </motion.div>
  );
}

function LoginScreen({ onLogin, onRegister }: { onLogin: () => void, onRegister: () => void }) {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { signIn } = useAuth();

  const handleLogin = async () => {
    if (!email || !password) {
      setError('请输入邮箱和密码');
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      await signIn(email, password);
      onLogin();
    } catch (err: any) {
      setError(err.message || '登录失败，请检查账号密码');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ x: 20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: -20, opacity: 0 }}
      className="relative flex h-screen w-full max-w-md mx-auto flex-col overflow-x-hidden bg-background-light dark:bg-background-dark"
    >
      <div className="flex items-center bg-transparent p-4 justify-between">
        <button className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h2 className="text-lg font-bold leading-tight tracking-tight flex-1 text-center pr-10">登录</h2>
      </div>
      <div className="flex-1 flex flex-col px-6">
        <div className="pt-10 pb-8 text-center">
          <h1 className="text-[32px] font-bold leading-tight tracking-tight">欢迎回来</h1>
          <p className="text-slate-500 dark:text-[#92a4c9] mt-2 text-sm">助力四六级，开启你的进阶之旅</p>
        </div>
        <div className="space-y-4">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium leading-normal px-1">邮箱</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="form-input flex w-full rounded-xl border border-slate-200 dark:border-[#324467] bg-white dark:bg-[#192233] h-14 placeholder:text-slate-400 dark:placeholder:text-[#92a4c9] px-4 text-base font-normal focus:ring-2 focus:ring-primary focus:border-primary transition-all outline-none"
              placeholder="请输入邮箱"
              type="email"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium leading-normal px-1">密码</label>
            <div className="relative flex items-center">
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                className="form-input flex w-full rounded-xl border border-slate-200 dark:border-[#324467] bg-white dark:bg-[#192233] h-14 placeholder:text-slate-400 dark:placeholder:text-[#92a4c9] px-4 text-base font-normal focus:ring-2 focus:ring-primary focus:border-primary transition-all outline-none"
                placeholder="请输入密码"
                type={showPassword ? "text" : "password"}
              />
              <button
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 text-slate-400 dark:text-[#92a4c9] flex items-center justify-center"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {error && <p className="text-rose-500 text-sm px-1">{error}</p>}

          <div className="flex justify-end">
            <button className="text-slate-500 dark:text-[#92a4c9] text-sm font-normal hover:text-primary transition-colors">
              忘记密码?
            </button>
          </div>
          <div className="pt-4">
            <button
              onClick={handleLogin}
              disabled={isLoading}
              className="w-full flex items-center justify-center bg-primary hover:bg-primary/90 disabled:opacity-50 text-white font-bold h-14 rounded-xl shadow-lg shadow-primary/20 transition-all active:scale-[0.98]"
            >
              {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : '立即登录'}
            </button>
          </div>
          <div className="text-center pt-2">
            <p className="text-sm text-slate-500 dark:text-[#92a4c9]">
              还没有账号?
              <button onClick={onRegister} className="text-primary font-semibold ml-1">立即注册</button>
            </p>
          </div>
        </div>
        <div className="mt-auto pb-12">
          <div className="flex items-center gap-4 mb-8">
            <div className="h-[1px] flex-1 bg-slate-200 dark:bg-slate-800"></div>
            <span className="text-xs text-slate-400 dark:text-[#4f6b9c] font-medium uppercase tracking-widest">其他登录方式</span>
            <div className="h-[1px] flex-1 bg-slate-200 dark:bg-slate-800"></div>
          </div>
          <div className="flex justify-center gap-6">
            <button className="w-12 h-12 flex items-center justify-center rounded-full bg-white dark:bg-[#192233] border border-slate-200 dark:border-[#324467] hover:border-primary/50 transition-colors">
              <MessageSquare className="w-6 h-6 text-[#07c160]" />
            </button>
            <button className="w-12 h-12 flex items-center justify-center rounded-full bg-white dark:bg-[#192233] border border-slate-200 dark:border-[#324467] hover:border-primary/50 transition-colors">
              <User className="w-6 h-6 text-slate-900 dark:text-white" />
            </button>
            <button className="w-12 h-12 flex items-center justify-center rounded-full bg-white dark:bg-[#192233] border border-slate-200 dark:border-[#324467] hover:border-primary/50 transition-colors">
              <Languages className="w-6 h-6 text-[#12b7f5]" />
            </button>
          </div>
        </div>
      </div>
      <div className="flex justify-center pb-2 pt-6">
        <div className="w-32 h-1 bg-slate-300 dark:bg-slate-700 rounded-full"></div>
      </div>
    </motion.div>
  );
}

function RegisterScreen({ onBack, onRegister }: { onBack: () => void, onRegister: () => void }) {
  const [showPassword, setShowPassword] = useState(false);
  const [step, setStep] = useState<'form' | 'verify'>('form');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { signUp, verifyOtp } = useAuth();

  const handleRegister = async () => {
    if (!username || !email || !password) {
      setError('请输入昵称、邮箱和密码');
      return;
    }
    if (password.length < 6) {
      setError('密码长度至少为 6 位');
      return;
    }

    setIsLoading(true);
    setError('');
    try {
      await signUp(email, password, username);
      setStep('verify');
    } catch (err: any) {
      setError(err.message || '注册失败，请稍后重试');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!otpCode) {
      setError('请输入验证码');
      return;
    }

    setIsLoading(true);
    setError('');
    try {
      await verifyOtp(email, otpCode);
      onRegister();
    } catch (err: any) {
      setError(err.message || '验证失败，请检查验证码是否正确');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ x: 20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: -20, opacity: 0 }}
      className="relative flex h-full min-h-screen w-full flex-col overflow-x-hidden max-w-[480px] mx-auto shadow-2xl bg-background-light dark:bg-background-dark"
    >
      <div className="flex items-center p-4 pb-2 justify-between">
        <button onClick={onBack} className="text-slate-800 dark:text-white flex size-12 shrink-0 items-center cursor-pointer">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h2 className="text-slate-800 dark:text-white text-lg font-bold leading-tight tracking-tight flex-1 text-center pr-12">注册新账号</h2>
      </div>
      <div className="flex-1 flex flex-col px-6">
        <div className="pt-8 pb-8 text-center">
          <h1 className="text-[32px] font-bold leading-tight tracking-tight">
            {step === 'form' ? '加入我们' : '邮箱验证'}
          </h1>
          <p className="text-slate-500 dark:text-[#92a4c9] mt-2 text-sm">
            {step === 'form' ? '创建一个新账号，开启学习之旅' : `我们已向 ${email} 发送了 6 位数字验证码`}
          </p>
        </div>

        {step === 'form' ? (
          <div className="space-y-4">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium leading-normal px-1">昵称 (用户名)</label>
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="form-input flex w-full rounded-xl border border-slate-200 dark:border-[#324467] bg-white dark:bg-[#192233] h-14 placeholder:text-slate-400 dark:placeholder:text-[#92a4c9] px-4 text-base font-normal focus:ring-2 focus:ring-primary focus:border-primary transition-all outline-none"
                placeholder="请输入昵称"
                type="text"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium leading-normal px-1">邮箱</label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="form-input flex w-full rounded-xl border border-slate-200 dark:border-[#324467] bg-white dark:bg-[#192233] h-14 placeholder:text-slate-400 dark:placeholder:text-[#92a4c9] px-4 text-base font-normal focus:ring-2 focus:ring-primary focus:border-primary transition-all outline-none"
                placeholder="请输入邮箱"
                type="email"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium leading-normal px-1">密码</label>
              <div className="relative flex items-center">
                <input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleRegister()}
                  className="form-input flex w-full rounded-xl border border-slate-200 dark:border-[#324467] bg-white dark:bg-[#192233] h-14 placeholder:text-slate-400 dark:placeholder:text-[#92a4c9] px-4 text-base font-normal focus:ring-2 focus:ring-primary focus:border-primary transition-all outline-none"
                  placeholder="请输入至少 6 位密码"
                  type={showPassword ? "text" : "password"}
                />
                <button
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 text-slate-400 dark:text-[#92a4c9] flex items-center justify-center"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {error && <p className="text-rose-500 text-sm px-1">{error}</p>}

            <div className="px-1 py-4 flex items-start gap-3">
              <input className="mt-1 w-5 h-5 rounded border-slate-300 dark:border-[#324467] text-primary focus:ring-primary bg-white dark:bg-[#192233]" id="terms" type="checkbox" />
              <label className="text-sm text-slate-500 dark:text-[#92a4c9] leading-relaxed" htmlFor="terms">
                我已阅读并同意 <span className="text-primary cursor-pointer font-medium">《用户协议》</span> 和 <span className="text-primary cursor-pointer font-medium">《隐私政策》</span>，并授权应用获取相关权限。
              </label>
            </div>

            <div className="pt-2">
              <button
                onClick={handleRegister}
                disabled={isLoading}
                className="w-full flex items-center justify-center bg-primary hover:bg-primary/90 disabled:opacity-50 text-white font-bold h-14 rounded-xl shadow-lg shadow-primary/20 transition-all active:scale-[0.98]"
              >
                {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : '发送验证码'}
              </button>
            </div>

            <div className="mt-auto pt-8 pb-4 text-center">
              <p className="text-slate-500 dark:text-[#92a4c9] text-sm">
                已有账号？ <button onClick={onBack} className="text-primary font-bold cursor-pointer">立即登录</button>
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium leading-normal px-1">验证码</label>
              <input
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleVerify()}
                className="form-input flex w-full rounded-xl border border-slate-200 dark:border-[#324467] bg-white dark:bg-[#192233] h-14 placeholder:text-slate-400 dark:placeholder:text-[#92a4c9] px-4 text-base font-normal focus:ring-2 focus:ring-primary focus:border-primary transition-all outline-none tracking-widest text-center"
                placeholder="在此输入 6 位数字验证码"
                type="text"
                maxLength={6}
              />
            </div>

            {error && <p className="text-rose-500 text-sm px-1 text-center">{error}</p>}

            <div className="pt-4">
              <button
                onClick={handleVerify}
                disabled={isLoading || otpCode.length < 6}
                className="w-full flex items-center justify-center bg-primary hover:bg-primary/90 disabled:opacity-50 text-white font-bold h-14 rounded-xl shadow-lg shadow-primary/20 transition-all active:scale-[0.98]"
              >
                {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : '验证并登录'}
              </button>
            </div>

            <div className="text-center pt-2">
              <button onClick={() => setStep('form')} className="text-sm text-slate-500 hover:text-primary transition-colors">
                返回修改邮箱并重试
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="h-8 bg-transparent"></div>
    </motion.div>
  );
}

// --- Screens ---

function HomeScreen({ onNavigate, onStartReview, onStartReading, onStartWriting }: {
  onNavigate: (s: Screen) => void,
  onStartReview: () => void,
  onStartReading: () => void,
  onStartWriting: () => void
}) {
  const { user } = useAuth();
  const { stats } = useData();

  const progressPercent = stats.dailyGoal > 0
    ? Math.min(100, Math.round((stats.todayWords / stats.dailyGoal) * 100))
    : 0;

  const dashArray = 364.4;
  const dashOffset = dashArray - (dashArray * progressPercent) / 100;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="bg-background-light dark:bg-background-dark text-slate-900 dark:text-white min-h-screen pb-24"
    >
      <div className="sticky top-0 z-50 bg-background-light/80 dark:bg-background-dark/80 ios-blur">
        <div className="flex items-center p-4 pb-2 justify-between">
          <div className="flex size-10 shrink-0 items-center overflow-hidden rounded-full ring-2 ring-primary/20">
            <User className="w-6 h-6 m-auto text-slate-500" />
          </div>
          <div className="flex-1 px-4">
            <p className="text-[10px] text-slate-500 dark:text-[#92a4c9] font-semibold uppercase tracking-wider">你好，</p>
            <h2 className="text-slate-900 dark:text-white text-lg font-bold leading-tight tracking-tight truncate max-w-[150px]">{user?.email?.split('@')[0] || '学习者'}</h2>
          </div>
          <div className="flex w-10 items-center justify-end">
            <button className="relative flex size-10 cursor-pointer items-center justify-center rounded-full bg-slate-200 dark:bg-[#232f48] text-slate-900 dark:text-white">
              <Bell className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="px-4 py-6 flex flex-col items-center">
        <div className="relative mb-2 flex items-center justify-center">
          <svg className="w-32 h-32 transform -rotate-90">
            <circle className="text-slate-200 dark:text-[#232f48]" cx="64" cy="64" fill="transparent" r="58" stroke="currentColor" strokeWidth="8"></circle>
            <circle
              className="text-primary transition-all duration-1000 ease-out"
              cx="64" cy="64" fill="transparent" r="58" stroke="currentColor"
              strokeDasharray={dashArray}
              strokeDashoffset={dashOffset}
              strokeLinecap="round" strokeWidth="8"
            ></circle>
          </svg>
          <div className="absolute flex flex-col items-center justify-center">
            <p className="text-slate-500 dark:text-[#92a4c9] text-xs font-medium leading-normal">累计时长</p>
          </div>
          <p className="text-slate-900 dark:text-white text-lg font-bold leading-tight">45.5h</p>
          <p className="text-[#0bda5e] text-xs font-semibold leading-normal">今日 +1.5h</p>
        </div>
      </div>
      <div className="flex shrink-0 flex-col gap-3 px-4 pt-4 pb-2">
        <button
          onClick={onStartReview}
          className="w-full py-3 bg-primary hover:bg-primary/90 text-white rounded-lg font-bold transition-colors flex items-center justify-center gap-2"
        >
          <Play className="w-4 h-4 fill-white" />
          开始复习
        </button>
        <button
          onClick={onStartReading}
          className="w-full py-3 bg-white dark:bg-[#232f48] border border-slate-200 dark:border-[#324467] text-slate-700 dark:text-white rounded-lg font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
        >
          每日阅读
        </button>
      </div>

      <BottomNav current="home" onNavigate={onNavigate} />
    </motion.div>
  );
}

function BottomNav({ current, onNavigate }: { current: string, onNavigate: (s: Screen) => void }) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 h-20 bg-white/80 dark:bg-[#101622]/80 ios-blur border-t border-slate-200 dark:border-white/5 px-6 pb-4 z-50">
      <div className="flex justify-between items-center h-full">
        <button onClick={() => onNavigate('home')} className={cn("flex flex-col items-center gap-1", current === 'home' ? "text-primary" : "text-slate-400 dark:text-[#92a4c9]")}>
          <Home className={cn("w-6 h-6", current === 'home' && "fill-primary")} />
          <span className="text-[10px] font-bold">首页</span>
        </button>
        <button onClick={() => onNavigate('collections')} className={cn("flex flex-col items-center gap-1", current === 'collections' ? "text-primary" : "text-slate-400 dark:text-[#92a4c9]")}>
          <Bookmark className={cn("w-6 h-6", current === 'collections' && "fill-primary")} />
          <span className="text-[10px] font-bold">书库</span>
        </button>
        <div className="relative -top-5">
          <button onClick={() => onNavigate('writing')} className="flex size-14 items-center justify-center rounded-full bg-primary text-white shadow-lg shadow-primary/40 border-4 border-background-light dark:border-background-dark">
            <Sparkles className="w-7 h-7 fill-white" />
          </button>
        </div>
        <button onClick={() => onNavigate('mistakes')} className={cn("flex flex-col items-center gap-1", current === 'mistakes' ? "text-primary" : "text-slate-400 dark:text-[#92a4c9]")}>
          <History className={cn("w-6 h-6", current === 'mistakes' && "fill-primary")} />
          <span className="text-[10px] font-bold">错题</span>
        </button>
        <button onClick={() => onNavigate('profile')} className={cn("flex flex-col items-center gap-1", current === 'profile' ? "text-primary" : "text-slate-400 dark:text-[#92a4c9]")}>
          <User className={cn("w-6 h-6", current === 'profile' && "fill-primary")} />
          <span className="text-[10px] font-bold">我的</span>
        </button>
      </div>
    </nav>
  );
}

function VocabularyScreen({ onBack }: { onBack: () => void }) {
  const { words, wordsLoading, updateWordMastered, toggleCollect, collectedWords, refreshStats } = useData();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showDefinition, setShowDefinition] = useState(false);
  const [progress, setProgress] = useState(0);

  const word = words[currentIndex];

  // 检查当前单词是否被收藏
  const isCollected = word ? collectedWords.some(cw => cw.id === word.id) : false;

  const handleNext = async (mastered: boolean) => {
    if (!word) return;

    // 乐观更新进度
    setProgress(p => Math.min(words.length, p + 1));

    // 更新状态到后端
    try {
      await updateWordMastered(word.id, mastered);
      await refreshStats(); // 刷新今日学习词汇量
    } catch (e) {
      console.error(e);
    }

    if (currentIndex < words.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setShowDefinition(false);
    } else {
      setTimeout(onBack, 1000);
    }
  };

  const handleToggleCollect = async () => {
    if (!word) return;
    await toggleCollect(word.id, !isCollected);
  };

  if (wordsLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background-light dark:bg-background-dark">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!word) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-background-light dark:bg-background-dark">
        <p className="text-slate-500 dark:text-slate-400">词汇库为空或已全部学完</p>
        <button onClick={onBack} className="mt-4 text-primary font-bold">返回首页</button>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="bg-background-light dark:bg-background-dark text-slate-900 dark:text-white min-h-screen flex flex-col transition-colors duration-300"
    >
      <header className="sticky top-0 z-10 bg-background-light dark:bg-background-dark px-4 py-3 flex items-center justify-between border-b border-slate-200 dark:border-slate-800">
        <button onClick={onBack} className="flex items-center gap-2">
          <ArrowLeft className="w-6 h-6 text-slate-600 dark:text-slate-400" />
        </button>
        <h2 className="text-lg font-bold tracking-tight">六级核心词汇</h2>
        <div className="flex items-center gap-4">
          <button onClick={handleToggleCollect}>
            <Bookmark className={cn("w-6 h-6 cursor-pointer", isCollected ? "fill-primary text-primary" : "text-slate-600 dark:text-slate-400")} />
          </button>
          <MoreHorizontal className="w-6 h-6 text-slate-600 dark:text-slate-400 cursor-pointer" />
        </div>
      </header>

      <div className="px-4 py-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">学习进度</span>
          <span className="text-xs font-bold text-primary">{progress} / 50</span>
        </div>
        <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
          <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${(progress / 50) * 100}%` }}></div>
        </div>
      </div>

      <main className="flex-1 px-4 flex flex-col items-center justify-center gap-6 max-w-lg mx-auto w-full">
        <div className="w-full bg-white dark:bg-card-dark rounded-xl shadow-xl dark:shadow-2xl p-8 flex flex-col items-center border border-slate-100 dark:border-slate-800">
          <h1 className="text-4xl md:text-5xl font-bold mb-2 tracking-tight">{word.word}</h1>
          <p className="text-slate-500 dark:text-slate-400 text-lg mb-6 font-light">{word.phonetic}</p>
          <button className="flex items-center justify-center w-14 h-14 rounded-full bg-primary/10 text-primary hover:bg-primary hover:text-white transition-all duration-200 mb-8">
            <Volume2 className="w-8 h-8" />
          </button>
          <div className="w-full space-y-4">
            <div className="border-t border-slate-100 dark:border-slate-800 pt-6">
              <span className="inline-block px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">定义</span>
              <p className="text-base leading-relaxed text-slate-700 dark:text-slate-200">
                {word.definitionEn}
              </p>
              <p className="text-base leading-relaxed text-slate-500 dark:text-slate-400 mt-2">
                {word.definitionCn}
              </p>
            </div>
            <div className="bg-primary/5 dark:bg-primary/10 rounded-lg p-4 border-l-4 border-primary mt-4">
              <div className="flex items-center gap-2 mb-2">
                <History className="w-4 h-4 text-primary" />
                <span className="text-[10px] font-bold text-primary uppercase tracking-widest">{word.source}</span>
              </div>
              <p className="text-sm italic leading-relaxed text-slate-700 dark:text-slate-300">
                "{word.exampleEn.split(word.word).map((part, i, arr) => (
                  <span key={i}>
                    {part}
                    {i < arr.length - 1 && <span className="font-bold text-primary underline underline-offset-4">{word.word}</span>}
                  </span>
                ))}"
              </p>
            </div>
          </div>
        </div>
        <div className="text-slate-400 dark:text-slate-600 text-xs text-center flex items-center gap-1 mt-2">
          <Info className="w-3 h-3" />
          上次复习：{word.lastReviewed}
        </div>
      </main>

      <footer className="p-4 bg-background-light dark:bg-background-dark pb-10">
        <div className="max-w-lg mx-auto grid grid-cols-3 gap-3">
          <button
            onClick={() => handleNext(false)}
            className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl border border-rose-200 dark:border-rose-900/30 bg-rose-50 dark:bg-rose-900/10 hover:bg-rose-100 dark:hover:bg-rose-900/20 transition-colors"
          >
            <div className="w-10 h-10 rounded-full flex items-center justify-center bg-rose-500 text-white">
              <X className="w-6 h-6" />
            </div>
            <span className="text-sm font-bold text-rose-600 dark:text-rose-400">忘记</span>
          </button>
          <button
            onClick={() => handleNext(false)}
            className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl border border-amber-200 dark:border-amber-900/30 bg-amber-50 dark:bg-amber-900/10 hover:bg-amber-100 dark:hover:bg-amber-900/20 transition-colors"
          >
            <div className="w-10 h-10 rounded-full flex items-center justify-center bg-amber-500 text-white">
              <HelpCircle className="w-6 h-6" />
            </div>
            <span className="text-sm font-bold text-amber-600 dark:text-amber-400">模糊</span>
          </button>
          <button
            onClick={() => handleNext(true)}
            className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl border border-primary/20 bg-primary/10 dark:bg-primary/20 hover:bg-primary/20 dark:hover:bg-primary/30 transition-colors"
          >
            <div className="w-10 h-10 rounded-full flex items-center justify-center bg-primary text-white">
              <Check className="w-6 h-6" />
            </div>
            <span className="text-sm font-bold text-primary">认识</span>
          </button>
        </div>
      </footer>
    </motion.div>
  );
}

function ReadingScreen({ onBack }: { onBack: () => void }) {
  const { currentArticle, articlesLoading } = useData();
  const [aiArticle, setAiArticle] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const displayArticle = aiArticle || currentArticle;

  const handleGenerateNew = async () => {
    if (isGenerating) return;
    setIsGenerating(true);
    try {
      // 随机选取一个四六级主题
      const topics = ['Technology and Society', 'Environmental Protection', 'Education Reform', 'Cultural Differences', 'Economic Globalization'];
      const randomTopic = topics[Math.floor(Math.random() * topics.length)];
      const result = await generateArticle('CET-4', randomTopic);
      setAiArticle({
        ...result,
        level: 'CET-4',
        readTime: result.read_time, // 抹平后端大写驼峰差异
      });
    } catch (e: any) {
      alert(e.message || '生成失败');
    } finally {
      setIsGenerating(false);
    }
  };

  if (articlesLoading || (!displayArticle && !isGenerating)) {
    return (
      <div className="flex h-screen items-center justify-center bg-background-light dark:bg-background-dark">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isGenerating) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-background-light dark:bg-background-dark gap-4">
        <RefreshCw className="w-10 h-10 animate-spin text-primary" />
        <p className="text-slate-600 dark:text-slate-300 font-medium">Gemini 正在为您创作全新阅读材料...</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="bg-background-light dark:bg-background-dark text-slate-900 dark:text-white transition-colors duration-300 min-h-screen"
    >
      <header className="sticky top-0 z-50 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between px-4 h-16 max-w-lg mx-auto">
          <button onClick={onBack} className="flex items-center justify-center size-10 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-base font-bold leading-tight tracking-tight flex-1 text-center truncate px-2">
            {displayArticle.title}
          </h1>
          <button className="flex items-center justify-center size-10 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800">
            <TypeIcon className="w-6 h-6" />
          </button>
        </div>
      </header>

      <main className="max-w-lg mx-auto pb-32">
        <div className="px-4 pt-6 pb-2">
          <div className="flex items-center gap-3 mb-4">
            <div className="px-2 py-1 bg-primary/20 text-primary text-[10px] font-bold rounded uppercase tracking-wider">{displayArticle.level}</div>
            <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400 text-xs">
              <Timer className="w-4 h-4" />
              <span>{displayArticle.readTime}</span>
            </div>
            <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400 text-xs">
              <Layout className="w-4 h-4" />
              <span>{displayArticle.difficulty}</span>
            </div>
          </div>

          <button
            onClick={handleGenerateNew}
            disabled={isGenerating}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-violet-500 to-primary text-white font-medium active:scale-95 transition-all shadow-lg shadow-primary/20 mb-6"
          >
            <Sparkles className="w-5 h-5" />
            AI 智能生成新文章
          </button>
        </div>

        <article className="px-4 space-y-6 text-lg leading-relaxed text-slate-700 dark:text-slate-200">
          {displayArticle.content.split('\n').filter((p: string) => p.trim() !== '').map((para: string, idx: number) => {
            if (para.startsWith('"')) {
              return (
                <div key={idx} className="relative group">
                  <p className="border-l-4 border-primary/40 pl-4 italic text-slate-500 dark:text-slate-400">
                    {para}
                  </p>
                </div>
              );
            }
            return (
              <p key={idx}>
                {para.split(' ').map((word: string, wIdx: number) => {
                  const cleanWord = word.replace(/[.,!?"]/g, '').toLowerCase();
                  const isKeyword = displayArticle.keywords?.includes(cleanWord);
                  return (
                    <span key={wIdx} className={cn(isKeyword && "text-primary font-bold underline decoration-primary/30 decoration-2 underline-offset-4")}>
                      {word}{' '}
                    </span>
                  );
                })}
              </p>
            );
          })}

          <div className="my-8 rounded-xl overflow-hidden aspect-video relative group">
            <img
              alt="Article illustration"
              className="w-full h-full object-cover"
              src="https://picsum.photos/seed/energy/800/450"
              referrerPolicy="no-referrer"
            />
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/60 to-transparent">
              <p className="text-white text-xs font-light">Sustainable wind farm integration in Northern Europe.</p>
            </div>
          </div>
        </article>

        <div className="px-4 mt-8">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-xl border border-slate-200 dark:border-slate-700 ring-4 ring-primary/10">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 className="text-xl font-bold text-primary">sustainable</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 font-mono">/səˈsteɪnəbl/</p>
              </div>
              <button className="bg-primary text-white p-2 rounded-lg">
                <Bookmark className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm leading-normal text-slate-600 dark:text-slate-300">
              <span className="font-bold text-slate-400 mr-2">adj.</span>
              Involving the use of natural products and energy in a way that does not harm the environment. (可持续的)
            </p>
            <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700 flex gap-2">
              <span className="px-2 py-1 bg-slate-100 dark:bg-slate-700 text-[10px] rounded">CET-4</span>
              <span className="px-2 py-1 bg-slate-100 dark:bg-slate-700 text-[10px] rounded">IELTS</span>
            </div>
          </div>
        </div>

        <div className="flex gap-2 p-4 flex-wrap mt-4">
          <div className="flex h-8 items-center gap-x-2 rounded-full bg-slate-100 dark:bg-slate-800 px-3">
            <Sparkles className="w-4 h-4 text-primary" />
            <p className="text-slate-700 dark:text-slate-200 text-xs font-medium">核心词汇</p>
          </div>
          <div className="flex h-8 items-center gap-x-2 rounded-full bg-slate-100 dark:bg-slate-800 px-3">
            <Layout className="w-4 h-4 text-primary" />
            <p className="text-slate-700 dark:text-slate-200 text-xs font-medium">环境生态</p>
          </div>
          <div className="flex h-8 items-center gap-x-2 rounded-full bg-slate-100 dark:bg-slate-800 px-3">
            <History className="w-4 h-4 text-primary" />
            <p className="text-slate-700 dark:text-slate-200 text-xs font-medium">学术写作</p>
          </div>
        </div>
      </main>

      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-[90%] max-w-md z-50">
        <div className="glass-toolbar rounded-2xl flex items-center justify-between px-6 py-4 shadow-2xl">
          <div className="flex flex-col items-center gap-1 group cursor-pointer">
            <div className="size-12 rounded-full bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/30">
              <Play className="w-6 h-6 fill-white" />
            </div>
            <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 tracking-tighter">音频</span>
          </div>
          <div className="h-8 w-px bg-slate-200 dark:bg-slate-700"></div>
          <div className="flex flex-col items-center gap-1 cursor-pointer">
            <div className="size-10 flex items-center justify-center text-slate-600 dark:text-slate-300">
              <Languages className="w-6 h-6" />
            </div>
            <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 tracking-tighter">翻译</span>
          </div>
          <div className="h-8 w-px bg-slate-200 dark:bg-slate-700"></div>
          <div className="flex flex-col items-center gap-1 cursor-pointer">
            <div className="size-10 flex items-center justify-center text-slate-600 dark:text-slate-300">
              <Layout className="w-6 h-6" />
            </div>
            <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 tracking-tighter">语法</span>
          </div>
          <div className="h-8 w-px bg-slate-200 dark:bg-slate-700"></div>
          <div className="flex flex-col items-center gap-1 cursor-pointer">
            <div className="size-10 flex items-center justify-center text-slate-600 dark:text-slate-300">
              <Sparkles className="w-6 h-6" />
            </div>
            <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 tracking-tighter">AI 笔记</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function MistakesScreen({ onBack, onPractice, onNavigate }: { onBack: () => void, onPractice: () => void, onNavigate: (s: Screen) => void }) {
  const { mistakes, mistakesLoading, unpracticedCount, practicedCount } = useData();

  if (mistakesLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background-light dark:bg-background-dark">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col h-screen bg-background-light dark:bg-background-dark overflow-hidden"
    >
      <header className="sticky top-0 z-20 bg-background-light dark:bg-background-dark border-b border-slate-200 dark:border-slate-800 shrink-0">
        <div className="flex items-center p-4 justify-between max-w-[480px] mx-auto w-full">
          <button onClick={onBack} className="text-slate-900 dark:text-white flex size-12 shrink-0 items-center cursor-pointer">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h2 className="text-slate-900 dark:text-white text-lg font-bold leading-tight tracking-tight flex-1 text-center">错题本</h2>
          <div className="flex w-12 items-center justify-end">
            <button className="flex cursor-pointer items-center justify-center rounded-lg h-12 bg-transparent text-slate-900 dark:text-white">
              <Search className="w-6 h-6" />
            </button>
          </div>
        </div>
        <div className="max-w-[480px] mx-auto w-full px-4 pb-2">
          <div className="flex border-b border-slate-200 dark:border-slate-800">
            <button
              onClick={() => onNavigate('collections')}
              className="flex-1 py-3 text-sm font-bold text-slate-400 border-b-2 border-transparent active:text-primary transition-colors"
            >
              生词本
            </button>
            <button className="flex-1 py-3 text-sm font-bold text-primary border-b-2 border-primary">错题集</button>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto max-w-[480px] mx-auto w-full pb-32">
        <div className="px-4 py-6">
          <div className="bg-primary/5 dark:bg-primary/10 rounded-2xl p-5 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-1">待复习错题</p>
              <p className="text-3xl font-bold text-primary">{unpracticedCount}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-1">今日已练</p>
              <p className="text-3xl font-bold text-slate-900 dark:text-white">{practicedCount}</p>
            </div>
          </div>
        </div>

        <div className="px-4 space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-slate-900 dark:text-white text-md font-bold">最近错题</h3>
            <span className="text-xs text-slate-500 dark:text-slate-400">全部</span>
          </div>
          {mistakes.length === 0 ? (
            <div className="text-center text-slate-500 py-10">暂无错题记录</div>
          ) : (
            mistakes.map(mistake => (
              <div key={mistake.id} className="bg-white dark:bg-[#192233] border border-slate-200 dark:border-[#324467] rounded-xl p-4 shadow-sm group active:scale-[0.99] transition-transform">
                <div className="flex justify-between items-start mb-2">
                  <span className={cn(
                    "px-2 py-0.5 text-[10px] font-bold rounded uppercase",
                    mistake.type === 'spelling' ? "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400" :
                      mistake.type === 'grammar' ? "bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400" :
                        "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                  )}>
                    {mistake.type === 'spelling' ? '拼写错误' : mistake.type === 'grammar' ? '语法错误' : '词义混淆'}
                  </span>
                  <span className="text-[10px] text-slate-400">{mistake.time}</span>
                </div>
                <p className="text-slate-900 dark:text-white font-bold text-base mb-1">{mistake.title}</p>
                <p className="text-slate-500 dark:text-slate-400 text-sm font-normal line-clamp-1">{mistake.description}</p>
              </div>
            ))
          )}
        </div>
      </main>

      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-full max-w-[480px] px-6 pointer-events-none">
        <button
          onClick={onPractice}
          className="pointer-events-auto w-full flex cursor-pointer items-center justify-center overflow-hidden rounded-full h-14 px-6 bg-primary text-white gap-3 text-lg font-bold shadow-2xl shadow-primary/40 active:scale-95 transition-transform"
        >
          <PlayCircle className="w-6 h-6 fill-white" />
          <span>开始重练</span>
        </button>
      </div>
      <BottomNav current="mistakes" onNavigate={onNavigate} />
    </motion.div>
  );
}

function PracticeScreen({ onBack }: { onBack: () => void }) {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  const options = [
    { id: 'A', text: 'the technical proficiency of the teaching staff' },
    { id: 'B', text: 'the initial investment in hardware infrastructure' },
    { id: 'C', text: 'the level of student engagement and interaction' },
    { id: 'D', text: 'the alignment with existing curriculum standards' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.05 }}
      className="flex flex-col min-h-screen bg-background-dark text-white"
    >
      <header className="sticky top-0 z-10 bg-background-dark border-b border-border-dark">
        <div className="flex items-center p-4 justify-between max-w-[480px] mx-auto w-full">
          <button onClick={onBack} className="flex w-12 items-center cursor-pointer">
            <X className="w-6 h-6" />
          </button>
          <div className="flex-1 text-center">
            <h2 className="text-white text-lg font-bold">错题重练</h2>
            <p className="text-[10px] text-slate-500 font-medium tracking-widest uppercase">1 / 15</p>
          </div>
          <div className="flex w-12 items-center justify-end">
            <button className="text-slate-400">
              <MoreHorizontal className="w-6 h-6" />
            </button>
          </div>
        </div>
        <div className="w-full h-1 bg-border-dark">
          <div className="h-full bg-primary w-[6.66%] transition-all duration-300"></div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto max-w-[480px] mx-auto w-full flex flex-col p-6">
        <div className="flex items-center gap-2 mb-4">
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-primary/20 text-primary border border-primary/30 uppercase">CET-6 2023.12</span>
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-400 border border-border-dark uppercase">Reading</span>
        </div>
        <div className="mb-8">
          <p className="text-lg leading-relaxed text-slate-100 font-medium">
            The author's description of the new educational software implies that its effectiveness is primarily dependent on ________.
          </p>
        </div>
        <div className="space-y-4 flex-1">
          {options.map(option => (
            <button
              key={option.id}
              onClick={() => setSelectedOption(option.id)}
              className={cn(
                "w-full text-left flex items-center p-5 rounded-2xl bg-surface-dark border transition-all duration-200 active:scale-[0.98]",
                selectedOption === option.id ? "border-primary bg-primary/5" : "border-border-dark"
              )}
            >
              <span className={cn(
                "w-8 h-8 flex items-center justify-center rounded-full border text-sm font-bold mr-4 transition-colors",
                selectedOption === option.id ? "bg-primary border-primary text-white" : "border-border-dark text-slate-400"
              )}>
                {option.id}
              </span>
              <p className="flex-1 text-base text-slate-200">{option.text}</p>
            </button>
          ))}
        </div>
      </main>

      <footer className="sticky bottom-0 w-full max-w-[480px] mx-auto bg-background-dark/80 backdrop-blur-md border-t border-border-dark p-6 flex gap-4">
        <button className="flex-1 flex items-center justify-center h-14 rounded-2xl border border-border-dark text-slate-300 font-bold text-base active:bg-surface-dark transition-colors">
          查看解析
        </button>
        <button className="flex-1 flex items-center justify-center h-14 rounded-2xl bg-primary text-white font-bold text-base shadow-lg shadow-primary/20 active:scale-[0.98] transition-all">
          下一题
        </button>
      </footer>
    </motion.div>
  );
}
import { generateStory } from './lib/ai';

const GENRES = [
  { id: 'Suspense', label: '悬疑探案' },
  { id: 'Sci-Fi', label: '科幻异星' },
  { id: 'Romance', label: '都市情感' },
  { id: 'Comedy', label: '幽默喜剧' },
  { id: 'Adventure', label: '奇幻冒险' },
];

function WritingScreen({ onBack }: { onBack: () => void }) {
  const { user } = useAuth();
  const [level, setLevel] = useState('CET-4');
  const [genre, setGenre] = useState(GENRES[0].id);
  const [keywords, setKeywords] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [story, setStory] = useState<any>(null);

  const handleGenerateStory = async () => {
    if (!user) return;
    setIsGenerating(true);
    setStory(null);
    try {
      const result = await generateStory(level as 'CET-4' | 'CET-6', genre, keywords);
      setStory(result);

      // 可以选择性把生成历史也存起来，这里沿用之前接口字段
      await writingApi.saveEssay(user.id, {
        level: level as 'CET-4' | 'CET-6',
        topic: genre + (keywords ? ` (${keywords})` : ''),
        generated_title: result.title || "Custom Story",
        generated_content: JSON.stringify(result),
      });
    } catch (err: any) {
      console.error('Failed to generate story', err);
      alert(err.message || '生成失败');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="bg-background-light dark:bg-background-dark text-slate-900 dark:text-white min-h-screen flex flex-col"
    >
      <header className="sticky top-0 z-10 bg-background-light dark:bg-background-dark border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center p-4 justify-between max-w-[480px] mx-auto w-full">
          <button onClick={onBack} className="text-slate-900 dark:text-white flex size-12 shrink-0 items-center cursor-pointer">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h2 className="text-slate-900 dark:text-white text-lg font-bold leading-tight tracking-[-0.01em] flex-1 text-center">自定义趣味文章生成</h2>
          <div className="flex w-12 items-center justify-end">
            <button className="flex cursor-pointer items-center justify-center rounded-lg h-12 bg-transparent text-slate-900 dark:text-white">
              <History className="w-6 h-6" />
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto max-w-[480px] mx-auto w-full pb-10">
        <div className="px-4 py-4">
          <p className="text-slate-900 dark:text-white text-sm font-semibold mb-2">目标等级</p>
          <div className="flex h-11 items-center justify-center rounded-xl bg-slate-200 dark:bg-[#232f48] p-1">
            <button
              onClick={() => setLevel('CET-4')}
              className={cn(
                "flex cursor-pointer h-full grow items-center justify-center overflow-hidden rounded-lg px-2 text-sm font-bold transition-all",
                level === 'CET-4' ? "bg-white dark:bg-[#111722] shadow-sm text-primary dark:text-white" : "text-slate-500 dark:text-[#92a4c9]"
              )}
            >
              四级 (CET-4)
            </button>
            <button
              onClick={() => setLevel('CET-6')}
              className={cn(
                "flex cursor-pointer h-full grow items-center justify-center overflow-hidden rounded-lg px-2 text-sm font-bold transition-all",
                level === 'CET-6' ? "bg-white dark:bg-[#111722] shadow-sm text-primary dark:text-white" : "text-slate-500 dark:text-[#92a4c9]"
              )}
            >
              六级 (CET-6)
            </button>
          </div>
        </div>

        <div className="px-4 py-2 space-y-4">
          <label className="flex flex-col">
            <p className="text-slate-900 dark:text-white text-sm font-semibold pb-2">文章体裁</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {GENRES.map(g => (
                <button
                  key={g.id}
                  onClick={() => setGenre(g.id)}
                  className={cn(
                    "h-10 rounded-xl text-sm font-semibold transition-all border",
                    genre === g.id
                      ? "bg-primary/10 border-primary text-primary dark:bg-primary/20"
                      : "bg-white dark:bg-[#192233] border-slate-200 dark:border-[#324467] text-slate-600 dark:text-slate-300"
                  )}
                >
                  {g.label}
                </button>
              ))}
            </div>
          </label>
          <label className="flex flex-col pt-2">
            <p className="text-slate-900 dark:text-white text-sm font-semibold pb-2">特定元素或提示词 (可选)</p>
            <textarea
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-xl text-slate-900 dark:text-white focus:outline-0 focus:ring-2 focus:ring-primary border border-slate-200 dark:border-[#324467] bg-white dark:bg-[#192233] placeholder:text-slate-400 dark:placeholder:text-[#92a4c9] min-h-[100px] p-4 text-base font-normal leading-relaxed outline-none"
              placeholder="例如：赛博朋克，一只会说话的黑猫，校园推理..."
            ></textarea>
          </label>
        </div>

        <div className="px-4 py-4">
          <button
            disabled={isGenerating}
            onClick={handleGenerateStory}
            className="w-full flex cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed items-center justify-center overflow-hidden rounded-xl h-14 px-5 bg-gradient-to-r from-primary to-orange-500 text-white gap-3 text-lg font-bold shadow-lg shadow-primary/20 active:scale-[0.98] transition-transform"
          >
            {isGenerating ? <Loader2 className="w-6 h-6 animate-spin" /> : <Sparkles className="w-6 h-6 fill-white" />}
            <span>{isGenerating ? 'AI 小说家正在构思中...' : '生成趣味读物'}</span>
          </button>
        </div>

        <div className="my-4 border-t border-slate-200 dark:border-slate-800"></div>

        {story && (
          <div className="px-4 pt-4 space-y-6">
            <section>
              <h3 className="text-2xl font-bold text-center text-slate-900 dark:text-white mb-6">
                {story.title}
              </h3>

              <div className="bg-slate-50 dark:bg-[#151c2c] border border-slate-200 dark:border-[#324467] rounded-2xl p-6 text-slate-700 dark:text-slate-300 text-base leading-loose font-serif whitespace-pre-line">
                {story.content}
              </div>
            </section>

            {story.target_words && story.target_words.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <Layout className="w-5 h-5 text-orange-500" />
                  <h3 className="text-slate-900 dark:text-white text-md font-bold">融入的高频词汇汇编</h3>
                </div>
                <div className="grid gap-3">
                  {story.target_words.map((word: string, i: number) => (
                    <div key={i} className="flex flex-col p-4 bg-white dark:bg-[#192233] border border-slate-200 dark:border-[#324467] rounded-xl shadow-sm">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-lg font-bold text-primary">{word}</span>
                      </div>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        {story.words_translation?.[word] || '暂无释义'}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </main>

      <div className="sticky bottom-0 w-full max-w-[480px] mx-auto bg-background-light dark:bg-background-dark border-t border-slate-200 dark:border-slate-800 p-4 flex gap-3">
        <button className="flex-1 flex items-center justify-center gap-2 h-12 rounded-xl bg-slate-200 dark:bg-[#232f48] text-slate-900 dark:text-white font-bold text-sm active:opacity-70 transition-opacity">
          <Copy className="w-5 h-5" />
          复制
        </button>
        <button className="flex-1 flex items-center justify-center gap-2 h-12 rounded-xl bg-slate-200 dark:bg-[#232f48] text-slate-900 dark:text-white font-bold text-sm active:opacity-70 transition-opacity">
          <Download className="w-5 h-5" />
          导出 PDF
        </button>
      </div>
    </motion.div>
  );
}

function CollectionsScreen({ onBack, onNavigate }: { onBack: () => void, onNavigate: (s: Screen) => void }) {
  const { collectedWords, collectionsLoading, toggleCollect } = useData();

  if (collectionsLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background-light dark:bg-background-dark">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="bg-background-light dark:bg-background-dark text-slate-900 dark:text-white antialiased h-screen flex flex-col overflow-hidden"
    >
      <div className="relative flex h-full w-full flex-col max-w-[430px] mx-auto bg-background-light dark:bg-background-dark shadow-2xl">
        <header className="sticky top-0 z-50 bg-background-light dark:bg-background-dark/80 backdrop-blur-md shrink-0">
          <div className="flex items-center p-4 pb-2 justify-between">
            <button onClick={onBack} className="flex size-12 shrink-0 items-center justify-start">
              <ArrowLeft className="w-6 h-6 cursor-pointer" />
            </button>
            <h1 className="text-lg font-bold leading-tight tracking-tight flex-1 text-center">学习收藏</h1>
            <div className="flex w-12 items-center justify-end">
              <button className="flex items-center justify-center rounded-lg h-12 bg-transparent gap-2 text-base font-bold min-w-0 p-0">
                <MoreHorizontal className="w-6 h-6" />
              </button>
            </div>
          </div>
          <div className="px-4">
            <div className="flex border-b border-slate-200 dark:border-slate-800 justify-between">
              <button className="flex flex-col items-center justify-center border-b-[3px] border-primary pb-3 pt-4 flex-1">
                <p className="text-primary text-sm font-bold tracking-wide">生词本</p>
              </button>
              <button
                onClick={() => onNavigate('mistakes')}
                className="flex flex-col items-center justify-center border-b-[3px] border-transparent text-slate-500 dark:text-[#92a4c9] pb-3 pt-4 flex-1 active:text-primary transition-colors"
              >
                <p className="text-sm font-bold tracking-wide">错题集</p>
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto pb-40 custom-scrollbar">
          <div className="px-4 py-4">
            <div className="flex w-full flex-1 items-stretch rounded-xl h-12 overflow-hidden shadow-sm bg-slate-100 dark:bg-[#232f48]">
              <div className="flex items-center justify-center pl-4 text-slate-400 dark:text-[#92a4c9]">
                <Search className="w-5 h-5" />
              </div>
              <input
                className="form-input flex w-full min-w-0 flex-1 resize-none border-none bg-transparent text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-[#92a4c9] px-4 pl-2 text-base font-normal leading-normal focus:ring-0 focus:outline-none outline-none"
                placeholder="搜索单词..."
              />
            </div>
          </div>

          <div className="px-4 pt-2 pb-1 flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500">最近加入 ({collectedWords.length})</h3>
            <ArrowLeftToLine className="w-4 h-4 text-slate-400 cursor-pointer rotate-90" />
          </div>

          <div className="flex flex-col">
            {collectedWords.length === 0 ? (
              <div className="text-center text-slate-500 py-10">暂无收藏内容</div>
            ) : (
              collectedWords.map(word => (
                <div key={word.id} className="flex items-center gap-4 px-4 min-h-[88px] py-3 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors border-b border-slate-100 dark:border-slate-800/50">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="text-primary flex items-center justify-center rounded-xl bg-primary/10 dark:bg-[#232f48] shrink-0 size-12 cursor-pointer hover:bg-primary/20 transition-colors">
                      <Volume2 className="w-6 h-6" />
                    </div>
                    <div className="flex flex-col justify-center">
                      <div className="flex items-baseline gap-2">
                        <p className="text-slate-900 dark:text-white text-lg font-bold leading-tight">{word.word}</p>
                        <p className="text-slate-400 text-xs font-normal">{word.phonetic}</p>
                      </div>
                      <p className="text-slate-500 dark:text-[#92a4c9] text-sm font-normal mt-0.5 line-clamp-1">{word.definitionCn}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <button
                      onClick={() => toggleCollect(word.id, false)}
                      className={cn(
                        "relative flex h-[28px] w-[48px] cursor-pointer items-center rounded-full p-0.5 transition-all",
                        word.mastered ? "bg-primary justify-end" : "bg-slate-200 dark:bg-[#232f48] justify-start"
                      )}
                    >
                      <div className="h-full aspect-square rounded-full bg-white shadow-md flex items-center justify-center">
                        {!word.mastered && <div className="w-1.5 h-1.5 rounded-full bg-slate-400"></div>}
                      </div>
                    </button>
                    <span className={cn("text-[10px] font-medium", word.mastered ? "text-primary font-bold" : "text-slate-400")}>
                      {word.mastered ? '已掌握' : '取消收藏'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </main>

        <div className="fixed bottom-24 right-6">
          <button className="size-14 bg-primary text-white rounded-full shadow-lg flex items-center justify-center hover:scale-105 active:scale-95 transition-transform">
            <Plus className="w-8 h-8" />
          </button>
        </div>
        <BottomNav current="collections" onNavigate={onNavigate} />
      </div>
    </motion.div>
  );
}

function ProfileScreen({ onNavigate }: { onNavigate: (s: Screen) => void }) {
  const { user, signOut, updateUserMetadata, uploadAvatar } = useAuth();
  const userName = user?.user_metadata?.username || user?.email?.split('@')[0] || 'User';
  // 优先获取用户自己上传的图像，如果没有则取预制生成的种子图片
  const avatarUrl = user?.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.user_metadata?.avatar_seed || user?.id || 'default'}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffdfbf`;

  const [isUpdatingAvatar, setIsUpdatingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarClick = () => {
    if (isUpdatingAvatar) return;
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 简单校验可以加上大小限制之类，比如不能超出 5M
    if (file.size > 5 * 1024 * 1024) {
      alert('头像图片大小不能超过 5MB');
      return;
    }

    setIsUpdatingAvatar(true);
    try {
      // 执行文件真实上传过程
      const publicUrl = await uploadAvatar(file);
      // 把取得的上传地址存进去
      await updateUserMetadata({ avatar_url: publicUrl });
    } catch (err: any) {
      console.error('Failed to update avatar:', err);
      alert(err.message || '上传头像失败，请稍后重试');
    } finally {
      setIsUpdatingAvatar(false);
      // 成功或失败均清空 file input 的 value，确保相同的图能再次被 onChange 探知发送
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="bg-background-light dark:bg-background-dark text-slate-900 dark:text-white min-h-screen flex flex-col"
    >
      <header className="p-4 flex items-center justify-between shrink-0 bg-background-light dark:bg-background-dark sticky top-0 z-10">
        <h2 className="text-xl font-bold">个人中心</h2>
        <button className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 active:scale-90 transition-transform">
          <Bell className="w-5 h-5" />
        </button>
      </header>

      <main className="flex-1 overflow-y-auto px-4 py-6 pb-32 custom-scrollbar">
        <div className="flex items-center gap-4 mb-8">
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
          />
          <div
            onClick={handleAvatarClick}
            className="size-20 rounded-full overflow-hidden ring-4 ring-primary/20 shrink-0 relative group cursor-pointer bg-slate-100 dark:bg-slate-800"
            title="点击从相册选取新头像"
          >
            <img src={avatarUrl} alt="Avatar" className="size-full object-cover" />
            <div className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity ${isUpdatingAvatar ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
              <RefreshCw className={`w-6 h-6 text-white ${isUpdatingAvatar ? 'animate-spin' : ''}`} />
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-bold">{userName}</h3>
            <p className="text-slate-500 dark:text-slate-400">ID: {user?.id?.slice(0, 8) || '----'}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {[
            { icon: BookOpen, label: '我的课程', count: '3', action: () => alert('我的课程模块正在全力开发中，敬请期待！') },
            { icon: Bookmark, label: '我的收藏', count: '52', action: () => onNavigate('collections') },
            { icon: History, label: '学习记录', count: '128', action: () => { } },
            { icon: User, label: '账号设置', count: '', action: () => onNavigate('settings') },
          ].map((item, i) => (
            <button
              key={i}
              onClick={item.action}
              className="flex items-center justify-between p-4 bg-white dark:bg-[#192233] rounded-xl border border-slate-100 dark:border-white/5 shadow-sm active:scale-[0.98] transition-all hover:border-primary/30"
            >
              <div className="flex items-center gap-3">
                <item.icon className="w-5 h-5 text-primary" />
                <span className="font-medium">{item.label}</span>
              </div>
              <div className="flex items-center gap-2">
                {item.count && <span className="text-sm text-slate-400">{item.count}</span>}
                <ChevronRight className="w-4 h-4 text-slate-300" />
              </div>
            </button>
          ))}
        </div>

        <div className="mt-8 space-y-4">
          <div className="p-4 bg-primary/5 rounded-xl border border-primary/10">
            <p className="text-xs font-bold text-primary uppercase mb-1">当前版本</p>
            <p className="text-sm text-slate-600 dark:text-slate-300">CET Smart Learn v1.2.0 (Beta)</p>
          </div>
        </div>

        <button
          onClick={async () => {
            await signOut();
          }}
          className="w-full mt-10 py-4 rounded-xl border border-rose-200 dark:border-rose-900/30 text-rose-500 font-bold active:bg-rose-50 dark:active:bg-rose-900/10 transition-colors"
        >
          退出登录
        </button>
      </main>

      <BottomNav current="profile" onNavigate={onNavigate} />
    </motion.div>
  );
}

function SettingsScreen({ onBack }: { onBack: () => void }) {
  const { user, signOut } = useAuth();
  const userName = user?.user_metadata?.username || user?.email?.split('@')[0] || 'User';

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="bg-background-light dark:bg-background-dark text-slate-900 dark:text-white min-h-screen flex flex-col"
    >
      <header className="p-4 flex items-center gap-4 border-b border-slate-100 dark:border-white/5">
        <button onClick={onBack} className="p-2 -ml-2 rounded-full active:bg-slate-100 dark:active:bg-slate-800">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h2 className="text-xl font-bold">账号设置</h2>
      </header>

      <main className="flex-1 p-4 space-y-6">
        <section>
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 px-2">基本信息</h3>
          <div className="bg-white dark:bg-[#192233] rounded-2xl border border-slate-100 dark:border-white/5 overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-slate-50 dark:border-white/5">
              <span className="text-slate-600 dark:text-slate-300">昵称</span>
              <span className="font-medium">{userName}</span>
            </div>
            <div className="flex items-center justify-between p-4">
              <span className="text-slate-600 dark:text-slate-300">账号</span>
              <span className="font-medium truncate max-w-[200px]">{user?.email}</span>
            </div>
          </div>
        </section>

        <section>
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 px-2">安全与隐私</h3>
          <div className="bg-white dark:bg-[#192233] rounded-2xl border border-slate-100 dark:border-white/5 overflow-hidden">
            <button className="w-full flex items-center justify-between p-4 border-b border-slate-50 dark:border-white/5 active:bg-slate-50 dark:active:bg-slate-900/50">
              <span className="text-slate-600 dark:text-slate-300">修改密码</span>
              <ChevronRight className="w-4 h-4 text-slate-300" />
            </button>
            <button
              onClick={async () => await signOut()}
              className="w-full flex items-center justify-between p-4 active:bg-slate-50 dark:active:bg-rose-900/10"
            >
              <span className="text-rose-500 font-bold">退出登录</span>
            </button>
          </div>
        </section>

        <section>
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 px-2">其他</h3>
          <div className="bg-white dark:bg-[#192233] rounded-2xl border border-slate-100 dark:border-white/5 overflow-hidden">
            <div className="flex items-center justify-between p-4">
              <span className="text-slate-600 dark:text-slate-300">清除缓存</span>
              <span className="text-sm text-slate-400">24.5 MB</span>
            </div>
          </div>
        </section>
      </main>
    </motion.div>
  );
}
