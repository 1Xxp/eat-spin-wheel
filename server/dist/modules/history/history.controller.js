"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../../middleware/auth");
const response_1 = require("../../shared/response");
const pool_1 = __importDefault(require("../../db/pool"));
const router = (0, express_1.Router)();
router.use(auth_1.authRequired);
// GET /v1/food/history — 转盘历史记录
router.get('/', async (req, res) => {
    try {
        const page = Math.max(1, Number(req.query.page) || 1);
        const pageSize = Math.min(50, Math.max(1, Number(req.query.pageSize) || 10));
        const offset = (page - 1) * pageSize;
        const [countRows] = await pool_1.default.query('SELECT COUNT(*) AS total FROM spin_history WHERE user_id = ?', [req.userId]);
        const total = countRows[0].total;
        const [rows] = await pool_1.default.query(`SELECT sh.id, sh.method, sh.ai_text, sh.user_rating, sh.spun_at,
              ud.name AS dish_name, ud.emoji AS dish_emoji,
              dc.name AS category_name
       FROM spin_history sh
       JOIN user_dishes ud ON ud.id = sh.user_dish_id
       JOIN dish_categories dc ON dc.id = ud.category_id
       WHERE sh.user_id = ?
       ORDER BY sh.spun_at DESC
       LIMIT ${pageSize} OFFSET ${offset}`, [req.userId]);
        return (0, response_1.success)(res, { list: rows, total, page, pageSize });
    }
    catch (err) {
        console.error(err);
        return (0, response_1.fail)(res, 500, '获取历史记录失败');
    }
});
// POST /v1/food/history/confirm — 用户确认选择，写入历史
router.post('/confirm', async (req, res) => {
    try {
        const { dish_id, ai_text, method } = req.body;
        if (!dish_id)
            return (0, response_1.fail)(res, 400, 'dish_id 不能为空');
        const now = new Date();
        const [result] = await pool_1.default.execute('INSERT INTO spin_history (user_id, user_dish_id, method, ai_text, spun_at) VALUES (?, ?, ?, ?, ?)', [req.userId, dish_id, method || 'wheel', ai_text || '', now]);
        await pool_1.default.execute('UPDATE user_dishes SET last_selected_at = ?, spin_count = spin_count + 1 WHERE id = ?', [now, dish_id]);
        return (0, response_1.success)(res, { id: result.insertId }, '已记录');
    }
    catch (err) {
        console.error(err);
        return (0, response_1.fail)(res, 500, '确认失败');
    }
});
// GET /v1/food/history/today — 今日抽过的菜品ID列表（前端去重用）
router.get('/today', async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const [rows] = await pool_1.default.execute(`SELECT sh.user_dish_id, ud.name, ud.emoji
       FROM spin_history sh
       JOIN user_dishes ud ON ud.id = sh.user_dish_id
       WHERE sh.user_id = ? AND sh.spun_at >= ?
       ORDER BY sh.spun_at DESC`, [req.userId, today]);
        return (0, response_1.success)(res, rows);
    }
    catch (err) {
        console.error(err);
        return (0, response_1.fail)(res, 500, '获取今日记录失败');
    }
});
// DELETE /v1/food/history/clear — 清空全部历史
router.delete('/clear', async (req, res) => {
    try {
        await pool_1.default.execute('DELETE FROM spin_history WHERE user_id = ?', [req.userId]);
        return (0, response_1.success)(res, null, '已清空');
    }
    catch (err) {
        console.error(err);
        return (0, response_1.fail)(res, 500, '清空失败');
    }
});
// DELETE /v1/food/history/:id — 删除单条记录
router.delete('/:id', async (req, res) => {
    try {
        await pool_1.default.execute('DELETE FROM spin_history WHERE id = ? AND user_id = ?', [req.params.id, req.userId]);
        return (0, response_1.success)(res, null, '删除成功');
    }
    catch (err) {
        console.error(err);
        return (0, response_1.fail)(res, 500, '删除失败');
    }
});
// POST /v1/food/history/:id/rate — 评分
router.post('/:id/rate', async (req, res) => {
    try {
        const rating = parseInt(req.body.rating);
        if (!rating || rating < 1 || rating > 5) {
            return (0, response_1.fail)(res, 400, '评分需在1-5之间');
        }
        await pool_1.default.execute('UPDATE spin_history SET user_rating = ? WHERE id = ? AND user_id = ?', [rating, req.params.id, req.userId]);
        return (0, response_1.success)(res, null, '评分成功');
    }
    catch (err) {
        console.error(err);
        return (0, response_1.fail)(res, 500, '评分失败');
    }
});
exports.default = router;
//# sourceMappingURL=history.controller.js.map