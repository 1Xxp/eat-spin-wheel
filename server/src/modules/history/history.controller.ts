import { Router, Response } from 'express';
import { authRequired, AuthRequest } from '../../middleware/auth';
import { success, fail } from '../../shared/response';
import pool from '../../db/pool';

const router = Router();
router.use(authRequired);

// GET /v1/food/history — 转盘历史记录
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const pageSize = Math.min(50, Math.max(1, Number(req.query.pageSize) || 10));
    const offset = (page - 1) * pageSize;

    const [countRows] = await pool.query(
      'SELECT COUNT(*) AS total FROM spin_history WHERE user_id = ?',
      [req.userId!]
    ) as any;
    const total = countRows[0].total;

    const [rows] = await pool.query(
      `SELECT sh.id, sh.method, sh.ai_text, sh.user_rating, sh.spun_at,
              ud.name AS dish_name, ud.emoji AS dish_emoji,
              dc.name AS category_name
       FROM spin_history sh
       JOIN user_dishes ud ON ud.id = sh.user_dish_id
       JOIN dish_categories dc ON dc.id = ud.category_id
       WHERE sh.user_id = ?
       ORDER BY sh.spun_at DESC
       LIMIT ${pageSize} OFFSET ${offset}`,
      [req.userId!]
    );

    return success(res, { list: rows, total, page, pageSize });
  } catch (err) {
    console.error(err);
    return fail(res, 500, '获取历史记录失败');
  }
});

// POST /v1/food/history/confirm — 用户确认选择，写入历史
router.post('/confirm', async (req: AuthRequest, res: Response) => {
  try {
    const { dish_id, ai_text, method } = req.body;
    if (!dish_id) return fail(res, 400, 'dish_id 不能为空');

    const now = new Date();
    const [result] = await pool.execute(
      'INSERT INTO spin_history (user_id, user_dish_id, method, ai_text, spun_at) VALUES (?, ?, ?, ?, ?)',
      [req.userId!, dish_id, method || 'wheel', ai_text || '', now]
    ) as any;

    await pool.execute(
      'UPDATE user_dishes SET last_selected_at = ?, spin_count = spin_count + 1 WHERE id = ?',
      [now, dish_id]
    );

    return success(res, { id: result.insertId }, '已记录');
  } catch (err) {
    console.error(err);
    return fail(res, 500, '确认失败');
  }
});

// GET /v1/food/history/today — 今日抽过的菜品ID列表（前端去重用）
router.get('/today', async (req: AuthRequest, res: Response) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const [rows] = await pool.execute(
      `SELECT sh.user_dish_id, ud.name, ud.emoji
       FROM spin_history sh
       JOIN user_dishes ud ON ud.id = sh.user_dish_id
       WHERE sh.user_id = ? AND sh.spun_at >= ?
       ORDER BY sh.spun_at DESC`,
      [req.userId!, today]
    );
    return success(res, rows);
  } catch (err) {
    console.error(err);
    return fail(res, 500, '获取今日记录失败');
  }
});

// DELETE /v1/food/history/clear — 清空全部历史
router.delete('/clear', async (req: AuthRequest, res: Response) => {
  try {
    await pool.execute('DELETE FROM spin_history WHERE user_id = ?', [req.userId!]);
    return success(res, null, '已清空');
  } catch (err) {
    console.error(err);
    return fail(res, 500, '清空失败');
  }
});

// DELETE /v1/food/history/:id — 删除单条记录
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    await pool.execute(
      'DELETE FROM spin_history WHERE id = ? AND user_id = ?',
      [req.params.id, req.userId!]
    );
    return success(res, null, '删除成功');
  } catch (err) {
    console.error(err);
    return fail(res, 500, '删除失败');
  }
});

// POST /v1/food/history/:id/rate — 评分
router.post('/:id/rate', async (req: AuthRequest, res: Response) => {
  try {
    const rating = parseInt(req.body.rating);
    if (!rating || rating < 1 || rating > 5) {
      return fail(res, 400, '评分需在1-5之间');
    }
    await pool.execute(
      'UPDATE spin_history SET user_rating = ? WHERE id = ? AND user_id = ?',
      [rating, req.params.id, req.userId!]
    );
    return success(res, null, '评分成功');
  } catch (err) {
    console.error(err);
    return fail(res, 500, '评分失败');
  }
});

export default router;
