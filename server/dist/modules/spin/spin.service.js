"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.spinService = void 0;
const pool_1 = __importDefault(require("../../db/pool"));
exports.spinService = {
    /**
     * 执行一次转盘抽取
     * 策略：
     * 1. 查询用户启用菜品
     * 2. 排除今日已抽过的
     * 3. 套用偏好权重（如有画像数据）
     * 4. 随机选一
     * 5. 兜底：今日全部抽过则重置
     */
    async spin(userId, method = 'wheel') {
        // 1. 查询启用的菜品
        const [dishes] = await pool_1.default.execute(`SELECT ud.*, dc.name AS category_name
       FROM user_dishes ud
       JOIN dish_categories dc ON dc.id = ud.category_id
       WHERE ud.user_id = ? AND ud.is_deleted = 0 AND ud.is_enabled = 1
       ORDER BY ud.last_selected_at ASC`, [userId]);
        if (dishes.length === 0)
            throw new Error('菜品池为空，请先添加菜品');
        // 2. 查询今日已抽中的菜品ID
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const [todayHistory] = await pool_1.default.execute('SELECT user_dish_id FROM spin_history WHERE user_id = ? AND spun_at >= ?', [userId, today]);
        const todayIds = new Set(todayHistory.map((r) => r.user_dish_id));
        // 3. 过滤今日已抽的
        let candidates = dishes.filter((d) => !todayIds.has(d.id));
        // 4. 如果今日全部抽过了，重置（允许重复）
        if (candidates.length === 0) {
            candidates = dishes;
        }
        // 5. 尝试加权（有画像数据时）
        const weighted = await applyTasteWeights(userId, candidates);
        const picked = weighted[Math.floor(Math.random() * weighted.length)];
        // 6. 更新统计
        await pool_1.default.execute('UPDATE user_dishes SET last_selected_at = NOW(), spin_count = spin_count + 1 WHERE id = ?', [picked.id]);
        return {
            dish: {
                id: picked.id,
                user_id: picked.user_id,
                system_dish_id: picked.system_dish_id,
                category_id: picked.category_id,
                name: picked.name,
                emoji: picked.emoji,
                tags: picked.tags,
                is_custom: picked.is_custom,
                is_enabled: picked.is_enabled,
                spin_count: picked.spin_count + 1,
                last_selected_at: new Date().toISOString(),
            },
            category_name: picked.category_name,
        };
    },
    /** 写入历史记录 */
    async saveHistory(userId, userDishId, aiText, method) {
        const [result] = await pool_1.default.execute('INSERT INTO spin_history (user_id, user_dish_id, method, ai_text) VALUES (?, ?, ?, ?)', [userId, userDishId, method, aiText]);
        return result.insertId;
    },
};
/** 根据用户口味偏好调整权重（重复偏好的菜品，提高命中率） */
async function applyTasteWeights(userId, candidates) {
    try {
        const [profiles] = await pool_1.default.execute('SELECT taste_prefs FROM user_taste_profile WHERE user_id = ?', [userId]);
        if (profiles.length === 0)
            return candidates;
        const profile = profiles[0];
        const prefs = profile.taste_prefs || [];
        if (prefs.length === 0)
            return candidates;
        // 口味匹配的复制2份（权重x2），其余1份
        const weighted = [];
        for (const d of candidates) {
            const tags = d.tags || [];
            const match = prefs.some((p) => tags.includes(p));
            weighted.push(d);
            if (match)
                weighted.push(d); // 匹配的多加一次
        }
        return weighted;
    }
    catch {
        return candidates; // 画像查询失败，退化为均匀随机
    }
}
//# sourceMappingURL=spin.service.js.map