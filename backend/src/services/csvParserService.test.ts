/**
 * CSVパーサーサービスのテスト
 */

import { describe, it, expect } from 'vitest';
import { CsvParserService } from './csvParserService';

describe('CsvParserService', () => {
  const parser = new CsvParserService();

  describe('parse', () => {
    it('正常なCSVをパースできる', async () => {
      const csv = `日付,始値,高値,安値,終値,出来高
2024-01-15,150.5,153.0,149.8,152.3,15000000
2024-01-16,152.3,153.5,150.5,151.0,14500000`;

      const result = await parser.parse(csv);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        date: '2024-01-15',
        open: 150.5,
        high: 153.0,
        low: 149.8,
        close: 152.3,
        volume: 15000000,
      });
      expect(result[1]).toEqual({
        date: '2024-01-16',
        open: 152.3,
        high: 153.5,
        low: 150.5,
        close: 151.0,
        volume: 14500000,
      });
    });

    it('空白行を無視する', async () => {
      const csv = `日付,始値,高値,安値,終値,出来高
2024-01-15,150.5,153.0,149.8,152.3,15000000

2024-01-16,152.3,153.5,150.5,151.0,14500000
`;

      const result = await parser.parse(csv);

      expect(result).toHaveLength(2);
    });

    it('Windows形式の改行コード（CRLF）を処理できる', async () => {
      const csv = `日付,始値,高値,安値,終値,出来高\r\n2024-01-15,150.5,153.0,149.8,152.3,15000000\r\n`;

      const result = await parser.parse(csv);

      expect(result).toHaveLength(1);
      expect(result[0].date).toBe('2024-01-15');
    });

    it('空のCSVファイルでエラーを投げる', async () => {
      const csv = '';

      await expect(parser.parse(csv)).rejects.toThrow('CSVファイルが空です');
    });

    it('ヘッダーのみでデータ行がない場合は空配列を返す', async () => {
      const csv = '日付,始値,高値,安値,終値,出来高';

      const result = await parser.parse(csv);

      expect(result).toHaveLength(0);
    });

    it('ヘッダーの列数が不正な場合エラーを投げる', async () => {
      const csv = `日付,始値,高値,安値,終値
2024-01-15,150.5,153.0,149.8,152.3,15000000`;

      await expect(parser.parse(csv)).rejects.toThrow('CSVヘッダーの列数が不正です');
    });

    it('ヘッダーの名前が不正な場合エラーを投げる', async () => {
      const csv = `Date,始値,高値,安値,終値,出来高
2024-01-15,150.5,153.0,149.8,152.3,15000000`;

      await expect(parser.parse(csv)).rejects.toThrow('CSVヘッダーが不正です');
    });

    it('データ行の列数が不正な場合エラーを投げる', async () => {
      const csv = `日付,始値,高値,安値,終値,出来高
2024-01-15,150.5,153.0,149.8,152.3`;

      await expect(parser.parse(csv)).rejects.toThrow('列数が不正です');
    });

    it('日付が空の場合エラーを投げる', async () => {
      const csv = `日付,始値,高値,安値,終値,出来高
,150.5,153.0,149.8,152.3,15000000`;

      await expect(parser.parse(csv)).rejects.toThrow('日付が空です');
    });

    it('始値が数値でない場合エラーを投げる', async () => {
      const csv = `日付,始値,高値,安値,終値,出来高
2024-01-15,abc,153.0,149.8,152.3,15000000`;

      await expect(parser.parse(csv)).rejects.toThrow('始値が数値ではありません');
    });

    it('高値が数値でない場合エラーを投げる', async () => {
      const csv = `日付,始値,高値,安値,終値,出来高
2024-01-15,150.5,xyz,149.8,152.3,15000000`;

      await expect(parser.parse(csv)).rejects.toThrow('高値が数値ではありません');
    });

    it('安値が数値でない場合エラーを投げる', async () => {
      const csv = `日付,始値,高値,安値,終値,出来高
2024-01-15,150.5,153.0,abc,152.3,15000000`;

      await expect(parser.parse(csv)).rejects.toThrow('安値が数値ではありません');
    });

    it('終値が数値でない場合エラーを投げる', async () => {
      const csv = `日付,始値,高値,安値,終値,出来高
2024-01-15,150.5,153.0,149.8,xyz,15000000`;

      await expect(parser.parse(csv)).rejects.toThrow('終値が数値ではありません');
    });

    it('出来高が整数でない場合エラーを投げる', async () => {
      const csv = `日付,始値,高値,安値,終値,出来高
2024-01-15,150.5,153.0,149.8,152.3,abc`;

      await expect(parser.parse(csv)).rejects.toThrow('出来高が整数ではありません');
    });

    it('値の前後の空白を除去する', async () => {
      const csv = `日付,始値,高値,安値,終値,出来高
 2024-01-15 , 150.5 , 153.0 , 149.8 , 152.3 , 15000000 `;

      const result = await parser.parse(csv);

      expect(result).toHaveLength(1);
      expect(result[0].date).toBe('2024-01-15');
      expect(result[0].open).toBe(150.5);
    });
  });
});
