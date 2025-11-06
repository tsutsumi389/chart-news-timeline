// CSV行のバリデーション
import type { CsvRow, ImportError, ValidationResult } from '../types/import';

/**
 * 日付形式チェック（YYYY-MM-DD）
 * @param dateString 日付文字列
 * @returns 有効な日付の場合true
 */
function isValidDate(dateString: string): boolean {
  // YYYY-MM-DD形式の正規表現チェック
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateString)) {
    return false;
  }

  // 実際に有効な日付かチェック
  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    return false;
  }

  // 日付文字列と実際のDate型の値が一致するかチェック
  // （例: 2024-02-30は2024-03-01になるため不一致となる）
  const [year, month, day] = dateString.split('-').map(Number);
  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
}

/**
 * 日付が過去の日付かチェック
 * @param dateString 日付文字列（YYYY-MM-DD）
 * @returns 過去の日付の場合true
 */
function isPastDate(dateString: string): boolean {
  const date = new Date(dateString);
  const today = new Date();
  today.setHours(0, 0, 0, 0); // 時刻をリセットして日付のみで比較
  return date <= today;
}

/**
 * 単一のCSV行をバリデーション
 * @param row CSV行データ
 * @param rowIndex 行番号（エラー表示用、1始まり）
 * @returns エラーメッセージ（正常な場合はnull）
 */
export function validateCsvRow(
  row: CsvRow,
  _rowIndex: number
): string | null {
  // 日付形式チェック
  if (!isValidDate(row.date)) {
    return '日付形式が不正です（YYYY-MM-DD形式で入力してください）';
  }

  // 日付が未来でないかチェック
  if (!isPastDate(row.date)) {
    return '日付は過去の日付である必要があります';
  }

  // 価格の正数チェック
  if (row.open <= 0) {
    return '始値は正の数値である必要があります';
  }
  if (row.high <= 0) {
    return '高値は正の数値である必要があります';
  }
  if (row.low <= 0) {
    return '安値は正の数値である必要があります';
  }
  if (row.close <= 0) {
    return '終値は正の数値である必要があります';
  }

  // OHLC関係性チェック: 高値が最大値である
  if (row.high < row.low) {
    return '高値が安値より低い値です';
  }

  if (row.high < row.open) {
    return '高値が始値より低い値です';
  }

  if (row.high < row.close) {
    return '高値が終値より低い値です';
  }

  // OHLC関係性チェック: 安値が最小値である
  if (row.low > row.open) {
    return '安値が始値より高い値です';
  }

  if (row.low > row.close) {
    return '安値が終値より高い値です';
  }

  // 出来高チェック
  if (row.volume < 0) {
    return '出来高は0以上である必要があります';
  }

  if (!Number.isInteger(row.volume)) {
    return '出来高は整数である必要があります';
  }

  // 異常値チェック（価格が極端に高い/低い）
  const MAX_PRICE = 1_000_000; // 100万円
  const MIN_PRICE = 0.01; // 1銭

  if (
    row.open > MAX_PRICE ||
    row.high > MAX_PRICE ||
    row.low > MAX_PRICE ||
    row.close > MAX_PRICE
  ) {
    return `価格が異常に高い値です（最大: ${MAX_PRICE.toLocaleString()}円）`;
  }

  if (
    row.open < MIN_PRICE ||
    row.high < MIN_PRICE ||
    row.low < MIN_PRICE ||
    row.close < MIN_PRICE
  ) {
    return `価格が異常に低い値です（最小: ${MIN_PRICE}円）`;
  }

  // 出来高の異常値チェック
  const MAX_VOLUME = 10_000_000_000; // 100億株
  if (row.volume > MAX_VOLUME) {
    return `出来高が異常に大きい値です（最大: ${MAX_VOLUME.toLocaleString()}株）`;
  }

  return null;
}

/**
 * 複数のCSV行をバリデーション
 * @param rows CSV行データの配列
 * @returns バリデーション結果
 */
export function validateCsvRows(rows: CsvRow[]): ValidationResult {
  const validRows: CsvRow[] = [];
  const errors: ImportError[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowIndex = i + 2; // ヘッダー行を考慮（1行目はヘッダー、2行目からデータ）

    const errorMessage = validateCsvRow(row, rowIndex);

    if (errorMessage) {
      errors.push({
        row: rowIndex,
        date: row.date,
        message: errorMessage,
      });
    } else {
      validRows.push(row);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    validRows,
  };
}

/**
 * CSVデータの重複チェック（同一日付）
 * @param rows CSV行データの配列
 * @returns 重複している日付のリスト
 */
export function findDuplicateDates(rows: CsvRow[]): string[] {
  const dateSet = new Set<string>();
  const duplicates = new Set<string>();

  for (const row of rows) {
    if (dateSet.has(row.date)) {
      duplicates.add(row.date);
    } else {
      dateSet.add(row.date);
    }
  }

  return Array.from(duplicates).sort();
}

/**
 * CSVデータの日付順序チェック
 * @param rows CSV行データの配列
 * @returns 日付が昇順にソートされている場合true
 */
export function isDatesSorted(rows: CsvRow[]): boolean {
  for (let i = 1; i < rows.length; i++) {
    const prevDate = new Date(rows[i - 1].date);
    const currDate = new Date(rows[i].date);

    if (prevDate > currDate) {
      return false;
    }
  }

  return true;
}

/**
 * CSVデータを日付でソート（昇順）
 * @param rows CSV行データの配列
 * @returns ソート済みのCSV行データ
 */
export function sortRowsByDate(rows: CsvRow[]): CsvRow[] {
  return [...rows].sort((a, b) => {
    const dateA = new Date(a.date);
    const dateB = new Date(b.date);
    return dateA.getTime() - dateB.getTime();
  });
}
