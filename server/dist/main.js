"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const config_1 = require("./config");
const errorHandler_1 = require("./middleware/errorHandler");
const pool_1 = __importDefault(require("./db/pool"));
// 路由
const auth_controller_1 = __importDefault(require("./modules/auth/auth.controller"));
const dish_controller_1 = __importDefault(require("./modules/dish/dish.controller"));
const spin_controller_1 = __importDefault(require("./modules/spin/spin.controller"));
const history_controller_1 = __importDefault(require("./modules/history/history.controller"));
const prefs_controller_1 = __importDefault(require("./modules/prefs/prefs.controller"));
const ai_controller_1 = __importDefault(require("./modules/ai/ai.controller"));
const auth_1 = require("./middleware/auth");
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// 健康检查
app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'eat-spin-wheel' }));
// 种子数据
app.post('/health/seed', async (_req, res) => {
    try {
        const cats = [
            { name: '夜宵', icon: '🌙', sort: 1 },
            { name: '减脂', icon: '🥗', sort: 2 },
            { name: '情侣', icon: '💕', sort: 3 },
            { name: '一人食', icon: '🍱', sort: 4 },
            { name: '工作日', icon: '💼', sort: 5 },
            { name: '周末', icon: '🎉', sort: 6 },
        ];
        const dishes = [
            [1, '烤串', '🍢', ['烧烤', '重口']], [1, '小龙虾', '🦞', ['辣', '重口', '社交']], [1, '泡面', '🍜', ['快手', '碳水']], [1, '炸鸡', '🍗', ['油炸', '高热量']], [1, '螺蛳粉', '🍲', ['辣', '重口']], [1, '关东煮', '🍢', ['清淡', '日式']],
            [2, '鸡胸肉沙拉', '🥗', ['高蛋白', '低卡']], [2, '水煮西兰花', '🥦', ['低卡', '素食']], [2, '藜麦碗', '🥣', ['高蛋白', '素食']], [2, '三文鱼沙拉', '🐟', ['高蛋白', '日式']], [2, '酸奶水果杯', '🍓', ['甜', '冷食']], [2, '荞麦冷面', '🍝', ['低卡', '快手']],
            [3, '牛排', '🥩', ['西餐', '高蛋白']], [3, '寿司拼盘', '🍣', ['日式', '精致']], [3, '意大利面', '🍝', ['西餐', '碳水']], [3, '火锅', '🫕', ['社交', '重口']], [3, '披萨', '🍕', ['西餐', '碳水']], [3, '烤鱼', '🐠', ['辣', '社交']],
            [4, '蛋炒饭', '🍳', ['快手', '碳水']], [4, '黄焖鸡米饭', '🐔', ['暖胃', '中式']], [4, '兰州拉面', '🍜', ['碳水', '快手']], [4, '麻辣烫', '🍲', ['辣', '暖胃']], [4, '煲仔饭', '🍚', ['广式', '碳水']], [4, '沙县小吃', '🥟', ['快手', '平价']],
            [5, '便当', '🍱', ['快手', '均衡']], [5, '三明治', '🥪', ['快手', '冷食']], [5, '盖浇饭', '🍛', ['快手', '碳水']], [5, '冒菜', '🥘', ['辣', '暖胃']], [5, '米线', '🍜', ['快手', '暖胃']], [5, '叉烧饭', '🥓', ['广式', '高蛋白']],
            [6, '烤肉', '🥩', ['烧烤', '社交', '重口']], [6, '早午餐', '🥞', ['西餐', '精致']], [6, '椰子鸡', '🥥', ['清淡', '暖胃']], [6, '羊蝎子', '🐑', ['辣', '暖胃']], [6, '海鲜大餐', '🦀', ['高蛋白', '精致']], [6, '部队锅', '🪖', ['韩式', '辣', '社交']],
        ];
        const conn = await pool_1.default.getConnection();
        try {
            for (const c of cats) {
                await conn.query('INSERT IGNORE INTO dish_categories (name, icon, sort_order, is_system) VALUES (?, ?, ?, 1)', [c.name, c.icon, c.sort]);
            }
            for (const d of dishes) {
                await conn.query('INSERT IGNORE INTO system_dishes (category_id, name, emoji, tags) VALUES (?, ?, ?, ?)', [d[0], d[1], d[2], JSON.stringify(d[3])]);
            }
            conn.release();
            res.json({ seed: 'ok', categories: cats.length, dishes: dishes.length });
        }
        catch (e) {
            conn.release();
            res.json({ seed: 'error', message: e.message });
        }
    }
    catch (e) {
        res.json({ seed: 'error', message: e.message });
    }
});
// 数据库诊断
app.get('/health/db', async (_req, res) => {
    const allEnv = Object.keys(process.env).sort();
    const info = {
        host: config_1.config.db.host,
        port: config_1.config.db.port,
        user: config_1.config.db.user,
        database: config_1.config.db.database,
        dbUrl: (process.env.DATABASE_URL || '').slice(0, 50),
        allEnv: allEnv,
    };
    try {
        const conn = await pool_1.default.getConnection();
        const [tables] = await conn.query("SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = ?", [config_1.config.db.database]);
        conn.release();
        res.json({ db: 'ok', ...info, tables: tables.map((t) => t.TABLE_NAME) });
    }
    catch (e) {
        res.json({ db: 'error', ...info, message: e.message, code: e.code });
    }
});
// 公开路由
app.use('/v1/auth', auth_controller_1.default);
// 需要认证的路由
app.use('/v1/food', auth_1.authRequired, dish_controller_1.default);
app.use('/v1/food/spin', auth_1.authRequired, spin_controller_1.default);
app.use('/v1/food/history', auth_1.authRequired, history_controller_1.default);
app.use('/v1/food/prefs', auth_1.authRequired, prefs_controller_1.default);
app.use('/v1/food/ai-text', auth_1.authRequired, ai_controller_1.default);
// 全局错误处理
app.use(errorHandler_1.errorHandler);
// 生产环境：托管前端静态文件
const clientDist = path_1.default.join(__dirname, '../public');
if (fs_1.default.existsSync(clientDist)) {
    app.use(express_1.default.static(clientDist));
    app.get('*', (_req, res) => {
        res.sendFile(path_1.default.join(clientDist, 'index.html'));
    });
    console.log('  前端静态文件托管:', clientDist);
}
// 自动建表
async function autoMigrate() {
    try {
        // 先测试数据库连接
        console.log('  尝试连接数据库...');
        const testConn = await pool_1.default.getConnection();
        console.log('  数据库连接成功');
        testConn.release();
        // 查找 schema.sql
        const schemaPath = path_1.default.join(__dirname, 'db/schema.sql');
        const altSchemaPath = path_1.default.join(__dirname, '../src/db/schema.sql');
        const finalSchemaPath = fs_1.default.existsSync(schemaPath) ? schemaPath : altSchemaPath;
        console.log('  schema路径:', finalSchemaPath, '存在:', fs_1.default.existsSync(finalSchemaPath));
        if (fs_1.default.existsSync(finalSchemaPath)) {
            const schema = fs_1.default.readFileSync(finalSchemaPath, 'utf-8');
            const conn = await pool_1.default.getConnection();
            try {
                // 逐条执行，每条单独打印错误
                const statements = schema.split(';').filter(s => s.trim());
                for (const stmt of statements) {
                    try {
                        await conn.query(stmt);
                    }
                    catch (e) {
                        // 表已存在不算错
                        if (!e.message.includes('already exists')) {
                            console.warn('  SQL警告:', e.message.slice(0, 80));
                        }
                    }
                }
                console.log('  数据库表已就绪');
            }
            finally {
                conn.release();
            }
        }
        else {
            console.warn('  找不到 schema.sql，跳过建表');
            console.warn('  __dirname:', __dirname);
        }
    }
    catch (err) {
        console.error('  自动建表失败:', err.message);
        console.error('  堆栈:', err.stack);
    }
}
autoMigrate().then(() => {
    app.listen(config_1.config.port, () => {
        console.log('');
        console.log(`  🎰 每日吃什么大转盘 服务已启动`);
        console.log(`  端口: ${config_1.config.port}`);
        console.log(`  环境: ${config_1.config.env}`);
        console.log('');
    });
});
exports.default = app;
//# sourceMappingURL=main.js.map