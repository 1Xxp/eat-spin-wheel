import { Request, Response, NextFunction } from 'express';
export interface AuthRequest extends Request {
    userId?: number;
    openid?: string;
}
export declare function authRequired(req: AuthRequest, res: Response, next: NextFunction): Response<any, Record<string, any>> | undefined;
export declare function authOptional(req: AuthRequest, _res: Response, next: NextFunction): void;
