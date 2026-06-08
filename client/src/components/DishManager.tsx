import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Dish, Category } from '../api/types';

interface Props {
  dishes: Dish[];
  categories: Category[];
  onAdd: (name: string, categoryId: number, emoji?: string) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
  onUpdate: (id: number, data: Record<string, any>) => Promise<void>;
  open: boolean;
  onClose: () => void;
}

const EMOJI_OPTIONS = ['🍜', '🍛', '🍣', '🍕', '🥗', '🍲', '🥘', '🍝', '🥟', '🍱', '🥩', '🍗'];

function catColor(i: number) {
  const palettes = [
    { bg: '#FFF0E6', border: '#FFD4B8', text: '#B0887A', activeBg: '#FFE0CC' },
    { bg: '#FFF5E6', border: '#FFE0B8', text: '#B08A6A', activeBg: '#FFECD0' },
    { bg: '#F0FFE6', border: '#C8E8B0', text: '#6B8A5A', activeBg: '#E0FFD0' },
    { bg: '#E6F5FF', border: '#B8D8F0', text: '#5A7A9A', activeBg: '#D0E8FF' },
    { bg: '#F8E8FF', border: '#D8C0F0', text: '#7A6A9A', activeBg: '#E8D8FF' },
    { bg: '#FFE8EC', border: '#F0C0CC', text: '#9A6A7A', activeBg: '#FFD8E0' },
    { bg: '#E8FFF0', border: '#B8E8CC', text: '#5A8A6A', activeBg: '#D0FFE0' },
    { bg: '#FFF8E8', border: '#F0E0B8', text: '#9A8A5A', activeBg: '#FFF0D0' },
  ];
  return palettes[i % palettes.length];
}

export default function DishManager({ dishes, categories, onAdd, onDelete, onUpdate, open, onClose }: Props) {
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState(0);
  const [emoji, setEmoji] = useState('🍽️');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);

  // categories加载完成后更新默认分类
  useEffect(() => {
    if (categories.length > 0 && categoryId === 0) {
      setCategoryId(categories[0].id);
    }
  }, [categories, categoryId]);

  // 打开表单时重置emoji
  useEffect(() => {
    if (adding) {
      setEmoji('🍽️');
    }
  }, [adding]);

  const handleAdd = async () => {
    if (!name.trim()) return;
    setError('');
    setSubmitting(true);
    try {
      await onAdd(name.trim(), categoryId, emoji);
      setName('');
      setEmoji('🍽️');
      setAdding(false);
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || '添加失败';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const startEdit = (dish: Dish) => {
    setEditingId(dish.id);
    setName(dish.name);
    setCategoryId(dish.category_id);
    setEmoji(dish.emoji);
    setError('');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setName('');
    setEmoji('🍽️');
    setError('');
  };

  const handleUpdate = async () => {
    if (!name.trim() || !editingId) return;
    setError('');
    setSubmitting(true);
    try {
      await onUpdate(editingId, { name: name.trim(), category_id: categoryId, emoji });
      cancelEdit();
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || '更新失败';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // 按分类分组
  const grouped = categories
    .map((cat) => ({
      ...cat,
      items: dishes.filter((d) => d.category_id === cat.id),
    }))
    .filter((g) => g.items.length > 0);

  // 无分类的
  const ungrouped = dishes.filter(
    (d) => !categories.find((c) => c.id === d.category_id)
  );

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-40 flex items-end sm:items-center justify-center">
          {/* 遮罩 */}
          <motion.div
            className="absolute inset-0 bg-[#5D4037]/40 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* 底部抽屉 */}
          <motion.div
            className="relative w-full sm:w-[380px] sm:max-h-[85vh] max-h-[75vh] bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl shadow-brand-200/30 flex flex-col overflow-hidden"
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
          >
            {/* 拽手 */}
            <div className="flex-shrink-0 pt-4 pb-2 flex justify-center sm:hidden">
              <div className="w-10 h-1 rounded-full bg-brand-200" />
            </div>

            {/* 头部 */}
            <div className="flex-shrink-0 flex items-center justify-between px-5 py-3">
              <h2 className="text-lg font-bold text-[#5D4037]">我的菜单</h2>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-brand-50 flex items-center justify-center text-[#B0887A] text-sm active:bg-brand-100 transition-colors"
              >
                ✕
              </button>
            </div>

            {/* 添加按钮 */}
            {!adding && (
              <div className="flex-shrink-0 px-5 pb-3">
                <button
                  onClick={() => setAdding(true)}
                  className="w-full h-12 rounded-2xl bg-gradient-to-r from-brand-400 to-brand-500 text-white text-[15px] font-semibold active:scale-[0.97] transition-all shadow-lg shadow-brand-300/30"
                >
                  + 添加菜品
                </button>
              </div>
            )}

            {/* 添加表单 */}
            <AnimatePresence>
              {adding && (
                <motion.div
                  className="flex-shrink-0 px-5 pb-3"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <div className="bg-brand-50/50 rounded-2xl p-4 space-y-3 border border-brand-100">
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="输入菜名，如：酸菜鱼"
                      className="w-full h-11 px-4 rounded-xl bg-white border border-brand-200 text-[#5D4037] text-sm placeholder-[#D4B8A8] outline-none focus:border-brand-400 transition-colors"
                      autoFocus
                    />
                    <div>
                      <p className="text-[11px] text-[#B0887A] mb-2">选择分类</p>
                      <div className="flex flex-wrap gap-2">
                        {categories.map((c, i) => {
                          const col = catColor(i);
                          const active = categoryId === c.id;
                          return (
                            <button
                              key={c.id}
                              type="button"
                              onClick={() => setCategoryId(c.id)}
                              className="px-3 py-2 rounded-xl text-xs font-medium border transition-all active:scale-95"
                              style={{
                                backgroundColor: active ? col.activeBg : col.bg,
                                borderColor: active ? col.text : col.border,
                                color: col.text,
                                boxShadow: active ? `0 0 0 2px ${col.text}40` : 'none',
                              }}
                            >
                              {c.icon} {c.name}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Emoji选择 */}
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <p className="text-[11px] text-[#B0887A]">选个图标</p>
                        <span className="text-2xl">{emoji}</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {EMOJI_OPTIONS.map((e) => (
                          <button
                            key={e}
                            type="button"
                            onClick={() => setEmoji(e)}
                            className={`w-10 h-10 rounded-xl text-lg flex items-center justify-center transition-all active:scale-90 ${
                              emoji === e
                                ? 'bg-brand-400/20 ring-2 ring-brand-400/50 scale-105'
                                : 'bg-white hover:bg-brand-50'
                            }`}
                          >
                            {e}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* 错误提示 */}
                    {error && (
                      <p className="text-red-400 text-xs text-center">{error}</p>
                    )}

                    {/* 表单按钮 */}
                    <div className="flex gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => { setAdding(false); setError(''); }}
                        className="flex-1 h-10 rounded-xl bg-[#F0E6E0] text-[#8D6E63] text-sm active:bg-[#E8D8D0]"
                      >
                        取消
                      </button>
                      <button
                        type="button"
                        onClick={handleAdd}
                        disabled={!name.trim() || !categoryId || submitting}
                        className="flex-1 h-10 rounded-xl bg-brand-500 text-white font-semibold text-sm disabled:opacity-30 active:scale-95 transition-all"
                      >
                        {submitting ? '添加中...' : '确认添加'}
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* 分类列表 — 可滚动 */}
            <div className="flex-1 overflow-y-auto scroll-area px-5 pb-6">
              <div className="space-y-5">
                {grouped.map((group) => (
                  <div key={group.id}>
                    <h3 className="text-[11px] font-semibold text-[#B0887A] uppercase tracking-wide mb-2 flex items-center gap-1.5">
                      <span>{group.icon}</span>
                      <span>{group.name}</span>
                      <span className="text-[#D4B8A8] font-normal normal-case">{group.items.length}道</span>
                    </h3>
                    <div className="space-y-1">
                      {group.items.map((dish) => (
                        <div key={dish.id}>
                          {editingId === dish.id ? (
                            /* 编辑表单 */
                            <div className="bg-brand-50/50 rounded-2xl p-3 space-y-2.5 border border-brand-100">
                              <input
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full h-10 px-3 rounded-xl bg-white border border-brand-200 text-[#5D4037] text-sm placeholder-[#D4B8A8] outline-none focus:border-brand-400"
                                autoFocus
                              />
                              <div className="flex flex-wrap gap-1.5">
                                {categories.map((c, i) => {
                                  const col = catColor(i);
                                  const active = categoryId === c.id;
                                  return (
                                    <button
                                      key={c.id} type="button"
                                      onClick={() => setCategoryId(c.id)}
                                      className="px-2.5 py-1.5 rounded-lg text-[11px] font-medium border transition-all active:scale-95"
                                      style={{
                                        backgroundColor: active ? col.activeBg : col.bg,
                                        borderColor: active ? col.text : col.border,
                                        color: col.text,
                                        boxShadow: active ? `0 0 0 1.5px ${col.text}40` : 'none',
                                      }}
                                    >
                                      {c.icon} {c.name}
                                    </button>
                                  );
                                })}
                              </div>
                              <div className="flex flex-wrap gap-1">
                                {EMOJI_OPTIONS.map((e) => (
                                  <button
                                    key={e} type="button"
                                    onClick={() => setEmoji(e)}
                                    className={`w-8 h-8 rounded-lg text-base flex items-center justify-center transition-all active:scale-90 ${
                                      emoji === e ? 'bg-brand-400/20 ring-1 ring-brand-400/50' : 'bg-white hover:bg-brand-50'
                                    }`}
                                  >{e}</button>
                                ))}
                              </div>
                              {error && <p className="text-red-400 text-[10px] text-center">{error}</p>}
                              <div className="flex gap-2">
                                <button type="button" onClick={cancelEdit} className="flex-1 h-8 rounded-lg bg-[#F0E6E0] text-[#8D6E63] text-xs">取消</button>
                                <button type="button" onClick={handleUpdate} disabled={!name.trim() || !categoryId || submitting} className="flex-1 h-8 rounded-lg bg-brand-500 text-white font-semibold text-xs disabled:opacity-30">
                                  {submitting ? '保存中...' : '保存'}
                                </button>
                              </div>
                            </div>
                          ) : (
                            /* 菜品行 */
                            <div
                              className={`flex items-center justify-between py-2.5 px-3 rounded-2xl transition-colors active:bg-brand-50 ${
                                dish.is_enabled ? '' : 'opacity-40'
                              }`}
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <span className="text-xl flex-shrink-0">{dish.emoji}</span>
                                <span className="text-sm text-[#5D4037] truncate">{dish.name}</span>
                                {dish.is_custom === 1 && (
                                  <span className="text-[10px] bg-brand-100 text-brand-600 px-1.5 py-0.5 rounded-md flex-shrink-0 font-medium">
                                    自
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => startEdit(dish)}
                                  className="flex-shrink-0 w-7 h-7 rounded-full bg-[#F0E6E0] flex items-center justify-center text-xs active:bg-brand-100 transition-all text-[#B0887A]"
                                >
                                  ✎
                                </button>
                                <button
                                  onClick={() => onDelete(dish.id)}
                                  className="flex-shrink-0 w-7 h-7 rounded-full bg-[#F0E6E0] flex items-center justify-center text-xs active:bg-red-100 active:text-red-400 transition-all text-[#B0887A]"
                                >
                                  ✕
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                {/* 无分类菜品 */}
                {ungrouped.length > 0 && (
                  <div>
                    <h3 className="text-[11px] font-semibold text-[#B0887A] uppercase tracking-wide mb-2">
                      其他 · {ungrouped.length}道
                    </h3>
                    <div className="space-y-1">
                      {ungrouped.map((dish) => (
                        <div key={dish.id}>
                          {editingId === dish.id ? (
                            <div className="bg-brand-50/50 rounded-2xl p-3 space-y-2.5 border border-brand-100">
                              <input value={name} onChange={(e) => setName(e.target.value)} className="w-full h-10 px-3 rounded-xl bg-white border border-brand-200 text-[#5D4037] text-sm outline-none focus:border-brand-400" autoFocus />
                              <div className="flex flex-wrap gap-1.5">
                                {categories.map((c, i) => {
                                  const col = catColor(i);
                                  const active = categoryId === c.id;
                                  return (
                                    <button key={c.id} type="button" onClick={() => setCategoryId(c.id)}
                                      className="px-2.5 py-1.5 rounded-lg text-[11px] font-medium border transition-all active:scale-95"
                                      style={{
                                        backgroundColor: active ? col.activeBg : col.bg,
                                        borderColor: active ? col.text : col.border,
                                        color: col.text,
                                        boxShadow: active ? `0 0 0 1.5px ${col.text}40` : 'none',
                                      }}
                                    >{c.icon} {c.name}</button>
                                  );
                                })}
                              </div>
                              <div className="flex flex-wrap gap-1">
                                {EMOJI_OPTIONS.map((e) => (
                                  <button key={e} type="button" onClick={() => setEmoji(e)} className={`w-8 h-8 rounded-lg text-base flex items-center justify-center transition-all active:scale-90 ${emoji === e ? 'bg-brand-400/20 ring-1 ring-brand-400/50' : 'bg-white hover:bg-brand-50'}`}>{e}</button>
                                ))}
                              </div>
                              {error && <p className="text-red-400 text-[10px] text-center">{error}</p>}
                              <div className="flex gap-2">
                                <button type="button" onClick={cancelEdit} className="flex-1 h-8 rounded-lg bg-[#F0E6E0] text-[#8D6E63] text-xs">取消</button>
                                <button type="button" onClick={handleUpdate} disabled={!name.trim() || !categoryId || submitting} className="flex-1 h-8 rounded-lg bg-brand-500 text-white font-semibold text-xs disabled:opacity-30">{submitting ? '保存中...' : '保存'}</button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between py-2.5 px-3 rounded-2xl">
                              <div className="flex items-center gap-2.5 min-w-0">
                                <span className="text-xl">{dish.emoji}</span>
                                <span className="text-sm text-[#5D4037] truncate">{dish.name}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <button onClick={() => startEdit(dish)} className="flex-shrink-0 w-7 h-7 rounded-full bg-[#F0E6E0] flex items-center justify-center text-xs active:bg-brand-100 transition-all text-[#B0887A]">✎</button>
                                <button onClick={() => onDelete(dish.id)} className="flex-shrink-0 w-7 h-7 rounded-full bg-[#F0E6E0] flex items-center justify-center text-xs active:bg-red-100 active:text-red-400 transition-all text-[#B0887A]">✕</button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {dishes.length === 0 && (
                  <div className="text-center py-12">
                    <p className="text-5xl mb-3">🍽️</p>
                    <p className="text-[#B0887A] text-sm">还没有菜品</p>
                    <p className="text-[#D4B8A8] text-xs mt-1">点击上方按钮添加你的第一道菜</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
