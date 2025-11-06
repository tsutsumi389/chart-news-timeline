/**
 * ニュースインポートコントローラー
 * ニュースインポートAPIのリクエスト処理
 */

import { FastifyRequest, FastifyReply } from 'fastify';
import { newsImportService } from '../services/newsImportService';
import {
  stockCodeParamSchema,
  newsCsvImportBodySchema,
  deleteNewsQuerySchema,
  checkDuplicatesBodySchema,
  StockCodeParam,
  NewsCsvImportBody,
  DeleteNewsQuery,
  CheckDuplicatesBody,
} from '../schemas/newsImportSchemas';
import { logger } from '../utils/logger';
import { MultipartFile } from '@fastify/multipart';

/**
 * CSVファイルアップロードAPI
 * POST /api/v1/stocks/:stockCode/news/import/csv
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
        fileSize: 5 * 1024 * 1024, // 5MB
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

    // ファイルタイプチェック
    const file = data as MultipartFile;
    const isValidMimeType =
      file.mimetype.includes('csv') ||
      file.mimetype.includes('text') ||
      file.mimetype.includes('plain');
    const isValidExtension =
      file.filename.toLowerCase().endsWith('.csv');

    if (!isValidMimeType && !isValidExtension) {
      return reply.status(415).send({
        success: false,
        error: {
          code: 'UNSUPPORTED_FILE_TYPE',
          message: 'CSVファイル(.csv)のみアップロード可能です',
        },
      });
    }

    // ファイル内容読み取り
    const buffer = await file.toBuffer();
    const csvContent = buffer.toString('utf-8');

    // リクエストボディからインポートオプションを取得
    // multipartの場合、他のフィールドはdata.fieldsから取得
    const fields = file.fields as any;
    const duplicateStrategy = fields?.duplicateStrategy?.value || 'skip';
    const dateFrom = fields?.dateFrom?.value;
    const dateTo = fields?.dateTo?.value;

    // バリデーション
    const options = newsCsvImportBodySchema.parse({
      duplicateStrategy,
      dateFrom,
      dateTo,
    });

    // インポート実行
    const result = await newsImportService.importFromCsv(
      stockCode,
      csvContent,
      options
    );

    return reply.status(200).send({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error('ニュースCSVインポートエラー:', error);

    if (error instanceof Error) {
      // 銘柄が見つからない場合
      if (error.message.includes('が見つかりません')) {
        return reply.status(404).send({
          success: false,
          error: {
            code: 'STOCK_NOT_FOUND',
            message: error.message,
          },
        });
      }

      // CSVフォーマットエラー
      if (
        error.message.includes('CSV') ||
        error.message.includes('ヘッダー') ||
        error.message.includes('列数')
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

    // その他のエラー
    return reply.status(500).send({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'ニュースデータのインポートに失敗しました',
      },
    });
  }
}

/**
 * ニュースデータ削除API
 * DELETE /api/v1/stocks/:stockCode/news
 */
export async function deleteNews(
  request: FastifyRequest<{
    Params: StockCodeParam;
    Querystring: DeleteNewsQuery;
  }>,
  reply: FastifyReply
) {
  try {
    // パラメータバリデーション
    const { stockCode } = stockCodeParamSchema.parse(request.params);
    const { startDate, endDate } = deleteNewsQuerySchema.parse(request.query);

    // 削除実行
    const deletedCount = await newsImportService.deleteNewsByDateRange(
      stockCode,
      startDate,
      endDate
    );

    return reply.status(200).send({
      success: true,
      data: {
        stockCode,
        deletedCount,
        dateRange: {
          start: startDate,
          end: endDate,
        },
      },
    });
  } catch (error) {
    logger.error('ニュースデータ削除エラー:', error);

    if (error instanceof Error && error.message.includes('が見つかりません')) {
      return reply.status(404).send({
        success: false,
        error: {
          code: 'STOCK_NOT_FOUND',
          message: error.message,
        },
      });
    }

    return reply.status(500).send({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'ニュースデータの削除に失敗しました',
      },
    });
  }
}

/**
 * 重複ニュース検出API
 * POST /api/v1/stocks/:stockCode/news/check-duplicates
 */
export async function checkDuplicates(
  request: FastifyRequest<{
    Params: StockCodeParam;
    Body: CheckDuplicatesBody;
  }>,
  reply: FastifyReply
) {
  try {
    // パラメータバリデーション
    const { stockCode } = stockCodeParamSchema.parse(request.params);
    const { news } = checkDuplicatesBodySchema.parse(request.body);

    // 重複チェック実行
    const result = await newsImportService.checkDuplicates(stockCode, news);

    return reply.status(200).send({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error('重複ニュース検出エラー:', error);

    if (error instanceof Error && error.message.includes('が見つかりません')) {
      return reply.status(404).send({
        success: false,
        error: {
          code: 'STOCK_NOT_FOUND',
          message: error.message,
        },
      });
    }

    return reply.status(500).send({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: '重複ニュースの検出に失敗しました',
      },
    });
  }
}
