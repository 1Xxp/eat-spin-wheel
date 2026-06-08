import api from './index';
import type { ApiResponse } from './types';

export async function login(code: string, nickname?: string, avatarUrl?: string) {
  return api.post('/auth/login', { code, nickname, avatar_url: avatarUrl });
}

export async function fetchCategories() {
  return api.get('/food/categories');
}

export async function addCategory(name: string, icon?: string) {
  return api.post('/food/categories', { name, icon });
}

export async function updateCategory(id: number, data: Record<string, any>) {
  return api.put(`/food/categories/${id}`, data);
}

export async function deleteCategory(id: number) {
  return api.delete(`/food/categories/${id}`);
}

export async function fetchDishes(categoryId?: number) {
  return api.get('/food/dishes', { params: categoryId ? { category_id: categoryId } : {} });
}

export async function addDish(name: string, categoryId: number, emoji?: string) {
  return api.post('/food/dishes', { name, category_id: categoryId, emoji });
}

export async function deleteDish(id: number) {
  return api.delete(`/food/dishes/${id}`);
}

export async function updateDish(id: number, data: Record<string, any>) {
  return api.put(`/food/dishes/${id}`, data);
}

export async function importSystemDish(systemDishId: number) {
  return api.post('/food/dishes/import-system', { system_dish_id: systemDishId });
}

export async function spin() {
  return api.post('/food/spin', { method: 'wheel' });
}

export async function confirmDish(dishId: number, aiText: string, method: string) {
  return api.post('/food/history/confirm', { dish_id: dishId, ai_text: aiText, method });
}

export async function fetchHistory(page = 1, pageSize = 10) {
  return api.get('/food/history', { params: { page, pageSize } });
}

export async function clearHistory() {
  return api.delete('/food/history/clear');
}

export async function rateHistory(id: number, rating: number) {
  return api.post(`/food/history/${id}/rate`, { rating });
}
