import { Router, Response } from 'express';
import { authRequired, AuthRequest } from '../../middleware/auth';
import { success, fail } from '../../shared/response';
import { aiService, generateLocalText } from './ai.service';
import pool from '../../db/pool';

const router = Router();
router.use(authRequired);

// POST /v1/food/ai-text — 为指定菜品生成/获取文案
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const { dish_name, tone } = req.body;
    if (!dish_name) return fail(res, 400, 'dish_name 不能为空');

    // 查询最近三天历史
    const recentDishes = await getRecentDishes(req.userId!);

    const text = await aiService.generateText(dish_name, recentDishes, tone || 'funny');
    return success(res, { text, dish_name });
  } catch (err) {
    console.error(err);
    return success(res, { text: generateLocalText(req.body.dish_name), dish_name: req.body.dish_name, fallback: true });
  }
});

// POST /v1/food/ai-text/regenerate — 重新生成文案（清除缓存）
router.post('/regenerate', async (req: AuthRequest, res: Response) => {
  try {
    const { dish_name, tone } = req.body;
    if (!dish_name) return fail(res, 400, 'dish_name 不能为空');

    const recentDishes = await getRecentDishes(req.userId!);

    const text = await aiService.regenerate(dish_name, recentDishes, tone || 'funny');
    return success(res, { text, dish_name });
  } catch (err) {
    console.error(err);
    const recentDishes = await getRecentDishes(req.userId!).catch(() => []);
    return success(res, { text: generateLocalText(req.body.dish_name, recentDishes), dish_name: req.body.dish_name, fallback: true });
  }
});

async function getRecentDishes(userId: number): Promise<string[]> {
  const threeDaysAgo = new Date();
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
  const [rows] = await pool.execute(
    `SELECT ud.name FROM spin_history sh
     JOIN user_dishes ud ON ud.id = sh.user_dish_id
     WHERE sh.user_id = ? AND sh.spun_at >= ?
     ORDER BY sh.spun_at DESC LIMIT 10`,
    [userId, threeDaysAgo]
  ) as any;
  return (rows as any[]).map((r: any) => r.name);
}

export default router;
