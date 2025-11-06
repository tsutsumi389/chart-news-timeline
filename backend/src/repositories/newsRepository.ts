/**
 * ニュースリポジトリ
 * ニューステーブル（news）へのデータアクセス
 */

import { News, Prisma } from '@prisma/client';
import { getPrismaClient } from '../config/database';
import { NewsItem } from '../types/newsImport';

/**
 * ニュースリポジトリクラス
 */
export class NewsRepository {
  private prisma = getPrismaClient();

  /**
   * 指定タイトル・日時のニュースが存在するかチェック
   * @param stockId 株ID
   * @param publishedAt 公開日時
   * @param title タイトル
   * @returns 存在する場合true
   */
  async existsByTitleAndDate(
    stockId: number,
    publishedAt: string,
    title: string
  ): Promise<boolean> {
    const count = await this.prisma.news.count({
      where: {
        stockId,
        publishedAt: new Date(publishedAt),
        title,
      },
    });
    return count > 0;
  }

  /**
   * 指定タイトル・日時のニュースを取得
   * @param stockId 株ID
   * @param publishedAt 公開日時
   * @param title タイトル
   * @returns ニュースデータ（見つからない場合はnull）
   */
  async findByTitleAndDate(
    stockId: number,
    publishedAt: string,
    title: string
  ): Promise<News | null> {
    return await this.prisma.news.findFirst({
      where: {
        stockId,
        publishedAt: new Date(publishedAt),
        title,
      },
    });
  }

  /**
   * ニュースデータのUpsert（存在する場合は更新、しない場合は挿入）
   * @param stockId 株ID
   * @param data ニュースアイテム
   * @returns Upsertされたニュースデータ
   */
  async upsert(stockId: number, data: NewsItem): Promise<News> {
    // 同一銘柄・同一公開日時・同一タイトルのニュースを一意とする
    const existingNews = await this.findByTitleAndDate(
      stockId,
      data.publishedAt,
      data.title
    );

    if (existingNews) {
      // 更新
      return await this.prisma.news.update({
        where: { newsId: existingNews.newsId },
        data: {
          summary: data.summary || null,
          url: data.url || null,
          source: data.source || null,
          sentiment: data.sentiment || 'neutral',
          sentimentScore: data.sentimentScore !== undefined
            ? new Prisma.Decimal(data.sentimentScore)
            : null,
        },
      });
    } else {
      // 新規挿入
      return await this.prisma.news.create({
        data: {
          stockId,
          publishedAt: new Date(data.publishedAt),
          title: data.title,
          summary: data.summary || null,
          url: data.url || null,
          source: data.source || null,
          sentiment: data.sentiment || 'neutral',
          sentimentScore: data.sentimentScore !== undefined
            ? new Prisma.Decimal(data.sentimentScore)
            : null,
        },
      });
    }
  }

  /**
   * ニュースデータを作成（単一）
   * @param stockId 株ID
   * @param data ニュースアイテム
   * @returns 作成されたニュースデータ
   */
  async create(stockId: number, data: NewsItem): Promise<News> {
    return await this.prisma.news.create({
      data: {
        stockId,
        publishedAt: new Date(data.publishedAt),
        title: data.title,
        summary: data.summary || null,
        url: data.url || null,
        source: data.source || null,
        sentiment: data.sentiment || 'neutral',
        sentimentScore: data.sentimentScore !== undefined
          ? new Prisma.Decimal(data.sentimentScore)
          : null,
      },
    });
  }

  /**
   * 指定範囲のニュースデータを削除
   * @param stockId 株ID
   * @param startDate 開始日時（省略可、YYYY-MM-DD形式の文字列）
   * @param endDate 終了日時（省略可、YYYY-MM-DD形式の文字列）
   * @returns 削除件数
   */
  async deleteByDateRange(
    stockId: number,
    startDate?: string,
    endDate?: string
  ): Promise<number> {
    const where: Prisma.NewsWhereInput = {
      stockId,
    };

    if (startDate || endDate) {
      where.publishedAt = {};
      if (startDate) where.publishedAt.gte = new Date(startDate);
      if (endDate) where.publishedAt.lte = new Date(endDate);
    }

    const result = await this.prisma.news.deleteMany({
      where,
    });

    return result.count;
  }

  /**
   * 指定銘柄の全ニュースデータを削除
   * @param stockId 株ID
   * @returns 削除件数
   */
  async deleteAll(stockId: number): Promise<number> {
    const result = await this.prisma.news.deleteMany({
      where: {
        stockId,
      },
    });

    return result.count;
  }

  /**
   * 銘柄のニュース一覧取得
   * @param stockId 株ID
   * @param options オプション
   * @returns ニュースデータ配列
   */
  async findByStockId(
    stockId: number,
    options?: {
      startDate?: string;
      endDate?: string;
      limit?: number;
      offset?: number;
    }
  ): Promise<News[]> {
    const where: Prisma.NewsWhereInput = {
      stockId,
    };

    if (options?.startDate || options?.endDate) {
      where.publishedAt = {};
      if (options.startDate) where.publishedAt.gte = new Date(options.startDate);
      if (options.endDate) where.publishedAt.lte = new Date(options.endDate);
    }

    return await this.prisma.news.findMany({
      where,
      orderBy: { publishedAt: 'desc' },
      take: options?.limit || 100,
      skip: options?.offset || 0,
    });
  }

  /**
   * 銘柄コードからニュースデータを取得
   * @param stockCode 銘柄コード（4桁）
   * @param startDate 開始日時（省略可）
   * @param endDate 終了日時（省略可）
   * @param limit 取得件数制限（省略可）
   * @returns ニュースデータ配列
   */
  async findByStockCode(
    stockCode: string,
    startDate?: Date,
    endDate?: Date,
    limit?: number
  ): Promise<News[]> {
    const where: Prisma.NewsWhereInput = {
      stock: {
        stockCode,
      },
    };

    if (startDate || endDate) {
      where.publishedAt = {};
      if (startDate) where.publishedAt.gte = startDate;
      if (endDate) where.publishedAt.lte = endDate;
    }

    return await this.prisma.news.findMany({
      where,
      orderBy: {
        publishedAt: 'desc',
      },
      take: limit,
    });
  }

  /**
   * 指定銘柄のニュースデータ件数を取得
   * @param stockId 株ID
   * @returns データ件数
   */
  async count(stockId: number): Promise<number> {
    return await this.prisma.news.count({
      where: {
        stockId,
      },
    });
  }
}

// シングルトンインスタンスをエクスポート
export const newsRepository = new NewsRepository();
