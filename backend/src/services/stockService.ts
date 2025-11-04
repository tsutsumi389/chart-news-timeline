/**
 * 株マスタサービス
 * 株マスタに関するビジネスロジック
 */

import { Stock } from '@prisma/client';
import { stockRepository } from '../repositories/stockRepository';
import { CreateStockInput } from '../schemas/stockSchemas';

/**
 * カスタムエラー: 銘柄コード重複
 */
export class StockCodeDuplicateError extends Error {
  code = 'STOCK_CODE_DUPLICATE';
  details: { stockCode: string };

  constructor(stockCode: string) {
    super('この銘柄コードは既に登録されています');
    this.name = 'StockCodeDuplicateError';
    this.details = { stockCode };
  }
}

/**
 * カスタムエラー: 株が見つからない
 */
export class StockNotFoundError extends Error {
  code = 'STOCK_NOT_FOUND';
  details: { stockId: number };

  constructor(stockId: number) {
    super('指定された株が見つかりません');
    this.name = 'StockNotFoundError';
    this.details = { stockId };
  }
}

/**
 * 株一覧取得
 * @returns 株一覧と総数
 */
export async function getAllStocks(): Promise<{ stocks: Stock[]; total: number }> {
  const stocks = await stockRepository.findAll();
  return {
    stocks,
    total: stocks.length,
  };
}

/**
 * 株登録（重複チェック含む）
 * @param input 株登録入力データ
 * @returns 登録された株マスタ
 * @throws {StockCodeDuplicateError} 銘柄コードが重複している場合
 */
export async function registerStock(input: CreateStockInput): Promise<Stock> {
  // 既存の銘柄コードチェック
  const existingStock = await stockRepository.findByCode(input.stockCode);
  if (existingStock) {
    throw new StockCodeDuplicateError(input.stockCode);
  }

  // 株登録
  const newStock = await stockRepository.create(input.stockCode, input.stockName);
  return newStock;
}

/**
 * 株詳細取得
 * @param stockId 株ID
 * @returns 株マスタ
 * @throws {StockNotFoundError} 株が見つからない場合
 */
export async function getStockById(stockId: number): Promise<Stock> {
  const stock = await stockRepository.findById(stockId);
  if (!stock) {
    throw new StockNotFoundError(stockId);
  }
  return stock;
}
