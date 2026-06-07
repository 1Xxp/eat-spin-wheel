"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const uuid_1 = require("uuid");
const config_1 = require("../../config");
const pool_1 = __importDefault(require("../../db/pool"));
const response_1 = require("../../shared/response");
const router = (0, express_1.Router)();
// POST /v1/auth/login — 模拟登录
router.post('/login', async (req, res) => {
    const { code, nickname, avatar_url } = req.body;
    // MVP模式：code直接当openid用
    const openid = code ? `user_${code.slice(0, 32)}` : `guest_${(0, uuid_1.v4)().slice(0, 8)}`;
    try {
        const [rows] = await pool_1.default.execute('SELECT * FROM users WHERE openid = ?', [openid]);
        let user = rows[0];
        if (!user) {
            const [result] = await pool_1.default.execute('INSERT INTO users (openid, nickname, avatar_url, last_login_at) VALUES (?, ?, ?, NOW())', [openid, nickname || '吃货', avatar_url || '']);
            // 新用户自动创建偏好画像
            await pool_1.default.execute('INSERT INTO user_taste_profile (user_id) VALUES (?)', [result.insertId]);
            // 新用户自动从系统菜品池导入全部菜品
            const [sysDishes] = await pool_1.default.execute('SELECT id, category_id, name, emoji, tags FROM system_dishes WHERE is_deleted = 0');
            for (const d of sysDishes) {
                await pool_1.default.execute('INSERT INTO user_dishes (user_id, system_dish_id, category_id, name, emoji, tags) VALUES (?, ?, ?, ?, ?, ?)', [result.insertId, d.id, d.category_id, d.name, d.emoji, d.tags]);
            }
            user = { id: result.insertId, openid, nickname: nickname || '吃货', avatar_url: avatar_url || '' };
        }
        else {
            await pool_1.default.execute('UPDATE users SET nickname = COALESCE(NULLIF(?, ""), nickname), avatar_url = COALESCE(NULLIF(?, ""), avatar_url), last_login_at = NOW() WHERE id = ?', [nickname || '', avatar_url || '', user.id]);
        }
        const token = jsonwebtoken_1.default.sign({ userId: user.id, openid }, config_1.config.jwt.secret, {
            expiresIn: config_1.config.jwt.expiresIn,
        });
        return (0, response_1.success)(res, {
            token,
            user: {
                id: user.id,
                nickname: nickname || user.nickname,
                avatarUrl: avatar_url || user.avatar_url,
            },
        });
    }
    catch (err) {
        console.error('登录失败:', err);
        return (0, response_1.fail)(res, 500, '登录失败');
    }
});
// POST /v1/auth/refresh — 刷新token
router.post('/refresh', async (req, res) => {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
        return (0, response_1.fail)(res, 401, '请先登录');
    }
    try {
        const payload = jsonwebtoken_1.default.verify(header.slice(7), config_1.config.jwt.secret);
        const newToken = jsonwebtoken_1.default.sign({ userId: payload.userId, openid: payload.openid }, config_1.config.jwt.secret, { expiresIn: config_1.config.jwt.expiresIn });
        return (0, response_1.success)(res, { token: newToken });
    }
    catch {
        return (0, response_1.fail)(res, 401, '登录已过期，请重新登录');
    }
});
exports.default = router;
//# sourceMappingURL=auth.controller.js.map