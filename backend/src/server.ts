/**
 * Fastifyサーバー設定
 */

import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import { loggerConfig } from './utils/logger';
import { globalErrorHandler } from './utils/errorHandler';
import { testDatabaseConnection, disconnectDatabase } from './config/database';
import { stockImportRoutes } from './routes/stockImport';
import { stockRoutes } from './routes/stocks';

/**
 * Fastifyサーバーインスタンスを作成
 */
export async function createServer(): Promise<FastifyInstance> {
  // Fastifyインスタンス作成
  const server = Fastify({
    logger: loggerConfig,
  });

  // CORS設定
  await server.register(cors, {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true,
  });

  // Multipartプラグイン登録（ファイルアップロード用）
  await server.register(multipart, {
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB
    },
  });

  // グローバルエラーハンドラー登録
  server.setErrorHandler(globalErrorHandler);

  // ヘルスチェックエンドポイント
  server.get('/health', async () => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  });

  // データベース接続確認エンドポイント
  server.get('/health/db', async () => {
    const isConnected = await testDatabaseConnection();
    return {
      status: isConnected ? 'ok' : 'error',
      database: isConnected ? 'connected' : 'disconnected',
      timestamp: new Date().toISOString(),
    };
  });

  // APIルート登録
  await server.register(stockImportRoutes, { prefix: '/api/v1' });
  await server.register(stockRoutes, { prefix: '/api/v1' });

  // Graceful shutdown
  const closeGracefully = async (signal: string) => {
    server.log.info(`Received ${signal}, closing server gracefully`);
    await disconnectDatabase();
    await server.close();
    process.exit(0);
  };

  process.on('SIGINT', () => closeGracefully('SIGINT'));
  process.on('SIGTERM', () => closeGracefully('SIGTERM'));

  return server;
}

/**
 * サーバーを起動
 */
export async function startServer(port: number = 3000, host: string = '0.0.0.0') {
  try {
    const server = await createServer();

    // データベース接続テスト
    const dbConnected = await testDatabaseConnection();
    if (!dbConnected) {
      throw new Error('Failed to connect to database');
    }

    // サーバー起動
    await server.listen({ port, host });
    server.log.info(`Server listening on http://${host}:${port}`);

    return server;
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}
