/**
 * 株マスタバリデーションスキーマのユニットテスト
 */

import { describe, it, expect } from 'vitest';
import { createStockSchema, stockIdParamSchema } from './stockSchemas';

describe('createStockSchema', () => {
  describe('正常系', () => {
    it('有効な銘柄コード（数値4桁）と銘柄名を受け入れる', () => {
      const input = {
        stockCode: '7203',
        stockName: 'トヨタ自動車',
      };

      const result = createStockSchema.parse(input);

      expect(result).toEqual({
        stockCode: '7203',
        stockName: 'トヨタ自動車',
      });
    });

    it('有効な銘柄コード（英字4桁）と銘柄名を受け入れる', () => {
      const input = {
        stockCode: 'AAPL',
        stockName: 'Apple Inc.',
      };

      const result = createStockSchema.parse(input);

      expect(result).toEqual({
        stockCode: 'AAPL',
        stockName: 'Apple Inc.',
      });
    });

    it('小文字の銘柄コードを大文字に変換する', () => {
      const input = {
        stockCode: 'aapl',
        stockName: 'Apple Inc.',
      };

      const result = createStockSchema.parse(input);

      expect(result.stockCode).toBe('AAPL');
    });

    it('銘柄名の前後の空白をトリムする', () => {
      const input = {
        stockCode: '7203',
        stockName: '  トヨタ自動車  ',
      };

      const result = createStockSchema.parse(input);

      expect(result.stockName).toBe('トヨタ自動車');
    });

    it('英数字混在の銘柄コードを受け入れる', () => {
      const input = {
        stockCode: 'A123',
        stockName: 'Test Company',
      };

      const result = createStockSchema.parse(input);

      expect(result.stockCode).toBe('A123');
    });

    it('100文字の銘柄名を受け入れる', () => {
      const input = {
        stockCode: '7203',
        stockName: 'あ'.repeat(100),
      };

      const result = createStockSchema.parse(input);

      expect(result.stockName.length).toBe(100);
    });
  });

  describe('異常系 - 銘柄コード', () => {
    it('3桁の銘柄コードを拒否する', () => {
      const input = {
        stockCode: '720',
        stockName: 'トヨタ自動車',
      };

      expect(() => createStockSchema.parse(input)).toThrow();
    });

    it('5桁の銘柄コードを拒否する', () => {
      const input = {
        stockCode: '72031',
        stockName: 'トヨタ自動車',
      };

      expect(() => createStockSchema.parse(input)).toThrow();
    });

    it('空の銘柄コードを拒否する', () => {
      const input = {
        stockCode: '',
        stockName: 'トヨタ自動車',
      };

      expect(() => createStockSchema.parse(input)).toThrow();
    });

    it('特殊文字を含む銘柄コードを拒否する', () => {
      const input = {
        stockCode: '72@3',
        stockName: 'トヨタ自動車',
      };

      expect(() => createStockSchema.parse(input)).toThrow();
    });

    it('銘柄コードが未定義の場合を拒否する', () => {
      const input = {
        stockName: 'トヨタ自動車',
      };

      expect(() => createStockSchema.parse(input)).toThrow();
    });
  });

  describe('異常系 - 銘柄名', () => {
    it('空の銘柄名を拒否する', () => {
      const input = {
        stockCode: '7203',
        stockName: '',
      };

      expect(() => createStockSchema.parse(input)).toThrow();
    });

    it('101文字の銘柄名を拒否する', () => {
      const input = {
        stockCode: '7203',
        stockName: 'あ'.repeat(101),
      };

      expect(() => createStockSchema.parse(input)).toThrow();
    });

    it('銘柄名が未定義の場合を拒否する', () => {
      const input = {
        stockCode: '7203',
      };

      expect(() => createStockSchema.parse(input)).toThrow();
    });
  });
});

describe('stockIdParamSchema', () => {
  describe('正常系', () => {
    it('数値文字列を受け入れる', () => {
      const input = { stockId: '123' };

      const result = stockIdParamSchema.parse(input);

      expect(result).toEqual({ stockId: '123' });
    });

    it('大きな数値文字列を受け入れる', () => {
      const input = { stockId: '999999' };

      const result = stockIdParamSchema.parse(input);

      expect(result).toEqual({ stockId: '999999' });
    });
  });

  describe('異常系', () => {
    it('英字を含む文字列を拒否する', () => {
      const input = { stockId: 'abc' };

      expect(() => stockIdParamSchema.parse(input)).toThrow();
    });

    it('小数点を含む文字列を拒否する', () => {
      const input = { stockId: '12.34' };

      expect(() => stockIdParamSchema.parse(input)).toThrow();
    });

    it('負の数を拒否する', () => {
      const input = { stockId: '-123' };

      expect(() => stockIdParamSchema.parse(input)).toThrow();
    });

    it('空文字列を拒否する', () => {
      const input = { stockId: '' };

      expect(() => stockIdParamSchema.parse(input)).toThrow();
    });
  });
});
