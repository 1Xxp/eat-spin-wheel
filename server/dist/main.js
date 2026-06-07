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
const clientDist = path_1.default.join(__dirname, '../../client/dist');
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