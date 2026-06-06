// ============ 每日吃什么大转盘 - 类型定义 ============

export interface DishCategory {
  id: number;
  user_id: number | null;
  name: string;
  icon: string;
  sort_order: number;
  is_system: number;
}

export interface SystemDish {
  id: number;
  category_id: number;
  name: string;
  emoji: string;
  tags: string[] | null;
  calories: number | null;
  cook_time: number | null;
  difficulty: number | null;
}

export interface UserDish {
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
}

export interface SpinRecord {
  id: number;
  user_id: number;
  user_dish_id: number;
  method: 'wheel' | 'voice' | 'random' | 'ai_recommend';
  ai_text: string;
  user_rating: number | null;
  spun_at: string;
  dish_name?: string;
  dish_emoji?: string;
  category_name?: string;
}

export interface UserTasteProfile {
  id: number;
  user_id: number;
  taste_prefs: string[];
  avoid_tastes: string[];
  weight_quick: number;
  weight_healthy: number;
  weight_indulgent: number;
  weight_social: number;
  avg_calories_pref: number | null;
  top_category_ids: number[];
  top_tags: string[];
  prefer_lunch_time: string | null;
  prefer_dinner_time: string | null;
}

export interface SpinResult {
  dish: UserDish;
  ai_text: string;
  category_name: string;
  record_id: number;
}
