import { Router, Response } from 'express';
import { authRequired, AuthRequest } from '../../middleware/auth';
import { success, fail } from '../../shared/response';
import { dishService } from './dish.service';

const router = Router();
router.use(authRequired);

// GET /v1/food/categories — 分类列表
router.get('/categories', async (req: AuthRequest, res: Response) => {
  try {
    const [rows] = await (await import('../../db/pool')).default.execute(
      `SELECT id, user_id, name, icon, sort_order, is_system
       FROM dish_categories
       WHERE (user_id = ? OR is_system = 1) AND is_deleted = 0
       ORDER BY sort_order ASC`,
      [req.userId!]
    );
    return success(res, rows);
  } catch (err) {
    console.error(err);
    return fail(res, 500, '获取分类失败');
  }
});

// GET /v1/food/dishes — 菜品列表
router.get('/dishes', async (req: AuthRequest, res: Response) => {
  try {
    const categoryId = req.query.category_id ? Number(req.query.category_id) : undefined;
    const list = await dishService.list(req.userId!, categoryId);
    return success(res, list);
  } catch (err) {
    console.error(err);
    return fail(res, 500, '获取菜品列表失败');
  }
});

// GET /v1/food/dishes/:id — 菜品详情
router.get('/dishes/:id', async (req: AuthRequest, res: Response) => {
  try {
    const [rows] = await (await import('../../db/pool')).default.execute(
      `SELECT ud.*, dc.name AS category_name FROM user_dishes ud
       JOIN dish_categories dc ON dc.id = ud.category_id
       WHERE ud.id = ? AND ud.user_id = ? AND ud.is_deleted = 0`,
      [req.params.id, req.userId!]
    ) as any;
    if (rows.length === 0) return fail(res, 404, '菜品不存在');
    return success(res, rows[0]);
  } catch (err) {
    console.error(err);
    return fail(res, 500, '获取菜品详情失败');
  }
});

// POST /v1/food/dishes — 添加自定义菜品
router.post('/dishes', async (req: AuthRequest, res: Response) => {
  try {
    const { name, category_id, emoji } = req.body;
    if (!name || !category_id) return fail(res, 400, '菜品名称和分类不能为空');
    const dish = await dishService.create(req.userId!, { name, category_id, emoji });
    return success(res, dish, '添加成功');
  } catch (err) {
    console.error(err);
    return fail(res, 500, '添加菜品失败');
  }
});

// PUT /v1/food/dishes/:id — 更新菜品
router.put('/dishes/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { name, category_id, emoji, is_enabled } = req.body;
    await dishService.update(req.userId!, Number(req.params.id), { name, category_id, emoji, is_enabled });
    return success(res, null, '更新成功');
  } catch (err) {
    console.error(err);
    return fail(res, 500, '更新菜品失败');
  }
});

// DELETE /v1/food/dishes/:id — 删除菜品
router.delete('/dishes/:id', async (req: AuthRequest, res: Response) => {
  try {
    await dishService.remove(req.userId!, Number(req.params.id));
    return success(res, null, '删除成功');
  } catch (err) {
    console.error(err);
    return fail(res, 500, '删除菜品失败');
  }
});

// POST /v1/food/dishes/import-system — 从系统库导入菜品
router.post('/dishes/import-system', async (req: AuthRequest, res: Response) => {
  try {
    const { system_dish_id } = req.body;
    if (!system_dish_id) return fail(res, 400, 'system_dish_id 不能为空');
    const dish = await dishService.importSystem(req.userId!, system_dish_id);
    return success(res, dish, '导入成功');
  } catch (err: any) {
    return fail(res, 400, err.message || '导入失败');
  }
});

// GET /v1/food/system-dishes — 查看系统菜品库（按分类）
router.get('/system-dishes', async (req: AuthRequest, res: Response) => {
  try {
    const categoryId = req.query.category_id ? Number(req.query.category_id) : undefined;
    let sql = `
      SELECT sd.*, dc.name AS category_name, dc.icon AS category_icon
      FROM system_dishes sd
      JOIN dish_categories dc ON dc.id = sd.category_id
      WHERE sd.is_deleted = 0
    `;
    const params: any[] = [];
    if (categoryId) { sql += ' AND sd.category_id = ?'; params.push(categoryId); }
    sql += ' ORDER BY dc.sort_order, sd.id';
    const [rows] = await (await import('../../db/pool')).default.execute(sql, params);
    return success(res, rows);
  } catch (err) {
    console.error(err);
    return fail(res, 500, '获取系统菜品失败');
  }
});

export default router;
