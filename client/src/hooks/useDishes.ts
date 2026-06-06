import { useState, useEffect, useCallback } from 'react';
import { fetchDishes, addDish, deleteDish as delDish, updateDish, fetchCategories } from '../api/endpoints';
import type { Dish, Category } from '../api/types';

export function useDishes() {
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [dRes, cRes]: any[] = await Promise.all([fetchDishes(), fetchCategories()]);
      setDishes(dRes.data || []);
      setCategories(cRes.data || []);
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
