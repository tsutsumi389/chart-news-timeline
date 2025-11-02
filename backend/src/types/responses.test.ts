/**
 * レスポンス型のユニットテスト
 */

import { describe, it, expect } from 'vitest';
import type { SuccessResponse, ErrorResponse, ErrorCode, ApiResponse } from './responses';

describe('レスポンス型定義', () => {
  describe('SuccessResponse', () => {
    it('成功レスポンスの型が正しく定義されている', () => {
      const response: SuccessResponse<{ message: string }> = {
        success: true,
        data: { message: 'テスト成功' },
      };

      expect(response.success).toBe(true);
      expect(response.data).toEqual({ message: 'テスト成功' });
    });
  });

  describe('ErrorResponse', () => {
    it('エラーレスポンスの型が正しく定義されている', () => {
      const response: ErrorResponse = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'バリデーションエラー',
          details: { field: 'email' },
        },
      };

      expect(response.success).toBe(false);
      expect(response.error.code).toBe('VALIDATION_ERROR');
      expect(response.error.message).toBe('バリデーションエラー');
      expect(response.error.details).toEqual({ field: 'email' });
    });

    it('detailsなしのエラーレスポンスが作成できる', () => {
      const response: ErrorResponse = {
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'サーバーエラー',
        },
      };

      expect(response.success).toBe(false);
      expect(response.error.details).toBeUndefined();
    });
  });

  describe('ErrorCode', () => {
    it('すべてのエラーコードが有効', () => {
      const validCodes: ErrorCode[] = [
        'VALIDATION_ERROR',
        'STOCK_NOT_FOUND',
        'NEWS_NOT_FOUND',
        'PRICE_DATA_NOT_FOUND',
        'INVALID_DATE_RANGE',
        'DATABASE_ERROR',
        'INTERNAL_SERVER_ERROR',
      ];

      validCodes.forEach((code) => {
        expect(code).toBeDefined();
      });
    });
  });

  describe('ApiResponse', () => {
    it('成功レスポンスとして使用できる', () => {
      const response: ApiResponse<{ count: number }> = {
        success: true,
        data: { count: 42 },
      };

      if (response.success) {
        expect(response.data.count).toBe(42);
      }
    });

    it('エラーレスポンスとして使用できる', () => {
      const response: ApiResponse<never> = {
        success: false,
        error: {
          code: 'STOCK_NOT_FOUND',
          message: '株が見つかりません',
        },
      };

      if (!response.success) {
        expect(response.error.code).toBe('STOCK_NOT_FOUND');
      }
    });
  });
});
