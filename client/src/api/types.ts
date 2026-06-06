// 与后端统一响应格式
export interface ApiResponse<T = any> {
  code: number;
  message: string;
  data: T;
}

// ---- 业务类型 ----

export interface Dish {
  id: number;
  user_id: number;
  system_dish_id: number | null;
  category_id: number;
  name: string;
  emoji: string;
  tags: string[] | null;
  is_custom: number;
  is_enabled: number;
  spin_count: number;
  last_selected_at: string | null;
  category_name?: string;
  category_icon?: string;
}

export interface Category {
  id: number;
  name: string;
  icon: string;
  sort_order: number;
  is_system: number;
}

export interface SpinResult {
  dish: Dish;
  ai_text: string;
  category_name: string;
  dish_id: number;
}

export interface HistoryItem {
  id: number;
  method: string;
  ai_text: string;
  user_rating: number | null;
  spun_at: string;
  dish_name: string;
  dish_emoji: string;
  category_name: string;
}
