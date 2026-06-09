import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { config } from './config';
import { errorHandler } from './middleware/errorHandler';
import pool from './db/pool';
import OpenAI from 'openai';

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

// AI测试
app.get('/health/ai', async (_req, res) => {
  try {
    if (!config.deepseek.apiKey) return res.json({ ai: 'error', reason: 'DEEPSEEK_API_KEY未设置' });
    const ds = new OpenAI({ apiKey: config.deepseek.apiKey, baseURL: config.deepseek.baseURL });
    const completion = await ds.chat.completions.create({
      model: config.deepseek.model,
      max_tokens: 60,
      messages: [{ role: 'user', content: '说一句中文，不超过20字：今天吃什么？' }],
    });
    res.json({ ai: 'ok', text: completion.choices[0]?.message?.content });
  } catch (e: any) {
    res.json({ ai: 'error', message: e.message, code: e.status });
  }
});

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
    const dishes: [number, string, string, string[]][] = [
      [1,'烤串','🍢',['烧烤','重口']],[1,'小龙虾','🦞',['辣','重口','社交']],[1,'泡面','🍜',['快手','碳水']],[1,'炸鸡','🍗',['油炸','高热量']],[1,'螺蛳粉','🍲',['辣','重口']],[1,'关东煮','🍢',['清淡','日式']],[1,'炒粉','🍝',['快手','碳水','重口']],[1,'煎饺','🥟',['快手','碳水']],[1,'手抓饼','🫓',['快手','碳水']],[1,'烤冷面','🫓',['快手','碳水']],
      [2,'鸡胸肉沙拉','🥗',['高蛋白','低卡']],[2,'水煮西兰花','🥦',['低卡','素食']],[2,'藜麦碗','🥣',['高蛋白','素食']],[2,'三文鱼沙拉','🐟',['高蛋白','日式']],[2,'酸奶水果杯','🍓',['甜','冷食']],[2,'荞麦冷面','🍝',['低卡','快手']],[2,'蒸蛋羹','🥚',['低卡','高蛋白']],[2,'凉拌黄瓜','🥒',['低卡','素食','冷食']],[2,'虾仁蔬菜卷','🦐',['低卡','高蛋白']],[2,'豆腐沙拉','🫘',['低卡','素食','冷食']],
      [3,'牛排','🥩',['西餐','高蛋白']],[3,'寿司拼盘','🍣',['日式','精致']],[3,'意大利面','🍝',['西餐','碳水']],[3,'火锅','🫕',['社交','重口']],[3,'披萨','🍕',['西餐','碳水']],[3,'烤鱼','🐠',['辣','社交']],[3,'芝士焗饭','🧀',['西餐','精致']],[3,'冬阴功汤','🍲',['泰式','辣']],[3,'法式可丽饼','🥞',['甜','精致','西餐']],[3,'烤羊排','🍖',['西餐','高蛋白']],
      [4,'蛋炒饭','🍳',['快手','碳水']],[4,'黄焖鸡米饭','🐔',['暖胃','中式']],[4,'兰州拉面','🍜',['碳水','快手']],[4,'麻辣烫','🍲',['辣','暖胃']],[4,'煲仔饭','🍚',['广式','碳水']],[4,'沙县小吃','🥟',['快手','平价']],[4,'桂林米粉','🍜',['快手','碳水']],[4,'热干面','🍝',['快手','碳水']],[4,'煎饼果子','🌯',['快手','碳水']],[4,'肉夹馍','🥙',['快手','碳水']],
      [5,'便当','🍱',['快手','均衡']],[5,'三明治','🥪',['快手','冷食']],[5,'盖浇饭','🍛',['快手','碳水']],[5,'冒菜','🥘',['辣','暖胃']],[5,'米线','🍜',['快手','暖胃']],[5,'叉烧饭','🥓',['广式','高蛋白']],[5,'卤肉饭','🍛',['碳水','快手']],[5,'炒面','🍝',['快手','碳水']],[5,'照烧鸡腿饭','🍗',['日式','高蛋白']],[5,'酸辣粉','🍜',['辣','快手']],
      [6,'烤肉','🥩',['烧烤','社交','重口']],[6,'早午餐','🥞',['西餐','精致']],[6,'椰子鸡','🥥',['清淡','暖胃']],[6,'羊蝎子','🐑',['辣','暖胃']],[6,'海鲜大餐','🦀',['高蛋白','精致']],[6,'部队锅','🪖',['韩式','辣','社交']],[6,'红烧肉','🥘',['中式','重口']],[6,'酸菜鱼','🐟',['辣','暖胃']],[6,'大闸蟹','🦀',['精致','高蛋白']],[6,'佛跳墙','🍲',['精致','中式']],
    ];
    const conn = await pool.getConnection();
    try {
      for (const c of cats) {
        await conn.query('INSERT IGNORE INTO dish_categories (name, icon, sort_order, is_system) VALUES (?, ?, ?, 1)', [c.name, c.icon, c.sort]);
      }
      for (const d of dishes) {
        await conn.query('INSERT IGNORE INTO system_dishes (category_id, name, emoji, tags) VALUES (?, ?, ?, ?)', [d[0], d[1], d[2], JSON.stringify(d[3])]);
      }
      conn.release();
      res.json({ seed: 'ok', categories: cats.length, dishes: dishes.length });
    } catch (e: any) {
      conn.release();
      res.json({ seed: 'error', message: e.message });
    }
  } catch (e: any) {
    res.json({ seed: 'error', message: e.message });
  }
});

// 数据库诊断
app.get('/health/db', async (_req, res) => {
  const allEnv = Object.keys(process.env).sort();
  const info = {
    host: config.db.host,
    port: config.db.port,
    user: config.db.user,
    database: config.db.database,
    dbUrl: (process.env.DATABASE_URL || '').slice(0, 50),
    allEnv: allEnv,
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
const clientDist = path.join(__dirname, '../public');
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
