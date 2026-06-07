"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../../middleware/auth");
const response_1 = require("../../shared/response");
const spin_service_1 = require("./spin.service");
const ai_service_1 = require("../ai/ai.service");
const pool_1 = __importDefault(require("../../db/pool"));
const router = (0, express_1.Router)();
router.use(auth_1.authRequired);
// POST /v1/food/spin — 执行转盘抽取
router.post('/', async (req, res) => {
    try {
        const { method } = req.body;
        const spinMethod = (method === 'random' ? 'random' : 'wheel');
        const userId = req.userId;
        // 1. 抽取
        const { dish, category_name } = await spin_service_1.spinService.spin(userId, spinMethod);
        // 2. 查询最近三天吃过的菜名
        const threeDaysAgo = new Date();
        threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
        const [historyRows] = await pool_1.default.execute(`SELECT ud.name
       FROM spin_history sh
       JOIN user_dishes ud ON ud.id = sh.user_dish_id
       WHERE sh.user_id = ? AND sh.spun_at >= ?
       ORDER BY sh.spun_at DESC
       LIMIT 10`, [userId, threeDaysAgo]);
        const recentDishes = historyRows.map((r) => r.name);
        // 3. 生成 AI 文案
        let aiText;
        try {
            aiText = await ai_service_1.aiService.generateText(dish.name, recentDishes);
        }
        catch {
            aiText = (0, ai_service_1.generateLocalText)(dish.name, recentDishes, dish.emoji);
        }
        // 4. 暂不写入历史——等用户点击"就它了"再确认
        return (0, response_1.success)(res, {
            dish,
            ai_text: aiText,
            category_name,
            dish_id: dish.id,
        });
    }
    catch (err) {
        console.error('转盘抽取失败:', err);
        return (0, response_1.fail)(res, 500, err.message || '抽取失败');
    }
});
exports.default = router;
//# sourceMappingURL=spin.controller.js.map