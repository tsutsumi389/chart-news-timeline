/**
 * CSVパーサーサービス
 * CSVファイルの内容をパースして構造化データに変換
 */

import { CsvRow } from '../types/import';
import { logger } from '../utils/logger';

/**
 * CSVパーサーサービスクラス
 */
export class CsvParserService {
  // 期待するCSVヘッダー
  private readonly expectedHeaders = ['日付', '始値', '高値', '安値', '終値', '出来高'];

  /**
   * CSVファイル内容をパースして構造化データに変換
   * @param csvContent CSVファイルの内容
   * @returns CsvRow配列
   * @throws CSVフォーマットエラー
   */
  async parse(csvContent: string): Promise<CsvRow[]> {
    logger.debug('CSVパース開始');

    // 空白行を除外して行分割
    const lines = csvContent
      .split(/\r?\n/)
      .map(line => line.trim())
      .filter(line => line.length > 0);

    if (lines.length === 0) {
      throw new Error('CSVファイルが空です');
    }

    // ヘッダー行検証
    const header = this.parseHeaderLine(lines[0]);
    this.validateHeader(header);

    // データ行をパース
    const rows: CsvRow[] = [];
    for (let i = 1; i < lines.length; i++) {
      try {
        const row = this.parseDataLine(lines[i], i + 1);
        rows.push(row);
      } catch (error) {
        logger.warn(`行 ${i + 1} のパースに失敗: ${error instanceof Error ? error.message : String(error)}`);
        throw new Error(`行 ${i + 1}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    logger.debug(`CSVパース完了: ${rows.length}行`);
    return rows;
  }

  /**
   * ヘッダー行をパース
   * @param headerLine ヘッダー行の文字列
   * @returns ヘッダー配列
   */
  private parseHeaderLine(headerLine: string): string[] {
    return headerLine.split(',').map(col => col.trim());
  }

  /**
   * ヘッダー行の検証
   * @param header ヘッダー配列
   * @throws ヘッダーが不正な場合
   */
  private validateHeader(header: string[]): void {
    if (header.length !== this.expectedHeaders.length) {
      throw new Error(
        `CSVヘッダーの列数が不正です。期待: ${this.expectedHeaders.length}列、実際: ${header.length}列`
      );
    }

    for (let i = 0; i < this.expectedHeaders.length; i++) {
      if (header[i] !== this.expectedHeaders[i]) {
        throw new Error(
          `CSVヘッダーが不正です。列${i + 1}は「${this.expectedHeaders[i]}」である必要があります（実際: 「${header[i]}」）`
        );
      }
    }
  }

  /**
   * データ行をパース
   * @param line データ行の文字列
   * @param lineNumber 行番号（エラーメッセージ用）
   * @returns CsvRow
   * @throws パースエラー
   */
  private parseDataLine(line: string, lineNumber: number): CsvRow {
    const values = line.split(',').map(col => col.trim());

    if (values.length !== 6) {
      throw new Error(`列数が不正です（期待: 6列、実際: ${values.length}列）`);
    }

    // 日付
    const date = values[0];
    if (!date) {
      throw new Error('日付が空です');
    }

    // 数値のパース
    const open = this.parseNumber(values[1], '始値');
    const high = this.parseNumber(values[2], '高値');
    const low = this.parseNumber(values[3], '安値');
    const close = this.parseNumber(values[4], '終値');
    const volume = this.parseInteger(values[5], '出来高');

    return {
      date,
      open,
      high,
      low,
      close,
      volume,
    };
  }

  /**
   * 文字列を数値にパース
   * @param value 文字列値
   * @param fieldName フィールド名（エラーメッセージ用）
   * @returns 数値
   * @throws パースエラー
   */
  private parseNumber(value: string, fieldName: string): number {
    const num = parseFloat(value);
    if (isNaN(num)) {
      throw new Error(`${fieldName}が数値ではありません: ${value}`);
    }
    return num;
  }

  /**
   * 文字列を整数にパース
   * @param value 文字列値
   * @param fieldName フィールド名（エラーメッセージ用）
   * @returns 整数
   * @throws パースエラー
   */
  private parseInteger(value: string, fieldName: string): number {
    const num = parseInt(value, 10);
    if (isNaN(num)) {
      throw new Error(`${fieldName}が整数ではありません: ${value}`);
    }
    return num;
  }
}

// シングルトンインスタンスをエクスポート
export const csvParserService = new CsvParserService();
