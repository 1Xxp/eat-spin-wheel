"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = errorHandler;
function errorHandler(err, _req, res, _next) {
    console.error('[Error]', err.message);
    res.status(500).json({ code: 500, message: '服务器内部错误', data: null });
}
//# sourceMappingURL=errorHandler.js.map