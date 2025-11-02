/**
 * ロガー設定
 * Fastifyの組み込みロガー設定を定義
 */

import { FastifyLoggerOptions } from 'fastify';

// 環境変数からログレベルを取得
const LOG_LEVEL = process.env.LOG_LEVEL || 'info';

// 本番環境かどうか
const isProduction = process.env.NODE_ENV === 'production';

/**
 * Fastifyロガー設定
 */
export const loggerConfig: FastifyLoggerOptions = {
  level: LOG_LEVEL,
  // 開発環境では見やすい形式、本番環境ではJSON形式
  transport: isProduction
    ? undefined
    : {
        target: 'pino-pretty',
        options: {
          translateTime: 'HH:MM:ss Z',
          ignore: 'pid,hostname',
          colorize: true,
        },
      },
};

/**
 * シンプルなコンソールロガー（Fastify外で使用）
 */
export const logger = {
  info: (message: string, ...args: unknown[]) => {
    console.log(`[INFO] ${message}`, ...args);
  },
  error: (message: string, ...args: unknown[]) => {
    console.error(`[ERROR] ${message}`, ...args);
  },
  warn: (message: string, ...args: unknown[]) => {
    console.warn(`[WARN] ${message}`, ...args);
  },
  debug: (message: string, ...args: unknown[]) => {
    if (!isProduction) {
      console.debug(`[DEBUG] ${message}`, ...args);
    }
  },
};
