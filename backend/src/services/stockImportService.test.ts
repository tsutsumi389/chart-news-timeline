/**
 * 株価インポートサービスの統合テスト
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { stockImportService } from './stockImportService';
import { stockRepository } from '../repositories/stockRepository';
import { stockPriceRepository } from '../repositories/stockPriceRepository';
import { getPrismaClient, disconnectDatabase } from '../config/database';

describe('StockImportService', () => {
  let testStockId: number;
  const testStockCode = '9999';

  beforeAll(async () => {
    // テスト用銘柄を作成
    const stock = await stockRepository.create(testStockCode, 'テスト銘柄');
    testStockId = stock.stockId;
  });

  afterAll(async () => {
    // テストデータクリーンアップ
    await stockPriceRepository.deleteAll(testStockId);
    await stockRepository.delete(testStockId);
    await disconnectDatabase();
  });

  describe('importFromCsv', () => {
    it('正常なCSVファイルをインポートできる', async () => {
      const csvContent = `日付,始値,高値,安値,終値,出来高
2024-01-15,150.5,153.0,149.8,152.3,15000000
2024-01-16,152.3,153.5,150.5,151.0,14500000
2024-01-17,151.0,152.8,150.2,152.5,13800000`;

      const result = await stockImportService.importFromCsv(
        testStockCode,
        csvContent,
        'skip'
      );

      expect(result.success).toBe(undefined); // ImportResultにはsuccessプロパティがない
      expect(result.stockCode).toBe(testStockCode);
      expect(result.stockName).toBe('テスト銘柄');
      expect(result.totalRows).toBe(3);
      expect(result.successCount).toBe(3);
      expect(result.skipCount).toBe(0);
      expect(result.errorCount).toBe(0);
      expect(result.errors).toHaveLength(0);

      // データベースに登録されたか確認
      const count = await stockPriceRepository.count(testStockId);
      expect(count).toBe(3);
    });

    it('重複データをスキップする（skip戦略）', async () => {
      const csvContent = `日付,始値,高値,安値,終値,出来高
2024-01-15,150.5,153.0,149.8,152.3,15000000
2024-01-18,155.0,156.0,154.0,155.5,18000000`;

      const result = await stockImportService.importFromCsv(
        testStockCode,
        csvContent,
        'skip'
      );

      expect(result.totalRows).toBe(2);
      expect(result.successCount).toBe(1); // 1件は新規
      expect(result.skipCount).toBe(1); // 1件はスキップ
      expect(result.errorCount).toBe(0);

      // データベースの件数を確認（3 + 1 = 4件）
      const count = await stockPriceRepository.count(testStockId);
      expect(count).toBe(4);
    });

    it('重複データを上書きする（overwrite戦略）', async () => {
      const csvContent = `日付,始値,高値,安値,終値,出来高
2024-01-15,160.0,162.0,159.0,161.0,20000000`;

      const result = await stockImportService.importFromCsv(
        testStockCode,
        csvContent,
        'overwrite'
      );

      expect(result.totalRows).toBe(1);
      expect(result.successCount).toBe(1);
      expect(result.skipCount).toBe(0);
      expect(result.errorCount).toBe(0);

      // データが上書きされたか確認
      const prices = await stockPriceRepository.findByStockIdAndDateRange(
        testStockId,
        new Date('2024-01-15'),
        new Date('2024-01-15')
      );
      expect(prices).toHaveLength(1);
      expect(Number(prices[0].openPrice)).toBe(160.0);
    });

    it('バリデーションエラーを検出する', async () => {
      const csvContent = `日付,始値,高値,安値,終値,出来高
2024-02-01,150.0,149.0,148.0,151.0,10000000
2024-02-02,152.0,155.0,151.0,154.0,12000000`;

      const result = await stockImportService.importFromCsv(
        testStockCode,
        csvContent,
        'overwrite' // overwriteモードで重複を気にせずテスト
      );

      // totalRowsはvalidRowsの数（バリデーション通過した行数）
      expect(result.totalRows).toBe(1);
      expect(result.successCount).toBe(1); // 2行目のみ成功
      expect(result.errorCount).toBe(1); // 1行目はバリデーションエラー（高値 < 始値）
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].message).toContain('高値');
    });

    it('存在しない銘柄コードでエラーになる', async () => {
      const csvContent = `日付,始値,高値,安値,終値,出来高
2024-01-15,150.5,153.0,149.8,152.3,15000000`;

      await expect(
        stockImportService.importFromCsv('0000', csvContent, 'skip')
      ).rejects.toThrow('銘柄コード 0000 が見つかりません');
    });

    it('不正なCSVフォーマットでエラーになる', async () => {
      const csvContent = `invalid,header,format
2024-01-15,150.5,153.0,149.8,152.3,15000000`;

      await expect(
        stockImportService.importFromCsv(testStockCode, csvContent, 'skip')
      ).rejects.toThrow('CSVヘッダー');
    });

    it('空のCSVファイルでエラーになる', async () => {
      const csvContent = '';

      await expect(
        stockImportService.importFromCsv(testStockCode, csvContent, 'skip')
      ).rejects.toThrow('CSVファイルが空です');
    });
  });
});
