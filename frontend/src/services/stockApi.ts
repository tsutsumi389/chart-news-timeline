/**
 * 株マスタAPI通信サービス
 * 株一覧取得・登録APIとの通信処理
 */

import { Stock, CreateStockInput, ApiResponse } from '../types/stock';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

/**
 * 株一覧取得
 * @returns 株マスタの配列
 * @throws エラーメッセージ
 */
export async function fetchStocks(): Promise<Stock[]> {
  const response = await fetch(`${API_BASE_URL}/api/v1/stocks`);
  const data: ApiResponse<{ stocks: Stock[]; total: number }> =
    await response.json();

  if (!data.success || !data.data) {
    throw new Error(data.error?.message || '株一覧の取得に失敗しました');
  }

  return data.data.stocks;
}

/**
 * 株登録
 * @param input 株登録入力データ
 * @returns 登録された株マスタ
 * @throws エラーオブジェクト（code, message, details）
 */
export async function createStock(
  input: CreateStockInput
): Promise<Stock> {
  const response = await fetch(`${API_BASE_URL}/api/v1/stocks`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });

  const data: ApiResponse<{ stock: Stock }> = await response.json();

  if (!response.ok || !data.success) {
    throw {
      code: data.error?.code || 'UNKNOWN_ERROR',
      message: data.error?.message || '株の登録に失敗しました',
      details: data.error?.details,
    };
  }

  return data.data!.stock;
}

/**
 * 株詳細取得
 * @param stockId 株ID
 * @returns 株マスタ
 * @throws エラーメッセージ
 */
export async function fetchStockById(stockId: number): Promise<Stock> {
  const response = await fetch(`${API_BASE_URL}/api/v1/stocks/id/${stockId}`);
  const data: ApiResponse<{ stock: Stock }> = await response.json();

  if (!data.success || !data.data) {
    throw new Error(data.error?.message || '株の取得に失敗しました');
  }

  return data.data.stock;
}
