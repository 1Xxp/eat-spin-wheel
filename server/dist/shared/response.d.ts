import { Response } from 'express';
export declare function success(res: Response, data?: any, message?: string): Response<any, Record<string, any>>;
export declare function fail(res: Response, code: number, message: string): Response<any, Record<string, any>>;
