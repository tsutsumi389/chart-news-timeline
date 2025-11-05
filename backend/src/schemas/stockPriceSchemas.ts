/**
 * 株価バリデーションスキーマ
 * 株価データ取得のZodスキーマ定義
 */

import { z } from 'zod';

/**
 * 銘柄コード パスパラメータスキーマ
 */
export const stockCodeParamSchema = z.object({
  stockCode: z
    .string()
    .regex(/^[A-Za-z0-9]{4}$/, '銘柄コードは英数字4桁である必要があります')
    .transform((val) => val.toUpperCase()),
});

/**
 * 銘柄コード パスパラメータ型
 */
export type StockCodeParam = z.infer<typeof stockCodeParamSchema>;

/**
 * 株価取得クエリパラメータスキーマ
 */
export const stockPriceQuerySchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  limit: z.string().optional().transform((val) => val ? parseInt(val, 10) : undefined),
});

/**
 * 株価取得クエリパラメータ型
 */
export type StockPriceQuery = z.infer<typeof stockPriceQuerySchema>;
