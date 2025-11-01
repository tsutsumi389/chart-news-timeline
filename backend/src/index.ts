/**
 * バックエンドエントリーポイント(仮実装)
 * データベース接続テスト用
 */

import { Client } from 'pg';

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://chartuser:chartpass@db:5432/chartdb';

async function main() {
  console.log('🚀 Backend starting...');
  console.log(`📊 Database URL: ${DATABASE_URL}`);

  // PostgreSQL接続テスト
  const client = new Client({
    connectionString: DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('✅ Database connected successfully!');

    // バージョン確認
    const result = await client.query('SELECT version()');
    console.log('📦 PostgreSQL version:', result.rows[0].version);

    await client.end();
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  }

  console.log('✨ Backend is ready!');
}

main();
