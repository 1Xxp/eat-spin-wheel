"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRequired = authRequired;
exports.authOptional = authOptional;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const config_1 = require("../config");
function authRequired(req, res, next) {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
        return res.status(401).json({ code: 401, message: '请先登录', data: null });
    }
    try {
        const payload = jsonwebtoken_1.default.verify(header.slice(7), config_1.config.jwt.secret);
        req.userId = payload.userId;
        req.openid = payload.openid;
        next();
    }
    catch {
        return res.status(401).json({ code: 401, message: '登录已过期，请重新登录', data: null });
    }
}
// 可选认证：有token就解析，没有也放行
function authOptional(req, _res, next) {
    const header = req.headers.authorization;
    if (header && header.startsWith('Bearer ')) {
        try {
            const payload = jsonwebtoken_1.default.verify(header.slice(7), config_1.config.jwt.secret);
            req.userId = payload.userId;
            req.openid = payload.openid;
        }
        catch { /* token无效也放行 */ }
    }
    next();
}
//# sourceMappingURL=auth.js.map