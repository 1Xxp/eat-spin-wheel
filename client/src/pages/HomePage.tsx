import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Wheel from '../components/Wheel';
import ResultModal from '../components/ResultModal';
import DishManager from '../components/DishManager';
import HistoryModal from '../components/HistoryModal';
import { useSpin } from '../hooks/useSpin';
import { useDishes } from '../hooks/useDishes';
import { fetchHistory, confirmDish } from '../api/endpoints';
import { resumeAudio, playTick, playReveal, playConfirm } from '../utils/sound';
import type { SpinResult } from '../api/types';

interface Props {
  onLogout: () => void;
  theme: string;
  onCycleTheme: () => void;
  themeInfo: { label: string; icon: string };
}

export default function HomePage({ onLogout, theme, onCycleTheme, themeInfo }: Props) {
  const { state, result, doSpin, reset } = useSpin();
  const { dishes, categories, add, remove, update, loading } = useDishes();
  const [showResult, setShowResult] = useState(false);
  const [showManager, setShowManager] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [todayCount, setTodayCount] = useState(0);
  const [ripple, setRipple] = useState<{ x: number; y: number; id: number } | null>(null);
  const [todayPick, setTodayPick] = useState<SpinResult | null>(null);
  const prevCount = useRef(0);
  const tickTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const stateRef = useRef(state);
  const resultRef = useRef(result);
  stateRef.current = state;
  resultRef.current = result;

  const stopTick = useCallback(() => {
    if (tickTimer.current) {
      clearInterval(tickTimer.current);
      tickTimer.current = null;
    }
  }, []);

  // 加载今日已抽次数 + 今日免选
  const loadTodayCount = async () => {
    // 先从 localStorage 读取今日免选
    try {
      const raw = localStorage.getItem('eat_today_pick');
      if (raw) {
        const { date, pick } = JSON.parse(raw);
        const today = new Date().toDateString();
        if (date === today) setTodayPick(pick);
        else { localStorage.removeItem('eat_today_pick'); setTodayPick(null); }
      }
    } catch {}
    try {
      const res: any = await fetchHistory(1, 50);
      const list = res.data?.list || [];
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      setTodayCount(list.filter((item: any) => new Date(item.spun_at) >= today).length);
    } catch {}
  };

  useEffect(() => { loadTodayCount(); }, []);
  useEffect(() => { return () => stopTick(); }, [stopTick]);
  // 每次抽取完成后刷新计数
  useEffect(() => { if (state === 'done') loadTodayCount(); }, [state]);

  const handleSpinEnd = useCallback(() => {
    playReveal();
    stopTick();
    if (stateRef.current === 'done' && resultRef.current) {
      setTimeout(() => setShowResult(true), 300);
    }
  }, [stopTick]);

  const handleRetry = () => {
    setShowResult(false);
    setTodayPick(null);
    try { localStorage.removeItem('eat_today_pick'); } catch {}
    setTimeout(() => doSpin(), 300);
  };

  const handleClearTodayPick = () => {
    setTodayPick(null);
    try { localStorage.removeItem('eat_today_pick'); } catch {}
  };

  const handleConfirm = async () => {
    if (!result) return;
    setShowResult(false);
    playConfirm();
    try {
      await confirmDish(result.dish_id, result.ai_text, 'wheel');
      loadTodayCount();
      // 保存今日免选到 localStorage
      try {
        localStorage.setItem('eat_today_pick', JSON.stringify({
          date: new Date().toDateString(),
          pick: result,
        }));
        setTodayPick(result);
      } catch {}
      try { sessionStorage.removeItem('eat_cache_history'); } catch {}
    } catch {}
  };

  const enabledCount = dishes.filter((d) => d.is_enabled).length;
  const countChanged = prevCount.current !== 0 && prevCount.current !== enabledCount;
  useEffect(() => { prevCount.current = enabledCount; }, [enabledCount]);

  const handleSpin = (e: React.MouseEvent) => {
    resumeAudio();
    const rect = e.currentTarget.getBoundingClientRect();
    setRipple({ x: e.clientX - rect.left, y: e.clientY - rect.top, id: Date.now() });
    setTimeout(() => setRipple(null), 600);
    // 重置今日免选
    setTodayPick(null);
    try { localStorage.removeItem('eat_today_pick'); } catch {}
    doSpin();
    // 转动期间播放刻度音
    stopTick();
    tickTimer.current = setInterval(() => {
      playTick();
    }, 180);
  };

  return (
    <div className="h-full flex flex-col safe-bottom relative overflow-hidden">
      {/* 背景装饰 */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-brand-200/30 blur-3xl animate-float" />
        <div className="absolute top-1/3 -left-12 w-32 h-32 rounded-full bg-purple-200/30 blur-3xl animate-breathe" />
        <div className="absolute bottom-20 right-0 w-36 h-36 rounded-full bg-yellow-200/20 blur-3xl animate-float" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/4 right-1/4 text-2xl opacity-30 animate-float" style={{ animationDelay: '0.5s' }}>✨</div>
        <div className="absolute bottom-1/3 left-1/4 text-xl opacity-25 animate-breathe" style={{ animationDelay: '1.2s' }}>🌸</div>
        <div className="absolute top-1/2 right-[15%] text-lg opacity-20 animate-float" style={{ animationDelay: '2s' }}>💫</div>
      </div>

      {/* 顶部导航 */}
      <header className="flex-shrink-0 flex items-center justify-between px-5 pt-4 pb-2 relative z-10">
        <motion.button
          onClick={onLogout}
          className="text-xs text-[#B0887A] active:text-brand-500 transition-colors px-2 py-1 rounded-lg"
          whileHover={{ scale: 1.05, color: '#FF6B8A' }}
          whileTap={{ scale: 0.93 }}
        >
          🚪 退出
        </motion.button>
        <motion.button
          onClick={onCycleTheme}
          className="h-9 px-3 rounded-full bg-white/80 border border-brand-200 text-xs text-[#8D6E63] flex items-center gap-1 shadow-sm"
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.94 }}
          title={`切换主题（当前：${themeInfo.label}）`}
        >
          <span>{themeInfo.icon}</span>
          <span>{themeInfo.label}</span>
        </motion.button>
        <motion.button
          onClick={() => setShowManager(true)}
          className="h-9 px-4 rounded-full bg-white/80 border border-brand-200 text-xs text-[#8D6E63] flex items-center gap-1.5 shadow-sm"
          whileHover={{ scale: 1.04, boxShadow: '0 2px 12px rgba(255,107,138,0.15)' }}
          whileTap={{ scale: 0.95 }}
        >
          <span>📋</span>
          <span>我的菜单</span>
          <motion.span
            className="text-brand-500 font-semibold"
            key={enabledCount}
            initial={countChanged ? { scale: 1.5, color: '#FF6B8A' } : false}
            animate={{ scale: 1, color: '#FF6B8A' }}
            transition={{ type: 'spring', stiffness: 400, damping: 12 }}
          >
            {enabledCount}
          </motion.span>
        </motion.button>
      </header>

      {/* 今日免选 */}
      <AnimatePresence>
        {todayPick && state === 'idle' && !showResult && (
          <motion.div
            className="flex-shrink-0 mx-5 mt-2 px-5 py-3.5 rounded-2xl bg-white/70 border border-brand-200/60 shadow-sm"
            initial={{ opacity: 0, y: -12, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 300, damping: 26 }}
          >
            <div className="flex items-center gap-3">
              <span className="text-3xl">{todayPick.dish.emoji}</span>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] text-[#B0887A]">今天的命运已定</p>
                <p className="text-base font-bold text-[#5D4037] truncate">{todayPick.dish.name}</p>
                <p className="text-xs text-brand-500 truncate mt-0.5">"{todayPick.ai_text}"</p>
              </div>
              <button
                onClick={handleClearTodayPick}
                className="text-[10px] text-[#B0887A] underline underline-offset-2 decoration-dotted active:text-brand-500 transition-colors shrink-0"
              >
                重新抉择
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 转盘区域 */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 min-h-0">
        {/* 转盘 */}
        <motion.div
          className="mt-2"
          animate={state === 'spinning' ? { scale: [1, 1.03, 0.98, 1] } : {}}
          transition={{ duration: 0.6, ease: 'easeInOut' }}
        >
          {loading ? (
            <div className="w-[260px] h-[260px] sm:w-[300px] sm:h-[300px] rounded-full bg-white/40 flex items-center justify-center">
              <span className="text-4xl animate-breathe">🍽️</span>
            </div>
          ) : (
            <Wheel dishes={dishes} spinning={state === 'spinning'} onSpinEnd={handleSpinEnd} />
          )}
        </motion.div>

        {/* 状态提示 */}
        <div className="h-6 mt-4 flex items-center justify-center">
          <AnimatePresence mode="wait">
            {state === 'idle' && !loading && (
              <motion.p
                key="idle"
                className="text-[#B0887A] text-xs"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.25 }}
              >
                {enabledCount > 0
                  ? (todayPick ? '还想换一个？' : `共 ${enabledCount} 道菜，点击下方按钮开始`)
                  : '先添加一些菜品吧～'}
              </motion.p>
            )}
            {state === 'spinning' && (
              <motion.p
                key="spinning"
                className="text-brand-500 text-sm font-semibold"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ opacity: { duration: 1, repeat: Infinity } }}
              >
                🎲 命运齿轮转动中...
              </motion.p>
            )}
            {state === 'done' && !showResult && (
              <motion.p
                key="done"
                className="text-[#B0887A] text-xs"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                即将揭晓...
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        {/* 主按钮 */}
        <motion.button
          onClick={handleSpin}
          disabled={state === 'spinning' || loading || enabledCount === 0}
          className="w-full max-w-[280px] h-14 mt-3 rounded-2xl text-white font-bold text-lg transition-all duration-200 disabled:active:scale-100 relative overflow-hidden"
          style={{
            background: state === 'spinning' || loading || enabledCount === 0
              ? '#E0D6CF'
              : 'linear-gradient(135deg, #FF6B8A, #FFA3B8)',
            boxShadow: state === 'spinning' || loading || enabledCount === 0
              ? 'none'
              : '0 8px 32px rgba(255, 107, 138, 0.35)',
          }}
          whileHover={state === 'idle' ? { scale: 1.03, boxShadow: '0 12px 40px rgba(255, 107, 138, 0.45)' } : {}}
          whileTap={state === 'idle' ? { scale: 0.95 } : {}}
          animate={
            state === 'idle' && enabledCount > 0
              ? { boxShadow: ['0 8px 32px rgba(255,107,138,0.35)', '0 14px 40px rgba(255,107,138,0.5)', '0 8px 32px rgba(255,107,138,0.35)'] }
              : {}
          }
          transition={
            state === 'idle' && enabledCount > 0
              ? { boxShadow: { duration: 2, repeat: Infinity, ease: 'easeInOut' } }
              : {}
          }
        >
          {/* 水波纹 */}
          <AnimatePresence>
            {ripple && (
              <motion.span
                className="absolute rounded-full bg-white/30 pointer-events-none"
                style={{ left: ripple.x - 4, top: ripple.y - 4, width: 8, height: 8 }}
                initial={{ scale: 1, opacity: 0.6 }}
                animate={{ scale: 30, opacity: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
              />
            )}
          </AnimatePresence>
          <span className="relative z-10">
            {state === 'spinning' ? '旋转中...' : state === 'done' ? '🔄  再来一次' : todayPick ? '🎰  换一个试试' : '🎰  开始'}
          </span>
        </motion.button>

        {/* 底部提示 */}
        {!showManager && (
          <p className="text-[#D4B8A8] text-[11px] mt-6 mb-2">
            <button
              onClick={() => setShowManager(true)}
              className="underline underline-offset-4 decoration-dotted active:text-brand-400 transition-colors hover:text-brand-500"
            >
              管理菜单
            </button>
            {'  ·  '}
            <button
              onClick={() => setShowHistory(true)}
              className="underline underline-offset-4 decoration-dotted active:text-brand-400 transition-colors hover:text-brand-500"
            >
              历史记录
            </button>
            {'  ·  '}
            {enabledCount > 0 ? `今日已抽 ${todayCount} 次` : '还没有菜品'}
          </p>
        )}
      </div>

      {/* 结果弹窗 */}
      <ResultModal
        result={result}
        open={showResult}
        onClose={() => setShowResult(false)}
        onConfirm={handleConfirm}
        onRetry={handleRetry}
      />

      {/* 菜品管理底部抽屉 */}
      <DishManager
        dishes={dishes}
        categories={categories}
        onAdd={add}
        onDelete={remove}
        onUpdate={update}
        open={showManager}
        onClose={() => setShowManager(false)}
      />

      <HistoryModal
        open={showHistory}
        onClose={() => setShowHistory(false)}
      />
    </div>
  );
}
