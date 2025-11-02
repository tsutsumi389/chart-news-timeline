/**
 * エラーハンドリング
 */

import { FastifyReply, FastifyRequest } from 'fastify';
import { ErrorCode, ErrorResponse } from '../types/responses';

/**
 * カスタムアプリケーションエラー
 */
export class AppError extends Error {
  constructor(
    public code: ErrorCode,
    public message: string,
    public statusCode: number,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'AppError';
  }
}

/**
 * エラーレスポンスを作成
 */
export function createErrorResponse(
  code: ErrorCode,
  message: string,
  details?: Record<string, unknown>
): ErrorResponse {
  return {
    success: false,
    error: {
      code,
      message,
      details,
    },
  };
}

/**
 * Fastifyグローバルエラーハンドラー
 */
export async function globalErrorHandler(
  error: Error,
  request: FastifyRequest,
  reply: FastifyReply
) {
  // ログ出力
  request.log.error(error);

  // AppErrorの場合
  if (error instanceof AppError) {
    return reply.status(error.statusCode).send(
      createErrorResponse(error.code, error.message, error.details)
    );
  }

  // Zodバリデーションエラーの場合
  if (error.name === 'ZodError') {
    return reply.status(400).send(
      createErrorResponse('VALIDATION_ERROR', 'リクエストパラメータが不正です', {
        validationErrors: error.message,
      })
    );
  }

  // Prismaエラーの場合
  if (error.name === 'PrismaClientKnownRequestError') {
    return reply.status(500).send(
      createErrorResponse('DATABASE_ERROR', 'データベースエラーが発生しました')
    );
  }

  // その他の予期しないエラー
  const isProduction = process.env.NODE_ENV === 'production';
  return reply.status(500).send(
    createErrorResponse(
      'INTERNAL_SERVER_ERROR',
      'サーバー内部エラーが発生しました',
      isProduction ? undefined : { stack: error.stack }
    )
  );
}

/**
 * エラーファクトリー関数
 */
export const createError = {
  notFound: (resourceType: string, identifier: string | number): AppError => {
    const errorCodeMap: Record<string, ErrorCode> = {
      stock: 'STOCK_NOT_FOUND',
      news: 'NEWS_NOT_FOUND',
      price: 'PRICE_DATA_NOT_FOUND',
    };

    const code = errorCodeMap[resourceType] || 'INTERNAL_SERVER_ERROR';
    return new AppError(
      code,
      `指定された${resourceType}が見つかりません`,
      404,
      { [resourceType]: identifier }
    );
  },

  validation: (message: string, details?: Record<string, unknown>): AppError => {
    return new AppError('VALIDATION_ERROR', message, 400, details);
  },

  invalidDateRange: (): AppError => {
    return new AppError(
      'INVALID_DATE_RANGE',
      '日付範囲が不正です。開始日は終了日より前である必要があります',
      400
    );
  },

  database: (message?: string): AppError => {
    return new AppError(
      'DATABASE_ERROR',
      message || 'データベースエラーが発生しました',
      500
    );
  },
};
