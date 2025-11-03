/**
 * 株価インポートコントローラー
 * 株価インポートAPIのリクエスト処理
 */

import { FastifyRequest, FastifyReply } from 'fastify';
import { stockRepository } from '../repositories/stockRepository';
import { stockPriceRepository } from '../repositories/stockPriceRepository';
import { stockImportService } from '../services/stockImportService';
import {
  stockCodeParamSchema,
  csvImportBodySchema,
  deletePricesQuerySchema,
  StockCodeParam,
  CsvImportBody,
  DeletePricesQuery,
} from '../schemas/stockImportSchemas';
import { logger } from '../utils/logger';
import { MultipartFile } from '@fastify/multipart';

/**
 * 銘柄情報取得API
 * GET /api/v1/stocks/:stockCode
 */
export async function getStock(
  request: FastifyRequest<{ Params: StockCodeParam }>,
  reply: FastifyReply
) {
  try {
    // パラメータバリデーション
    const { stockCode } = stockCodeParamSchema.parse(request.params);

    // 銘柄取得
    const stock = await stockRepository.findByCode(stockCode);
    if (!stock) {
      return reply.status(404).send({
        success: false,
        error: {
          code: 'STOCK_NOT_FOUND',
          message: `銘柄コード ${stockCode} が見つかりません`,
        },
      });
    }

    return reply.status(200).send({
      success: true,
      data: {
        stockId: stock.stockId,
        stockCode: stock.stockCode,
        stockName: stock.stockName,
        createdAt: stock.createdAt.toISOString(),
        updatedAt: stock.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    logger.error('銘柄情報取得エラー:', error);
    return reply.status(500).send({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: '銘柄情報の取得に失敗しました',
      },
    });
  }
}

/**
 * CSVファイルアップロードAPI
 * POST /api/v1/stocks/:stockCode/import/csv
 */
export async function importCsv(
  request: FastifyRequest<{ Params: StockCodeParam }>,
  reply: FastifyReply
) {
  try {
    // パラメータバリデーション
    const { stockCode } = stockCodeParamSchema.parse(request.params);

    // multipartデータ取得
    const data = await request.file({
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
      },
    });

    if (!data) {
      return reply.status(400).send({
        success: false,
        error: {
          code: 'FILE_REQUIRED',
          message: 'CSVファイルが必要です',
        },
      });
    }

    // ファイルタイプチェック（拡張子でもチェック）
    const file = data as MultipartFile;
    const isValidMimeType =
      file.mimetype.includes('csv') ||
      file.mimetype.includes('text') ||
      file.mimetype === 'application/octet-stream'; // curlなどでアップロードされた場合
    const isValidExtension = file.filename.endsWith('.csv');

    if (!isValidMimeType && !isValidExtension) {
      return reply.status(415).send({
        success: false,
        error: {
          code: 'UNSUPPORTED_FILE_TYPE',
          message: 'CSVファイルのみサポートしています',
        },
      });
    }

    // ファイル内容を読み取る
    const buffer = await file.toBuffer();
    const csvContent = buffer.toString('utf-8');

    // duplicateStrategy取得（デフォルト: skip）
    const fields = data.fields as any;
    const duplicateStrategy = fields?.duplicateStrategy?.value || 'skip';

    // バリデーション
    const bodyData = csvImportBodySchema.parse({ duplicateStrategy });

    logger.info(`CSVインポート開始: 銘柄=${stockCode}, ファイル名=${file.filename}`);

    // インポート実行
    const result = await stockImportService.importFromCsv(
      stockCode,
      csvContent,
      bodyData.duplicateStrategy
    );

    return reply.status(200).send({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error('CSVインポートエラー:', error);

    // エラーの種類に応じたレスポンス
    if (error instanceof Error) {
      if (error.message.includes('が見つかりません')) {
        return reply.status(404).send({
          success: false,
          error: {
            code: 'STOCK_NOT_FOUND',
            message: error.message,
          },
        });
      }

      if (
        error.message.includes('CSVヘッダー') ||
        error.message.includes('CSVファイル') ||
        error.message.includes('列数が不正')
      ) {
        return reply.status(400).send({
          success: false,
          error: {
            code: 'INVALID_CSV_FORMAT',
            message: error.message,
          },
        });
      }
    }

    return reply.status(500).send({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'CSVインポートに失敗しました',
      },
    });
  }
}

/**
 * 株価データ削除API
 * DELETE /api/v1/stocks/:stockCode/prices
 */
export async function deletePrices(
  request: FastifyRequest<{
    Params: StockCodeParam;
    Querystring: DeletePricesQuery;
  }>,
  reply: FastifyReply
) {
  try {
    // パラメータバリデーション
    const { stockCode } = stockCodeParamSchema.parse(request.params);
    const { startDate, endDate } = deletePricesQuerySchema.parse(request.query);

    // 銘柄存在チェック
    const stock = await stockRepository.findByCode(stockCode);
    if (!stock) {
      return reply.status(404).send({
        success: false,
        error: {
          code: 'STOCK_NOT_FOUND',
          message: `銘柄コード ${stockCode} が見つかりません`,
        },
      });
    }

    // 株価データ削除
    const deletedCount = await stockPriceRepository.deleteByDateRange(
      stock.stockId,
      startDate,
      endDate
    );

    logger.info(
      `株価データ削除完了: 銘柄=${stockCode}, 削除件数=${deletedCount}, 期間=${startDate || '指定なし'} ～ ${endDate || '指定なし'}`
    );

    return reply.status(200).send({
      success: true,
      data: {
        stockCode,
        deletedCount,
        dateRange: {
          start: startDate || null,
          end: endDate || null,
        },
      },
    });
  } catch (error) {
    logger.error('株価データ削除エラー:', error);
    return reply.status(500).send({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: '株価データの削除に失敗しました',
      },
    });
  }
}
