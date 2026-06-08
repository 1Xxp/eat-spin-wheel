import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchHistory, clearHistory } from '../api/endpoints';

interface Props {
  open: boolean;
  onClose: () => void;
}

interface HistoryItem {
  id: number;
  dish_name: string;
  dish_emoji: string;
  category_name: string;
  ai_text: string;
  method: string;
  spun_at: string;
  user_rating: number | null;
}

export default function HistoryModal({ open, onClose }: Props) {
  const [list, setList] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [clearing, setClearing] = useState(false);

  const load = () => {
    // 优先显示缓存，秒开
    let hasCache = false;
    try {
      const cached = sessionStorage.getItem('eat_cache_history');
      if (cached) { setList(JSON.parse(cached)); hasCache = true; }
    } catch {}
    // 有缓存时不显示 loading，后台静默刷新
    if (!hasCache) setLoading(true);
    fetchHistory(1, 50)
      .then((res: any) => {
        const data = res.data?.list || [];
        setList(data);
        try { sessionStorage.setItem('eat_cache_history', JSON.stringify(data)); } catch {}
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!open) return;
    load();
  }, [open]);

  const handleClear = async () => {
    if (!window.confirm('确定清空所有历史记录？')) return;
    setClearing(true);
    try {
      await clearHistory();
      setList([]);
      try { sessionStorage.removeItem('eat_cache_history'); } catch {}
    } catch {}
    setClearing(false);
  };

  // 按日期分组
  const grouped: Record<string, HistoryItem[]> = {};
  list.forEach((item) => {
    const date = new Date(item.spun_at).toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'short' });
    if (!grouped[date]) grouped[date] = [];
    grouped[date].push(item);
  });

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <motion.div
            className="absolute inset-0 bg-[#5D4037]/40 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          <motion.div
            className="relative w-full sm:w-[400px] sm:max-h-[80vh] max-h-[75vh] bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl shadow-brand-200/30 flex flex-col overflow-hidden"
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
          >
            <div className="flex-shrink-0 pt-4 pb-2 flex justify-center sm:hidden">
              <div className="w-10 h-1 rounded-full bg-brand-200" />
            </div>

            <div className="flex-shrink-0 flex items-center justify-between px-5 py-3">
              <h2 className="text-lg font-bold text-[#5D4037]">📜 历史记录</h2>
              <div className="flex items-center gap-1.5">
                {list.length > 0 && (
                  <button
                    onClick={handleClear}
                    disabled={clearing}
                    className="text-[10px] text-[#B0887A] px-2 py-1 rounded-lg active:bg-red-50 active:text-red-400 transition-colors"
                  >
                    清空
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-full bg-brand-50 flex items-center justify-center text-[#B0887A] text-sm active:bg-brand-100"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto scroll-area px-5 pb-6">
              {loading ? (
                <div className="text-center py-12">
                  <p className="text-2xl animate-breathe">🍽️</p>
                  <p className="text-[#B0887A] text-xs mt-2">加载中...</p>
                </div>
              ) : list.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-5xl mb-3">📭</p>
                  <p className="text-[#B0887A] text-sm">还没有记录</p>
                  <p className="text-[#D4B8A8] text-xs mt-1">去转几下看看吧</p>
                </div>
              ) : (
                <div className="space-y-5">
                  {Object.entries(grouped).map(([date, items]) => (
                    <div key={date}>
                      <h3 className="text-[11px] font-semibold text-[#B0887A] mb-2 sticky top-0 bg-white/90 backdrop-blur py-1">
                        {date}
                      </h3>
                      <div className="space-y-2">
                        {items.map((item) => (
                          <div
                            key={item.id}
                            className="bg-brand-50/40 rounded-2xl px-4 py-3 border border-brand-100/50"
                          >
                            <div className="flex items-center gap-2.5 mb-1.5">
                              <span className="text-2xl">{item.dish_emoji}</span>
                              <div>
                                <p className="text-sm font-semibold text-[#5D4037]">{item.dish_name}</p>
                                <p className="text-[10px] text-[#B0887A]">{item.category_name}</p>
                              </div>
                              <span className="ml-auto text-[10px] text-[#D4B8A8]">
                                {new Date(item.spun_at).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <p className="text-xs text-brand-600 leading-relaxed">"{item.ai_text}"</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
