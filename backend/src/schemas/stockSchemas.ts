/**
 * 株マスタバリデーションスキーマ
 * 株一覧・登録・詳細取得のZodスキーマ定義
 */

import { z } from 'zod';

/**
 * 株登録リクエストスキーマ
 * - 銘柄コード: 英数字4桁（大文字に統一）
 * - 銘柄名: 1〜100文字（前後の空白をトリム）
 */
export const createStockSchema = z.object({
  stockCode: z
    .string()
    .regex(/^[A-Za-z0-9]{4}$/, '銘柄コードは英数字4桁である必要があります')
    .trim()
    .transform((val) => val.toUpperCase()), // 大文字に統一
  stockName: z
    .string()
    .min(1, '銘柄名は1文字以上入力してください')
    .max(100, '銘柄名は100文字以内で入力してください')
    .trim(),
});

/**
 * 株登録リクエスト型
 */
export type CreateStockInput = z.infer<typeof createStockSchema>;

/**
 * 株ID パスパラメータスキーマ
 */
export const stockIdParamSchema = z.object({
  stockId: z.string().regex(/^\d+$/, '株IDは数値である必要があります'),
});

/**
 * 株ID パスパラメータ型
 */
export type StockIdParam = z.infer<typeof stockIdParamSchema>;
