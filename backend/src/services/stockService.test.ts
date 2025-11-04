/**
 * 株マスタサービスのユニットテスト
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as stockService from './stockService';
import { stockRepository } from '../repositories/stockRepository';

// リポジトリをモック化
vi.mock('../repositories/stockRepository', () => ({
  stockRepository: {
    findAll: vi.fn(),
    findByCode: vi.fn(),
    findById: vi.fn(),
    create: vi.fn(),
  },
}));

describe('stockService', () => {
  beforeEach(() => {
    // 各テストの前にモックをリセット
    vi.clearAllMocks();
  });

  describe('getAllStocks', () => {
    it('全株の一覧を取得できる', async () => {
      const mockStocks = [
        {
          stockId: 1,
          stockCode: '7203',
          stockName: 'トヨタ自動車',
          createdAt: new Date('2024-01-15'),
          updatedAt: new Date('2024-01-15'),
        },
        {
          stockId: 2,
          stockCode: 'AAPL',
          stockName: 'Apple Inc.',
          createdAt: new Date('2024-01-16'),
          updatedAt: new Date('2024-01-16'),
        },
      ];

      vi.mocked(stockRepository.findAll).mockResolvedValue(mockStocks);

      const result = await stockService.getAllStocks();

      expect(result).toEqual({
        stocks: mockStocks,
        total: 2,
      });
      expect(stockRepository.findAll).toHaveBeenCalledOnce();
    });

    it('株が0件の場合も正しく処理する', async () => {
      vi.mocked(stockRepository.findAll).mockResolvedValue([]);

      const result = await stockService.getAllStocks();

      expect(result).toEqual({
        stocks: [],
        total: 0,
      });
    });
  });

  describe('registerStock', () => {
    it('新規株を正常に登録できる', async () => {
      const input = {
        stockCode: '7203',
        stockName: 'トヨタ自動車',
      };

      const mockCreatedStock = {
        stockId: 1,
        stockCode: '7203',
        stockName: 'トヨタ自動車',
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-01-15'),
      };

      vi.mocked(stockRepository.findByCode).mockResolvedValue(null);
      vi.mocked(stockRepository.create).mockResolvedValue(mockCreatedStock);

      const result = await stockService.registerStock(input);

      expect(result).toEqual(mockCreatedStock);
      expect(stockRepository.findByCode).toHaveBeenCalledWith('7203');
      expect(stockRepository.create).toHaveBeenCalledWith('7203', 'トヨタ自動車');
    });

    it('銘柄コードが重複している場合はエラーを投げる', async () => {
      const input = {
        stockCode: '7203',
        stockName: 'トヨタ自動車',
      };

      const existingStock = {
        stockId: 1,
        stockCode: '7203',
        stockName: '既存のトヨタ自動車',
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-01-15'),
      };

      vi.mocked(stockRepository.findByCode).mockResolvedValue(existingStock);

      await expect(stockService.registerStock(input)).rejects.toThrow(
        stockService.StockCodeDuplicateError
      );

      expect(stockRepository.findByCode).toHaveBeenCalledWith('7203');
      expect(stockRepository.create).not.toHaveBeenCalled();
    });

    it('StockCodeDuplicateErrorに正しい情報が含まれる', async () => {
      const input = {
        stockCode: 'AAPL',
        stockName: 'Apple Inc.',
      };

      const existingStock = {
        stockId: 2,
        stockCode: 'AAPL',
        stockName: 'Apple Inc.',
        createdAt: new Date('2024-01-16'),
        updatedAt: new Date('2024-01-16'),
      };

      vi.mocked(stockRepository.findByCode).mockResolvedValue(existingStock);

      try {
        await stockService.registerStock(input);
        expect.fail('エラーが投げられるべき');
      } catch (error) {
        expect(error).toBeInstanceOf(stockService.StockCodeDuplicateError);
        if (error instanceof stockService.StockCodeDuplicateError) {
          expect(error.code).toBe('STOCK_CODE_DUPLICATE');
          expect(error.message).toBe('この銘柄コードは既に登録されています');
          expect(error.details).toEqual({ stockCode: 'AAPL' });
        }
      }
    });
  });

  describe('getStockById', () => {
    it('IDで株を正常に取得できる', async () => {
      const mockStock = {
        stockId: 1,
        stockCode: '7203',
        stockName: 'トヨタ自動車',
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-01-15'),
      };

      vi.mocked(stockRepository.findById).mockResolvedValue(mockStock);

      const result = await stockService.getStockById(1);

      expect(result).toEqual(mockStock);
      expect(stockRepository.findById).toHaveBeenCalledWith(1);
    });

    it('株が見つからない場合はエラーを投げる', async () => {
      vi.mocked(stockRepository.findById).mockResolvedValue(null);

      await expect(stockService.getStockById(999)).rejects.toThrow(
        stockService.StockNotFoundError
      );

      expect(stockRepository.findById).toHaveBeenCalledWith(999);
    });

    it('StockNotFoundErrorに正しい情報が含まれる', async () => {
      vi.mocked(stockRepository.findById).mockResolvedValue(null);

      try {
        await stockService.getStockById(999);
        expect.fail('エラーが投げられるべき');
      } catch (error) {
        expect(error).toBeInstanceOf(stockService.StockNotFoundError);
        if (error instanceof stockService.StockNotFoundError) {
          expect(error.code).toBe('STOCK_NOT_FOUND');
          expect(error.message).toBe('指定された株が見つかりません');
          expect(error.details).toEqual({ stockId: 999 });
        }
      }
    });
  });
});
