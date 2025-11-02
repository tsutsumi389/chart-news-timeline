/**
 * Fastifyサーバー設定
 */

import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import { loggerConfig } from './utils/logger';
import { globalErrorHandler } from './utils/errorHandler';
import { testDatabaseConnection, disconnectDatabase } from './config/database';

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

  // ルート登録（後で追加）
  // await server.register(routes, { prefix: '/api/v1' });

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
