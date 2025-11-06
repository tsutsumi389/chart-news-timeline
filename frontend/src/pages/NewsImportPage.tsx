import React, { useState } from 'react';
import { Stock } from '../types/stock';
import type { DuplicateStrategy, NewsImportOptions } from '../types/newsImport';
import { StockSelector } from '../components/import/StockSelector';
import { NewsCsvUploader } from '../components/newsImport/NewsCsvUploader';
import { ImportProgress } from '../components/import/ImportProgress';
import { NewsImportResult } from '../components/newsImport/NewsImportResult';
import { useNewsImport } from '../hooks/useNewsImport';
import './NewsImportPage.css';

/**
 * ニュースインポートメイン画面
 * 銘柄選択、CSVアップロード、インポート実行、結果表示を統合
 */
export const NewsImportPage: React.FC = () => {
  const [selectedStock, setSelectedStock] = useState<Stock | null>(null);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [duplicateStrategy, setDuplicateStrategy] =
    useState<DuplicateStrategy>('skip');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');

  const { importCsv, progress, result, error, reset } = useNewsImport();

  // インポート実行
  const handleImport = async () => {
    if (!selectedStock || !csvFile) {
      return;
    }

    const options: NewsImportOptions = {
      duplicateStrategy,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
    };

    await importCsv(selectedStock.stockCode, csvFile, options);
  };

  // リセット
  const handleReset = () => {
    reset();
    setCsvFile(null);
  };

  return (
    <div className="news-import-container">
      <header className="news-import-header">
        <h1 className="news-import-main-title">
          📰 ニュースデータインポート
        </h1>
        <p className="news-import-subtitle">
          企業（銘柄）ごとにニュースデータをCSVファイルからインポート
        </p>
      </header>

      <main className="news-import-main">
        {/* 銘柄選択セクション */}
        <section className="news-import-section">
          <StockSelector
            onSelect={setSelectedStock}
            disabled={progress.isLoading}
          />
        </section>

        {/* CSVアップロードセクション */}
        {selectedStock && (
          <section className="news-import-section">
            <NewsCsvUploader
              onFileSelect={setCsvFile}
              disabled={progress.isLoading}
            />
          </section>
        )}

        {/* インポート設定セクション */}
        {selectedStock && csvFile && !progress.isLoading && !result && (
          <section className="news-import-section">
            <div className="news-import-card">
              <div className="news-import-card-header">
                <span className="news-import-card-icon">⚙️</span>
                <h2 className="news-import-card-title">インポート設定</h2>
              </div>

              <div className="news-import-settings">
                {/* 重複データの扱い */}
                <div className="news-import-setting-group">
                  <label className="news-import-setting-label">
                    <span>📋</span> 重複データの扱い
                  </label>
                  <select
                    value={duplicateStrategy}
                    onChange={(e) =>
                      setDuplicateStrategy(e.target.value as DuplicateStrategy)
                    }
                    className="news-import-select"
                  >
                    <option value="skip">スキップ（既存データを保持）</option>
                    <option value="overwrite">上書き（既存データを更新）</option>
                  </select>
                  <p className="news-import-setting-help">
                    同一銘柄・同一公開日時・同一タイトルのニュースが重複と判定されます
                  </p>
                </div>

                {/* 日付範囲フィルター */}
                <div className="news-import-setting-group">
                  <label className="news-import-setting-label">
                    <span>📅</span> 日付範囲フィルター（任意）
                  </label>
                  <div className="news-import-date-range">
                    <div className="news-import-date-input">
                      <label htmlFor="dateFrom">開始日:</label>
                      <input
                        type="date"
                        id="dateFrom"
                        value={dateFrom}
                        onChange={(e) => setDateFrom(e.target.value)}
                        className="news-import-input"
                      />
                    </div>
                    <span className="news-import-date-separator">〜</span>
                    <div className="news-import-date-input">
                      <label htmlFor="dateTo">終了日:</label>
                      <input
                        type="date"
                        id="dateTo"
                        value={dateTo}
                        onChange={(e) => setDateTo(e.target.value)}
                        className="news-import-input"
                      />
                    </div>
                  </div>
                  <p className="news-import-setting-help">
                    指定期間外のニュースはインポートから除外されます
                  </p>
                </div>

                {/* インポート実行ボタン */}
                <div className="news-import-button-container">
                  <button
                    onClick={handleImport}
                    className="news-import-button news-import-button-primary"
                  >
                    <span className="news-import-button-icon">📤</span>
                    インポート実行
                  </button>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* 進捗表示 */}
        {progress.isLoading && (
          <section className="news-import-section">
            <ImportProgress
              isLoading={progress.isLoading}
              progress={progress.progress}
              statusMessage={progress.message}
            />
          </section>
        )}

        {/* エラー表示 */}
        {error && !progress.isLoading && (
          <section className="news-import-section">
            <div className="news-import-error">
              <div className="news-import-error-header">
                <span className="news-import-error-icon">❌</span>
                <h3 className="news-import-error-title">
                  エラーが発生しました
                </h3>
              </div>
              <pre className="news-import-error-message">{error}</pre>
              <div className="news-import-button-container">
                <button
                  onClick={handleReset}
                  className="news-import-button news-import-button-error"
                >
                  <span className="news-import-button-icon">🔄</span>
                  もう一度試す
                </button>
              </div>
            </div>
          </section>
        )}

        {/* 結果表示 */}
        {result && !progress.isLoading && (
          <section className="news-import-section">
            <NewsImportResult result={result} />
            <div className="news-import-button-container">
              <button
                onClick={handleReset}
                className="news-import-button news-import-button-success"
              >
                <span className="news-import-button-icon">➕</span>
                新しいインポート
              </button>
            </div>
          </section>
        )}

        {/* 使い方ガイド */}
        {!selectedStock && (
          <section className="news-import-section">
            <div className="news-import-guide">
              <div className="news-import-guide-header">
                <span className="news-import-guide-icon">💡</span>
                <h2 className="news-import-guide-title">使い方</h2>
              </div>
              <ol className="news-import-guide-list">
                <li className="news-import-guide-list-item">
                  <strong>銘柄コードを入力:</strong>{' '}
                  インポートしたい銘柄の4桁コードを入力してください（例: 7203）
                </li>
                <li className="news-import-guide-list-item">
                  <strong>CSVファイルを選択:</strong>{' '}
                  ニュースデータが記載されたCSVファイルをアップロードしてください
                </li>
                <li className="news-import-guide-list-item">
                  <strong>設定を確認:</strong>{' '}
                  重複データの扱いや日付範囲フィルターを設定してください
                </li>
                <li className="news-import-guide-list-item">
                  <strong>インポート実行:</strong>{' '}
                  「インポート実行」ボタンをクリックしてください
                </li>
              </ol>
            </div>
          </section>
        )}
      </main>
    </div>
  );
};
