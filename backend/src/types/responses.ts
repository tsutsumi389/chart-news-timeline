/**
 * API レスポンス型定義
 */

// 成功レスポンスの基本型
export interface SuccessResponse<T> {
  success: true;
  data: T;
}

// エラーレスポンスの基本型
export interface ErrorResponse {
  success: false;
  error: {
    code: ErrorCode;
    message: string;
    details?: Record<string, unknown>;
  };
}

// エラーコード定義
export type ErrorCode =
  | 'VALIDATION_ERROR'
  | 'STOCK_NOT_FOUND'
  | 'NEWS_NOT_FOUND'
  | 'PRICE_DATA_NOT_FOUND'
  | 'INVALID_DATE_RANGE'
  | 'DATABASE_ERROR'
  | 'INTERNAL_SERVER_ERROR';

// API レスポンスの共通型
export type ApiResponse<T> = SuccessResponse<T> | ErrorResponse;
