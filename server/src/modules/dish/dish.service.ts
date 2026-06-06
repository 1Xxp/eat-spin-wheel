import pool from '../../db/pool';
import { UserDish } from '../../shared/types';

export const dishService = {
  /** 获取用户菜品列表（带分类名） */
  async list(userId: number, categoryId?: number): Promise<any[]> {
    let sql = `
      SELECT ud.*, dc.name AS category_name, dc.icon AS category_icon
      FROM user_dishes ud
      JOIN dish_categories dc ON dc.id = ud.category_id
      WHERE ud.user_id = ? AND ud.is_deleted = 0
    `;
    const params: any[] = [userId];
    if (categoryId) {
      sql += ' AND ud.category_id = ?';
      params.push(categoryId);
    }
    sql += ' ORDER BY ud.is_enabled DESC, ud.created_at DESC';
    const [rows] = await pool.execute(sql, params);
    return rows as any[];
  },

  /** 添加自定义菜品 */
  async create(userId: number, data: { name: string; category_id: number; emoji?: string }): Promise<UserDish> {
    const [result] = await pool.execute(
      'INSERT INTO user_dishes (user_id, category_id, name, emoji, is_custom) VALUES (?, ?, ?, ?, 1)',
      [userId, data.category_id, data.name, data.emoji || '🍽️']
    ) as any;
    const [rows] = await pool.execute('SELECT * FROM user_dishes WHERE id = ?', [result.insertId]) as any;
    return rows[0] as UserDish;
  },

  /** 更新菜品（仅自定义菜品可改名/改分类） */
  async update(userId: number, dishId: number, data: { name?: string; category_id?: number; emoji?: string; is_enabled?: number }) {
    const fields: string[] = [];
    const params: any[] = [];
    if (data.name !== undefined) { fields.push('name = ?'); params.push(data.name); }
    if (data.category_id !== undefined) { fields.push('category_id = ?'); params.push(data.category_id); }
    if (data.emoji !== undefined) { fields.push('emoji = ?'); params.push(data.emoji); }
    if (data.is_enabled !== undefined) { fields.push('is_enabled = ?'); params.push(data.is_enabled); }
    if (fields.length === 0) return;
    params.push(dishId, userId);
    await pool.execute(`UPDATE user_dishes SET ${fields.join(', ')} WHERE id = ? AND user_id = ?`, params);
  },

  /** 删除（软删除） */
  async remove(userId: number, dishId: number) {
    await pool.execute(
      'UPDATE user_dishes SET is_deleted = 1 WHERE id = ? AND user_id = ?',
      [dishId, userId]
    );
  },

  /** 从系统菜品库导入 */
  async importSystem(userId: number, systemDishId: number) {
    const [sys] = await pool.execute('SELECT * FROM system_dishes WHERE id = ? AND is_deleted = 0', [systemDishId]) as any;
    if (sys.length === 0) throw new Error('系统菜品不存在');

    const d = sys[0];
    // 检查是否已导入
    const [exist] = await pool.execute(
      'SELECT id FROM user_dishes WHERE user_id = ? AND system_dish_id = ? AND is_deleted = 0',
      [userId, systemDishId]
    ) as any;
    if (exist.length > 0) return exist[0] as UserDish;

    const [result] = await pool.execute(
      'INSERT INTO user_dishes (user_id, system_dish_id, category_id, name, emoji, tags) VALUES (?, ?, ?, ?, ?, ?)',
      [userId, d.id, d.category_id, d.name, d.emoji, d.tags]
    ) as any;
    const [rows] = await pool.execute('SELECT * FROM user_dishes WHERE id = ?', [result.insertId]) as any;
    return rows[0] as UserDish;
  },

  /** 批量导入系统默认菜品（新用户注册时调用） */
  async importAllSystem(userId: number) {
    const [sysDishes] = await pool.execute('SELECT id FROM system_dishes WHERE is_deleted = 0') as any;
    const imported: UserDish[] = [];
    for (const d of sysDishes) {
      const dish = await this.importSystem(userId, d.id);
      imported.push(dish);
    }
    return imported;
  },
};
