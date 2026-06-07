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