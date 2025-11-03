// 株価インポートAPIのE2Eテスト

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';
import { createServer } from '../server';
import { getPrismaClient, disconnectDatabase } from '../config/database';
import type { FastifyInstance } from 'fastify';

describe('Stock Import API E2E Tests', () => {
  let app: FastifyInstance;
  let testStockId: number | undefined;
  const testStockCode = '9999';
  const testStockName = 'E2Eテスト株式会社';

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
      await prisma.stockPrice.deleteMany({
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
    // 各テスト前に株価データをクリーンアップ
    const prisma = getPrismaClient();
    await prisma.stockPrice.deleteMany({
      where: { stockId: testStockId },
    });
  });

  describe('GET /api/v1/stocks/:stockCode', () => {
    it('銘柄情報を正常に取得できる', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/stocks/${testStockCode}`,
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.data.stockCode).toBe(testStockCode);
      expect(body.data.stockName).toBe(testStockName);
    });

    it('存在しない銘柄コードで404エラーを返す', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/stocks/0000',
      });

      expect(response.statusCode).toBe(404);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(false);
    });
  });

  describe('POST /api/v1/stocks/:stockCode/import/csv', () => {
    it('正常なCSVファイルをインポートできる', async () => {
      // テスト用のCSVファイルを作成
      const csvContent = `日付,始値,高値,安値,終値,出来高
2024-01-15,150.5,153.0,149.8,152.3,15000000
2024-01-16,152.3,153.5,150.5,151.0,14500000
2024-01-17,151.0,152.8,150.2,152.5,13800000`;

      const form = new FormData();
      form.append('file', Buffer.from(csvContent), {
        filename: 'test.csv',
        contentType: 'text/csv',
      });
      form.append('duplicateStrategy', 'skip');

      const response = await app.inject({
        method: 'POST',
        url: `/api/v1/stocks/${testStockCode}/import/csv`,
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
      const count = await prisma.stockPrice.count({
        where: { stockId: testStockId },
      });
      expect(count).toBe(3);
    });

    it('重複データをスキップできる', async () => {
      // 最初のインポート
      const csvContent1 = `日付,始値,高値,安値,終値,出来高
2024-01-15,150.5,153.0,149.8,152.3,15000000
2024-01-16,152.3,153.5,150.5,151.0,14500000`;

      const form1 = new FormData();
      form1.append('file', Buffer.from(csvContent1), {
        filename: 'test1.csv',
        contentType: 'text/csv',
      });
      form1.append('duplicateStrategy', 'skip');

      await app.inject({
        method: 'POST',
        url: `/api/v1/stocks/${testStockCode}/import/csv`,
        headers: form1.getHeaders(),
        payload: form1,
      });

      // 2回目のインポート（重複データを含む）
      const csvContent2 = `日付,始値,高値,安値,終値,出来高
2024-01-15,150.5,153.0,149.8,152.3,15000000
2024-01-17,151.0,152.8,150.2,152.5,13800000`;

      const form2 = new FormData();
      form2.append('file', Buffer.from(csvContent2), {
        filename: 'test2.csv',
        contentType: 'text/csv',
      });
      form2.append('duplicateStrategy', 'skip');

      const response = await app.inject({
        method: 'POST',
        url: `/api/v1/stocks/${testStockCode}/import/csv`,
        headers: form2.getHeaders(),
        payload: form2,
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.data.totalRows).toBe(2);
      expect(body.data.successCount).toBe(1); // 新しいデータのみ
      expect(body.data.skipCount).toBe(1); // 重複データ

      // データベースに3件登録されているか確認
      const prisma = getPrismaClient();
      const count = await prisma.stockPrice.count({
        where: { stockId: testStockId },
      });
      expect(count).toBe(3);
    });

    it('重複データを上書きできる', async () => {
      // 最初のインポート
      const csvContent1 = `日付,始値,高値,安値,終値,出来高
2024-01-15,150.5,153.0,149.8,152.3,15000000`;

      const form1 = new FormData();
      form1.append('file', Buffer.from(csvContent1), {
        filename: 'test1.csv',
        contentType: 'text/csv',
      });
      form1.append('duplicateStrategy', 'skip');

      await app.inject({
        method: 'POST',
        url: `/api/v1/stocks/${testStockCode}/import/csv`,
        headers: form1.getHeaders(),
        payload: form1,
      });

      // 2回目のインポート（上書き）
      const csvContent2 = `日付,始値,高値,安値,終値,出来高
2024-01-15,160.0,163.0,159.8,162.3,20000000`;

      const form2 = new FormData();
      form2.append('file', Buffer.from(csvContent2), {
        filename: 'test2.csv',
        contentType: 'text/csv',
      });
      form2.append('duplicateStrategy', 'overwrite');

      const response = await app.inject({
        method: 'POST',
        url: `/api/v1/stocks/${testStockCode}/import/csv`,
        headers: form2.getHeaders(),
        payload: form2,
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.data.successCount).toBe(1);

      // データが上書きされているか確認
      const prisma = getPrismaClient();
      const price = await prisma.stockPrice.findFirst({
        where: {
          stockId: testStockId,
          tradeDate: new Date('2024-01-15'),
        },
      });
      // Prismaはdecimal型とbigint型を返すため、数値に変換して比較
      expect(Number(price?.openPrice)).toBe(160.0);
      expect(Number(price?.closePrice)).toBe(162.3);
      expect(Number(price?.volume)).toBe(20000000);
    });

    it('不正なCSVフォーマットでエラーを返す', async () => {
      const csvContent = `日付,始値,高値,安値,終値
2024-01-15,150.5,153.0,149.8,152.3`;

      const form = new FormData();
      form.append('file', Buffer.from(csvContent), {
        filename: 'test.csv',
        contentType: 'text/csv',
      });
      form.append('duplicateStrategy', 'skip');

      const response = await app.inject({
        method: 'POST',
        url: `/api/v1/stocks/${testStockCode}/import/csv`,
        headers: form.getHeaders(),
        payload: form,
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(false);
    });

    it('バリデーションエラーを検出できる', async () => {
      const csvContent = `日付,始値,高値,安値,終値,出来高
2024-01-15,150.5,149.0,149.8,152.3,15000000
2024-01-16,152.3,153.5,150.5,151.0,-1000
2024-01-17,151.0,152.8,153.0,152.5,13800000`;

      const form = new FormData();
      form.append('file', Buffer.from(csvContent), {
        filename: 'test.csv',
        contentType: 'text/csv',
      });
      form.append('duplicateStrategy', 'skip');

      const response = await app.inject({
        method: 'POST',
        url: `/api/v1/stocks/${testStockCode}/import/csv`,
        headers: form.getHeaders(),
        payload: form,
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.data.successCount).toBe(0); // バリデーションエラーで全て失敗
      expect(body.data.errorCount).toBe(3);
      expect(body.data.errors.length).toBeGreaterThan(0);
    });

    it('存在しない銘柄コードで404エラーを返す', async () => {
      const csvContent = `日付,始値,高値,安値,終値,出来高
2024-01-15,150.5,153.0,149.8,152.3,15000000`;

      const form = new FormData();
      form.append('file', Buffer.from(csvContent), {
        filename: 'test.csv',
        contentType: 'text/csv',
      });
      form.append('duplicateStrategy', 'skip');

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/stocks/0000/import/csv',
        headers: form.getHeaders(),
        payload: form,
      });

      expect(response.statusCode).toBe(404);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(false);
    });
  });

  describe('DELETE /api/v1/stocks/:stockCode/prices', () => {
    beforeEach(async () => {
      // テストデータを作成
      const prisma = getPrismaClient();
      await prisma.stockPrice.createMany({
        data: [
          {
            stockId: testStockId,
            tradeDate: new Date('2024-01-15'),
            openPrice: 150.5,
            highPrice: 153.0,
            lowPrice: 149.8,
            closePrice: 152.3,
            volume: 15000000,
          },
          {
            stockId: testStockId,
            tradeDate: new Date('2024-01-16'),
            openPrice: 152.3,
            highPrice: 153.5,
            lowPrice: 150.5,
            closePrice: 151.0,
            volume: 14500000,
          },
          {
            stockId: testStockId,
            tradeDate: new Date('2024-01-17'),
            openPrice: 151.0,
            highPrice: 152.8,
            lowPrice: 150.2,
            closePrice: 152.5,
            volume: 13800000,
          },
        ],
      });
    });

    it('全ての株価データを削除できる', async () => {
      const response = await app.inject({
        method: 'DELETE',
        url: `/api/v1/stocks/${testStockCode}/prices`,
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.data.deletedCount).toBe(3);

      // データベースから削除されたか確認
      const prisma = getPrismaClient();
      const count = await prisma.stockPrice.count({
        where: { stockId: testStockId },
      });
      expect(count).toBe(0);
    });

    it('日付範囲を指定して削除できる', async () => {
      const response = await app.inject({
        method: 'DELETE',
        url: `/api/v1/stocks/${testStockCode}/prices?startDate=2024-01-16&endDate=2024-01-16`,
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.data.deletedCount).toBe(1);

      // 1件だけ削除され、2件残っているか確認
      const prisma = getPrismaClient();
      const count = await prisma.stockPrice.count({
        where: { stockId: testStockId },
      });
      expect(count).toBe(2);
    });

    it('存在しない銘柄コードで404エラーを返す', async () => {
      const response = await app.inject({
        method: 'DELETE',
        url: '/api/v1/stocks/0000/prices',
      });

      expect(response.statusCode).toBe(404);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(false);
    });
  });

  describe('パフォーマンステスト', () => {
    it('大量データ(1000件)をインポートできる', async () => {
      // 1000件のCSVデータを生成
      const headers = '日付,始値,高値,安値,終値,出来高';
      const rows: string[] = [];
      const startDate = new Date('2020-01-01');

      for (let i = 0; i < 1000; i++) {
        const date = new Date(startDate);
        date.setDate(date.getDate() + i);
        const dateStr = date.toISOString().split('T')[0];

        const open = 150 + Math.random() * 10;
        const close = 150 + Math.random() * 10;
        const high = Math.max(open, close) + Math.random() * 5;
        const low = Math.min(open, close) - Math.random() * 5;
        const volume = Math.floor(10000000 + Math.random() * 5000000);

        rows.push(
          `${dateStr},${open.toFixed(2)},${high.toFixed(2)},${low.toFixed(2)},${close.toFixed(2)},${volume}`
        );
      }

      const csvContent = `${headers}\n${rows.join('\n')}`;

      const form = new FormData();
      form.append('file', Buffer.from(csvContent), {
        filename: 'large.csv',
        contentType: 'text/csv',
      });
      form.append('duplicateStrategy', 'skip');

      const startTime = Date.now();
      const response = await app.inject({
        method: 'POST',
        url: `/api/v1/stocks/${testStockCode}/import/csv`,
        headers: form.getHeaders(),
        payload: form,
      });
      const endTime = Date.now();

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.data.totalRows).toBe(1000);
      expect(body.data.successCount).toBe(1000);

      // 処理時間を出力（目安: 10秒以内）
      const duration = endTime - startTime;
      console.log(`1000件のインポート処理時間: ${duration}ms`);
      expect(duration).toBeLessThan(10000); // 10秒以内

      // データベースに登録されたか確認
      const prisma = getPrismaClient();
      const count = await prisma.stockPrice.count({
        where: { stockId: testStockId },
      });
      expect(count).toBe(1000);
    }, 15000); // タイムアウトを15秒に設定
  });
});
