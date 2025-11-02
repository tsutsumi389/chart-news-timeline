/**
 * エラーハンドラーのユニットテスト
 */

import { describe, it, expect } from 'vitest';
import { AppError, createError, createErrorResponse } from './errorHandler';

describe('エラーハンドラー', () => {
  describe('AppError', () => {
    it('カスタムエラーを正しく作成できる', () => {
      const error = new AppError('VALIDATION_ERROR', 'バリデーションエラー', 400, {
        field: 'email',
      });

      expect(error.code).toBe('VALIDATION_ERROR');
      expect(error.message).toBe('バリデーションエラー');
      expect(error.statusCode).toBe(400);
      expect(error.details).toEqual({ field: 'email' });
      expect(error.name).toBe('AppError');
    });
  });

  describe('createErrorResponse', () => {
    it('エラーレスポンスを正しく作成できる', () => {
      const response = createErrorResponse('STOCK_NOT_FOUND', '株が見つかりません', {
        stockCode: '9999',
      });

      expect(response).toEqual({
        success: false,
        error: {
          code: 'STOCK_NOT_FOUND',
          message: '株が見つかりません',
          details: { stockCode: '9999' },
        },
      });
    });

    it('detailsなしでエラーレスポンスを作成できる', () => {
      const response = createErrorResponse('INTERNAL_SERVER_ERROR', 'サーバーエラー');

      expect(response).toEqual({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'サーバーエラー',
          details: undefined,
        },
      });
    });
  });

  describe('createError ファクトリー関数', () => {
    describe('notFound', () => {
      it('株が見つからないエラーを作成できる', () => {
        const error = createError.notFound('stock', '7203');

        expect(error.code).toBe('STOCK_NOT_FOUND');
        expect(error.message).toBe('指定されたstockが見つかりません');
        expect(error.statusCode).toBe(404);
        expect(error.details).toEqual({ stock: '7203' });
      });

      it('ニュースが見つからないエラーを作成できる', () => {
        const error = createError.notFound('news', 123);

        expect(error.code).toBe('NEWS_NOT_FOUND');
        expect(error.statusCode).toBe(404);
        expect(error.details).toEqual({ news: 123 });
      });

      it('株価データが見つからないエラーを作成できる', () => {
        const error = createError.notFound('price', '7203');

        expect(error.code).toBe('PRICE_DATA_NOT_FOUND');
        expect(error.statusCode).toBe(404);
      });
    });

    describe('validation', () => {
      it('バリデーションエラーを作成できる', () => {
        const error = createError.validation('無効な入力です', {
          field: 'stockCode',
          value: 'invalid',
        });

        expect(error.code).toBe('VALIDATION_ERROR');
        expect(error.message).toBe('無効な入力です');
        expect(error.statusCode).toBe(400);
        expect(error.details).toEqual({ field: 'stockCode', value: 'invalid' });
      });

      it('detailsなしでバリデーションエラーを作成できる', () => {
        const error = createError.validation('無効な入力です');

        expect(error.code).toBe('VALIDATION_ERROR');
        expect(error.statusCode).toBe(400);
        expect(error.details).toBeUndefined();
      });
    });

    describe('invalidDateRange', () => {
      it('日付範囲エラーを作成できる', () => {
        const error = createError.invalidDateRange();

        expect(error.code).toBe('INVALID_DATE_RANGE');
        expect(error.message).toBe('日付範囲が不正です。開始日は終了日より前である必要があります');
        expect(error.statusCode).toBe(400);
      });
    });

    describe('database', () => {
      it('カスタムメッセージでデータベースエラーを作成できる', () => {
        const error = createError.database('接続に失敗しました');

        expect(error.code).toBe('DATABASE_ERROR');
        expect(error.message).toBe('接続に失敗しました');
        expect(error.statusCode).toBe(500);
      });

      it('デフォルトメッセージでデータベースエラーを作成できる', () => {
        const error = createError.database();

        expect(error.code).toBe('DATABASE_ERROR');
        expect(error.message).toBe('データベースエラーが発生しました');
        expect(error.statusCode).toBe(500);
      });
    });
  });
});
