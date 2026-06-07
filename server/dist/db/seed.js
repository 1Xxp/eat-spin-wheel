"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const pool_1 = __importDefault(require("./pool"));
const CATEGORIES = [
    { name: '夜宵', icon: '🌙', sort_order: 1 },
    { name: '减脂', icon: '🥗', sort_order: 2 },
    { name: '情侣', icon: '💕', sort_order: 3 },
    { name: '一人食', icon: '🍱', sort_order: 4 },
    { name: '工作日', icon: '💼', sort_order: 5 },
    { name: '周末', icon: '🎉', sort_order: 6 },
];
const SYSTEM_DISHES = [
    // 夜宵
    { category: '夜宵', name: '烤串', emoji: '🍢', tags: ['烧烤', '重口'], calories: 550, cook_time: 20, difficulty: 1 },
    { category: '夜宵', name: '小龙虾', emoji: '🦞', tags: ['辣', '重口', '社交'], calories: 400, cook_time: 15, difficulty: 1 },
    { category: '夜宵', name: '泡面', emoji: '🍜', tags: ['快手', '碳水'], calories: 450, cook_time: 5, difficulty: 1 },
    { category: '夜宵', name: '炸鸡', emoji: '🍗', tags: ['油炸', '高热量'], calories: 600, cook_time: 25, difficulty: 2 },
    { category: '夜宵', name: '螺蛳粉', emoji: '🍲', tags: ['辣', '重口'], calories: 500, cook_time: 15, difficulty: 1 },
    { category: '夜宵', name: '关东煮', emoji: '🍢', tags: ['清淡', '日式'], calories: 200, cook_time: 10, difficulty: 1 },
    // 减脂
    { category: '减脂', name: '鸡胸肉沙拉', emoji: '🥗', tags: ['高蛋白', '低卡'], calories: 250, cook_time: 15, difficulty: 1 },
    { category: '减脂', name: '水煮西兰花', emoji: '🥦', tags: ['低卡', '素食'], calories: 80, cook_time: 10, difficulty: 1 },
    { category: '减脂', name: '藜麦碗', emoji: '🥣', tags: ['高蛋白', '素食'], calories: 350, cook_time: 20, difficulty: 2 },
    { category: '减脂', name: '三文鱼沙拉', emoji: '🐟', tags: ['高蛋白', '日式'], calories: 300, cook_time: 15, difficulty: 2 },
    { category: '减脂', name: '酸奶水果杯', emoji: '🍓', tags: ['甜', '冷食'], calories: 200, cook_time: 5, difficulty: 1 },
    { category: '减脂', name: '荞麦冷面', emoji: '🍝', tags: ['低卡', '快手'], calories: 280, cook_time: 12, difficulty: 1 },
    // 情侣
    { category: '情侣', name: '牛排', emoji: '🥩', tags: ['西餐', '高蛋白'], calories: 500, cook_time: 25, difficulty: 3 },
    { category: '情侣', name: '寿司拼盘', emoji: '🍣', tags: ['日式', '精致'], calories: 400, cook_time: 20, difficulty: 2 },
    { category: '情侣', name: '意大利面', emoji: '🍝', tags: ['西餐', '碳水'], calories: 450, cook_time: 20, difficulty: 2 },
    { category: '情侣', name: '火锅', emoji: '🫕', tags: ['社交', '重口'], calories: 700, cook_time: 30, difficulty: 1 },
    { category: '情侣', name: '披萨', emoji: '🍕', tags: ['西餐', '碳水'], calories: 600, cook_time: 25, difficulty: 2 },
    { category: '情侣', name: '烤鱼', emoji: '🐠', tags: ['辣', '社交'], calories: 450, cook_time: 30, difficulty: 2 },
    // 一人食
    { category: '一人食', name: '蛋炒饭', emoji: '🍳', tags: ['快手', '碳水'], calories: 400, cook_time: 10, difficulty: 1 },
    { category: '一人食', name: '黄焖鸡米饭', emoji: '🐔', tags: ['暖胃', '中式'], calories: 500, cook_time: 20, difficulty: 1 },
    { category: '一人食', name: '兰州拉面', emoji: '🍜', tags: ['碳水', '快手'], calories: 450, cook_time: 15, difficulty: 1 },
    { category: '一人食', name: '麻辣烫', emoji: '🍲', tags: ['辣', '暖胃'], calories: 400, cook_time: 10, difficulty: 1 },
    { category: '一人食', name: '煲仔饭', emoji: '🍚', tags: ['广式', '碳水'], calories: 550, cook_time: 25, difficulty: 2 },
    { category: '一人食', name: '沙县小吃', emoji: '🥟', tags: ['快手', '平价'], calories: 350, cook_time: 10, difficulty: 1 },
    // 工作日
    { category: '工作日', name: '便当', emoji: '🍱', tags: ['快手', '均衡'], calories: 450, cook_time: 15, difficulty: 1 },
    { category: '工作日', name: '三明治', emoji: '🥪', tags: ['快手', '冷食'], calories: 350, cook_time: 5, difficulty: 1 },
    { category: '工作日', name: '盖浇饭', emoji: '🍛', tags: ['快手', '碳水'], calories: 500, cook_time: 15, difficulty: 1 },
    { category: '工作日', name: '冒菜', emoji: '🥘', tags: ['辣', '暖胃'], calories: 450, cook_time: 15, difficulty: 1 },
    { category: '工作日', name: '米线', emoji: '🍜', tags: ['快手', '暖胃'], calories: 400, cook_time: 10, difficulty: 1 },
    { category: '工作日', name: '叉烧饭', emoji: '🥓', tags: ['广式', '高蛋白'], calories: 500, cook_time: 15, difficulty: 1 },
    // 周末
    { category: '周末', name: '烤肉', emoji: '🥩', tags: ['烧烤', '社交', '重口'], calories: 650, cook_time: 40, difficulty: 2 },
    { category: '周末', name: '早午餐', emoji: '🥞', tags: ['西餐', '精致'], calories: 500, cook_time: 25, difficulty: 2 },
    { category: '周末', name: '椰子鸡', emoji: '🥥', tags: ['清淡', '暖胃'], calories: 400, cook_time: 35, difficulty: 2 },
    { category: '周末', name: '羊蝎子', emoji: '🐑', tags: ['辣', '暖胃'], calories: 600, cook_time: 45, difficulty: 2 },
    { category: '周末', name: '海鲜大餐', emoji: '🦀', tags: ['高蛋白', '精致'], calories: 500, cook_time: 40, difficulty: 3 },
    { category: '周末', name: '部队锅', emoji: '🪖', tags: ['韩式', '辣', '社交'], calories: 650, cook_time: 30, difficulty: 1 },
];
async function seed() {
    const conn = await pool_1.default.getConnection();
    try {
        // 插入分类
        const catMap = new Map();
        for (const cat of CATEGORIES) {
            const [rows] = await conn.execute('SELECT id FROM dish_categories WHERE name = ? AND is_system = 1', [cat.name]);
            if (rows.length === 0) {
                const [r] = await conn.execute('INSERT INTO dish_categories (name, icon, sort_order, is_system) VALUES (?, ?, ?, 1)', [cat.name, cat.icon, cat.sort_order]);
                catMap.set(cat.name, r.insertId);
                console.log(`  + 分类: ${cat.name}`);
            }
            else {
                catMap.set(cat.name, rows[0].id);
            }
        }
        // 插入系统菜品
        for (const dish of SYSTEM_DISHES) {
            const catId = catMap.get(dish.category);
            if (!catId)
                continue;
            const [rows] = await conn.execute('SELECT id FROM system_dishes WHERE name = ? AND category_id = ?', [dish.name, catId]);
            if (rows.length === 0) {
                await conn.execute('INSERT INTO system_dishes (category_id, name, emoji, tags, calories, cook_time, difficulty) VALUES (?, ?, ?, ?, ?, ?, ?)', [catId, dish.name, dish.emoji, JSON.stringify(dish.tags), dish.calories, dish.cook_time, dish.difficulty]);
                console.log(`  + 菜品: ${dish.emoji} ${dish.name}`);
            }
        }
        console.log('种子数据填充完成');
    }
    finally {
        conn.release();
        await pool_1.default.end();
    }
}
seed().catch((err) => {
    console.error('种子数据填充失败:', err);
    process.exit(1);
});
//# sourceMappingURL=seed.js.map