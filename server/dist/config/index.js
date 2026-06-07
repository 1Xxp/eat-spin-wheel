"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
dotenv_1.default.config({ path: path_1.default.join(__dirname, '../../.env') });
function parseDbUrl(url) {
    // mysql://user:pass@host:port/database
    const u = new URL(url);
    return {
        host: u.hostname,
        port: parseInt(u.port || '3306', 10),
        user: u.username,
        password: u.password,
        database: u.pathname.replace('/', ''),
    };
}
const rawDb = process.env.DATABASE_URL
    ? parseDbUrl(process.env.DATABASE_URL)
    : process.env.MYSQLHOST || process.env.MYSQL_HOST
        ? {
            host: process.env.MYSQLHOST || process.env.MYSQL_HOST || 'localhost',
            port: parseInt(process.env.MYSQLPORT || process.env.MYSQL_PORT || '3306', 10),
            user: process.env.MYSQLUSER || process.env.MYSQL_USER || 'root',
            password: process.env.MYSQLPASSWORD || process.env.MYSQL_PASSWORD || process.env.MYSQL_ROOT_PASSWORD || '',
            database: process.env.MYSQLDATABASE || process.env.MYSQL_DATABASE || 'railway',
        }
        : {
            host: process.env.DB_HOST || 'localhost',
            port: parseInt(process.env.DB_PORT || '3306', 10),
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'eat_spin_wheel',
        };
exports.config = {
    port: parseInt(process.env.PORT || '3001', 10),
    env: process.env.NODE_ENV || 'development',
    db: rawDb,
    claude: {
        apiKey: process.env.CLAUDE_API_KEY || '',
        model: process.env.CLAUDE_MODEL || 'claude-sonnet-4-20250514',
    },
    openai: {
        apiKey: process.env.OPENAI_API_KEY || '',
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    },
    deepseek: {
        apiKey: process.env.DEEPSEEK_API_KEY || '',
        model: process.env.DEEPSEEK_MODEL || 'deepseek-chat',
        baseURL: 'https://api.deepseek.com/v1',
    },
    aiText: {
        provider: (process.env.AI_TEXT_PROVIDER || 'local'),
        cacheHours: parseInt(process.env.AI_TEXT_CACHE_HOURS || '24', 10),
    },
    jwt: {
        secret: process.env.JWT_SECRET || 'dev-secret-change-in-production',
        expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    },
};
//# sourceMappingURL=index.js.map