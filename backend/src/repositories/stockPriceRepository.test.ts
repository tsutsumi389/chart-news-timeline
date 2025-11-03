/**
 * 株価リポジトリのテスト
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { StockPriceRepository } from './stockPriceRepository';
import { stockRepository } from './stockRepository';
import { getPrismaClient } from '../config/database';
import { CsvRow } from '../types/import';

describe('StockPriceRepository', () => {
  const repository = new StockPriceRepository();
  const prisma = getPrismaClient();
  let testStockId: number;

  beforeEach(async () => {
    // テスト用の銘柄を作成
    const stock = await stockRepository.create('9999', 'テスト銘柄');
    testStockId = stock.stockId;
  });

  afterEach(async () => {
    // テストデータをクリーンアップ
    await prisma.stockPrice.deleteMany({
      where: { stockId: testStockId },
    });
    await prisma.stock.delete({
      where: { stockId: testStockId },
    });
  });

  describe('existsByDate', () => {
    it('データが存在する場合trueを返す', async () => {
      // テストデータを挿入
      const csvRow: CsvRow = {
        date: '2024-01-15',
        open: 150.5,
        high: 153.0,
        low: 149.8,
        close: 152.3,
        volume: 15000000,
      };
      await repository.create(testStockId, csvRow);

      const exists = await repository.existsByDate(testStockId, '2024-01-15');

      expect(exists).toBe(true);
    });

    it('データが存在しない場合falseを返す', async () => {
      const exists = await repository.existsByDate(testStockId, '2024-01-15');

      expect(exists).toBe(false);
    });
  });

  describe('upsert', () => {
    it('データが存在しない場合、新規作成する', async () => {
      const csvRow: CsvRow = {
        date: '2024-01-15',
        open: 150.5,
        high: 153.0,
        low: 149.8,
        close: 152.3,
        volume: 15000000,
      };

      const result = await repository.upsert(testStockId, csvRow);

      expect(result.stockId).toBe(testStockId);
      expect(result.openPrice.toString()).toBe('150.5');
      expect(result.highPrice.toString()).toBe('153');
      expect(result.lowPrice.toString()).toBe('149.8');
      expect(result.closePrice.toString()).toBe('152.3');
      expect(result.volume.toString()).toBe('15000000');
    });

    it('データが存在する場合、更新する', async () => {
      // 既存データを挿入
      const csvRow1: CsvRow = {
        date: '2024-01-15',
        open: 150.5,
        high: 153.0,
        low: 149.8,
        close: 152.3,
        volume: 15000000,
      };
      await repository.create(testStockId, csvRow1);

      // 同じ日付で異なるデータでupsert
      const csvRow2: CsvRow = {
        date: '2024-01-15',
        open: 155.0,
        high: 158.0,
        low: 154.0,
        close: 157.0,
        volume: 20000000,
      };
      const result = await repository.upsert(testStockId, csvRow2);

      expect(result.openPrice.toString()).toBe('155');
      expect(result.highPrice.toString()).toBe('158');
      expect(result.lowPrice.toString()).toBe('154');
      expect(result.closePrice.toString()).toBe('157');
      expect(result.volume.toString()).toBe('20000000');
    });
  });

  describe('createMany', () => {
    it('複数のデータを一括作成できる', async () => {
      const csvRows: CsvRow[] = [
        {
          date: '2024-01-15',
          open: 150.5,
          high: 153.0,
          low: 149.8,
          close: 152.3,
          volume: 15000000,
        },
        {
          date: '2024-01-16',
          open: 152.3,
          high: 153.5,
          low: 150.5,
          close: 151.0,
          volume: 14500000,
        },
        {
          date: '2024-01-17',
          open: 151.0,
          high: 152.8,
          low: 150.2,
          close: 152.5,
          volume: 13800000,
        },
      ];

      const count = await repository.createMany(testStockId, csvRows);

      expect(count).toBe(3);

      // データが正しく挿入されたか確認
      const allPrices = await repository.findByStockIdAndDateRange(testStockId);
      expect(allPrices).toHaveLength(3);
    });

    it('重複データはスキップする', async () => {
      // 既存データを挿入
      const csvRow1: CsvRow = {
        date: '2024-01-15',
        open: 150.5,
        high: 153.0,
        low: 149.8,
        close: 152.3,
        volume: 15000000,
      };
      await repository.create(testStockId, csvRow1);

      // 重複を含むデータで一括作成
      const csvRows: CsvRow[] = [
        csvRow1, // 重複
        {
          date: '2024-01-16',
          open: 152.3,
          high: 153.5,
          low: 150.5,
          close: 151.0,
          volume: 14500000,
        },
      ];

      const count = await repository.createMany(testStockId, csvRows);

      expect(count).toBe(1); // 重複はスキップされるため1件のみ

      const allPrices = await repository.findByStockIdAndDateRange(testStockId);
      expect(allPrices).toHaveLength(2);
    });
  });

  describe('deleteByDateRange', () => {
    beforeEach(async () => {
      // テストデータを複数挿入
      const csvRows: CsvRow[] = [
        { date: '2024-01-10', open: 100, high: 105, low: 99, close: 103, volume: 1000000 },
        { date: '2024-01-15', open: 103, high: 108, low: 102, close: 106, volume: 1100000 },
        { date: '2024-01-20', open: 106, high: 110, low: 105, close: 109, volume: 1200000 },
        { date: '2024-01-25', open: 109, high: 112, low: 108, close: 111, volume: 1300000 },
      ];
      await repository.createMany(testStockId, csvRows);
    });

    it('指定範囲のデータを削除できる', async () => {
      const deletedCount = await repository.deleteByDateRange(
        testStockId,
        '2024-01-15',
        '2024-01-20'
      );

      expect(deletedCount).toBe(2);

      const remainingPrices = await repository.findByStockIdAndDateRange(testStockId);
      expect(remainingPrices).toHaveLength(2);
      expect(remainingPrices[0].tradeDate.toISOString().split('T')[0]).toBe('2024-01-10');
      expect(remainingPrices[1].tradeDate.toISOString().split('T')[0]).toBe('2024-01-25');
    });

    it('開始日のみ指定した場合、それ以降のデータを削除する', async () => {
      const deletedCount = await repository.deleteByDateRange(
        testStockId,
        '2024-01-20'
      );

      expect(deletedCount).toBe(2);

      const remainingPrices = await repository.findByStockIdAndDateRange(testStockId);
      expect(remainingPrices).toHaveLength(2);
    });

    it('終了日のみ指定した場合、それ以前のデータを削除する', async () => {
      const deletedCount = await repository.deleteByDateRange(
        testStockId,
        undefined,
        '2024-01-15'
      );

      expect(deletedCount).toBe(2);

      const remainingPrices = await repository.findByStockIdAndDateRange(testStockId);
      expect(remainingPrices).toHaveLength(2);
    });

    it('日付指定なしの場合、全データを削除する', async () => {
      const deletedCount = await repository.deleteByDateRange(testStockId);

      expect(deletedCount).toBe(4);

      const remainingPrices = await repository.findByStockIdAndDateRange(testStockId);
      expect(remainingPrices).toHaveLength(0);
    });
  });

  describe('findByStockIdAndDateRange', () => {
    beforeEach(async () => {
      // テストデータを複数挿入
      const csvRows: CsvRow[] = [
        { date: '2024-01-10', open: 100, high: 105, low: 99, close: 103, volume: 1000000 },
        { date: '2024-01-15', open: 103, high: 108, low: 102, close: 106, volume: 1100000 },
        { date: '2024-01-20', open: 106, high: 110, low: 105, close: 109, volume: 1200000 },
      ];
      await repository.createMany(testStockId, csvRows);
    });

    it('指定範囲のデータを取得できる', async () => {
      const prices = await repository.findByStockIdAndDateRange(
        testStockId,
        new Date('2024-01-15'),
        new Date('2024-01-20')
      );

      expect(prices).toHaveLength(2);
      expect(prices[0].tradeDate.toISOString().split('T')[0]).toBe('2024-01-15');
      expect(prices[1].tradeDate.toISOString().split('T')[0]).toBe('2024-01-20');
    });

    it('日付範囲指定なしで全データを取得できる', async () => {
      const prices = await repository.findByStockIdAndDateRange(testStockId);

      expect(prices).toHaveLength(3);
    });

    it('取引日の昇順でソートされる', async () => {
      const prices = await repository.findByStockIdAndDateRange(testStockId);

      expect(prices[0].tradeDate.toISOString().split('T')[0]).toBe('2024-01-10');
      expect(prices[1].tradeDate.toISOString().split('T')[0]).toBe('2024-01-15');
      expect(prices[2].tradeDate.toISOString().split('T')[0]).toBe('2024-01-20');
    });
  });

  describe('count', () => {
    it('データ件数を取得できる', async () => {
      const csvRows: CsvRow[] = [
        { date: '2024-01-15', open: 150.5, high: 153.0, low: 149.8, close: 152.3, volume: 15000000 },
        { date: '2024-01-16', open: 152.3, high: 153.5, low: 150.5, close: 151.0, volume: 14500000 },
      ];
      await repository.createMany(testStockId, csvRows);

      const count = await repository.count(testStockId);

      expect(count).toBe(2);
    });

    it('データがない場合0を返す', async () => {
      const count = await repository.count(testStockId);

      expect(count).toBe(0);
    });
  });
});
