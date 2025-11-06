/**
 * ニュースCSVパーサーサービスのテスト
 */

import { describe, it, expect } from 'vitest';
import { NewsCsvParserService } from './newsCsvParserService';

describe('NewsCsvParserService', () => {
  const parser = new NewsCsvParserService();

  describe('parse', () => {
    it('正常なCSVをパースできる', async () => {
      const csv = `公開日時,タイトル,要約,URL,ソース,センチメント,センチメントスコア
2024-01-15 09:00:00,トヨタ、2024年世界販売台数で過去最高を記録,2024年の世界販売台数が前年比7%増となり、過去最高を更新した。,https://example.com/news/1,日経新聞,positive,0.85
2024-01-16 14:30:00,トヨタ、米国工場で生産一時停止,部品供給の遅延により、米国の一部工場で生産を一時停止する。,https://example.com/news/2,Bloomberg,negative,-0.60`;

      const result = await parser.parse(csv);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        publishedAt: '2024-01-15 09:00:00',
        title: 'トヨタ、2024年世界販売台数で過去最高を記録',
        summary: '2024年の世界販売台数が前年比7%増となり、過去最高を更新した。',
        url: 'https://example.com/news/1',
        source: '日経新聞',
        sentiment: 'positive',
        sentimentScore: 0.85,
      });
      expect(result[1]).toEqual({
        publishedAt: '2024-01-16 14:30:00',
        title: 'トヨタ、米国工場で生産一時停止',
        summary: '部品供給の遅延により、米国の一部工場で生産を一時停止する。',
        url: 'https://example.com/news/2',
        source: 'Bloomberg',
        sentiment: 'negative',
        sentimentScore: -0.60,
      });
    });

    it('任意項目が空の場合でもパースできる', async () => {
      const csv = `公開日時,タイトル,要約,URL,ソース,センチメント,センチメントスコア
2024-01-15 09:00:00,トヨタ、新モデル発表,,,,,`;

      const result = await parser.parse(csv);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        publishedAt: '2024-01-15 09:00:00',
        title: 'トヨタ、新モデル発表',
        summary: undefined,
        url: undefined,
        source: undefined,
        sentiment: 'neutral',
        sentimentScore: undefined,
      });
    });

    it('ダブルクォートで囲まれた値をパースできる', async () => {
      const csv = `公開日時,タイトル,要約,URL,ソース,センチメント,センチメントスコア
"2024-01-15 09:00:00","トヨタ、2024年世界販売台数で過去最高を記録","2024年の世界販売台数が前年比7%増となり、過去最高を更新した。","https://example.com/news/1","日経新聞","positive","0.85"`;

      const result = await parser.parse(csv);

      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('トヨタ、2024年世界販売台数で過去最高を記録');
      expect(result[0].sentiment).toBe('positive');
    });

    it('カンマを含むタイトルをパースできる', async () => {
      const csv = `公開日時,タイトル,要約,URL,ソース,センチメント,センチメントスコア
2024-01-15 09:00:00,"トヨタ、ホンダ、日産が提携",提携内容の詳細,https://example.com/news/1,日経新聞,positive,0.70`;

      const result = await parser.parse(csv);

      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('トヨタ、ホンダ、日産が提携');
    });

    it('ダブルクォートのエスケープ（""）を処理できる', async () => {
      const csv = `公開日時,タイトル,要約,URL,ソース,センチメント,センチメントスコア
2024-01-15 09:00:00,"トヨタが""新時代""を宣言",詳細内容,https://example.com/news/1,日経新聞,positive,0.75`;

      const result = await parser.parse(csv);

      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('トヨタが"新時代"を宣言');
    });

    it('空白行を無視する', async () => {
      const csv = `公開日時,タイトル,要約,URL,ソース,センチメント,センチメントスコア
2024-01-15 09:00:00,トヨタ、新モデル発表,,,,,

2024-01-16 14:30:00,トヨタ、工場建設,,,,,
`;

      const result = await parser.parse(csv);

      expect(result).toHaveLength(2);
    });

    it('Windows形式の改行コード（CRLF）を処理できる', async () => {
      const csv = `公開日時,タイトル,要約,URL,ソース,センチメント,センチメントスコア\r\n2024-01-15 09:00:00,トヨタ、新モデル発表,,,,,\r\n`;

      const result = await parser.parse(csv);

      expect(result).toHaveLength(1);
      expect(result[0].publishedAt).toBe('2024-01-15 09:00:00');
    });

    it('不正なセンチメント値の場合neutralにフォールバック', async () => {
      const csv = `公開日時,タイトル,要約,URL,ソース,センチメント,センチメントスコア
2024-01-15 09:00:00,トヨタ、新モデル発表,,,,invalid,0.50`;

      const result = await parser.parse(csv);

      expect(result).toHaveLength(1);
      expect(result[0].sentiment).toBe('neutral');
    });

    it('センチメントスコアが数値でない場合undefinedになる', async () => {
      const csv = `公開日時,タイトル,要約,URL,ソース,センチメント,センチメントスコア
2024-01-15 09:00:00,トヨタ、新モデル発表,,,,positive,invalid`;

      const result = await parser.parse(csv);

      expect(result).toHaveLength(1);
      expect(result[0].sentimentScore).toBeUndefined();
    });

    it('空のCSVファイルでエラーを投げる', async () => {
      const csv = '';

      await expect(parser.parse(csv)).rejects.toThrow('CSVファイルが空です');
    });

    it('ヘッダーのみでデータ行がない場合は空配列を返す', async () => {
      const csv = '公開日時,タイトル,要約,URL,ソース,センチメント,センチメントスコア';

      const result = await parser.parse(csv);

      expect(result).toHaveLength(0);
    });

    it('ヘッダーの列数が不正な場合エラーを投げる', async () => {
      const csv = `公開日時,タイトル,要約,URL,ソース
2024-01-15 09:00:00,トヨタ、新モデル発表,,,,,`;

      await expect(parser.parse(csv)).rejects.toThrow('CSVヘッダーの列数が不正です');
    });

    it('ヘッダーの名前が不正な場合エラーを投げる', async () => {
      const csv = `PublishedAt,タイトル,要約,URL,ソース,センチメント,センチメントスコア
2024-01-15 09:00:00,トヨタ、新モデル発表,,,,,`;

      await expect(parser.parse(csv)).rejects.toThrow('CSVヘッダーが不正です');
    });

    it('データ行の列数が不正な場合エラーを投げる', async () => {
      const csv = `公開日時,タイトル,要約,URL,ソース,センチメント,センチメントスコア
2024-01-15 09:00:00,トヨタ、新モデル発表`;

      await expect(parser.parse(csv)).rejects.toThrow('列数が不正です');
    });

    it('公開日時が空の場合エラーを投げる', async () => {
      const csv = `公開日時,タイトル,要約,URL,ソース,センチメント,センチメントスコア
,トヨタ、新モデル発表,,,,,`;

      await expect(parser.parse(csv)).rejects.toThrow('公開日時が空です');
    });

    it('タイトルが空の場合エラーを投げる', async () => {
      const csv = `公開日時,タイトル,要約,URL,ソース,センチメント,センチメントスコア
2024-01-15 09:00:00,,,,,,`;

      await expect(parser.parse(csv)).rejects.toThrow('タイトルが空です');
    });

    it('ISO 8601形式の日時をパースできる', async () => {
      const csv = `公開日時,タイトル,要約,URL,ソース,センチメント,センチメントスコア
2024-01-15T09:00:00+09:00,トヨタ、新モデル発表,,,,,`;

      const result = await parser.parse(csv);

      expect(result).toHaveLength(1);
      expect(result[0].publishedAt).toBe('2024-01-15T09:00:00+09:00');
    });

    it('大文字小文字を区別せずセンチメントをパース', async () => {
      const csv = `公開日時,タイトル,要約,URL,ソース,センチメント,センチメントスコア
2024-01-15 09:00:00,ニュース1,,,,POSITIVE,0.80
2024-01-16 09:00:00,ニュース2,,,,Negative,-0.60
2024-01-17 09:00:00,ニュース3,,,,NEUTRAL,0.00`;

      const result = await parser.parse(csv);

      expect(result).toHaveLength(3);
      expect(result[0].sentiment).toBe('positive');
      expect(result[1].sentiment).toBe('negative');
      expect(result[2].sentiment).toBe('neutral');
    });
  });
});
