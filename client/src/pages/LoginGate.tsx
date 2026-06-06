import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  onLogin: (nickname: string) => void;
  loading: boolean;
  theme: string;
  onCycleTheme: () => void;
  themeInfo: { label: string; icon: string };
}

interface Spark {
  id: number;
  x: number;
  y: number;
  emoji: string;
}

const FOOD_SPARKS = ['🍜', '🍕', '🍣', '🍩', '🧁', '🍓', '🌸', '✨', '💖', '🌟'];

export default function LoginGate({ onLogin, loading, theme, onCycleTheme, themeInfo }: Props) {
  const [nickname, setNickname] = useState('');
  const [sparks, setSparks] = useState<Spark[]>([]);
  const [boop, setBoop] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin(nickname || '吃货本人');
  };

  const spawnSparks = useCallback((e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const newSparks: Spark[] = [];
    for (let i = 0; i < 8; i++) {
      newSparks.push({
        id: Date.now() + i,
        x: x + (Math.random() - 0.5) * 40,
        y: y + (Math.random() - 0.5) * 40,
        emoji: FOOD_SPARKS[Math.floor(Math.random() * FOOD_SPARKS.length)],
      });
    }
    setSparks(prev => [...prev, ...newSparks]);
    setTimeout(() => {
      setSparks(prev => prev.filter(s => !newSparks.includes(s)));
    }, 800);
  }, []);

  return (
    <div className="h-full flex flex-col items-center justify-center px-6 safe-bottom relative overflow-hidden">
      {/* 背景装饰 */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-20 -left-20 w-56 h-56 rounded-full bg-brand-200/30 blur-3xl animate-float" />
        <div className="absolute -bottom-24 -right-12 w-52 h-52 rounded-full bg-purple-200/30 blur-3xl animate-breathe" />
        <div className="absolute top-[15%] right-[25%] w-32 h-32 rounded-full bg-yellow-200/20 blur-3xl animate-float" style={{ animationDelay: '1s' }} />
        {/* 浮动食物 */}
        <div className="absolute top-[12%] left-[10%] text-xl opacity-25 animate-float" style={{ animationDelay: '0s' }}>🍜</div>
        <div className="absolute top-[25%] right-[12%] text-lg opacity-20 animate-float" style={{ animationDelay: '1.5s' }}>🍕</div>
        <div className="absolute bottom-[30%] left-[8%] text-2xl opacity-20 animate-breathe" style={{ animationDelay: '0.8s' }}>🍣</div>
        <div className="absolute bottom-[20%] right-[15%] text-xl opacity-25 animate-float" style={{ animationDelay: '2s' }}>🧁</div>
      </div>

      {/* 点击粒子 */}
      <AnimatePresence>
        {sparks.map(s => (
          <motion.div
            key={s.id}
            className="absolute pointer-events-none z-20 text-lg"
            style={{ left: s.x, top: s.y }}
            initial={{ scale: 0, opacity: 1, x: 0, y: 0 }}
            animate={{ scale: 1.5, opacity: 0, x: (Math.random()-0.5)*80, y: (Math.random()-0.5)*80 - 30 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
          >
            {s.emoji}
          </motion.div>
        ))}
      </AnimatePresence>

      <motion.div
        className="relative z-10 w-full max-w-sm mx-auto text-center"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        {/* 大图标 — 点击冒火花 */}
        <motion.div
          className="text-[100px] mb-4 cursor-pointer select-none inline-block"
          onClick={(e) => { spawnSparks(e); setBoop(true); setTimeout(() => setBoop(false), 300); }}
          animate={boop ? { scale: [1, 1.25, 0.9, 1.05, 1] } : { rotate: [0, -4, 4, -2, 0] }}
          transition={boop ? { duration: 0.3 } : { duration: 3, repeat: Infinity, repeatDelay: 2 }}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.9 }}
        >
          🎰
        </motion.div>

        {/* 标题 */}
        <div className="mb-2">
          <h1 className="text-[34px] font-black tracking-tight">
            <span className="text-brand-500">今天</span>
            <span className="text-[#5D4037]">吃什么</span>
          </h1>
        </div>
        <p className="text-[#B0887A] text-sm mb-8">
          让命运替你决定 ✨
        </p>

        {/* 登录卡片 */}
        <motion.form
          onSubmit={handleSubmit}
          className="bg-white/90 backdrop-blur rounded-3xl p-6 shadow-xl shadow-brand-200/40"
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, type: 'spring', stiffness: 200, damping: 20 }}
        >
          <label className="block text-xs text-[#B0887A] mb-2 text-left">
            👤 你的名字
          </label>
          <input
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="吃货本人"
            maxLength={12}
            className="w-full h-12 px-4 rounded-2xl bg-[#FFF5F0] border border-brand-200 text-[#5D4037] text-center text-base placeholder-[#D4B8A8] outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-200 transition-all"
          />
          <motion.button
            type="submit"
            disabled={loading}
            className="w-full h-14 mt-5 rounded-2xl bg-gradient-to-r from-brand-400 to-brand-500 text-white font-bold text-lg disabled:opacity-50 shadow-lg shadow-brand-300/40"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.96 }}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <motion.span animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>🍽️</motion.span>
                进入中...
              </span>
            ) : (
              '开始干饭 🍽️'
            )}
          </motion.button>
        </motion.form>

        <div className="mt-6 flex items-center justify-center gap-2">
          <button
            onClick={onCycleTheme}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-white/80 border border-brand-200 text-xs text-[#8D6E63] active:scale-95 transition-all shadow-sm"
          >
            <span>{themeInfo.icon}</span>
            <span>{themeInfo.label}色</span>
          </button>
        </div>
        <p className="text-[#D4B8A8] text-xs mt-3">点击🎰有惊喜 · 同意《干饭公约》</p>
      </motion.div>
    </div>
  );
}
