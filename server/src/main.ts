import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { config } from './config';
import { errorHandler } from './middleware/errorHandler';
import pool from './db/pool';

// 路由
import authRoutes from './modules/auth/auth.controller';
import dishRoutes from './modules/dish/dish.controller';
import spinRoutes from './modules/spin/spin.controller';
import historyRoutes from './modules/history/history.controller';
import prefsRoutes from './modules/prefs/prefs.controller';
import aiRoutes from './modules/ai/ai.controller';
import { authRequired } from './middleware/auth';

const app = express();

app.use(cors());
app.use(express.json());

// 健康检查
app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'eat-spin-wheel' }));

// 数据库诊断
app.get('/health/db', async (_req, res) => {
  const envKeys = Object.keys(process.env).filter(k => k.includes('SQL') || k.includes('DB') || k.includes('PORT')).sort();
  const info = {
    host: config.db.host,
    port: config.db.port,
    user: config.db.user,
    database: config.db.database,
    hasDbUrl: !!process.env.DATABASE_URL,
    detectedEnv: envKeys,
  };
  try {
    const conn = await pool.getConnection();
    const [tables]: any = await conn.query(
      "SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = ?",
      [config.db.database]
    );
    conn.release();
    res.json({ db: 'ok', ...info, tables: tables.map((t: any) => t.TABLE_NAME) });
  } catch (e: any) {
    res.json({ db: 'error', ...info, message: e.message, code: e.code });
  }
});

// 公开路由
app.use('/v1/auth', authRoutes);

// 需要认证的路由
app.use('/v1/food', authRequired, dishRoutes);
app.use('/v1/food/spin', authRequired, spinRoutes);
app.use('/v1/food/history', authRequired, historyRoutes);
app.use('/v1/food/prefs', authRequired, prefsRoutes);
app.use('/v1/food/ai-text', authRequired, aiRoutes);

// 全局错误处理
app.use(errorHandler);

// 生产环境：托管前端静态文件
const clientDist = path.join(__dirname, '../../client/dist');
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
  console.log('  前端静态文件托管:', clientDist);
}

// 自动建表
async function autoMigrate() {
  try {
    // 先测试数据库连接
    console.log('  尝试连接数据库...');
    const testConn = await pool.getConnection();
    console.log('  数据库连接成功');
    testConn.release();

    // 查找 schema.sql
    const schemaPath = path.join(__dirname, 'db/schema.sql');
    const altSchemaPath = path.join(__dirname, '../src/db/schema.sql');
    const finalSchemaPath = fs.existsSync(schemaPath) ? schemaPath : altSchemaPath;
    console.log('  schema路径:', finalSchemaPath, '存在:', fs.existsSync(finalSchemaPath));

    if (fs.existsSync(finalSchemaPath)) {
      const schema = fs.readFileSync(finalSchemaPath, 'utf-8');
      const conn = await pool.getConnection();
      try {
        // 逐条执行，每条单独打印错误
        const statements = schema.split(';').filter(s => s.trim());
        for (const stmt of statements) {
          try {
            await conn.query(stmt);
          } catch (e: any) {
            // 表已存在不算错
            if (!e.message.includes('already exists')) {
              console.warn('  SQL警告:', e.message.slice(0, 80));
            }
          }
        }
        console.log('  数据库表已就绪');
      } finally {
        conn.release();
      }
    } else {
      console.warn('  找不到 schema.sql，跳过建表');
      console.warn('  __dirname:', __dirname);
    }
  } catch (err: any) {
    console.error('  自动建表失败:', err.message);
    console.error('  堆栈:', err.stack);
  }
}

autoMigrate().then(() => {
  app.listen(config.port, () => {
    console.log('');
    console.log(`  🎰 每日吃什么大转盘 服务已启动`);
    console.log(`  端口: ${config.port}`);
    console.log(`  环境: ${config.env}`);
    console.log('');
  });
});

export default app;
