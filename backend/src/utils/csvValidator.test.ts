/**
 * CSVバリデーターのテスト
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { CsvValidator } from './csvValidator';
import { CsvRow } from '../types/import';

describe('CsvValidator', () => {
  const validator = new CsvValidator();
  let today: Date;

  beforeAll(() => {
    // テスト実行時の今日の日付を取得
    today = new Date();
    today.setHours(0, 0, 0, 0);
  });

  describe('validate - 正常系', () => {
    it('正常なデータでnullを返す', () => {
      const row: CsvRow = {
        date: '2024-01-15',
        open: 150.5,
        high: 153.0,
        low: 149.8,
        close: 152.3,
        volume: 15000000,
      };

      const result = validator.validate(row);

      expect(result).toBeNull();
    });

    it('始値=高値、終値=安値でもエラーにならない', () => {
      const row: CsvRow = {
        date: '2024-01-15',
        open: 150.0,
        high: 150.0,
        low: 145.0,
        close: 145.0,
        volume: 10000000,
      };

      const result = validator.validate(row);

      expect(result).toBeNull();
    });

    it('出来高0でもエラーにならない', () => {
      const row: CsvRow = {
        date: '2024-01-15',
        open: 150.5,
        high: 153.0,
        low: 149.8,
        close: 152.3,
        volume: 0,
      };

      const result = validator.validate(row);

      expect(result).toBeNull();
    });
  });

  describe('validate - 日付バリデーション', () => {
    it('日付形式が不正な場合エラーを返す（スラッシュ区切り）', () => {
      const row: CsvRow = {
        date: '2024/01/15',
        open: 150.5,
        high: 153.0,
        low: 149.8,
        close: 152.3,
        volume: 15000000,
      };

      const result = validator.validate(row);

      expect(result).toBe('日付形式が不正です（YYYY-MM-DD形式で入力してください）');
    });

    it('日付形式が不正な場合エラーを返す（ドット区切り）', () => {
      const row: CsvRow = {
        date: '2024.01.15',
        open: 150.5,
        high: 153.0,
        low: 149.8,
        close: 152.3,
        volume: 15000000,
      };

      const result = validator.validate(row);

      expect(result).toBe('日付形式が不正です（YYYY-MM-DD形式で入力してください）');
    });

    it('無効な日付の場合エラーを返す（2月30日）', () => {
      const row: CsvRow = {
        date: '2024-02-30',
        open: 150.5,
        high: 153.0,
        low: 149.8,
        close: 152.3,
        volume: 15000000,
      };

      const result = validator.validate(row);

      expect(result).toBe('無効な日付です');
    });

    it('未来の日付の場合エラーを返す', () => {
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];

      const row: CsvRow = {
        date: tomorrowStr,
        open: 150.5,
        high: 153.0,
        low: 149.8,
        close: 152.3,
        volume: 15000000,
      };

      const result = validator.validate(row);

      expect(result).toBe('未来の日付は指定できません');
    });

    it('1900年以前の日付の場合エラーを返す', () => {
      const row: CsvRow = {
        date: '1899-12-31',
        open: 150.5,
        high: 153.0,
        low: 149.8,
        close: 152.3,
        volume: 15000000,
      };

      const result = validator.validate(row);

      expect(result).toBe('1900年以前の日付は指定できません');
    });
  });

  describe('validate - 価格バリデーション', () => {
    it('始値が0以下の場合エラーを返す', () => {
      const row: CsvRow = {
        date: '2024-01-15',
        open: 0,
        high: 153.0,
        low: 149.8,
        close: 152.3,
        volume: 15000000,
      };

      const result = validator.validate(row);

      expect(result).toBe('始値は正の数値である必要があります');
    });

    it('高値が0以下の場合エラーを返す', () => {
      const row: CsvRow = {
        date: '2024-01-15',
        open: 150.5,
        high: -1,
        low: 149.8,
        close: 152.3,
        volume: 15000000,
      };

      const result = validator.validate(row);

      expect(result).toBe('高値は正の数値である必要があります');
    });

    it('安値が0以下の場合エラーを返す', () => {
      const row: CsvRow = {
        date: '2024-01-15',
        open: 150.5,
        high: 153.0,
        low: 0,
        close: 152.3,
        volume: 15000000,
      };

      const result = validator.validate(row);

      expect(result).toBe('安値は正の数値である必要があります');
    });

    it('終値が0以下の場合エラーを返す', () => {
      const row: CsvRow = {
        date: '2024-01-15',
        open: 150.5,
        high: 153.0,
        low: 149.8,
        close: -100,
        volume: 15000000,
      };

      const result = validator.validate(row);

      expect(result).toBe('終値は正の数値である必要があります');
    });
  });

  describe('validate - OHLC関係性バリデーション', () => {
    it('高値が安値より低い場合エラーを返す', () => {
      const row: CsvRow = {
        date: '2024-01-15',
        open: 150.5,
        high: 149.0,  // 高値 < 安値
        low: 150.0,
        close: 150.2,
        volume: 15000000,
      };

      const result = validator.validate(row);

      expect(result).toBe('高値が安値より低い値です');
    });

    it('高値が始値より低い場合エラーを返す', () => {
      const row: CsvRow = {
        date: '2024-01-15',
        open: 155.0,
        high: 153.0,  // 高値 < 始値
        low: 149.8,
        close: 152.3,
        volume: 15000000,
      };

      const result = validator.validate(row);

      expect(result).toBe('高値が始値より低い値です');
    });

    it('高値が終値より低い場合エラーを返す', () => {
      const row: CsvRow = {
        date: '2024-01-15',
        open: 150.5,
        high: 152.0,  // 高値 < 終値
        low: 149.8,
        close: 155.0,
        volume: 15000000,
      };

      const result = validator.validate(row);

      expect(result).toBe('高値が終値より低い値です');
    });

    it('安値が始値より高い場合エラーを返す', () => {
      const row: CsvRow = {
        date: '2024-01-15',
        open: 148.0,
        high: 153.0,
        low: 149.8,  // 安値 > 始値
        close: 152.3,
        volume: 15000000,
      };

      const result = validator.validate(row);

      expect(result).toBe('安値が始値より高い値です');
    });

    it('安値が終値より高い場合エラーを返す', () => {
      const row: CsvRow = {
        date: '2024-01-15',
        open: 153.0,
        high: 155.0,
        low: 152.0,  // 安値 > 終値
        close: 151.0,
        volume: 15000000,
      };

      const result = validator.validate(row);

      expect(result).toBe('安値が終値より高い値です');
    });

    it('値幅が異常に大きい場合エラーを返す', () => {
      const row: CsvRow = {
        date: '2024-01-15',
        open: 100.0,
        high: 200.0,  // 100%の値動き
        low: 50.0,
        close: 150.0,
        volume: 15000000,
      };

      const result = validator.validate(row);

      expect(result).toBe('1日の値動きが異常に大きいです（データを確認してください）');
    });
  });

  describe('validate - 出来高バリデーション', () => {
    it('出来高が負の場合エラーを返す', () => {
      const row: CsvRow = {
        date: '2024-01-15',
        open: 150.5,
        high: 153.0,
        low: 149.8,
        close: 152.3,
        volume: -1000,
      };

      const result = validator.validate(row);

      expect(result).toBe('出来高は0以上である必要があります');
    });

    it('出来高が整数でない場合エラーを返す', () => {
      const row: CsvRow = {
        date: '2024-01-15',
        open: 150.5,
        high: 153.0,
        low: 149.8,
        close: 152.3,
        volume: 15000000.5,
      };

      const result = validator.validate(row);

      expect(result).toBe('出来高は整数である必要があります');
    });

    it('出来高が異常に大きい場合エラーを返す', () => {
      const row: CsvRow = {
        date: '2024-01-15',
        open: 150.5,
        high: 153.0,
        low: 149.8,
        close: 152.3,
        volume: 2_000_000_000_000, // 2兆
      };

      const result = validator.validate(row);

      expect(result).toBe('出来高が異常に大きいです（データを確認してください）');
    });
  });
});
