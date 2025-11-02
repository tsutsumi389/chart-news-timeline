/**
 * データベース設定
 */

import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

// Prismaクライアントのシングルトンインスタンス
let prisma: PrismaClient;

/**
 * Prismaクライアントを取得
 */
export function getPrismaClient(): PrismaClient {
  if (!prisma) {
    prisma = new PrismaClient({
      log: [
        { level: 'query', emit: 'event' },
        { level: 'error', emit: 'stdout' },
        { level: 'warn', emit: 'stdout' },
      ],
    });

    // クエリログ（開発環境のみ）
    if (process.env.NODE_ENV !== 'production') {
      prisma.$on('query', (e) => {
        logger.debug(`Query: ${e.query}`);
        logger.debug(`Duration: ${e.duration}ms`);
      });
    }
  }

  return prisma;
}

/**
 * データベース接続を閉じる
 */
export async function disconnectDatabase(): Promise<void> {
  if (prisma) {
    await prisma.$disconnect();
    logger.info('Database disconnected');
  }
}

/**
 * データベース接続をテスト
 */
export async function testDatabaseConnection(): Promise<boolean> {
  try {
    const client = getPrismaClient();
    await client.$queryRaw`SELECT 1`;
    logger.info('Database connection successful');
    return true;
  } catch (error) {
    logger.error('Database connection failed', error);
    return false;
  }
}
