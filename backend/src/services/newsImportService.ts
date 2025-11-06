/**
 * ニュースインポートサービス
 * CSVファイルからニュースデータをインポートするビジネスロジック
 */

import { stockRepository } from '../repositories/stockRepository';
import { newsRepository } from '../repositories/newsRepository';
import { newsCsvParserService } from './newsCsvParserService';
import { newsValidator } from '../utils/newsValidator';
import {
  NewsItem,
  NewsImportResult,
  NewsImportError,
  ValidationResult,
  DuplicateStrategy,
  NewsImportOptions,
  DuplicateCheckResult,
  DuplicateNews,
} from '../types/newsImport';
import { logger } from '../utils/logger';
import { randomUUID } from 'crypto';

/**
 * ニュースインポートサービスクラス
 */
export class NewsImportService {
  /**
   * CSVファイルからニュースデータをインポート
   * @param stockCode 銘柄コード
   * @param csvContent CSVファイルの内容
   * @param options インポートオプション
   * @returns インポート結果
   * @throws 銘柄が見つからない場合
   */
  async importFromCsv(
    stockCode: string,
    csvContent: string,
    options: NewsImportOptions
  ): Promise<NewsImportResult> {
    logger.info(`ニュースインポート開始: 銘柄コード=${stockCode}, 戦略=${options.duplicateStrategy}`);

    // 1. 銘柄存在チェック
    const stock = await stockRepository.findByCode(stockCode);
    if (!stock) {
      throw new Error(`銘柄コード ${stockCode} が見つかりません`);
    }

    // 2. CSVパース
    const items = await newsCsvParserService.parse(csvContent);
    logger.debug(`CSVパース完了: ${items.length}件`);

    // 3. 日付範囲フィルター
    const filteredItems = this.filterByDateRange(
      items,
      options.dateFrom,
      options.dateTo
    );
    logger.debug(`日付範囲フィルター完了: ${filteredItems.length}件`);

    // 4. バリデーション
    const validationResult = this.validateNewsItems(filteredItems);
    logger.debug(
      `バリデーション完了: 有効=${validationResult.validItems.length}件, エラー=${validationResult.errors.length}件`
    );

    // 5. データベース登録
    const importResult = await this.bulkInsertNews(
      stock.stockId,
      stockCode,
      stock.stockName,
      validationResult.validItems,
      options.duplicateStrategy
    );

    // バリデーションエラーを結果に追加
    importResult.errors.push(...validationResult.errors);
    importResult.errorCount += validationResult.errors.length;

    logger.info(
      `ニュースインポート完了: 成功=${importResult.successCount}, スキップ=${importResult.skipCount}, エラー=${importResult.errorCount}`
    );

    return importResult;
  }

  /**
   * 日付範囲でニュースをフィルター
   * @param items ニュースアイテム配列
   * @param dateFrom 開始日（YYYY-MM-DD形式）
   * @param dateTo 終了日（YYYY-MM-DD形式）
   * @returns フィルター後のニュースアイテム配列
   */
  private filterByDateRange(
    items: NewsItem[],
    dateFrom?: string,
    dateTo?: string
  ): NewsItem[] {
    if (!dateFrom && !dateTo) {
      return items;
    }

    return items.filter((item) => {
      const publishedDate = new Date(item.publishedAt);

      if (dateFrom) {
        const fromDate = new Date(dateFrom);
        fromDate.setHours(0, 0, 0, 0);
        if (publishedDate < fromDate) {
          return false;
        }
      }

      if (dateTo) {
        const toDate = new Date(dateTo);
        toDate.setHours(23, 59, 59, 999);
        if (publishedDate > toDate) {
          return false;
        }
      }

      return true;
    });
  }

  /**
   * ニュースデータのバリデーション
   * @param items ニュースアイテム配列
   * @returns バリデーション結果
   */
  private validateNewsItems(items: NewsItem[]): ValidationResult {
    const validItems: NewsItem[] = [];
    const errors: NewsImportError[] = [];

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const validationError = newsValidator.validate(item);

      if (validationError) {
        errors.push({
          row: i + 2, // ヘッダー行を考慮（1行目がヘッダー、データは2行目から）
          publishedAt: item.publishedAt,
          title: item.title || '(タイトルなし)',
          message: validationError,
        });
      } else {
        validItems.push(item);
      }
    }

    return { validItems, errors };
  }

  /**
   * ニュースデータの一括登録
   * @param stockId 株ID
   * @param stockCode 銘柄コード
   * @param stockName 銘柄名
   * @param items 有効なニュースアイテム配列
   * @param strategy 重複時の処理戦略
   * @returns インポート結果
   */
  private async bulkInsertNews(
    stockId: number,
    stockCode: string,
    stockName: string,
    items: NewsItem[],
    strategy: DuplicateStrategy
  ): Promise<NewsImportResult> {
    let successCount = 0;
    let skipCount = 0;
    const errors: NewsImportError[] = [];

    // 1件ずつ処理（ニュースはupsertが必要なため）
    for (const item of items) {
      try {
        if (strategy === 'skip') {
          // 既存データをチェック
          const exists = await newsRepository.existsByTitleAndDate(
            stockId,
            item.publishedAt,
            item.title
          );
          if (exists) {
            skipCount++;
            continue;
          }
          await newsRepository.create(stockId, item);
        } else {
          // overwriteモード: upsert
          await newsRepository.upsert(stockId, item);
        }
        successCount++;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        logger.warn(
          `ニュースの登録エラー: 日時=${item.publishedAt}, タイトル=${item.title}, エラー=${errorMessage}`
        );
        errors.push({
          row: 0, // 行番号は後で設定
          publishedAt: item.publishedAt,
          title: item.title,
          message: `データベース登録エラー: ${errorMessage}`,
        });
      }
    }

    return {
      importId: this.generateImportId(),
      stockCode,
      stockName,
      totalRows: items.length,
      successCount,
      skipCount,
      errorCount: errors.length,
      errors,
      importedAt: new Date().toISOString(),
    };
  }

  /**
   * 重複ニュースの検出
   * @param stockCode 銘柄コード
   * @param newsItems ニュースアイテム配列
   * @returns 重複チェック結果
   * @throws 銘柄が見つからない場合
   */
  async checkDuplicates(
    stockCode: string,
    newsItems: NewsItem[]
  ): Promise<DuplicateCheckResult> {
    const stock = await stockRepository.findByCode(stockCode);
    if (!stock) {
      throw new Error(`銘柄コード ${stockCode} が見つかりません`);
    }

    const duplicates: DuplicateNews[] = [];

    for (const item of newsItems) {
      const existingNews = await newsRepository.findByTitleAndDate(
        stock.stockId,
        item.publishedAt,
        item.title
      );

      if (existingNews) {
        duplicates.push({
          publishedAt: item.publishedAt,
          title: item.title,
          existingNewsId: Number(existingNews.newsId),
        });
      }
    }

    return {
      totalNews: newsItems.length,
      duplicateCount: duplicates.length,
      duplicates,
    };
  }

  /**
   * 指定範囲のニュースデータを削除
   * @param stockCode 銘柄コード
   * @param startDate 開始日（YYYY-MM-DD形式、任意）
   * @param endDate 終了日（YYYY-MM-DD形式、任意）
   * @returns 削除件数
   * @throws 銘柄が見つからない場合
   */
  async deleteNewsByDateRange(
    stockCode: string,
    startDate?: string,
    endDate?: string
  ): Promise<number> {
    const stock = await stockRepository.findByCode(stockCode);
    if (!stock) {
      throw new Error(`銘柄コード ${stockCode} が見つかりません`);
    }

    const deletedCount = await newsRepository.deleteByDateRange(
      stock.stockId,
      startDate,
      endDate
    );

    logger.info(
      `ニュースデータ削除完了: 銘柄コード=${stockCode}, 削除件数=${deletedCount}`
    );

    return deletedCount;
  }

  /**
   * インポートIDを生成
   * @returns インポートID（例: news_import_20240115_123456_abc）
   */
  private generateImportId(): string {
    const timestamp = new Date()
      .toISOString()
      .replace(/[-:T]/g, '')
      .split('.')[0];
    const uuid = randomUUID().split('-')[0];
    return `news_import_${timestamp}_${uuid}`;
  }
}

// シングルトンインスタンスをエクスポート
export const newsImportService = new NewsImportService();
