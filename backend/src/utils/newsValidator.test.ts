/**
 * ニュースバリデーターのテスト
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { NewsValidator } from './newsValidator';
import { NewsItem } from '../types/newsImport';

describe('NewsValidator', () => {
  const validator = new NewsValidator();
  let now: Date;

  beforeAll(() => {
    // テスト実行時の現在日時を取得
    now = new Date();
  });

  describe('validate - 正常系', () => {
    it('正常なデータでnullを返す', () => {
      const item: NewsItem = {
        publishedAt: '2024-01-15 09:00:00',
        title: 'トヨタ、2024年世界販売台数で過去最高を記録',
        summary: '2024年の世界販売台数が前年比7%増となり、過去最高を更新した。',
        url: 'https://example.com/news/1',
        source: '日経新聞',
        sentiment: 'positive',
        sentimentScore: 0.85,
      };

      const result = validator.validate(item);

      expect(result).toBeNull();
    });

    it('任意項目が未指定でもnullを返す', () => {
      const item: NewsItem = {
        publishedAt: '2024-01-15 09:00:00',
        title: 'トヨタ、新モデル発表',
      };

      const result = validator.validate(item);

      expect(result).toBeNull();
    });

    it('ISO 8601形式の日時でnullを返す', () => {
      const item: NewsItem = {
        publishedAt: '2024-01-15T09:00:00+09:00',
        title: 'トヨタ、新モデル発表',
      };

      const result = validator.validate(item);

      expect(result).toBeNull();
    });

    it('センチメントスコアが-1.00でnullを返す', () => {
      const item: NewsItem = {
        publishedAt: '2024-01-15 09:00:00',
        title: 'ニュース',
        sentiment: 'negative',
        sentimentScore: -1.0,
      };

      const result = validator.validate(item);

      expect(result).toBeNull();
    });

    it('センチメントスコアが1.00でnullを返す', () => {
      const item: NewsItem = {
        publishedAt: '2024-01-15 09:00:00',
        title: 'ニュース',
        sentiment: 'positive',
        sentimentScore: 1.0,
      };

      const result = validator.validate(item);

      expect(result).toBeNull();
    });

    it('センチメントスコアが0.00でnullを返す', () => {
      const item: NewsItem = {
        publishedAt: '2024-01-15 09:00:00',
        title: 'ニュース',
        sentiment: 'neutral',
        sentimentScore: 0.0,
      };

      const result = validator.validate(item);

      expect(result).toBeNull();
    });
  });

  describe('validate - 公開日時バリデーション', () => {
    it('公開日時が空の場合エラーを返す', () => {
      const item: NewsItem = {
        publishedAt: '',
        title: 'ニュース',
      };

      const result = validator.validate(item);

      expect(result).toBe('公開日時が空です');
    });

    it('公開日時が空白の場合エラーを返す', () => {
      const item: NewsItem = {
        publishedAt: '   ',
        title: 'ニュース',
      };

      const result = validator.validate(item);

      expect(result).toBe('公開日時が空です');
    });

    it('公開日時の形式が不正な場合エラーを返す', () => {
      const item: NewsItem = {
        publishedAt: 'invalid-date',
        title: 'ニュース',
      };

      const result = validator.validate(item);

      expect(result).toBe('公開日時の形式が不正です（YYYY-MM-DD HH:MM:SS形式またはISO 8601形式で入力してください）');
    });

    it('未来の日時の場合エラーを返す', () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);
      const futureDateString = futureDate.toISOString();

      const item: NewsItem = {
        publishedAt: futureDateString,
        title: 'ニュース',
      };

      const result = validator.validate(item);

      expect(result).toBe('未来の日時は指定できません');
    });

    it('1900年以前の日時の場合エラーを返す', () => {
      const item: NewsItem = {
        publishedAt: '1899-12-31 23:59:59',
        title: 'ニュース',
      };

      const result = validator.validate(item);

      expect(result).toBe('1900年以前の日時は指定できません');
    });

    it('1900-01-01 00:00:00はエラーにならない', () => {
      const item: NewsItem = {
        publishedAt: '1900-01-01 00:00:00',
        title: 'ニュース',
      };

      const result = validator.validate(item);

      expect(result).toBeNull();
    });
  });

  describe('validate - タイトルバリデーション', () => {
    it('タイトルが空の場合エラーを返す', () => {
      const item: NewsItem = {
        publishedAt: '2024-01-15 09:00:00',
        title: '',
      };

      const result = validator.validate(item);

      expect(result).toBe('タイトルは必須です');
    });

    it('タイトルが空白の場合エラーを返す', () => {
      const item: NewsItem = {
        publishedAt: '2024-01-15 09:00:00',
        title: '   ',
      };

      const result = validator.validate(item);

      expect(result).toBe('タイトルは必須です');
    });

    it('タイトルが255文字の場合エラーにならない', () => {
      const item: NewsItem = {
        publishedAt: '2024-01-15 09:00:00',
        title: 'a'.repeat(255),
      };

      const result = validator.validate(item);

      expect(result).toBeNull();
    });

    it('タイトルが256文字の場合エラーを返す', () => {
      const item: NewsItem = {
        publishedAt: '2024-01-15 09:00:00',
        title: 'a'.repeat(256),
      };

      const result = validator.validate(item);

      expect(result).toBe('タイトルは255文字以内で入力してください');
    });
  });

  describe('validate - URL形式バリデーション', () => {
    it('httpから始まるURLでエラーにならない', () => {
      const item: NewsItem = {
        publishedAt: '2024-01-15 09:00:00',
        title: 'ニュース',
        url: 'http://example.com/news/1',
      };

      const result = validator.validate(item);

      expect(result).toBeNull();
    });

    it('httpsから始まるURLでエラーにならない', () => {
      const item: NewsItem = {
        publishedAt: '2024-01-15 09:00:00',
        title: 'ニュース',
        url: 'https://example.com/news/1',
      };

      const result = validator.validate(item);

      expect(result).toBeNull();
    });

    it('URLが500文字の場合エラーにならない', () => {
      const item: NewsItem = {
        publishedAt: '2024-01-15 09:00:00',
        title: 'ニュース',
        url: 'https://example.com/' + 'a'.repeat(480),
      };

      const result = validator.validate(item);

      expect(result).toBeNull();
    });

    it('URLが501文字の場合エラーを返す', () => {
      const item: NewsItem = {
        publishedAt: '2024-01-15 09:00:00',
        title: 'ニュース',
        url: 'https://example.com/' + 'a'.repeat(481),
      };

      const result = validator.validate(item);

      expect(result).toBe('URLは500文字以内で入力してください');
    });

    it('URLがhttpまたはhttpsで始まらない場合エラーを返す', () => {
      const item: NewsItem = {
        publishedAt: '2024-01-15 09:00:00',
        title: 'ニュース',
        url: 'ftp://example.com/news/1',
      };

      const result = validator.validate(item);

      expect(result).toBe('URLはhttp://またはhttps://で始まる必要があります');
    });

    it('URLの形式が不正な場合エラーを返す', () => {
      const item: NewsItem = {
        publishedAt: '2024-01-15 09:00:00',
        title: 'ニュース',
        url: 'not-a-url',
      };

      const result = validator.validate(item);

      expect(result).toBe('URLの形式が不正です（http://またはhttps://で始まる必要があります）');
    });
  });

  describe('validate - ソース長バリデーション', () => {
    it('ソースが100文字の場合エラーにならない', () => {
      const item: NewsItem = {
        publishedAt: '2024-01-15 09:00:00',
        title: 'ニュース',
        source: 'a'.repeat(100),
      };

      const result = validator.validate(item);

      expect(result).toBeNull();
    });

    it('ソースが101文字の場合エラーを返す', () => {
      const item: NewsItem = {
        publishedAt: '2024-01-15 09:00:00',
        title: 'ニュース',
        source: 'a'.repeat(101),
      };

      const result = validator.validate(item);

      expect(result).toBe('ソースは100文字以内で入力してください');
    });
  });

  describe('validate - センチメント値バリデーション', () => {
    it('センチメントがpositiveの場合エラーにならない', () => {
      const item: NewsItem = {
        publishedAt: '2024-01-15 09:00:00',
        title: 'ニュース',
        sentiment: 'positive',
      };

      const result = validator.validate(item);

      expect(result).toBeNull();
    });

    it('センチメントがnegativeの場合エラーにならない', () => {
      const item: NewsItem = {
        publishedAt: '2024-01-15 09:00:00',
        title: 'ニュース',
        sentiment: 'negative',
      };

      const result = validator.validate(item);

      expect(result).toBeNull();
    });

    it('センチメントがneutralの場合エラーにならない', () => {
      const item: NewsItem = {
        publishedAt: '2024-01-15 09:00:00',
        title: 'ニュース',
        sentiment: 'neutral',
      };

      const result = validator.validate(item);

      expect(result).toBeNull();
    });
  });

  describe('validate - センチメントスコアバリデーション', () => {
    it('センチメントスコアが-1.01の場合エラーを返す', () => {
      const item: NewsItem = {
        publishedAt: '2024-01-15 09:00:00',
        title: 'ニュース',
        sentimentScore: -1.01,
      };

      const result = validator.validate(item);

      expect(result).toBe('センチメントスコアは-1.00〜1.00の範囲内である必要があります');
    });

    it('センチメントスコアが1.01の場合エラーを返す', () => {
      const item: NewsItem = {
        publishedAt: '2024-01-15 09:00:00',
        title: 'ニュース',
        sentimentScore: 1.01,
      };

      const result = validator.validate(item);

      expect(result).toBe('センチメントスコアは-1.00〜1.00の範囲内である必要があります');
    });

    it('センチメントスコアが-2.00の場合エラーを返す', () => {
      const item: NewsItem = {
        publishedAt: '2024-01-15 09:00:00',
        title: 'ニュース',
        sentimentScore: -2.0,
      };

      const result = validator.validate(item);

      expect(result).toBe('センチメントスコアは-1.00〜1.00の範囲内である必要があります');
    });

    it('センチメントスコアが2.00の場合エラーを返す', () => {
      const item: NewsItem = {
        publishedAt: '2024-01-15 09:00:00',
        title: 'ニュース',
        sentimentScore: 2.0,
      };

      const result = validator.validate(item);

      expect(result).toBe('センチメントスコアは-1.00〜1.00の範囲内である必要があります');
    });
  });
});
