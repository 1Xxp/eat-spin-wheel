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
    // 开发和生产都能找到 schema.sql
    const schemaPath = path.join(__dirname, 'db/schema.sql');
    const altSchemaPath = path.join(__dirname, '../src/db/schema.sql');
    const finalSchemaPath = fs.existsSync(schemaPath) ? schemaPath : altSchemaPath;
    if (fs.existsSync(schemaPath)) {
      const schema = fs.readFileSync(finalSchemaPath, 'utf-8');
      const conn = await pool.getConnection();
      try {
        await conn.query(schema);
        console.log('  数据库表已就绪');
      } finally {
        conn.release();
      }
    }
  } catch (err: any) {
    console.warn('  自动建表跳过:', err.message);
  }
}

autoMigrate().then(() => {
  app.listen(config.port, () => {
    console.log('');
    console.log(`  🎰 每日吃什么大转盘 服务已启动`);
    console.log(`  地址: http://localhost:${config.port}`);
    console.log(`  环境: ${config.env}`);
    console.log('');
  });
});

export default app;
