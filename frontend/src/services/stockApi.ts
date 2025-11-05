/**
 * 株マスタAPI通信サービス
 * 株一覧取得・登録・株価データ取得APIとの通信処理
 */

import { Stock, CreateStockInput, StockPrice, CandlestickData, ApiResponse } from '../types/stock';

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

/**
 * 株価データをCandlestickData形式に変換
 * @param prices 株価データ配列
 * @returns ローソク足データ配列
 */
function convertToCandlestickData(prices: StockPrice[]): CandlestickData[] {
  return prices.map((price) => ({
    date: price.tradeDate.split('T')[0], // 日付部分のみ抽出
    open: parseFloat(price.openPrice),
    close: parseFloat(price.closePrice),
    low: parseFloat(price.lowPrice),
    high: parseFloat(price.highPrice),
  }));
}

/**
 * 株価データ取得
 * @param stockCode 銘柄コード（4桁）
 * @param options 取得オプション（日付範囲、件数制限）
 * @returns ローソク足データ配列
 * @throws エラーメッセージ
 */
export async function fetchStockPrices(
  stockCode: string,
  options?: {
    startDate?: string;
    endDate?: string;
    limit?: number;
  }
): Promise<CandlestickData[]> {
  // クエリパラメータの構築
  const params = new URLSearchParams();
  if (options?.startDate) params.append('startDate', options.startDate);
  if (options?.endDate) params.append('endDate', options.endDate);
  if (options?.limit) params.append('limit', options.limit.toString());

  const queryString = params.toString();
  const url = `${API_BASE_URL}/api/v1/stocks/${stockCode}/prices${
    queryString ? `?${queryString}` : ''
  }`;

  const response = await fetch(url);
  const data: ApiResponse<{ stockCode: string; prices: StockPrice[]; total: number }> =
    await response.json();

  if (!data.success || !data.data) {
    throw new Error(data.error?.message || '株価データの取得に失敗しました');
  }

  // ローソク足データ形式に変換
  return convertToCandlestickData(data.data.prices);
}
