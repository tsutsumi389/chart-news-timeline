// 株価インポート用カスタムフック
import { useState, useCallback } from 'react';
import type {
  ImportResult,
  ImportProgress,
  DuplicateStrategy,
} from '../types/import';
import {
  importStockPricesFromCsv,
  ApiError,
} from '../services/importService';
import { parseCsvFile } from '../utils/csvParser';
import { validateCsvRows } from '../utils/csvValidator';

/**
 * useStockImport フックの戻り値
 */
interface UseStockImportReturn {
  importCsv: (
    stockCode: string,
    file: File,
    strategy?: DuplicateStrategy
  ) => Promise<ImportResult | null>;
  progress: ImportProgress;
  result: ImportResult | null;
  error: string | null;
  reset: () => void;
}

/**
 * 株価インポート用カスタムフック
 * CSVファイルのパース、バリデーション、アップロード処理を管理
 */
export function useStockImport(): UseStockImportReturn {
  const [progress, setProgress] = useState<ImportProgress>({
    isLoading: false,
    progress: 0,
    status: 'idle',
  });

  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  /**
   * CSVファイルから株価データをインポート
   */
  const importCsv = useCallback(
    async (
      stockCode: string,
      file: File,
      strategy: DuplicateStrategy = 'skip'
    ): Promise<ImportResult | null> => {
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

        const rows = await parseCsvFile(file);

        if (rows.length === 0) {
          throw new Error('CSVファイルにデータが含まれていません');
        }

        // Step 2: バリデーション
        setProgress((prev) => ({
          ...prev,
          progress: 30,
          status: 'validating',
          message: `${rows.length}件のデータをバリデーションしています...`,
        }));

        const validationResult = validateCsvRows(rows);

        if (validationResult.errors.length > 0) {
          // バリデーションエラーがある場合でも、有効な行があればアップロードを継続
          const errorCount = validationResult.errors.length;
          const validCount = validationResult.validRows.length;

          if (validCount === 0) {
            // 全て無効な場合はエラー
            const errorMessages = validationResult.errors
              .slice(0, 5)
              .map((e) => `行${e.row}: ${e.message}`)
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

        const importResult = await importStockPricesFromCsv(
          stockCode,
          file,
          strategy
        );

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

        if (err instanceof ApiError) {
          errorMessage = err.message;
        } else if (err instanceof Error) {
          errorMessage = err.message;
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
    progress,
    result,
    error,
    reset,
  };
}
