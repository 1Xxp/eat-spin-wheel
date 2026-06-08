"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../../middleware/auth");
const response_1 = require("../../shared/response");
const dish_service_1 = require("./dish.service");
const router = (0, express_1.Router)();
router.use(auth_1.authRequired);
// GET /v1/food/categories — 分类列表
router.get('/categories', async (req, res) => {
    try {
        const [rows] = await (await Promise.resolve().then(() => __importStar(require('../../db/pool')))).default.execute(`SELECT id, user_id, name, icon, sort_order, is_system
       FROM dish_categories
       WHERE (user_id = ? OR is_system = 1) AND is_deleted = 0
       ORDER BY sort_order ASC`, [req.userId]);
        return (0, response_1.success)(res, rows);
    }
    catch (err) {
        console.error(err);
        return (0, response_1.fail)(res, 500, '获取分类失败');
    }
});
// POST /v1/food/categories — 创建自定义分类
router.post('/categories', async (req, res) => {
    try {
        const { name, icon } = req.body;
        if (!name || !name.trim())
            return (0, response_1.fail)(res, 400, '分类名称不能为空');
        const trimmedName = name.trim().slice(0, 10);
        // 查一下当前用户已有分类数，防止滥用
        const [countRows] = await (await Promise.resolve().then(() => __importStar(require('../../db/pool')))).default.execute('SELECT COUNT(*) AS cnt FROM dish_categories WHERE user_id = ? AND is_deleted = 0', [req.userId]);
        if (countRows[0].cnt >= 10)
            return (0, response_1.fail)(res, 400, '自定义分类最多10个');
        // 获取当前用户自定义分类的最大sort_order
        const [maxRows] = await (await Promise.resolve().then(() => __importStar(require('../../db/pool')))).default.execute('SELECT MAX(sort_order) AS mx FROM dish_categories WHERE user_id = ? AND is_deleted = 0', [req.userId]);
        const sortOrder = (maxRows[0].mx || 0) + 1;
        const [result] = await (await Promise.resolve().then(() => __importStar(require('../../db/pool')))).default.execute('INSERT INTO dish_categories (user_id, name, icon, sort_order, is_system) VALUES (?, ?, ?, ?, 0)', [req.userId, trimmedName, icon || '📌', sortOrder]);
        return (0, response_1.success)(res, { id: result.insertId, user_id: req.userId, name: trimmedName, icon: icon || '📌', sort_order: sortOrder, is_system: 0 }, '分类已创建');
    }
    catch (err) {
        console.error(err);
        return (0, response_1.fail)(res, 500, '创建分类失败');
    }
});
// PUT /v1/food/categories/:id — 修改自定义分类
router.put('/categories/:id', async (req, res) => {
    try {
        const { name, icon } = req.body;
        const id = Number(req.params.id);
        // 确保是用户自己的分类且非系统分类
        const [rows] = await (await Promise.resolve().then(() => __importStar(require('../../db/pool')))).default.execute('SELECT id FROM dish_categories WHERE id = ? AND user_id = ? AND is_system = 0 AND is_deleted = 0', [id, req.userId]);
        if (rows.length === 0)
            return (0, response_1.fail)(res, 403, '只能修改自己创建的分类');
        const updates = [];
        const params = [];
        if (name && name.trim()) {
            updates.push('name = ?');
            params.push(name.trim().slice(0, 10));
        }
        if (icon) {
            updates.push('icon = ?');
            params.push(icon);
        }
        if (updates.length === 0)
            return (0, response_1.fail)(res, 400, '无修改内容');
        params.push(id, req.userId);
        await (await Promise.resolve().then(() => __importStar(require('../../db/pool')))).default.execute(`UPDATE dish_categories SET ${updates.join(', ')} WHERE id = ? AND user_id = ?`, params);
        return (0, response_1.success)(res, null, '分类已更新');
    }
    catch (err) {
        console.error(err);
        return (0, response_1.fail)(res, 500, '更新分类失败');
    }
});
// DELETE /v1/food/categories/:id — 删除自定义分类
router.delete('/categories/:id', async (req, res) => {
    try {
        const id = Number(req.params.id);
        // 确保是用户自己的分类
        const [rows] = await (await Promise.resolve().then(() => __importStar(require('../../db/pool')))).default.execute('SELECT id FROM dish_categories WHERE id = ? AND user_id = ? AND is_system = 0 AND is_deleted = 0', [id, req.userId]);
        if (rows.length === 0)
            return (0, response_1.fail)(res, 403, '只能删除自己创建的分类');
        // 检查分类下是否有菜品
        const [dishRows] = await (await Promise.resolve().then(() => __importStar(require('../../db/pool')))).default.execute('SELECT COUNT(*) AS cnt FROM user_dishes WHERE category_id = ? AND user_id = ? AND is_deleted = 0', [id, req.userId]);
        if (dishRows[0].cnt > 0)
            return (0, response_1.fail)(res, 400, '该分类下还有菜品，请先移动或删除菜品');
        // 软删除
        await (await Promise.resolve().then(() => __importStar(require('../../db/pool')))).default.execute('UPDATE dish_categories SET is_deleted = 1 WHERE id = ? AND user_id = ?', [id, req.userId]);
        return (0, response_1.success)(res, null, '分类已删除');
    }
    catch (err) {
        console.error(err);
        return (0, response_1.fail)(res, 500, '删除分类失败');
    }
});
// GET /v1/food/dishes — 菜品列表
router.get('/dishes', async (req, res) => {
    try {
        const categoryId = req.query.category_id ? Number(req.query.category_id) : undefined;
        const list = await dish_service_1.dishService.list(req.userId, categoryId);
        return (0, response_1.success)(res, list);
    }
    catch (err) {
        console.error(err);
        return (0, response_1.fail)(res, 500, '获取菜品列表失败');
    }
});
// GET /v1/food/dishes/:id — 菜品详情
router.get('/dishes/:id', async (req, res) => {
    try {
        const [rows] = await (await Promise.resolve().then(() => __importStar(require('../../db/pool')))).default.execute(`SELECT ud.*, dc.name AS category_name FROM user_dishes ud
       JOIN dish_categories dc ON dc.id = ud.category_id
       WHERE ud.id = ? AND ud.user_id = ? AND ud.is_deleted = 0`, [req.params.id, req.userId]);
        if (rows.length === 0)
            return (0, response_1.fail)(res, 404, '菜品不存在');
        return (0, response_1.success)(res, rows[0]);
    }
    catch (err) {
        console.error(err);
        return (0, response_1.fail)(res, 500, '获取菜品详情失败');
    }
});
// POST /v1/food/dishes — 添加自定义菜品
router.post('/dishes', async (req, res) => {
    try {
        const { name, category_id, emoji } = req.body;
        if (!name || !category_id)
            return (0, response_1.fail)(res, 400, '菜品名称和分类不能为空');
        const dish = await dish_service_1.dishService.create(req.userId, { name, category_id, emoji });
        return (0, response_1.success)(res, dish, '添加成功');
    }
    catch (err) {
        console.error(err);
        return (0, response_1.fail)(res, 500, '添加菜品失败');
    }
});
// PUT /v1/food/dishes/:id — 更新菜品
router.put('/dishes/:id', async (req, res) => {
    try {
        const { name, category_id, emoji, is_enabled } = req.body;
        await dish_service_1.dishService.update(req.userId, Number(req.params.id), { name, category_id, emoji, is_enabled });
        return (0, response_1.success)(res, null, '更新成功');
    }
    catch (err) {
        console.error(err);
        return (0, response_1.fail)(res, 500, '更新菜品失败');
    }
});
// DELETE /v1/food/dishes/:id — 删除菜品
router.delete('/dishes/:id', async (req, res) => {
    try {
        await dish_service_1.dishService.remove(req.userId, Number(req.params.id));
        return (0, response_1.success)(res, null, '删除成功');
    }
    catch (err) {
        console.error(err);
        return (0, response_1.fail)(res, 500, '删除菜品失败');
    }
});
// POST /v1/food/dishes/import-system — 从系统库导入菜品
router.post('/dishes/import-system', async (req, res) => {
    try {
        const { system_dish_id } = req.body;
        if (!system_dish_id)
            return (0, response_1.fail)(res, 400, 'system_dish_id 不能为空');
        const dish = await dish_service_1.dishService.importSystem(req.userId, system_dish_id);
        return (0, response_1.success)(res, dish, '导入成功');
    }
    catch (err) {
        return (0, response_1.fail)(res, 400, err.message || '导入失败');
    }
});
// GET /v1/food/system-dishes — 查看系统菜品库（按分类）
router.get('/system-dishes', async (req, res) => {
    try {
        const categoryId = req.query.category_id ? Number(req.query.category_id) : undefined;
        let sql = `
      SELECT sd.*, dc.name AS category_name, dc.icon AS category_icon
      FROM system_dishes sd
      JOIN dish_categories dc ON dc.id = sd.category_id
      WHERE sd.is_deleted = 0
    `;
        const params = [];
        if (categoryId) {
            sql += ' AND sd.category_id = ?';
            params.push(categoryId);
        }
        sql += ' ORDER BY dc.sort_order, sd.id';
        const [rows] = await (await Promise.resolve().then(() => __importStar(require('../../db/pool')))).default.execute(sql, params);
        return (0, response_1.success)(res, rows);
    }
    catch (err) {
        console.error(err);
        return (0, response_1.fail)(res, 500, '获取系统菜品失败');
    }
});
exports.default = router;
//# sourceMappingURL=dish.controller.js.map