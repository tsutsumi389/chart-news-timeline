/**
 * 株価コントローラー
 * 株価データ取得のHTTPハンドラー
 */

import { FastifyRequest, FastifyReply } from 'fastify';
import { ZodError } from 'zod';
import { stockCodeParamSchema, stockPriceQuerySchema } from '../schemas/stockPriceSchemas';
import * as stockPriceService from '../services/stockPriceService';

/**
 * 銘柄コードから株価データを取得
 * GET /api/v1/stocks/:stockCode/prices
 */
export async function getStockPrices(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  try {
    // パスパラメータのバリデーション
    const params = stockCodeParamSchema.parse(request.params);
    const stockCode = params.stockCode;

    // クエリパラメータのバリデーション
    const query = stockPriceQuerySchema.parse(request.query);

    // 株価データ取得
    const prices = await stockPriceService.getStockPricesByCode(stockCode, {
      startDate: query.startDate,
      endDate: query.endDate,
      limit: query.limit,
    });

    reply.status(200).send({
      success: true,
      data: {
        stockCode,
        prices,
        total: prices.length,
      },
    });
  } catch (error: any) {
    request.log.error(error);

    // Zodバリデーションエラー
    if (error instanceof ZodError) {
      reply.status(400).send({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: '入力内容に誤りがあります',
        },
      });
      return;
    }

    // 銘柄コードが見つからない
    if (error instanceof stockPriceService.StockCodeNotFoundError) {
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

    // 株価データが見つからない
    if (error instanceof stockPriceService.StockPriceNotFoundError) {
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
