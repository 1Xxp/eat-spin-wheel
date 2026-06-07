"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.success = success;
exports.fail = fail;
function success(res, data = null, message = 'ok') {
    return res.json({ code: 0, message, data });
}
function fail(res, code, message) {
    return res.status(code >= 1000 ? 400 : code).json({ code, message, data: null });
}
//# sourceMappingURL=response.js.map