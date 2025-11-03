/**
 * 株価リポジトリ
 * 株価テーブル（stock_prices）へのデータアクセス
 */

import { StockPrice, Prisma } from '@prisma/client';
import { getPrismaClient } from '../config/database';
import { CsvRow } from '../types/import';

/**
 * 株価リポジトリクラス
 */
export class StockPriceRepository {
  private prisma = getPrismaClient();

  /**
   * 指定銘柄の指定期間の株価データを取得
   * @param stockId 株ID
   * @param startDate 開始日（省略可）
   * @param endDate 終了日（省略可）
   * @returns 株価データ配列
   */
  async findByStockIdAndDateRange(
    stockId: number,
    startDate?: Date,
    endDate?: Date
  ): Promise<StockPrice[]> {
    const where: Prisma.StockPriceWhereInput = {
      stockId,
    };

    if (startDate || endDate) {
      where.tradeDate = {};
      if (startDate) where.tradeDate.gte = startDate;
      if (endDate) where.tradeDate.lte = endDate;
    }

    return await this.prisma.stockPrice.findMany({
      where,
      orderBy: {
        tradeDate: 'asc',
      },
    });
  }

  /**
   * 指定日の株価データが存在するかチェック
   * @param stockId 株ID
   * @param tradeDate 取引日（YYYY-MM-DD形式の文字列）
   * @returns 存在する場合true
   */
  async existsByDate(stockId: number, tradeDate: string): Promise<boolean> {
    const count = await this.prisma.stockPrice.count({
      where: {
        stockId,
        tradeDate: new Date(tradeDate),
      },
    });
    return count > 0;
  }

  /**
   * 株価データのUpsert（存在する場合は更新、しない場合は挿入）
   * @param stockId 株ID
   * @param data CSV行データ
   * @returns Upsertされた株価データ
   */
  async upsert(stockId: number, data: CsvRow): Promise<StockPrice> {
    const tradeDate = new Date(data.date);

    return await this.prisma.stockPrice.upsert({
      where: {
        // Prismaのユニーク複合キー指定
        stockId_tradeDate: {
          stockId,
          tradeDate,
        },
      },
      update: {
        openPrice: new Prisma.Decimal(data.open),
        highPrice: new Prisma.Decimal(data.high),
        lowPrice: new Prisma.Decimal(data.low),
        closePrice: new Prisma.Decimal(data.close),
        volume: BigInt(data.volume),
      },
      create: {
        stockId,
        tradeDate,
        openPrice: new Prisma.Decimal(data.open),
        highPrice: new Prisma.Decimal(data.high),
        lowPrice: new Prisma.Decimal(data.low),
        closePrice: new Prisma.Decimal(data.close),
        volume: BigInt(data.volume),
      },
    });
  }

  /**
   * 株価データを作成（単一）
   * @param stockId 株ID
   * @param data CSV行データ
   * @returns 作成された株価データ
   */
  async create(stockId: number, data: CsvRow): Promise<StockPrice> {
    return await this.prisma.stockPrice.create({
      data: {
        stockId,
        tradeDate: new Date(data.date),
        openPrice: new Prisma.Decimal(data.open),
        highPrice: new Prisma.Decimal(data.high),
        lowPrice: new Prisma.Decimal(data.low),
        closePrice: new Prisma.Decimal(data.close),
        volume: BigInt(data.volume),
      },
    });
  }

  /**
   * 株価データを一括作成
   * @param stockId 株ID
   * @param dataList CSV行データ配列
   * @returns 作成件数
   */
  async createMany(stockId: number, dataList: CsvRow[]): Promise<number> {
    const result = await this.prisma.stockPrice.createMany({
      data: dataList.map((data) => ({
        stockId,
        tradeDate: new Date(data.date),
        openPrice: new Prisma.Decimal(data.open),
        highPrice: new Prisma.Decimal(data.high),
        lowPrice: new Prisma.Decimal(data.low),
        closePrice: new Prisma.Decimal(data.close),
        volume: BigInt(data.volume),
      })),
      skipDuplicates: true, // 重複はスキップ
    });

    return result.count;
  }

  /**
   * 指定範囲の株価データを削除
   * @param stockId 株ID
   * @param startDate 開始日（省略可、YYYY-MM-DD形式の文字列）
   * @param endDate 終了日（省略可、YYYY-MM-DD形式の文字列）
   * @returns 削除件数
   */
  async deleteByDateRange(
    stockId: number,
    startDate?: string,
    endDate?: string
  ): Promise<number> {
    const where: Prisma.StockPriceWhereInput = {
      stockId,
    };

    if (startDate || endDate) {
      where.tradeDate = {};
      if (startDate) where.tradeDate.gte = new Date(startDate);
      if (endDate) where.tradeDate.lte = new Date(endDate);
    }

    const result = await this.prisma.stockPrice.deleteMany({
      where,
    });

    return result.count;
  }

  /**
   * 指定銘柄の全株価データを削除
   * @param stockId 株ID
   * @returns 削除件数
   */
  async deleteAll(stockId: number): Promise<number> {
    const result = await this.prisma.stockPrice.deleteMany({
      where: {
        stockId,
      },
    });

    return result.count;
  }

  /**
   * 指定銘柄の株価データ件数を取得
   * @param stockId 株ID
   * @returns データ件数
   */
  async count(stockId: number): Promise<number> {
    return await this.prisma.stockPrice.count({
      where: {
        stockId,
      },
    });
  }
}

// シングルトンインスタンスをエクスポート
export const stockPriceRepository = new StockPriceRepository();
