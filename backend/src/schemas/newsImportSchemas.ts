/**
 * ニュースインポートAPIのバリデーションスキーマ
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
 * ニュースCSVインポートリクエストボディスキーマ
 */
export const newsCsvImportBodySchema = z.object({
  duplicateStrategy: z
    .enum(['skip', 'overwrite'])
    .optional()
    .default('skip')
    .describe('重複データの処理戦略'),
  dateFrom: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, '日付はYYYY-MM-DD形式である必要があります')
    .optional()
    .describe('日付範囲フィルター開始日'),
  dateTo: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, '日付はYYYY-MM-DD形式である必要があります')
    .optional()
    .describe('日付範囲フィルター終了日'),
});

/**
 * ニュースデータ削除クエリパラメータスキーマ
 */
export const deleteNewsQuerySchema = z.object({
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
 * 重複ニュース検出リクエストボディスキーマ
 */
export const checkDuplicatesBodySchema = z.object({
  news: z
    .array(
      z.object({
        publishedAt: z.string().describe('公開日時'),
        title: z.string().min(1).max(255).describe('タイトル'),
      })
    )
    .min(1, 'ニュースデータが空です')
    .describe('チェック対象のニュース配列'),
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
export type NewsCsvImportBody = z.infer<typeof newsCsvImportBodySchema>;
export type DeleteNewsQuery = z.infer<typeof deleteNewsQuerySchema>;
export type CheckDuplicatesBody = z.infer<typeof checkDuplicatesBodySchema>;
export type ImportHistoryQuery = z.infer<typeof importHistoryQuerySchema>;
