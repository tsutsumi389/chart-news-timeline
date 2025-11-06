/**
 * ニュースインポートAPI通信サービス
 * CSVアップロード、重複チェック、削除、履歴取得APIとの通信処理
 */

import type {
  NewsImportResult,
  NewsImportOptions,
  DuplicateCheckResult,
  NewsItem,
  NewsImportHistoryItem,
} from '../types/newsImport';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

/**
 * API共通レスポンス型
 */
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}

/**
 * CSVファイルからニュースデータをインポート
 * @param stockCode 銘柄コード（4桁）
 * @param file CSVファイル
 * @param options インポートオプション
 * @returns インポート結果
 * @throws エラーオブジェクト（code, message, details）
 */
export async function importNewsFromCsv(
  stockCode: string,
  file: File,
  options: NewsImportOptions
): Promise<NewsImportResult> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('duplicateStrategy', options.duplicateStrategy);
  if (options.dateFrom) {
    formData.append('dateFrom', options.dateFrom);
  }
  if (options.dateTo) {
    formData.append('dateTo', options.dateTo);
  }

  const response = await fetch(
    `${API_BASE_URL}/api/v1/stocks/${stockCode}/news/import/csv`,
    {
      method: 'POST',
      body: formData,
    }
  );

  const data: ApiResponse<NewsImportResult> = await response.json();

  if (!response.ok || !data.success) {
    throw {
      code: data.error?.code || 'UNKNOWN_ERROR',
      message: data.error?.message || 'ニュースのインポートに失敗しました',
      details: data.error?.details,
    };
  }

  return data.data!;
}

/**
 * 重複ニュースの検出
 * @param stockCode 銘柄コード（4桁）
 * @param newsItems ニュースアイテム配列
 * @returns 重複チェック結果
 * @throws エラーメッセージ
 */
export async function checkDuplicateNews(
  stockCode: string,
  newsItems: NewsItem[]
): Promise<DuplicateCheckResult> {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/stocks/${stockCode}/news/check-duplicates`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ news: newsItems }),
    }
  );

  const data: ApiResponse<DuplicateCheckResult> = await response.json();

  if (!data.success || !data.data) {
    throw new Error(
      data.error?.message || '重複ニュースのチェックに失敗しました'
    );
  }

  return data.data;
}

/**
 * 指定銘柄のニュースデータを削除
 * @param stockCode 銘柄コード（4桁）
 * @param options 削除オプション（日付範囲）
 * @returns 削除されたニュース件数
 * @throws エラーメッセージ
 */
export async function deleteNews(
  stockCode: string,
  options?: {
    startDate?: string;
    endDate?: string;
  }
): Promise<number> {
  const params = new URLSearchParams();
  if (options?.startDate) params.append('startDate', options.startDate);
  if (options?.endDate) params.append('endDate', options.endDate);

  const queryString = params.toString();
  const url = `${API_BASE_URL}/api/v1/stocks/${stockCode}/news${
    queryString ? `?${queryString}` : ''
  }`;

  const response = await fetch(url, {
    method: 'DELETE',
  });

  const data: ApiResponse<{
    stockCode: string;
    deletedCount: number;
    dateRange?: {
      start: string;
      end: string;
    };
  }> = await response.json();

  if (!data.success || !data.data) {
    throw new Error(data.error?.message || 'ニュースの削除に失敗しました');
  }

  return data.data.deletedCount;
}

/**
 * インポート履歴取得
 * @param stockCode 銘柄コード（4桁）
 * @param options 取得オプション（件数、オフセット）
 * @returns インポート履歴配列
 * @throws エラーメッセージ
 */
export async function fetchImportHistory(
  stockCode: string,
  options?: {
    limit?: number;
    offset?: number;
  }
): Promise<{ total: number; history: NewsImportHistoryItem[] }> {
  const params = new URLSearchParams();
  if (options?.limit) params.append('limit', options.limit.toString());
  if (options?.offset) params.append('offset', options.offset.toString());

  const queryString = params.toString();
  const url = `${API_BASE_URL}/api/v1/stocks/${stockCode}/news/import/history${
    queryString ? `?${queryString}` : ''
  }`;

  const response = await fetch(url);
  const data: ApiResponse<{
    total: number;
    history: NewsImportHistoryItem[];
  }> = await response.json();

  if (!data.success || !data.data) {
    throw new Error(
      data.error?.message || 'インポート履歴の取得に失敗しました'
    );
  }

  return data.data;
}
