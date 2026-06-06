import { Response } from 'express';

export function success(res: Response, data: any = null, message = 'ok') {
  return res.json({ code: 0, message, data });
}

export function fail(res: Response, code: number, message: string) {
  return res.status(code >= 1000 ? 400 : code).json({ code, message, data: null });
}
