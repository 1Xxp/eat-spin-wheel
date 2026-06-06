import { Router, Response } from 'express';
import { authRequired, AuthRequest } from '../../middleware/auth';
import { success, fail } from '../../shared/response';
import pool from '../../db/pool';

const router = Router();
router.use(authRequired);

// GET /v1/food/prefs — 获取用户口味偏好
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const [rows] = await pool.execute(
      `SELECT taste_prefs, avoid_tastes,
              weight_quick, weight_healthy, weight_indulgent, weight_social,
              avg_calories_pref, top_category_ids, top_tags,
              prefer_lunch_time, prefer_dinner_time
       FROM user_taste_profile WHERE user_id = ?`,
      [req.userId!]
    ) as any;

    if (rows.length === 0) {
      // 首次访问，创建默认画像
      await pool.execute('INSERT INTO user_taste_profile (user_id) VALUES (?)', [req.userId!]);
      return success(res, {
        taste_prefs: [], avoid_tastes: [],
        weight_quick: 0, weight_healthy: 0, weight_indulgent: 0, weight_social: 0,
        avg_calories_pref: null, top_category_ids: [], top_tags: [],
        prefer_lunch_time: null, prefer_dinner_time: null,
      });
    }

    return success(res, rows[0]);
  } catch (err) {
    console.error(err);
    return fail(res, 500, '获取偏好失败');
  }
});

// PUT /v1/food/prefs — 更新口味偏好
router.put('/', async (req: AuthRequest, res: Response) => {
  try {
    const { taste_prefs, avoid_tastes,
            weight_quick, weight_healthy, weight_indulgent, weight_social,
            prefer_lunch_time, prefer_dinner_time } = req.body;

    const fields: string[] = [];
    const params: any[] = [];

    if (taste_prefs !== undefined) { fields.push('taste_prefs = ?'); params.push(JSON.stringify(taste_prefs)); }
    if (avoid_tastes !== undefined) { fields.push('avoid_tastes = ?'); params.push(JSON.stringify(avoid_tastes)); }
    if (weight_quick !== undefined) { fields.push('weight_quick = ?'); params.push(weight_quick); }
    if (weight_healthy !== undefined) { fields.push('weight_healthy = ?'); params.push(weight_healthy); }
    if (weight_indulgent !== undefined) { fields.push('weight_indulgent = ?'); params.push(weight_indulgent); }
    if (weight_social !== undefined) { fields.push('weight_social = ?'); params.push(weight_social); }
    if (prefer_lunch_time !== undefined) { fields.push('prefer_lunch_time = ?'); params.push(prefer_lunch_time); }
    if (prefer_dinner_time !== undefined) { fields.push('prefer_dinner_time = ?'); params.push(prefer_dinner_time); }

    if (fields.length === 0) return fail(res, 400, '没有需要更新的字段');

    params.push(req.userId!);
    await pool.execute(`UPDATE user_taste_profile SET ${fields.join(', ')} WHERE user_id = ?`, params);

    return success(res, null, '偏好更新成功');
  } catch (err) {
    console.error(err);
    return fail(res, 500, '更新偏好失败');
  }
});

// POST /v1/food/prefs/recalculate — 根据历史数据重新计算画像
router.post('/recalculate', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;

    // 统计用户历史评分数据
    const [stats] = await pool.execute(
      `SELECT ud.category_id, ud.tags, ud.calories, AVG(sh.user_rating) AS avg_rating, COUNT(*) AS cnt
       FROM spin_history sh
       JOIN user_dishes ud ON ud.id = sh.user_dish_id
       JOIN system_dishes sd ON sd.id = ud.system_dish_id
       WHERE sh.user_id = ?
         AND sh.user_rating IS NOT NULL
         AND sd.calories IS NOT NULL
       GROUP BY ud.category_id, ud.tags, sd.calories
       ORDER BY cnt DESC`,
      [userId]
    ) as any;

    if (stats.length === 0) return success(res, null, '暂无足够数据计算画像');

    // 简单统计：最高频分类Top3、最高频标签Top5、平均热量
    const catCount = new Map<number, number>();
    const tagCount = new Map<string, number>();
    let totalCal = 0, calCount = 0;

    for (const row of stats) {
      catCount.set(row.category_id, (catCount.get(row.category_id) || 0) + row.cnt);
      const tags: string[] = row.tags || [];
      for (const t of tags) {
        tagCount.set(t, (tagCount.get(t) || 0) + row.cnt);
      }
      if (row.calories) {
        totalCal += row.calories * row.cnt;
        calCount += row.cnt;
      }
    }

    const topCategoryIds = [...catCount.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3).map(e => e[0]);
    const topTags = [...tagCount.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5).map(e => e[0]);
    const avgCal = calCount > 0 ? Math.round(totalCal / calCount) : null;

    await pool.execute(
      `UPDATE user_taste_profile
       SET top_category_ids = ?, top_tags = ?, avg_calories_pref = ?,
           profile_version = profile_version + 1, last_calculated_at = NOW()
       WHERE user_id = ?`,
      [JSON.stringify(topCategoryIds), JSON.stringify(topTags), avgCal, userId]
    );

    return success(res, { top_category_ids: topCategoryIds, top_tags: topTags, avg_calories_pref: avgCal }, '画像已更新');
  } catch (err) {
    console.error(err);
    return fail(res, 500, '画像计算失败');
  }
});

export default router;
