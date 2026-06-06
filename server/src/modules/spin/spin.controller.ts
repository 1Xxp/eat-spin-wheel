import { Router, Response } from 'express';
import { authRequired, AuthRequest } from '../../middleware/auth';
import { success, fail } from '../../shared/response';
import { spinService } from './spin.service';
import { aiService, generateLocalText } from '../ai/ai.service';
import pool from '../../db/pool';

const router = Router();
router.use(authRequired);

// POST /v1/food/spin — 执行转盘抽取
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const { method } = req.body;
    const spinMethod = (method === 'random' ? 'random' : 'wheel') as 'wheel' | 'random';
    const userId = req.userId!;

    // 1. 抽取
    const { dish, category_name } = await spinService.spin(userId, spinMethod);

    // 2. 查询最近三天吃过的菜名
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    const [historyRows] = await pool.execute(
      `SELECT ud.name
       FROM spin_history sh
       JOIN user_dishes ud ON ud.id = sh.user_dish_id
       WHERE sh.user_id = ? AND sh.spun_at >= ?
       ORDER BY sh.spun_at DESC
       LIMIT 10`,
      [userId, threeDaysAgo]
    ) as any;
    const recentDishes: string[] = (historyRows as any[]).map((r) => r.name);

    // 3. 生成 AI 文案
    let aiText: string;
    try {
      aiText = await aiService.generateText(dish.name, recentDishes);
    } catch {
      aiText = generateLocalText(dish.name, recentDishes, dish.emoji);
    }

    // 4. 暂不写入历史——等用户点击"就它了"再确认
    return success(res, {
      dish,
      ai_text: aiText,
      category_name,
      dish_id: dish.id,
    });
  } catch (err: any) {
    console.error('转盘抽取失败:', err);
    return fail(res, 500, err.message || '抽取失败');
  }
});

export default router;
