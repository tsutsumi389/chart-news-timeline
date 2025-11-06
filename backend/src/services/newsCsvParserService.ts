/**
 * ニュースCSVパーサーサービス
 * CSVファイルの内容をパースしてニュースデータに変換
 */

import { NewsItem, Sentiment } from '../types/newsImport';
import { logger } from '../utils/logger';

/**
 * ニュースCSVパーサーサービスクラス
 */
export class NewsCsvParserService {
  // 期待するCSVヘッダー
  private readonly expectedHeaders = [
    '公開日時',
    'タイトル',
    '要約',
    'URL',
    'ソース',
    'センチメント',
    'センチメントスコア',
  ];

  /**
   * CSVファイル内容をパースして構造化データに変換
   * @param csvContent CSVファイルの内容
   * @returns NewsItem配列
   * @throws CSVフォーマットエラー
   */
  async parse(csvContent: string): Promise<NewsItem[]> {
    logger.debug('ニュースCSVパース開始');

    // 空白行を除外して行分割
    const lines = csvContent
      .split(/\r?\n/)
      .map(line => line.trim())
      .filter(line => line.length > 0);

    if (lines.length === 0) {
      throw new Error('CSVファイルが空です');
    }

    // ヘッダー行検証
    const header = this.parseCsvLine(lines[0]);
    this.validateHeader(header);

    // データ行をパース
    const items: NewsItem[] = [];
    for (let i = 1; i < lines.length; i++) {
      try {
        const item = this.parseDataLine(lines[i], i + 1);
        items.push(item);
      } catch (error) {
        logger.warn(`行 ${i + 1} のパースに失敗: ${error instanceof Error ? error.message : String(error)}`);
        throw new Error(`行 ${i + 1}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    logger.debug(`ニュースCSVパース完了: ${items.length}件`);
    return items;
  }

  /**
   * CSV行のパース（カンマとダブルクォートに対応）
   * @param line CSV行
   * @returns 値の配列
   */
  private parseCsvLine(line: string): string[] {
    const values: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        // ダブルクォートのエスケープ（""）に対応
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++; // 次の文字をスキップ
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }

    values.push(current.trim());
    return values;
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
      // ダブルクォートを除去して比較
      const headerValue = header[i].replace(/^"|"$/g, '');
      if (headerValue !== this.expectedHeaders[i]) {
        throw new Error(
          `CSVヘッダーが不正です。列${i + 1}は「${this.expectedHeaders[i]}」である必要があります（実際: 「${headerValue}」）`
        );
      }
    }
  }

  /**
   * データ行をパース
   * @param line データ行の文字列
   * @param lineNumber 行番号（エラーメッセージ用）
   * @returns NewsItem
   * @throws パースエラー
   */
  private parseDataLine(line: string, lineNumber: number): NewsItem {
    const values = this.parseCsvLine(line);

    if (values.length !== 7) {
      throw new Error(`列数が不正です（期待: 7列、実際: ${values.length}列）`);
    }

    // ダブルクォートを除去
    const cleanValues = values.map(v => v.replace(/^"|"$/g, ''));

    // 公開日時（必須）
    const publishedAt = cleanValues[0];
    if (!publishedAt) {
      throw new Error('公開日時が空です');
    }

    // タイトル（必須）
    const title = cleanValues[1];
    if (!title) {
      throw new Error('タイトルが空です');
    }

    // 要約（任意）
    const summary = cleanValues[2] || undefined;

    // URL（任意）
    const url = cleanValues[3] || undefined;

    // ソース（任意）
    const source = cleanValues[4] || undefined;

    // センチメント（任意、デフォルト: neutral）
    const sentiment = this.parseSentiment(cleanValues[5]);

    // センチメントスコア（任意）
    const sentimentScore = this.parseSentimentScore(cleanValues[6]);

    return {
      publishedAt,
      title,
      summary,
      url,
      source,
      sentiment,
      sentimentScore,
    };
  }

  /**
   * センチメント値のパース
   * @param value センチメント文字列
   * @returns Sentiment型（デフォルト: neutral）
   */
  private parseSentiment(value: string): Sentiment {
    if (!value) {
      return 'neutral';
    }

    const lowerValue = value.toLowerCase();
    if (lowerValue === 'positive' || lowerValue === 'negative' || lowerValue === 'neutral') {
      return lowerValue as Sentiment;
    }

    // 不正な値の場合はneutralをデフォルトとする
    logger.warn(`不正なセンチメント値: ${value}（neutralに設定）`);
    return 'neutral';
  }

  /**
   * センチメントスコアのパース
   * @param value センチメントスコア文字列
   * @returns 数値（-1.00〜1.00）またはundefined
   */
  private parseSentimentScore(value: string): number | undefined {
    if (!value) {
      return undefined;
    }

    const num = parseFloat(value);
    if (isNaN(num)) {
      logger.warn(`センチメントスコアが数値ではありません: ${value}`);
      return undefined;
    }

    return num;
  }
}

// シングルトンインスタンスをエクスポート
export const newsCsvParserService = new NewsCsvParserService();
