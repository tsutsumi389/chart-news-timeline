// ニュースインポートAPIのE2Eテスト

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import FormData from 'form-data';
import { createServer } from '../server';
import { getPrismaClient, disconnectDatabase } from '../config/database';
import type { FastifyInstance } from 'fastify';

describe('News Import API E2E Tests', () => {
  let app: FastifyInstance;
  let testStockId: number | undefined;
  const testStockCode = '9998';
  const testStockName = 'E2Eテストニュース株式会社';

  beforeAll(async () => {
    // Fastifyアプリを起動
    app = await createServer();
    await app.ready();

    // テスト用の銘柄を作成
    const prisma = getPrismaClient();
    const stock = await prisma.stock.create({
      data: {
        stockCode: testStockCode,
        stockName: testStockName,
      },
    });
    testStockId = stock.stockId;
  });

  afterAll(async () => {
    // テストデータのクリーンアップ
    const prisma = getPrismaClient();
    if (testStockId) {
      await prisma.news.deleteMany({
        where: { stockId: testStockId },
      });
      await prisma.stock.delete({
        where: { stockId: testStockId },
      });
    }

    // 接続を閉じる
    await app.close();
    await disconnectDatabase();
  });

  beforeEach(async () => {
    // 各テスト前にニュースデータをクリーンアップ
    const prisma = getPrismaClient();
    await prisma.news.deleteMany({
      where: { stockId: testStockId },
    });
  });

  describe('POST /api/v1/stocks/:stockCode/news/import/csv', () => {
    it('正常なCSVファイルをインポートできる', async () => {
      // テスト用のCSVファイルを作成
      const csvContent = `公開日時,タイトル,要約,URL,ソース,センチメント,センチメントスコア
2024-01-15 09:00:00,トヨタ、2024年世界販売台数で過去最高を記録,2024年の世界販売台数が前年比7%増となり、過去最高を更新した。,https://example.com/news/1,日経新聞,positive,0.85
2024-01-16 14:30:00,トヨタ、米国工場で生産一時停止,部品供給の遅延により、米国の一部工場で生産を一時停止する。,https://example.com/news/2,Bloomberg,negative,-0.60
2024-01-17 10:15:00,トヨタ、EV新モデル発表,2025年発売予定の新型電気自動車を発表した。,https://example.com/news/3,ロイター,positive,0.70`;

      const form = new FormData();
      form.append('file', Buffer.from(csvContent), {
        filename: 'test_news.csv',
        contentType: 'text/csv',
      });
      form.append('duplicateStrategy', 'skip');

      const response = await app.inject({
        method: 'POST',
        url: `/api/v1/stocks/${testStockCode}/news/import/csv`,
        headers: form.getHeaders(),
        payload: form,
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.data.stockCode).toBe(testStockCode);
      expect(body.data.totalRows).toBe(3);
      expect(body.data.successCount).toBe(3);
      expect(body.data.errorCount).toBe(0);

      // データベースに登録されたか確認
      const prisma = getPrismaClient();
      const count = await prisma.news.count({
        where: { stockId: testStockId },
      });
      expect(count).toBe(3);
    });

    it('重複データをスキップできる', async () => {
      // 最初のインポート
      const csvContent1 = `公開日時,タイトル,要約,URL,ソース,センチメント,センチメントスコア
2024-01-15 09:00:00,トヨタ、新モデル発表,,,,,
2024-01-16 14:30:00,トヨタ、工場建設,,,,,`;

      const form1 = new FormData();
      form1.append('file', Buffer.from(csvContent1), {
        filename: 'test1.csv',
        contentType: 'text/csv',
      });
      form1.append('duplicateStrategy', 'skip');

      await app.inject({
        method: 'POST',
        url: `/api/v1/stocks/${testStockCode}/news/import/csv`,
        headers: form1.getHeaders(),
        payload: form1,
      });

      // 2回目のインポート（重複データを含む）
      const csvContent2 = `公開日時,タイトル,要約,URL,ソース,センチメント,センチメントスコア
2024-01-15 09:00:00,トヨタ、新モデル発表,,,,,
2024-01-17 10:15:00,トヨタ、新製品発売,,,,,`;

      const form2 = new FormData();
      form2.append('file', Buffer.from(csvContent2), {
        filename: 'test2.csv',
        contentType: 'text/csv',
      });
      form2.append('duplicateStrategy', 'skip');

      const response = await app.inject({
        method: 'POST',
        url: `/api/v1/stocks/${testStockCode}/news/import/csv`,
        headers: form2.getHeaders(),
        payload: form2,
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.data.totalRows).toBe(2);
      expect(body.data.successCount).toBe(1); // 1件のみ新規登録
      expect(body.data.skipCount).toBe(1); // 1件スキップ

      // データベースに3件登録されているか確認（最初の2件 + 新規1件）
      const prisma = getPrismaClient();
      const count = await prisma.news.count({
        where: { stockId: testStockId },
      });
      expect(count).toBe(3);
    });

    it('重複データを上書きできる', async () => {
      // 最初のインポート
      const csvContent1 = `公開日時,タイトル,要約,URL,ソース,センチメント,センチメントスコア
2024-01-15 09:00:00,トヨタ、新モデル発表,旧要約,https://example.com/old,日経新聞,neutral,0.00`;

      const form1 = new FormData();
      form1.append('file', Buffer.from(csvContent1), {
        filename: 'test1.csv',
        contentType: 'text/csv',
      });
      form1.append('duplicateStrategy', 'overwrite');

      await app.inject({
        method: 'POST',
        url: `/api/v1/stocks/${testStockCode}/news/import/csv`,
        headers: form1.getHeaders(),
        payload: form1,
      });

      // 2回目のインポート（同じタイトル・日時で異なる内容）
      const csvContent2 = `公開日時,タイトル,要約,URL,ソース,センチメント,センチメントスコア
2024-01-15 09:00:00,トヨタ、新モデル発表,新要約,https://example.com/new,Bloomberg,positive,0.80`;

      const form2 = new FormData();
      form2.append('file', Buffer.from(csvContent2), {
        filename: 'test2.csv',
        contentType: 'text/csv',
      });
      form2.append('duplicateStrategy', 'overwrite');

      const response = await app.inject({
        method: 'POST',
        url: `/api/v1/stocks/${testStockCode}/news/import/csv`,
        headers: form2.getHeaders(),
        payload: form2,
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.data.successCount).toBe(1);
      expect(body.data.skipCount).toBe(0);

      // データベースの内容が更新されているか確認
      const prisma = getPrismaClient();
      const news = await prisma.news.findFirst({
        where: {
          stockId: testStockId,
          publishedAt: new Date('2024-01-15 09:00:00'),
          title: 'トヨタ、新モデル発表',
        },
      });
      expect(news?.summary).toBe('新要約');
      expect(news?.url).toBe('https://example.com/new');
      expect(news?.sentiment).toBe('positive');
    });

    it('日付範囲フィルターが適用される', async () => {
      const csvContent = `公開日時,タイトル,要約,URL,ソース,センチメント,センチメントスコア
2024-01-10 09:00:00,古いニュース,,,,,
2024-01-15 09:00:00,対象ニュース1,,,,,
2024-01-20 09:00:00,対象ニュース2,,,,,
2024-01-30 09:00:00,新しいニュース,,,,,`;

      const form = new FormData();
      form.append('file', Buffer.from(csvContent), {
        filename: 'test.csv',
        contentType: 'text/csv',
      });
      form.append('duplicateStrategy', 'skip');
      form.append('dateFrom', '2024-01-15');
      form.append('dateTo', '2024-01-25');

      const response = await app.inject({
        method: 'POST',
        url: `/api/v1/stocks/${testStockCode}/news/import/csv`,
        headers: form.getHeaders(),
        payload: form,
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.data.totalRows).toBe(2); // フィルター後のデータ数

      // データベースに2件登録されているか確認
      const prisma = getPrismaClient();
      const count = await prisma.news.count({
        where: { stockId: testStockId },
      });
      expect(count).toBe(2);
    });

    it('存在しない銘柄コードで404エラーを返す', async () => {
      const csvContent = `公開日時,タイトル,要約,URL,ソース,センチメント,センチメントスコア
2024-01-15 09:00:00,ニュース,,,,,`;

      const form = new FormData();
      form.append('file', Buffer.from(csvContent), {
        filename: 'test.csv',
        contentType: 'text/csv',
      });

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/stocks/0000/news/import/csv',
        headers: form.getHeaders(),
        payload: form,
      });

      expect(response.statusCode).toBe(404);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(false);
    });

    it('不正なCSVフォーマットでエラーを返す', async () => {
      const csvContent = `不正なヘッダー1,不正なヘッダー2
データ1,データ2`;

      const form = new FormData();
      form.append('file', Buffer.from(csvContent), {
        filename: 'test.csv',
        contentType: 'text/csv',
      });

      const response = await app.inject({
        method: 'POST',
        url: `/api/v1/stocks/${testStockCode}/news/import/csv`,
        headers: form.getHeaders(),
        payload: form,
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('INVALID_CSV_FORMAT');
    });
  });

  describe('DELETE /api/v1/stocks/:stockCode/news', () => {
    beforeEach(async () => {
      // テストデータを準備
      const prisma = getPrismaClient();
      await prisma.news.createMany({
        data: [
          {
            stockId: testStockId!,
            publishedAt: new Date('2024-01-15 09:00:00'),
            title: 'ニュース1',
          },
          {
            stockId: testStockId!,
            publishedAt: new Date('2024-01-20 10:00:00'),
            title: 'ニュース2',
          },
          {
            stockId: testStockId!,
            publishedAt: new Date('2024-01-25 11:00:00'),
            title: 'ニュース3',
          },
        ],
      });
    });

    it('指定範囲のニュースデータを削除できる', async () => {
      const response = await app.inject({
        method: 'DELETE',
        url: `/api/v1/stocks/${testStockCode}/news?startDate=2024-01-18&endDate=2024-01-22`,
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.data.deletedCount).toBe(1);

      // データベースに2件残っているか確認
      const prisma = getPrismaClient();
      const count = await prisma.news.count({
        where: { stockId: testStockId },
      });
      expect(count).toBe(2);
    });

    it('日付範囲を指定せず全データを削除できる', async () => {
      const response = await app.inject({
        method: 'DELETE',
        url: `/api/v1/stocks/${testStockCode}/news`,
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.data.deletedCount).toBe(3);

      // データベースが空になっているか確認
      const prisma = getPrismaClient();
      const count = await prisma.news.count({
        where: { stockId: testStockId },
      });
      expect(count).toBe(0);
    });
  });

  describe('POST /api/v1/stocks/:stockCode/news/check-duplicates', () => {
    beforeEach(async () => {
      // テストデータを準備
      const prisma = getPrismaClient();
      await prisma.news.create({
        data: {
          stockId: testStockId!,
          publishedAt: new Date('2024-01-15 09:00:00'),
          title: '既存ニュース',
        },
      });
    });

    it('重複ニュースを検出できる', async () => {
      const response = await app.inject({
        method: 'POST',
        url: `/api/v1/stocks/${testStockCode}/news/check-duplicates`,
        headers: {
          'content-type': 'application/json',
        },
        payload: JSON.stringify({
          news: [
            {
              publishedAt: '2024-01-15 09:00:00',
              title: '既存ニュース',
            },
            {
              publishedAt: '2024-01-16 10:00:00',
              title: '新規ニュース',
            },
          ],
        }),
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.data.totalNews).toBe(2);
      expect(body.data.duplicateCount).toBe(1);
      expect(body.data.duplicates).toHaveLength(1);
      expect(body.data.duplicates[0].title).toBe('既存ニュース');
    });
  });
});
