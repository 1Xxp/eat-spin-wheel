"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../../middleware/auth");
const response_1 = require("../../shared/response");
const ai_service_1 = require("./ai.service");
const pool_1 = __importDefault(require("../../db/pool"));
const router = (0, express_1.Router)();
router.use(auth_1.authRequired);
// POST /v1/food/ai-text — 为指定菜品生成/获取文案
router.post('/', async (req, res) => {
    try {
        const { dish_name, tone } = req.body;
        if (!dish_name)
            return (0, response_1.fail)(res, 400, 'dish_name 不能为空');
        // 查询最近三天历史
        const recentDishes = await getRecentDishes(req.userId);
        const text = await ai_service_1.aiService.generateText(dish_name, recentDishes, tone || 'funny');
        return (0, response_1.success)(res, { text, dish_name });
    }
    catch (err) {
        console.error(err);
        return (0, response_1.success)(res, { text: (0, ai_service_1.generateLocalText)(req.body.dish_name), dish_name: req.body.dish_name, fallback: true });
    }
});
// POST /v1/food/ai-text/regenerate — 重新生成文案（清除缓存）
router.post('/regenerate', async (req, res) => {
    try {
        const { dish_name, tone } = req.body;
        if (!dish_name)
            return (0, response_1.fail)(res, 400, 'dish_name 不能为空');
        const recentDishes = await getRecentDishes(req.userId);
        const text = await ai_service_1.aiService.regenerate(dish_name, recentDishes, tone || 'funny');
        return (0, response_1.success)(res, { text, dish_name });
    }
    catch (err) {
        console.error(err);
        const recentDishes = await getRecentDishes(req.userId).catch(() => []);
        return (0, response_1.success)(res, { text: (0, ai_service_1.generateLocalText)(req.body.dish_name, recentDishes), dish_name: req.body.dish_name, fallback: true });
    }
});
async function getRecentDishes(userId) {
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    const [rows] = await pool_1.default.execute(`SELECT ud.name FROM spin_history sh
     JOIN user_dishes ud ON ud.id = sh.user_dish_id
     WHERE sh.user_id = ? AND sh.spun_at >= ?
     ORDER BY sh.spun_at DESC LIMIT 10`, [userId, threeDaysAgo]);
    return rows.map((r) => r.name);
}
exports.default = router;
//# sourceMappingURL=ai.controller.js.map