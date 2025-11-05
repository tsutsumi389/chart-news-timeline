/**
 * 株価サービス
 * 株価データ取得に関するビジネスロジック
 */

import { StockPrice } from '@prisma/client';
import { stockPriceRepository } from '../repositories/stockPriceRepository';
import { stockRepository } from '../repositories/stockRepository';

/**
 * カスタムエラー: 銘柄コードが見つからない
 */
export class StockCodeNotFoundError extends Error {
  code = 'STOCK_CODE_NOT_FOUND';
  details: { stockCode: string };

  constructor(stockCode: string) {
    super('指定された銘柄コードが見つかりません');
    this.name = 'StockCodeNotFoundError';
    this.details = { stockCode };
  }
}

/**
 * カスタムエラー: 株価データが存在しない
 */
export class StockPriceNotFoundError extends Error {
  code = 'STOCK_PRICE_NOT_FOUND';
  details: { stockCode: string };

  constructor(stockCode: string) {
    super('指定された銘柄の株価データが見つかりません');
    this.name = 'StockPriceNotFoundError';
    this.details = { stockCode };
  }
}

/**
 * 株価データ取得オプション
 */
export interface GetStockPricesOptions {
  startDate?: string;
  endDate?: string;
  limit?: number;
}

/**
 * 株価データ（JSON シリアライズ可能）
 */
export interface StockPriceResponse {
  priceId: string;
  stockId: number;
  tradeDate: Date;
  openPrice: any;
  highPrice: any;
  lowPrice: any;
  closePrice: any;
  volume: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 株価データをJSON シリアライズ可能な形式に変換
 * @param prices Prisma株価データ配列
 * @returns シリアライズ可能な株価データ配列
 */
function convertToSerializable(prices: StockPrice[]): StockPriceResponse[] {
  return prices.map((price) => ({
    priceId: price.priceId.toString(),
    stockId: price.stockId,
    tradeDate: price.tradeDate,
    openPrice: price.openPrice,
    highPrice: price.highPrice,
    lowPrice: price.lowPrice,
    closePrice: price.closePrice,
    volume: price.volume.toString(),
    createdAt: price.createdAt,
    updatedAt: price.updatedAt,
  }));
}

/**
 * 銘柄コードから株価データを取得
 * @param stockCode 銘柄コード（4桁）
 * @param options 取得オプション（日付範囲、件数制限）
 * @returns 株価データ配列
 * @throws {StockCodeNotFoundError} 銘柄コードが存在しない場合
 * @throws {StockPriceNotFoundError} 株価データが存在しない場合
 */
export async function getStockPricesByCode(
  stockCode: string,
  options?: GetStockPricesOptions
): Promise<StockPriceResponse[]> {
  // 銘柄コードの存在確認
  const stock = await stockRepository.findByCode(stockCode);
  if (!stock) {
    throw new StockCodeNotFoundError(stockCode);
  }

  // 日付変換
  const startDate = options?.startDate ? new Date(options.startDate) : undefined;
  const endDate = options?.endDate ? new Date(options.endDate) : undefined;
  const limit = options?.limit;

  // 株価データ取得
  const prices = await stockPriceRepository.findByStockCode(
    stockCode,
    startDate,
    endDate,
    limit
  );

  // データが存在しない場合エラー
  if (prices.length === 0) {
    throw new StockPriceNotFoundError(stockCode);
  }

  // BigInt等をシリアライズ可能な形式に変換
  return convertToSerializable(prices);
}
