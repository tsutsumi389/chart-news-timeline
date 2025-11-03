// 株価インポートAPIサービス
import type {
  ApiResponse,
  ImportResult,
  ImportHistoryItem,
  DuplicateStrategy,
} from '../types/import';
import type { Stock } from '../types/stock';

// APIベースURL（環境変数から取得、デフォルトはlocalhost:3000）
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

/**
 * API共通エラーハンドリング
 */
class ApiError extends Error {
  constructor(
    public code: string,
    message: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * APIレスポンスの型ガード
 */
function isApiSuccessResponse<T>(
  response: ApiResponse<T>
): response is { success: true; data: T } {
  return response.success === true;
}

/**
 * 銘柄情報を取得
 * @param stockCode 銘柄コード（4桁）
 * @returns 銘柄情報
 * @throws ApiError 銘柄が見つからない場合
 */
export async function fetchStock(stockCode: string): Promise<Stock> {
  const response = await fetch(`${API_BASE_URL}/api/v1/stocks/${stockCode}`);

  if (!response.ok) {
    if (response.status === 404) {
      throw new ApiError(
        'STOCK_NOT_FOUND',
        `銘柄コード ${stockCode} が見つかりません`
      );
    }
    throw new ApiError(
      'API_ERROR',
      `銘柄情報の取得に失敗しました: ${response.statusText}`
    );
  }

  const data: ApiResponse<Stock> = await response.json();

  if (!isApiSuccessResponse(data)) {
    throw new ApiError(
      data.error.code,
      data.error.message,
      data.error.details
    );
  }

  return data.data;
}

/**
 * CSVファイルから株価データをインポート
 * @param stockCode 銘柄コード（4桁）
 * @param file CSVファイル
 * @param duplicateStrategy 重複データ処理戦略（'skip' or 'overwrite'）
 * @returns インポート結果
 * @throws ApiError インポート失敗時
 */
export async function importStockPricesFromCsv(
  stockCode: string,
  file: File,
  duplicateStrategy: DuplicateStrategy = 'skip'
): Promise<ImportResult> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('duplicateStrategy', duplicateStrategy);

  const response = await fetch(
    `${API_BASE_URL}/api/v1/stocks/${stockCode}/import/csv`,
    {
      method: 'POST',
      body: formData,
    }
  );

  if (!response.ok) {
    if (response.status === 404) {
      throw new ApiError(
        'STOCK_NOT_FOUND',
        `銘柄コード ${stockCode} が見つかりません`
      );
    }
    if (response.status === 400) {
      const errorData = await response.json();
      throw new ApiError(
        'VALIDATION_ERROR',
        errorData.error?.message || 'CSVファイルの形式が不正です',
        errorData.error?.details
      );
    }
    if (response.status === 413) {
      throw new ApiError(
        'FILE_TOO_LARGE',
        'ファイルサイズが大きすぎます（最大10MB）'
      );
    }
    throw new ApiError(
      'API_ERROR',
      `インポートに失敗しました: ${response.statusText}`
    );
  }

  const data: ApiResponse<ImportResult> = await response.json();

  if (!isApiSuccessResponse(data)) {
    throw new ApiError(
      data.error.code,
      data.error.message,
      data.error.details
    );
  }

  return data.data;
}

/**
 * 株価データを削除
 * @param stockCode 銘柄コード（4桁）
 * @param startDate 削除開始日（YYYY-MM-DD形式、オプション）
 * @param endDate 削除終了日（YYYY-MM-DD形式、オプション）
 * @returns 削除件数
 * @throws ApiError 削除失敗時
 */
export async function deleteStockPrices(
  stockCode: string,
  startDate?: string,
  endDate?: string
): Promise<{ stockCode: string; deletedCount: number }> {
  const params = new URLSearchParams();
  if (startDate) params.append('startDate', startDate);
  if (endDate) params.append('endDate', endDate);

  const url = `${API_BASE_URL}/api/v1/stocks/${stockCode}/prices${
    params.toString() ? `?${params.toString()}` : ''
  }`;

  const response = await fetch(url, {
    method: 'DELETE',
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new ApiError(
        'STOCK_NOT_FOUND',
        `銘柄コード ${stockCode} が見つかりません`
      );
    }
    throw new ApiError(
      'API_ERROR',
      `データの削除に失敗しました: ${response.statusText}`
    );
  }

  const data: ApiResponse<{ stockCode: string; deletedCount: number }> =
    await response.json();

  if (!isApiSuccessResponse(data)) {
    throw new ApiError(
      data.error.code,
      data.error.message,
      data.error.details
    );
  }

  return data.data;
}

/**
 * インポート履歴を取得
 * @param stockCode 銘柄コード（4桁）
 * @param limit 取得件数（デフォルト: 20）
 * @param offset オフセット（デフォルト: 0）
 * @returns インポート履歴
 * @throws ApiError 取得失敗時
 */
export async function fetchImportHistory(
  stockCode: string,
  limit: number = 20,
  offset: number = 0
): Promise<{ total: number; history: ImportHistoryItem[] }> {
  const params = new URLSearchParams();
  params.append('limit', limit.toString());
  params.append('offset', offset.toString());

  const response = await fetch(
    `${API_BASE_URL}/api/v1/stocks/${stockCode}/import/history?${params.toString()}`
  );

  if (!response.ok) {
    if (response.status === 404) {
      throw new ApiError(
        'STOCK_NOT_FOUND',
        `銘柄コード ${stockCode} が見つかりません`
      );
    }
    throw new ApiError(
      'API_ERROR',
      `履歴の取得に失敗しました: ${response.statusText}`
    );
  }

  const data: ApiResponse<{ total: number; history: ImportHistoryItem[] }> =
    await response.json();

  if (!isApiSuccessResponse(data)) {
    throw new ApiError(
      data.error.code,
      data.error.message,
      data.error.details
    );
  }

  return data.data;
}

export { ApiError };
