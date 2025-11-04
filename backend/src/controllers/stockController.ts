/**
 * 株マスタコントローラー
 * 株一覧・登録・詳細取得のHTTPハンドラー
 */

import { FastifyRequest, FastifyReply } from 'fastify';
import { ZodError } from 'zod';
import { createStockSchema, stockIdParamSchema } from '../schemas/stockSchemas';
import * as stockService from '../services/stockService';

/**
 * 株一覧取得ハンドラー
 * GET /api/v1/stocks
 */
export async function getStocks(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  try {
    const data = await stockService.getAllStocks();
    reply.status(200).send({
      success: true,
      data,
    });
  } catch (error) {
    request.log.error(error);
    reply.status(500).send({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'サーバーエラーが発生しました',
      },
    });
  }
}

/**
 * 株登録ハンドラー
 * POST /api/v1/stocks
 */
export async function createStock(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  try {
    // バリデーション
    const validatedData = createStockSchema.parse(request.body);

    // 株登録
    const stock = await stockService.registerStock(validatedData);

    reply.status(201).send({
      success: true,
      data: { stock },
      message: '株を登録しました',
    });
  } catch (error: any) {
    request.log.error(error);

    // Zodバリデーションエラー
    if (error instanceof ZodError) {
      const details: Record<string, string> = {};
      error.errors.forEach((err) => {
        const field = err.path.join('.');
        details[field] = err.message;
      });

      reply.status(400).send({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: '入力内容に誤りがあります',
          details,
        },
      });
      return;
    }

    // 重複エラー
    if (error instanceof stockService.StockCodeDuplicateError) {
      reply.status(409).send({
        success: false,
        error: {
          code: error.code,
          message: error.message,
          details: error.details,
        },
      });
      return;
    }

    // その他のエラー
    reply.status(500).send({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'サーバーエラーが発生しました',
      },
    });
  }
}

/**
 * 株詳細取得ハンドラー
 * GET /api/v1/stocks/:stockId
 */
export async function getStockById(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  try {
    // パスパラメータのバリデーション
    const params = stockIdParamSchema.parse(request.params);
    const stockId = parseInt(params.stockId, 10);

    // 株詳細取得
    const stock = await stockService.getStockById(stockId);

    reply.status(200).send({
      success: true,
      data: { stock },
    });
  } catch (error: any) {
    request.log.error(error);

    // Zodバリデーションエラー
    if (error instanceof ZodError) {
      reply.status(400).send({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: '無効な株IDです',
        },
      });
      return;
    }

    // 株が見つからない
    if (error instanceof stockService.StockNotFoundError) {
      reply.status(404).send({
        success: false,
        error: {
          code: error.code,
          message: error.message,
          details: error.details,
        },
      });
      return;
    }

    // その他のエラー
    reply.status(500).send({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'サーバーエラーが発生しました',
      },
    });
  }
}
