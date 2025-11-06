/**
 * ニュースインポート用カスタムフック
 * CSVファイルのパース、バリデーション、アップロード処理を管理
 */

import { useState, useCallback } from 'react';
import type {
  NewsImportResult,
  NewsImportOptions,
  DuplicateCheckResult,
} from '../types/newsImport';
import { importNewsFromCsv, checkDuplicateNews } from '../services/newsImportService';
import { parseCsv } from '../utils/newsCsvParser';
import { validateNewsItems } from '../utils/newsValidator';

/**
 * インポート進捗状態
 */
export interface ImportProgress {
  isLoading: boolean;
  progress: number;
  status: 'idle' | 'parsing' | 'validating' | 'checking' | 'uploading' | 'completed' | 'error';
  message?: string;
}

/**
 * useNewsImport フックの戻り値
 */
interface UseNewsImportReturn {
  importCsv: (
    stockCode: string,
    file: File,
    options?: NewsImportOptions
  ) => Promise<NewsImportResult | null>;
  checkDuplicates: (
    stockCode: string,
    file: File
  ) => Promise<DuplicateCheckResult | null>;
  progress: ImportProgress;
  result: NewsImportResult | null;
  error: string | null;
  reset: () => void;
}

/**
 * ニュースインポート用カスタムフック
 */
export function useNewsImport(): UseNewsImportReturn {
  const [progress, setProgress] = useState<ImportProgress>({
    isLoading: false,
    progress: 0,
    status: 'idle',
  });

  const [result, setResult] = useState<NewsImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  /**
   * CSVファイルからニュースデータをインポート
   */
  const importCsv = useCallback(
    async (
      stockCode: string,
      file: File,
      options: NewsImportOptions = { duplicateStrategy: 'skip' }
    ): Promise<NewsImportResult | null> => {
      // 初期化
      setError(null);
      setResult(null);
      setProgress({
        isLoading: true,
        progress: 0,
        status: 'parsing',
        message: 'CSVファイルを読み込んでいます...',
      });

      try {
        // Step 1: CSVファイルをパース
        setProgress((prev) => ({
          ...prev,
          progress: 10,
          status: 'parsing',
          message: 'CSVファイルをパースしています...',
        }));

        const content = await file.text();
        const newsItems = parseCsv(content);

        if (newsItems.length === 0) {
          throw new Error('CSVファイルにデータが含まれていません');
        }

        // Step 2: バリデーション
        setProgress((prev) => ({
          ...prev,
          progress: 30,
          status: 'validating',
          message: `${newsItems.length}件のデータをバリデーションしています...`,
        }));

        const validationResult = validateNewsItems(newsItems);

        if (validationResult.errors.length > 0) {
          // バリデーションエラーがある場合でも、有効な行があればアップロードを継続
          const errorCount = validationResult.errors.length;
          const validCount = validationResult.validItems.length;

          if (validCount === 0) {
            // 全て無効な場合はエラー
            const errorMessages = validationResult.errors
              .slice(0, 5)
              .map((e) => {
                const errorMsgs = e.errors.map((err) => err.message).join('、');
                return `行${e.index + 2}: ${errorMsgs}`;
              })
              .join('\n');
            const remaining =
              errorCount > 5 ? `\n...他${errorCount - 5}件のエラー` : '';

            throw new Error(
              `バリデーションエラーが発生しました:\n${errorMessages}${remaining}`
            );
          }

          // 警告を表示（一部の行のみ有効）
          console.warn(
            `${errorCount}件のバリデーションエラーがありました。${validCount}件の有効なデータをインポートします。`,
            validationResult.errors
          );
        }

        // Step 3: アップロード
        setProgress((prev) => ({
          ...prev,
          progress: 60,
          status: 'uploading',
          message: 'サーバーにアップロードしています...',
        }));

        const importResult = await importNewsFromCsv(stockCode, file, options);

        // Step 4: 完了
        setProgress({
          isLoading: false,
          progress: 100,
          status: 'completed',
          message: 'インポートが完了しました',
        });

        setResult(importResult);
        return importResult;
      } catch (err) {
        // エラーハンドリング
        let errorMessage = 'インポート中にエラーが発生しました';

        if (err instanceof Error) {
          errorMessage = err.message;
        } else if (typeof err === 'object' && err !== null && 'message' in err) {
          errorMessage = String(err.message);
        }

        setError(errorMessage);
        setProgress({
          isLoading: false,
          progress: 0,
          status: 'error',
          message: errorMessage,
        });

        return null;
      }
    },
    []
  );

  /**
   * 重複ニュースをチェック
   */
  const checkDuplicates = useCallback(
    async (
      stockCode: string,
      file: File
    ): Promise<DuplicateCheckResult | null> => {
      // 初期化
      setError(null);
      setProgress({
        isLoading: true,
        progress: 0,
        status: 'parsing',
        message: 'CSVファイルを読み込んでいます...',
      });

      try {
        // Step 1: CSVファイルをパース
        setProgress((prev) => ({
          ...prev,
          progress: 20,
          status: 'parsing',
          message: 'CSVファイルをパースしています...',
        }));

        const content = await file.text();
        const newsItems = parseCsv(content);

        if (newsItems.length === 0) {
          throw new Error('CSVファイルにデータが含まれていません');
        }

        // Step 2: 重複チェック
        setProgress((prev) => ({
          ...prev,
          progress: 50,
          status: 'checking',
          message: '重複をチェックしています...',
        }));

        const duplicateResult = await checkDuplicateNews(stockCode, newsItems);

        // Step 3: 完了
        setProgress({
          isLoading: false,
          progress: 100,
          status: 'completed',
          message: '重複チェックが完了しました',
        });

        return duplicateResult;
      } catch (err) {
        // エラーハンドリング
        let errorMessage = '重複チェック中にエラーが発生しました';

        if (err instanceof Error) {
          errorMessage = err.message;
        } else if (typeof err === 'object' && err !== null && 'message' in err) {
          errorMessage = String(err.message);
        }

        setError(errorMessage);
        setProgress({
          isLoading: false,
          progress: 0,
          status: 'error',
          message: errorMessage,
        });

        return null;
      }
    },
    []
  );

  /**
   * 状態をリセット
   */
  const reset = useCallback(() => {
    setProgress({
      isLoading: false,
      progress: 0,
      status: 'idle',
    });
    setResult(null);
    setError(null);
  }, []);

  return {
    importCsv,
    checkDuplicates,
    progress,
    result,
    error,
    reset,
  };
}
