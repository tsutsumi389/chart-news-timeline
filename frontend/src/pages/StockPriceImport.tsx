import React, { useState } from 'react';
import { Stock } from '../types/stock';
import { DuplicateStrategy } from '../types/import';
import { StockSelector } from '../components/import/StockSelector';
import { CsvUploader } from '../components/import/CsvUploader';
import { ImportProgress } from '../components/import/ImportProgress';
import { ImportResult } from '../components/import/ImportResult';
import { useStockImport } from '../hooks/useStockImport';
import './StockPriceImport.css';

/**
 * 株価インポートメイン画面
 * 銘柄選択、CSVアップロード、インポート実行、結果表示を統合
 */
export const StockPriceImport: React.FC = () => {
  const [selectedStock, setSelectedStock] = useState<Stock | null>(null);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [duplicateStrategy, setDuplicateStrategy] = useState<DuplicateStrategy>('skip');

  const { importCsv, progress, result, error, reset } = useStockImport();

  // インポート実行
  const handleImport = async () => {
    if (!selectedStock || !csvFile) {
      return;
    }

    await importCsv(selectedStock.stockCode, csvFile, duplicateStrategy);
  };

  // リセット
  const handleReset = () => {
    reset();
    setCsvFile(null);
  };

  return (
    <div className="stock-import-container">
      <main className="stock-import-section">
        {/* 銘柄選択セクション */}
        <section className="stock-import-section">
          <StockSelector onSelect={setSelectedStock} disabled={progress.isLoading} />
        </section>

        {/* CSVアップロードセクション */}
        {selectedStock && (
          <section className="stock-import-section">
            <CsvUploader onFileSelect={setCsvFile} disabled={progress.isLoading} />
          </section>
        )}

        {/* インポート設定セクション */}
        {selectedStock && csvFile && !progress.isLoading && !result && (
          <section className="stock-import-section">
            <div className="stock-import-card">
              <div className="stock-import-card-header">
                <span className="stock-import-card-icon">⚙️</span>
                <h2 className="stock-import-card-title">インポート設定</h2>
              </div>

              <div className="stock-import-settings">
                <div className="stock-import-setting-group">
                  <label className="stock-import-setting-label">
                    <span>📋</span> 重複データの扱い
                  </label>
                  <select
                    value={duplicateStrategy}
                    onChange={(e) => setDuplicateStrategy(e.target.value as DuplicateStrategy)}
                    className="stock-import-select"
                  >
                    <option value="skip">スキップ（既存データを保持）</option>
                    <option value="overwrite">上書き（既存データを更新）</option>
                  </select>
                </div>

                <div className="stock-import-button-container">
                  <button
                    onClick={handleImport}
                    className="stock-import-button stock-import-button-primary"
                  >
                    <span className="stock-import-button-icon">📤</span>
                    インポート実行
                  </button>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* 進捗表示 */}
        {progress.isLoading && (
          <section className="stock-import-section">
            <ImportProgress
              isLoading={progress.isLoading}
              progress={progress.progress}
              statusMessage={progress.message}
            />
          </section>
        )}

        {/* エラー表示 */}
        {error && !progress.isLoading && (
          <section className="stock-import-section">
            <div className="stock-import-error">
              <div className="stock-import-error-header">
                <span className="stock-import-error-icon">❌</span>
                <h3 className="stock-import-error-title">エラーが発生しました</h3>
              </div>
              <pre className="stock-import-error-message">{error}</pre>
              <div className="stock-import-button-container">
                <button
                  onClick={handleReset}
                  className="stock-import-button stock-import-button-error"
                >
                  <span className="stock-import-button-icon">🔄</span>
                  もう一度試す
                </button>
              </div>
            </div>
          </section>
        )}

        {/* 結果表示 */}
        {result && !progress.isLoading && (
          <section className="stock-import-section">
            <ImportResult result={result} />
            <div className="stock-import-button-container">
              <button
                onClick={handleReset}
                className="stock-import-button stock-import-button-success"
              >
                <span className="stock-import-button-icon">➕</span>
                新しいインポート
              </button>
            </div>
          </section>
        )}

        {/* 使い方ガイド */}
        {!selectedStock && (
          <section className="stock-import-section">
            <div className="stock-import-guide">
              <div className="stock-import-guide-header">
                <span className="stock-import-guide-icon">💡</span>
                <h2 className="stock-import-guide-title">使い方</h2>
              </div>
              <ol className="stock-import-guide-list">
                <li className="stock-import-guide-list-item">
                  <strong>銘柄コードを入力:</strong> インポートしたい銘柄の4桁コードを入力してください（例: 7203）
                </li>
                <li className="stock-import-guide-list-item">
                  <strong>CSVファイルを選択:</strong> 株価データが記載されたCSVファイルをアップロードしてください
                </li>
                <li className="stock-import-guide-list-item">
                  <strong>設定を確認:</strong> 重複データの扱いを選択してください
                </li>
                <li className="stock-import-guide-list-item">
                  <strong>インポート実行:</strong> 「インポート実行」ボタンをクリックしてください
                </li>
              </ol>
            </div>
          </section>
        )}
      </main>
    </div>
  );
};
