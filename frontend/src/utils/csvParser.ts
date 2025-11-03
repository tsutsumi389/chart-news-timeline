// CSVファイルのパース処理
import type { CsvRow, RawCsvRow, CsvPreviewData } from '../types/import';

/**
 * CSVパースエラー
 */
export class CsvParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CsvParseError';
  }
}

/**
 * 期待されるCSVヘッダー
 */
const EXPECTED_HEADERS = ['日付', '始値', '高値', '安値', '終値', '出来高'];

/**
 * CSVファイルを読み込んでテキストに変換
 * @param file CSVファイル
 * @returns CSVテキスト内容
 */
export async function readCsvFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      const text = event.target?.result;
      if (typeof text === 'string') {
        resolve(text);
      } else {
        reject(new CsvParseError('ファイルの読み込みに失敗しました'));
      }
    };

    reader.onerror = () => {
      reject(new CsvParseError('ファイルの読み込み中にエラーが発生しました'));
    };

    reader.readAsText(file, 'UTF-8');
  });
}

/**
 * CSVヘッダー行を検証
 * @param header ヘッダー配列
 * @throws CsvParseError ヘッダーが不正な場合
 */
function validateHeader(header: string[]): void {
  if (header.length !== EXPECTED_HEADERS.length) {
    throw new CsvParseError(
      `CSVヘッダーの列数が不正です。期待: ${EXPECTED_HEADERS.length}列、実際: ${header.length}列`
    );
  }

  for (let i = 0; i < EXPECTED_HEADERS.length; i++) {
    const actualHeader = header[i]?.trim();
    const expectedHeader = EXPECTED_HEADERS[i];

    if (actualHeader !== expectedHeader) {
      throw new CsvParseError(
        `CSVヘッダーが不正です。\n期待: ${EXPECTED_HEADERS.join(',')}\n実際: ${header.join(',')}`
      );
    }
  }
}

/**
 * CSV行をパース（文字列のまま）
 * @param line CSV行テキスト
 * @returns パースされた値の配列
 */
function parseCsvLine(line: string): string[] {
  // シンプルなCSVパース（カンマ区切り）
  // TODO: 将来的にはより高度なパース（引用符対応など）を実装
  return line.split(',').map((value) => value.trim());
}

/**
 * CSV行を構造化データに変換（文字列型）
 * @param values CSV行の値配列
 * @param rowIndex 行番号（エラー表示用）
 * @returns 構造化された行データ（文字列型）
 * @throws CsvParseError 列数が不正な場合
 */
function parseRawRow(values: string[], rowIndex: number): RawCsvRow {
  if (values.length !== 6) {
    throw new CsvParseError(
      `行${rowIndex}: 列数が不正です（期待: 6列、実際: ${values.length}列）`
    );
  }

  return {
    date: values[0],
    open: values[1],
    high: values[2],
    low: values[3],
    close: values[4],
    volume: values[5],
  };
}

/**
 * 文字列型の行データを数値型に変換
 * @param rawRow 文字列型の行データ
 * @returns 数値型の行データ
 * @throws CsvParseError 数値変換に失敗した場合
 */
export function convertRawRowToTyped(rawRow: RawCsvRow): CsvRow {
  const open = parseFloat(rawRow.open);
  const high = parseFloat(rawRow.high);
  const low = parseFloat(rawRow.low);
  const close = parseFloat(rawRow.close);
  const volume = parseInt(rawRow.volume, 10);

  if (isNaN(open)) {
    throw new CsvParseError(`始値が数値ではありません: ${rawRow.open}`);
  }
  if (isNaN(high)) {
    throw new CsvParseError(`高値が数値ではありません: ${rawRow.high}`);
  }
  if (isNaN(low)) {
    throw new CsvParseError(`安値が数値ではありません: ${rawRow.low}`);
  }
  if (isNaN(close)) {
    throw new CsvParseError(`終値が数値ではありません: ${rawRow.close}`);
  }
  if (isNaN(volume)) {
    throw new CsvParseError(`出来高が数値ではありません: ${rawRow.volume}`);
  }

  return {
    date: rawRow.date,
    open,
    high,
    low,
    close,
    volume,
  };
}

/**
 * CSVテキストをパースして構造化データに変換
 * @param csvText CSVテキスト内容
 * @returns パースされた行データの配列
 * @throws CsvParseError パースに失敗した場合
 */
export function parseCsv(csvText: string): CsvRow[] {
  const lines = csvText
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.length === 0) {
    throw new CsvParseError('CSVファイルが空です');
  }

  // ヘッダー行を検証
  const headerLine = lines[0];
  const header = parseCsvLine(headerLine);
  validateHeader(header);

  // データ行をパース
  const rows: CsvRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    const values = parseCsvLine(line);

    try {
      const rawRow = parseRawRow(values, i + 1);
      const typedRow = convertRawRowToTyped(rawRow);
      rows.push(typedRow);
    } catch (error) {
      if (error instanceof CsvParseError) {
        throw error;
      }
      throw new CsvParseError(
        `行${i + 1}のパースに失敗しました: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  if (rows.length === 0) {
    throw new CsvParseError('データ行が存在しません');
  }

  return rows;
}

/**
 * CSVファイルからプレビューデータを生成（先頭N行のみ）
 * @param file CSVファイル
 * @param maxRows プレビュー最大行数（デフォルト: 10）
 * @returns プレビューデータ
 */
export async function parseCsvPreview(
  file: File,
  maxRows: number = 10
): Promise<CsvPreviewData> {
  const csvText = await readCsvFile(file);

  const lines = csvText
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.length === 0) {
    throw new CsvParseError('CSVファイルが空です');
  }

  // ヘッダー行
  const headerLine = lines[0];
  const headers = parseCsvLine(headerLine);

  // データ行（最大maxRows行まで）
  const dataLines = lines.slice(1, maxRows + 1);
  const rows = dataLines.map((line) => parseCsvLine(line));

  return {
    headers,
    rows,
    totalRows: lines.length - 1, // ヘッダー行を除く
  };
}

/**
 * CSVファイル全体をパース（ファイル→構造化データ）
 * @param file CSVファイル
 * @returns パースされた行データの配列
 */
export async function parseCsvFile(file: File): Promise<CsvRow[]> {
  const csvText = await readCsvFile(file);
  return parseCsv(csvText);
}
