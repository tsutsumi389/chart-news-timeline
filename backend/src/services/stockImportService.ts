/**
 * 株価インポートサービス
 * CSVファイルから株価データをインポートするビジネスロジック
 */

import { stockRepository } from '../repositories/stockRepository';
import { stockPriceRepository } from '../repositories/stockPriceRepository';
import { csvParserService } from './csvParserService';
import { csvValidator } from '../utils/csvValidator';
import {
  CsvRow,
  ImportResult,
  ImportError,
  ValidationResult,
  DuplicateStrategy,
} from '../types/import';
import { logger } from '../utils/logger';
import { randomUUID } from 'crypto';

/**
 * 株価インポートサービスクラス
 */
export class StockImportService {
  /**
   * CSVファイルから株価データをインポート
   * @param stockCode 銘柄コード
   * @param csvContent CSVファイルの内容
   * @param strategy 重複時の処理戦略（'skip' | 'overwrite'）
   * @returns インポート結果
   * @throws 銘柄が見つからない場合
   */
  async importFromCsv(
    stockCode: string,
    csvContent: string,
    strategy: DuplicateStrategy = 'skip'
  ): Promise<ImportResult> {
    logger.info(`株価インポート開始: 銘柄コード=${stockCode}, 戦略=${strategy}`);

    // 1. 銘柄存在チェック
    const stock = await stockRepository.findByCode(stockCode);
    if (!stock) {
      throw new Error(`銘柄コード ${stockCode} が見つかりません`);
    }

    // 2. CSVパース
    const rows = await csvParserService.parse(csvContent);
    logger.debug(`CSVパース完了: ${rows.length}行`);

    // 3. バリデーション
    const validationResult = this.validateRows(rows);
    logger.debug(
      `バリデーション完了: 有効=${validationResult.validRows.length}行, エラー=${validationResult.errors.length}行`
    );

    // 4. データベース登録
    const importResult = await this.bulkInsertPrices(
      stock.stockId,
      stockCode,
      stock.stockName,
      validationResult.validRows,
      strategy
    );

    // バリデーションエラーを結果に追加
    importResult.errors.push(...validationResult.errors);
    importResult.errorCount += validationResult.errors.length;

    logger.info(
      `株価インポート完了: 成功=${importResult.successCount}, スキップ=${importResult.skipCount}, エラー=${importResult.errorCount}`
    );

    return importResult;
  }

  /**
   * 株価データのバリデーション
   * @param rows CSV行データ配列
   * @returns バリデーション結果
   */
  private validateRows(rows: CsvRow[]): ValidationResult {
    const validRows: CsvRow[] = [];
    const errors: ImportError[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const validationError = csvValidator.validate(row);

      if (validationError) {
        errors.push({
          row: i + 2, // ヘッダー行を考慮（1行目がヘッダー、データは2行目から）
          date: row.date,
          message: validationError,
        });
      } else {
        validRows.push(row);
      }
    }

    return { validRows, errors };
  }

  /**
   * 株価データの一括登録
   * @param stockId 株ID
   * @param stockCode 銘柄コード
   * @param stockName 銘柄名
   * @param rows 有効なCSV行データ配列
   * @param strategy 重複時の処理戦略
   * @returns インポート結果
   */
  private async bulkInsertPrices(
    stockId: number,
    stockCode: string,
    stockName: string,
    rows: CsvRow[],
    strategy: DuplicateStrategy
  ): Promise<ImportResult> {
    let successCount = 0;
    let skipCount = 0;
    const errors: ImportError[] = [];

    // 戦略に応じた処理
    if (strategy === 'skip') {
      // skipモード: createManyを使用（skipDuplicates: true）
      try {
        const insertedCount = await stockPriceRepository.createMany(stockId, rows);
        successCount = insertedCount;
        skipCount = rows.length - insertedCount;
      } catch (error) {
        logger.error(`一括挿入エラー: ${error instanceof Error ? error.message : String(error)}`);
        // フォールバック: 1行ずつ処理
        const result = await this.insertRowByRow(stockId, rows, strategy);
        successCount = result.successCount;
        skipCount = result.skipCount;
        errors.push(...result.errors);
      }
    } else if (strategy === 'overwrite') {
      // overwriteモード: 1行ずつupsert
      const result = await this.insertRowByRow(stockId, rows, strategy);
      successCount = result.successCount;
      skipCount = result.skipCount;
      errors.push(...result.errors);
    }

    return {
      importId: this.generateImportId(),
      stockCode,
      stockName,
      totalRows: rows.length,
      successCount,
      skipCount,
      errorCount: errors.length,
      errors,
      importedAt: new Date().toISOString(),
    };
  }

  /**
   * 1行ずつデータを挿入
   * @param stockId 株ID
   * @param rows CSV行データ配列
   * @param strategy 重複時の処理戦略
   * @returns 挿入結果
   */
  private async insertRowByRow(
    stockId: number,
    rows: CsvRow[],
    strategy: DuplicateStrategy
  ): Promise<{ successCount: number; skipCount: number; errors: ImportError[] }> {
    let successCount = 0;
    let skipCount = 0;
    const errors: ImportError[] = [];

    for (const row of rows) {
      try {
        if (strategy === 'skip') {
          // 既存データをチェック
          const exists = await stockPriceRepository.existsByDate(stockId, row.date);
          if (exists) {
            skipCount++;
            continue;
          }
          await stockPriceRepository.create(stockId, row);
        } else {
          // overwriteモード: upsert
          await stockPriceRepository.upsert(stockId, row);
        }
        successCount++;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        logger.warn(`行の挿入エラー: 日付=${row.date}, エラー=${errorMessage}`);
        errors.push({
          row: 0, // 行番号は呼び出し元で設定
          date: row.date,
          message: `データベース登録エラー: ${errorMessage}`,
        });
      }
    }

    return { successCount, skipCount, errors };
  }

  /**
   * インポートIDを生成
   * @returns インポートID（例: import_20240115_123456）
   */
  private generateImportId(): string {
    const timestamp = new Date()
      .toISOString()
      .replace(/[-:T]/g, '')
      .split('.')[0];
    const uuid = randomUUID().split('-')[0];
    return `import_${timestamp}_${uuid}`;
  }
}

// シングルトンインスタンスをエクスポート
export const stockImportService = new StockImportService();
