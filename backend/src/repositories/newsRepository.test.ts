/**
 * ニュースリポジトリのテスト
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { NewsRepository } from './newsRepository';
import { stockRepository } from './stockRepository';
import { getPrismaClient } from '../config/database';
import { NewsItem } from '../types/newsImport';

describe('NewsRepository', () => {
  const repository = new NewsRepository();
  const prisma = getPrismaClient();
  let testStockId: number;

  beforeEach(async () => {
    // テスト用の銘柄を作成
    const stock = await stockRepository.create('9999', 'テスト銘柄');
    testStockId = stock.stockId;
  });

  afterEach(async () => {
    // テストデータをクリーンアップ
    await prisma.news.deleteMany({
      where: { stockId: testStockId },
    });
    await prisma.stock.delete({
      where: { stockId: testStockId },
    });
  });

  describe('existsByTitleAndDate', () => {
    it('データが存在する場合trueを返す', async () => {
      // テストデータを挿入
      const newsItem: NewsItem = {
        publishedAt: '2024-01-15 09:00:00',
        title: 'トヨタ、2024年世界販売台数で過去最高を記録',
        summary: '2024年の世界販売台数が前年比7%増となり、過去最高を更新した。',
        url: 'https://example.com/news/1',
        source: '日経新聞',
        sentiment: 'positive',
        sentimentScore: 0.85,
      };
      await repository.create(testStockId, newsItem);

      const exists = await repository.existsByTitleAndDate(
        testStockId,
        '2024-01-15 09:00:00',
        'トヨタ、2024年世界販売台数で過去最高を記録'
      );

      expect(exists).toBe(true);
    });

    it('データが存在しない場合falseを返す', async () => {
      const exists = await repository.existsByTitleAndDate(
        testStockId,
        '2024-01-15 09:00:00',
        '存在しないニュース'
      );

      expect(exists).toBe(false);
    });
  });

  describe('findByTitleAndDate', () => {
    it('データが存在する場合、そのデータを返す', async () => {
      // テストデータを挿入
      const newsItem: NewsItem = {
        publishedAt: '2024-01-15 09:00:00',
        title: 'トヨタ、2024年世界販売台数で過去最高を記録',
        summary: '2024年の世界販売台数が前年比7%増となり、過去最高を更新した。',
        url: 'https://example.com/news/1',
        source: '日経新聞',
        sentiment: 'positive',
        sentimentScore: 0.85,
      };
      await repository.create(testStockId, newsItem);

      const result = await repository.findByTitleAndDate(
        testStockId,
        '2024-01-15 09:00:00',
        'トヨタ、2024年世界販売台数で過去最高を記録'
      );

      expect(result).not.toBeNull();
      expect(result?.title).toBe('トヨタ、2024年世界販売台数で過去最高を記録');
      expect(result?.summary).toBe('2024年の世界販売台数が前年比7%増となり、過去最高を更新した。');
    });

    it('データが存在しない場合、nullを返す', async () => {
      const result = await repository.findByTitleAndDate(
        testStockId,
        '2024-01-15 09:00:00',
        '存在しないニュース'
      );

      expect(result).toBeNull();
    });
  });

  describe('upsert', () => {
    it('データが存在しない場合、新規作成する', async () => {
      const newsItem: NewsItem = {
        publishedAt: '2024-01-15 09:00:00',
        title: 'トヨタ、2024年世界販売台数で過去最高を記録',
        summary: '2024年の世界販売台数が前年比7%増となり、過去最高を更新した。',
        url: 'https://example.com/news/1',
        source: '日経新聞',
        sentiment: 'positive',
        sentimentScore: 0.85,
      };

      const result = await repository.upsert(testStockId, newsItem);

      expect(result.stockId).toBe(testStockId);
      expect(result.title).toBe('トヨタ、2024年世界販売台数で過去最高を記録');
      expect(result.summary).toBe('2024年の世界販売台数が前年比7%増となり、過去最高を更新した。');
      expect(result.url).toBe('https://example.com/news/1');
      expect(result.source).toBe('日経新聞');
      expect(result.sentiment).toBe('positive');
      expect(result.sentimentScore?.toString()).toBe('0.85');
    });

    it('データが存在する場合、更新する', async () => {
      // 既存データを挿入
      const newsItem1: NewsItem = {
        publishedAt: '2024-01-15 09:00:00',
        title: 'トヨタ、2024年世界販売台数で過去最高を記録',
        summary: '旧要約',
        url: 'https://example.com/news/1',
        source: '日経新聞',
        sentiment: 'neutral',
        sentimentScore: 0.50,
      };
      await repository.create(testStockId, newsItem1);

      // 同じタイトル・日時で異なるデータでupsert
      const newsItem2: NewsItem = {
        publishedAt: '2024-01-15 09:00:00',
        title: 'トヨタ、2024年世界販売台数で過去最高を記録',
        summary: '新要約',
        url: 'https://example.com/news/2',
        source: 'Bloomberg',
        sentiment: 'positive',
        sentimentScore: 0.85,
      };
      const result = await repository.upsert(testStockId, newsItem2);

      expect(result.summary).toBe('新要約');
      expect(result.url).toBe('https://example.com/news/2');
      expect(result.source).toBe('Bloomberg');
      expect(result.sentiment).toBe('positive');
      expect(result.sentimentScore?.toString()).toBe('0.85');
    });

    it('任意項目が未指定の場合、nullで保存される', async () => {
      const newsItem: NewsItem = {
        publishedAt: '2024-01-15 09:00:00',
        title: 'トヨタ、新モデル発表',
      };

      const result = await repository.upsert(testStockId, newsItem);

      expect(result.title).toBe('トヨタ、新モデル発表');
      expect(result.summary).toBeNull();
      expect(result.url).toBeNull();
      expect(result.source).toBeNull();
      expect(result.sentiment).toBe('neutral');
      expect(result.sentimentScore).toBeNull();
    });
  });

  describe('create', () => {
    it('正常にニュースデータを作成できる', async () => {
      const newsItem: NewsItem = {
        publishedAt: '2024-01-15 09:00:00',
        title: 'トヨタ、2024年世界販売台数で過去最高を記録',
        summary: '2024年の世界販売台数が前年比7%増となり、過去最高を更新した。',
        url: 'https://example.com/news/1',
        source: '日経新聞',
        sentiment: 'positive',
        sentimentScore: 0.85,
      };

      const result = await repository.create(testStockId, newsItem);

      expect(result.stockId).toBe(testStockId);
      expect(result.title).toBe('トヨタ、2024年世界販売台数で過去最高を記録');
    });
  });

  describe('deleteByDateRange', () => {
    beforeEach(async () => {
      // テストデータを挿入
      const newsItems: NewsItem[] = [
        {
          publishedAt: '2024-01-15 09:00:00',
          title: 'ニュース1',
        },
        {
          publishedAt: '2024-01-20 10:00:00',
          title: 'ニュース2',
        },
        {
          publishedAt: '2024-01-25 11:00:00',
          title: 'ニュース3',
        },
      ];

      for (const item of newsItems) {
        await repository.create(testStockId, item);
      }
    });

    it('指定範囲のデータを削除できる', async () => {
      const deletedCount = await repository.deleteByDateRange(
        testStockId,
        '2024-01-18',
        '2024-01-22'
      );

      expect(deletedCount).toBe(1);

      const remaining = await repository.findByStockId(testStockId);
      expect(remaining).toHaveLength(2);
    });

    it('開始日のみ指定した場合、それ以降のデータを削除', async () => {
      const deletedCount = await repository.deleteByDateRange(
        testStockId,
        '2024-01-20'
      );

      expect(deletedCount).toBe(2);
    });

    it('終了日のみ指定した場合、それ以前のデータを削除', async () => {
      const deletedCount = await repository.deleteByDateRange(
        testStockId,
        undefined,
        '2024-01-19'
      );

      expect(deletedCount).toBe(1);
    });

    it('日付範囲を指定しない場合、全データを削除', async () => {
      const deletedCount = await repository.deleteByDateRange(testStockId);

      expect(deletedCount).toBe(3);
    });
  });

  describe('deleteAll', () => {
    it('指定銘柄の全ニュースデータを削除できる', async () => {
      // テストデータを挿入
      const newsItems: NewsItem[] = [
        {
          publishedAt: '2024-01-15 09:00:00',
          title: 'ニュース1',
        },
        {
          publishedAt: '2024-01-20 10:00:00',
          title: 'ニュース2',
        },
      ];

      for (const item of newsItems) {
        await repository.create(testStockId, item);
      }

      const deletedCount = await repository.deleteAll(testStockId);

      expect(deletedCount).toBe(2);

      const remaining = await repository.count(testStockId);
      expect(remaining).toBe(0);
    });
  });

  describe('findByStockId', () => {
    beforeEach(async () => {
      // テストデータを挿入
      const newsItems: NewsItem[] = [
        {
          publishedAt: '2024-01-15 09:00:00',
          title: 'ニュース1',
        },
        {
          publishedAt: '2024-01-20 10:00:00',
          title: 'ニュース2',
        },
        {
          publishedAt: '2024-01-25 11:00:00',
          title: 'ニュース3',
        },
      ];

      for (const item of newsItems) {
        await repository.create(testStockId, item);
      }
    });

    it('全データを取得できる', async () => {
      const result = await repository.findByStockId(testStockId);

      expect(result).toHaveLength(3);
    });

    it('日付範囲でフィルタできる', async () => {
      const result = await repository.findByStockId(testStockId, {
        startDate: '2024-01-18',
        endDate: '2024-01-22',
      });

      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('ニュース2');
    });

    it('取得件数を制限できる', async () => {
      const result = await repository.findByStockId(testStockId, {
        limit: 2,
      });

      expect(result).toHaveLength(2);
    });

    it('オフセットを指定できる', async () => {
      const result = await repository.findByStockId(testStockId, {
        limit: 2,
        offset: 1,
      });

      expect(result).toHaveLength(2);
    });

    it('新しい順に並ぶ', async () => {
      const result = await repository.findByStockId(testStockId);

      expect(result[0].title).toBe('ニュース3');
      expect(result[1].title).toBe('ニュース2');
      expect(result[2].title).toBe('ニュース1');
    });
  });

  describe('count', () => {
    it('データ件数を取得できる', async () => {
      // テストデータを挿入
      const newsItems: NewsItem[] = [
        {
          publishedAt: '2024-01-15 09:00:00',
          title: 'ニュース1',
        },
        {
          publishedAt: '2024-01-20 10:00:00',
          title: 'ニュース2',
        },
      ];

      for (const item of newsItems) {
        await repository.create(testStockId, item);
      }

      const count = await repository.count(testStockId);

      expect(count).toBe(2);
    });

    it('データが0件の場合、0を返す', async () => {
      const count = await repository.count(testStockId);

      expect(count).toBe(0);
    });
  });
});
