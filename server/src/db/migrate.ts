import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import { config } from '../config';

async function migrate() {
  const connection = await mysql.createConnection({
    host: config.db.host,
    port: config.db.port,
    user: config.db.user,
    password: config.db.password,
    multipleStatements: true,
  });

  try {
    await connection.query(
      `CREATE DATABASE IF NOT EXISTS \`${config.db.database}\` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
    );
    await connection.query(`USE \`${config.db.database}\``);

    const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf-8');
    await connection.query(schema);
    console.log('数据库迁移完成');
  } finally {
    await connection.end();
  }
}

migrate().catch((err) => {
  console.error('数据库迁移失败:', err);
  process.exit(1);
});
