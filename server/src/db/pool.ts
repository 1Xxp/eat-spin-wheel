import mysql from 'mysql2/promise';
import { config } from '../config';

const pool = mysql.createPool({
  host: config.db.host,
  port: config.db.port,
  user: config.db.user,
  password: config.db.password,
  database: config.db.database,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: 'utf8mb4',
  multipleStatements: true,
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : undefined,
  connectTimeout: 10000,
});

export default pool;
