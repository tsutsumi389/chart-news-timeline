/**
 * 株マスタリポジトリ
 * 株マスタテーブル（stocks）へのデータアクセス
 */

import { Stock } from '@prisma/client';
import { getPrismaClient } from '../config/database';

/**
 * 株マスタリポジトリクラス
 */
export class StockRepository {
  private prisma = getPrismaClient();

  /**
   * 銘柄コードから株マスタを取得
   * @param stockCode 銘柄コード（4桁）
   * @returns 株マスタ（存在しない場合はnull）
   */
  async findByCode(stockCode: string): Promise<Stock | null> {
    return await this.prisma.stock.findUnique({
      where: {
        stockCode,
      },
    });
  }

  /**
   * 株IDから株マスタを取得
   * @param stockId 株ID
   * @returns 株マスタ（存在しない場合はnull）
   */
  async findById(stockId: number): Promise<Stock | null> {
    return await this.prisma.stock.findUnique({
      where: {
        stockId,
      },
    });
  }

  /**
   * 全銘柄を取得（登録日時の降順）
   * @returns 株マスタ配列
   */
  async findAll(): Promise<Stock[]> {
    return await this.prisma.stock.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * 銘柄を作成
   * @param stockCode 銘柄コード
   * @param stockName 銘柄名
   * @returns 作成された株マスタ
   */
  async create(stockCode: string, stockName: string): Promise<Stock> {
    return await this.prisma.stock.create({
      data: {
        stockCode,
        stockName,
      },
    });
  }

  /**
   * 銘柄を更新
   * @param stockId 株ID
   * @param stockName 銘柄名
   * @returns 更新された株マスタ
   */
  async update(stockId: number, stockName: string): Promise<Stock> {
    return await this.prisma.stock.update({
      where: {
        stockId,
      },
      data: {
        stockName,
      },
    });
  }

  /**
   * 銘柄を削除
   * @param stockId 株ID
   * @returns 削除された株マスタ
   */
  async delete(stockId: number): Promise<Stock> {
    return await this.prisma.stock.delete({
      where: {
        stockId,
      },
    });
  }
}

// シングルトンインスタンスをエクスポート
export const stockRepository = new StockRepository();
