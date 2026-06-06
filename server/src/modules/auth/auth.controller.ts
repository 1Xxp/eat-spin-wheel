import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { v4 as uuid } from 'uuid';
import { config } from '../../config';
import pool from '../../db/pool';
import { success, fail } from '../../shared/response';

const router = Router();

// POST /v1/auth/login — 模拟登录
router.post('/login', async (req: Request, res: Response) => {
  const { code, nickname, avatar_url } = req.body;

  // MVP模式：code直接当openid用
  const openid = code ? `user_${code.slice(0, 32)}` : `guest_${uuid().slice(0, 8)}`;

  try {
    const [rows] = await pool.execute('SELECT * FROM users WHERE openid = ?', [openid]) as any;
    let user = rows[0];

    if (!user) {
      const [result] = await pool.execute(
        'INSERT INTO users (openid, nickname, avatar_url, last_login_at) VALUES (?, ?, ?, NOW())',
        [openid, nickname || '吃货', avatar_url || '']
      ) as any;

      // 新用户自动创建偏好画像
      await pool.execute('INSERT INTO user_taste_profile (user_id) VALUES (?)', [result.insertId]);

      // 新用户自动从系统菜品池导入全部菜品
      const [sysDishes] = await pool.execute('SELECT id, category_id, name, emoji, tags FROM system_dishes WHERE is_deleted = 0') as any;
      for (const d of sysDishes) {
        await pool.execute(
          'INSERT INTO user_dishes (user_id, system_dish_id, category_id, name, emoji, tags) VALUES (?, ?, ?, ?, ?, ?)',
          [result.insertId, d.id, d.category_id, d.name, d.emoji, d.tags]
        );
      }

      user = { id: result.insertId, openid, nickname: nickname || '吃货', avatar_url: avatar_url || '' };
    } else {
      await pool.execute(
        'UPDATE users SET nickname = COALESCE(NULLIF(?, ""), nickname), avatar_url = COALESCE(NULLIF(?, ""), avatar_url), last_login_at = NOW() WHERE id = ?',
        [nickname || '', avatar_url || '', user.id]
      );
    }

    const token = jwt.sign({ userId: user.id, openid }, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn as any,
    });

    return success(res, {
      token,
      user: {
        id: user.id,
        nickname: nickname || user.nickname,
        avatarUrl: avatar_url || user.avatar_url,
      },
    });
  } catch (err) {
    console.error('登录失败:', err);
    return fail(res, 500, '登录失败');
  }
});

// POST /v1/auth/refresh — 刷新token
router.post('/refresh', async (req: Request, res: Response) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return fail(res, 401, '请先登录');
  }
  try {
    const payload = jwt.verify(header.slice(7), config.jwt.secret) as { userId: number; openid: string };
    const newToken = jwt.sign(
      { userId: payload.userId, openid: payload.openid },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn } as any
    );
    return success(res, { token: newToken });
  } catch {
    return fail(res, 401, '登录已过期，请重新登录');
  }
});

export default router;
