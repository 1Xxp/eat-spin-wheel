import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';

export interface AuthRequest extends Request {
  userId?: number;
  openid?: string;
}

export function authRequired(req: AuthRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ code: 401, message: '请先登录', data: null });
  }

  try {
    const payload = jwt.verify(header.slice(7), config.jwt.secret) as { userId: number; openid: string };
    req.userId = payload.userId;
    req.openid = payload.openid;
    next();
  } catch {
    return res.status(401).json({ code: 401, message: '登录已过期，请重新登录', data: null });
  }
}

// 可选认证：有token就解析，没有也放行
export function authOptional(req: AuthRequest, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (header && header.startsWith('Bearer ')) {
    try {
      const payload = jwt.verify(header.slice(7), config.jwt.secret) as { userId: number; openid: string };
      req.userId = payload.userId;
      req.openid = payload.openid;
    } catch { /* token无效也放行 */ }
  }
  next();
}
