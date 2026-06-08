import { useState, useEffect, useCallback } from 'react';
import { fetchDishes, addDish, deleteDish as delDish, updateDish, fetchCategories } from '../api/endpoints';
import type { Dish, Category } from '../api/types';

const CACHE_KEY_D = 'eat_cache_dishes';
const CACHE_KEY_C = 'eat_cache_cats';

function loadCache<T>(key: string): T | null {
  try {
    const raw = sessionStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function saveCache(key: string, data: any) {
  try { sessionStorage.setItem(key, JSON.stringify(data)); } catch {}
}

export function useDishes() {
  // 从缓存初始化——秒开
  const cachedDishes = loadCache<Dish[]>(CACHE_KEY_D);
  const cachedCats = loadCache<Category[]>(CACHE_KEY_C);
  const [dishes, setDishes] = useState<Dish[]>(cachedDishes || []);
  const [categories, setCategories] = useState<Category[]>(cachedCats || []);
  const hasCache = !!(cachedDishes && cachedCats);
  const [loading, setLoading] = useState(!hasCache);

  const load = useCallback(async () => {
    if (!hasCache) setLoading(true);
    try {
      const [dRes, cRes]: any[] = await Promise.all([fetchDishes(), fetchCategories()]);
      const d = dRes.data || [];
      const c = cRes.data || [];
      setDishes(d);
      setCategories(c);
      saveCache(CACHE_KEY_D, d);
      saveCache(CACHE_KEY_C, c);
    } catch (e) { console.error('菜单加载失败:', e); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const add = useCallback(async (name: string, categoryId: number, emoji?: string) => {
    await addDish(name, categoryId, emoji);
    await load();
  }, [load]);

  const remove = useCallback(async (id: number) => {
    await delDish(id);
    setDishes((prev) => prev.filter((d) => d.id !== id));
  }, []);

  const update = useCallback(async (id: number, data: Record<string, any>) => {
    await updateDish(id, data);
    await load();
  }, [load]);

  return { dishes, categories, loading, add, remove, update, reload: load };
}
