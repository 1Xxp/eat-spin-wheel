"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const promise_1 = __importDefault(require("mysql2/promise"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const config_1 = require("../config");
async function migrate() {
    const connection = await promise_1.default.createConnection({
        host: config_1.config.db.host,
        port: config_1.config.db.port,
        user: config_1.config.db.user,
        password: config_1.config.db.password,
        multipleStatements: true,
    });
    try {
        await connection.query(`CREATE DATABASE IF NOT EXISTS \`${config_1.config.db.database}\` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
        await connection.query(`USE \`${config_1.config.db.database}\``);
        const schema = fs_1.default.readFileSync(path_1.default.join(__dirname, 'schema.sql'), 'utf-8');
        await connection.query(schema);
        console.log('数据库迁移完成');
    }
    finally {
        await connection.end();
    }
}
migrate().catch((err) => {
    console.error('数据库迁移失败:', err);
    process.exit(1);
});
//# sourceMappingURL=migrate.js.map