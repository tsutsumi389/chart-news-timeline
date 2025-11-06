/**
 * ニュースCSVパーサーユーティリティ
 * ブラウザ環境でニュース用CSVファイルをパースし、ニュースアイテムに変換
 */

import type { NewsItem, CsvPreviewData } from '../types/newsImport';

/**
 * CSVヘッダー定義
 */
const EXPECTED_HEADERS = [
  '公開日時',
  'タイトル',
  '要約',
  'URL',
  'ソース',
  'センチメント',
  'センチメントスコア',
];

/**
 * CSV行をパースしてフィールド配列に変換
 * カンマとダブルクォートに対応
 * @param line CSV行文字列
 * @returns フィールド配列
 */
function parseCsvLine(line: string): string[] {
  const values: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      inQuotes = !inQuotes;
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
 * CSVヘッダーの検証
 * @param header ヘッダー配列
 * @throws ヘッダーが不正な場合
 */
function validateCsvHeader(header: string[]): void {
  for (let i = 0; i < EXPECTED_HEADERS.length; i++) {
    if (header[i]?.trim() !== EXPECTED_HEADERS[i]) {
      throw new Error(
        `CSVヘッダーが不正です。期待: ${EXPECTED_HEADERS.join(',')}`
      );
    }
  }
}

/**
 * CSVフィールド値配列をニュースアイテムに変換
 * @param values フィールド値配列
 * @returns ニュースアイテム
 */
function parseNewsItem(values: string[]): NewsItem {
  return {
    publishedAt: values[0] || '',
    title: values[1] || '',
    summary: values[2] || undefined,
    url: values[3] || undefined,
    source: values[4] || undefined,
    sentiment:
      (values[5] as 'positive' | 'negative' | 'neutral') || 'neutral',
    sentimentScore: values[6] ? parseFloat(values[6]) : undefined,
  };
}

/**
 * CSVファイル内容をパースしてニュースアイテム配列に変換
 * @param csvContent CSVファイル内容（文字列）
 * @returns ニュースアイテム配列
 * @throws パースエラー
 */
export function parseCsv(csvContent: string): NewsItem[] {
  const lines = csvContent.split('\n').filter((line) => line.trim() !== '');

  if (lines.length === 0) {
    throw new Error('CSVファイルが空です');
  }

  // ヘッダー行検証
  const header = parseCsvLine(lines[0]);
  validateCsvHeader(header);

  // データ行をパース
  const newsItems: NewsItem[] = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const values = parseCsvLine(line);
    const item = parseNewsItem(values);
    newsItems.push(item);
  }

  return newsItems;
}

/**
 * CSVファイルをパースしてプレビューデータを生成
 * エラーが発生した場合もキャッチして結果を返す
 * @param file CSVファイル
 * @returns プレビューデータ（Promise）
 */
export async function parseCsvPreview(
  file: File
): Promise<CsvPreviewData> {
  try {
    const content = await file.text();
    const items = parseCsv(content);

    return {
      items,
      totalRows: items.length,
      hasError: false,
    };
  } catch (error) {
    return {
      items: [],
      totalRows: 0,
      hasError: true,
      errorMessage:
        error instanceof Error ? error.message : 'CSVのパースに失敗しました',
    };
  }
}

/**
 * ファイルがCSV形式かチェック
 * @param file ファイル
 * @returns CSV形式の場合true
 */
export function isCsvFile(file: File): boolean {
  return (
    file.type === 'text/csv' ||
    file.type === 'application/csv' ||
    file.name.endsWith('.csv')
  );
}

/**
 * ファイルサイズがサイズ制限内かチェック
 * @param file ファイル
 * @param maxSizeMB 最大サイズ（MB）
 * @returns サイズ制限内の場合true
 */
export function isValidFileSize(file: File, maxSizeMB: number = 5): boolean {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  return file.size <= maxSizeBytes;
}
