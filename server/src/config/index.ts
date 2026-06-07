import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });

function parseDbUrl(url: string) {
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

export const config = {
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
    provider: (process.env.AI_TEXT_PROVIDER || 'local') as 'claude' | 'openai' | 'deepseek' | 'local',
    cacheHours: parseInt(process.env.AI_TEXT_CACHE_HOURS || '24', 10),
  },

  jwt: {
    secret: process.env.JWT_SECRET || 'dev-secret-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
};
