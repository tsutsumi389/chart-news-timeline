/**
 * 株価インポートAPIのバリデーションスキーマ
 * Zodを使用してリクエストパラメータをバリデーション
 */

import { z } from 'zod';

/**
 * 銘柄コードパラメータスキーマ
 */
export const stockCodeParamSchema = z.object({
  stockCode: z
    .string()
    .regex(/^\d{4}$/, '銘柄コードは4桁の数字である必要があります'),
});

/**
 * CSVインポートリクエストボディスキーマ
 */
export const csvImportBodySchema = z.object({
  duplicateStrategy: z
    .enum(['skip', 'overwrite'])
    .optional()
    .default('skip')
    .describe('重複データの処理戦略'),
});

/**
 * 株価データ削除クエリパラメータスキーマ
 */
export const deletePricesQuerySchema = z.object({
  startDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, '日付はYYYY-MM-DD形式である必要があります')
    .optional()
    .describe('削除開始日'),
  endDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, '日付はYYYY-MM-DD形式である必要があります')
    .optional()
    .describe('削除終了日'),
});

/**
 * インポート履歴取得クエリパラメータスキーマ（将来拡張用）
 */
export const importHistoryQuerySchema = z.object({
  limit: z
    .string()
    .regex(/^\d+$/)
    .transform(Number)
    .pipe(z.number().min(1).max(100))
    .optional()
    .default('20')
    .describe('取得件数'),
  offset: z
    .string()
    .regex(/^\d+$/)
    .transform(Number)
    .pipe(z.number().min(0))
    .optional()
    .default('0')
    .describe('オフセット'),
});

// TypeScript型をエクスポート
export type StockCodeParam = z.infer<typeof stockCodeParamSchema>;
export type CsvImportBody = z.infer<typeof csvImportBodySchema>;
export type DeletePricesQuery = z.infer<typeof deletePricesQuerySchema>;
export type ImportHistoryQuery = z.infer<typeof importHistoryQuerySchema>;
