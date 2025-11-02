/**
 * API型のユニットテスト
 */

import { describe, it, expect } from 'vitest';
import type { ChartDataResponse, PriceData, NewsData, ChartDataQuery } from './api';

describe('API型定義', () => {
  describe('ChartDataResponse', () => {
    it('チャートデータレスポンスの型が正しく定義されている', () => {
      const response: ChartDataResponse = {
        stock: {
          stockCode: '7203',
          stockName: 'トヨタ自動車',
        },
        prices: [
          {
            date: '2024-01-15',
            open: 150.5,
            close: 152.3,
            low: 149.8,
            high: 153.0,
          },
        ],
        news: [
          {
            id: 'news-001',
            date: '2024-01-15',
            time: '09:30:00',
            title: '新製品発表',
            summary: '新製品を発表しました',
            sentiment: 'positive',
            source: '日経新聞',
            url: 'https://example.com/news/001',
          },
        ],
      };

      expect(response.stock.stockCode).toBe('7203');
      expect(response.prices).toHaveLength(1);
      expect(response.news).toHaveLength(1);
    });
  });

  describe('PriceData', () => {
    it('株価データの型が正しく定義されている', () => {
      const priceData: PriceData = {
        date: '2024-01-15',
        open: 150.5,
        close: 152.3,
        low: 149.8,
        high: 153.0,
      };

      expect(priceData.date).toBe('2024-01-15');
      expect(priceData.open).toBe(150.5);
      expect(priceData.close).toBe(152.3);
      expect(priceData.low).toBe(149.8);
      expect(priceData.high).toBe(153.0);
    });
  });

  describe('NewsData', () => {
    it('ニュースデータの型が正しく定義されている（positive）', () => {
      const newsData: NewsData = {
        id: 'news-001',
        date: '2024-01-15',
        time: '09:30:00',
        title: 'ポジティブなニュース',
        summary: 'サマリー',
        sentiment: 'positive',
        source: '日経新聞',
        url: 'https://example.com',
      };

      expect(newsData.sentiment).toBe('positive');
    });

    it('ニュースデータの型が正しく定義されている（negative）', () => {
      const newsData: NewsData = {
        id: 'news-002',
        date: '2024-01-16',
        time: '10:00:00',
        title: 'ネガティブなニュース',
        summary: 'サマリー',
        sentiment: 'negative',
        source: 'Bloomberg',
        url: 'https://example.com',
      };

      expect(newsData.sentiment).toBe('negative');
    });

    it('ニュースデータの型が正しく定義されている（neutral）', () => {
      const newsData: NewsData = {
        id: 'news-003',
        date: '2024-01-17',
        time: '11:00:00',
        title: '中立的なニュース',
        summary: 'サマリー',
        sentiment: 'neutral',
        source: 'Reuters',
        url: 'https://example.com',
      };

      expect(newsData.sentiment).toBe('neutral');
    });
  });

  describe('ChartDataQuery', () => {
    it('すべてのクエリパラメータを含むことができる', () => {
      const query: ChartDataQuery = {
        startDate: '2024-01-15',
        endDate: '2024-02-23',
        includeNews: true,
      };

      expect(query.startDate).toBe('2024-01-15');
      expect(query.endDate).toBe('2024-02-23');
      expect(query.includeNews).toBe(true);
    });

    it('オプショナルなクエリパラメータを省略できる', () => {
      const query1: ChartDataQuery = {};
      const query2: ChartDataQuery = { startDate: '2024-01-15' };
      const query3: ChartDataQuery = { includeNews: false };

      expect(query1).toEqual({});
      expect(query2.startDate).toBe('2024-01-15');
      expect(query3.includeNews).toBe(false);
    });
  });
});
