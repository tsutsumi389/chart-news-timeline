import React, { useState } from 'react';
import { Stock } from '../types/stock';
import { DuplicateStrategy } from '../types/import';
import { StockSelector } from '../components/import/StockSelector';
import { CsvUploader } from '../components/import/CsvUploader';
import { ImportProgress } from '../components/import/ImportProgress';
import { ImportResult } from '../components/import/ImportResult';
import { useStockImport } from '../hooks/useStockImport';

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
    <div style={styles.container}>
      <header style={styles.header}>
        <h1 style={styles.title}>株価データインポート</h1>
        <p style={styles.subtitle}>
          CSVファイルから株価データをインポートして、データベースに登録します。
        </p>
      </header>

      <main style={styles.main}>
        {/* 銘柄選択セクション */}
        <section>
          <StockSelector onSelect={setSelectedStock} disabled={progress.isLoading} />
        </section>

        {/* CSVアップロードセクション */}
        {selectedStock && (
          <section>
            <CsvUploader onFileSelect={setCsvFile} disabled={progress.isLoading} />
          </section>
        )}

        {/* インポート設定セクション */}
        {selectedStock && csvFile && !progress.isLoading && !result && (
          <section style={styles.settingsSection}>
            <h2 style={styles.sectionHeading}>インポート設定</h2>

            <div style={styles.settingsContainer}>
              <div style={styles.settingGroup}>
                <label style={styles.settingLabel}>重複データの扱い:</label>
                <select
                  value={duplicateStrategy}
                  onChange={(e) => setDuplicateStrategy(e.target.value as DuplicateStrategy)}
                  style={styles.select}
                >
                  <option value="skip">スキップ（既存データを保持）</option>
                  <option value="overwrite">上書き（既存データを更新）</option>
                </select>
              </div>

              <div style={styles.buttonContainer}>
                <button onClick={handleImport} style={styles.importButton}>
                  📤 インポート実行
                </button>
              </div>
            </div>
          </section>
        )}

        {/* 進捗表示 */}
        {progress.isLoading && (
          <section>
            <ImportProgress
              isLoading={progress.isLoading}
              progress={progress.progress}
              statusMessage={progress.message}
            />
          </section>
        )}

        {/* エラー表示 */}
        {error && !progress.isLoading && (
          <section>
            <div style={styles.errorContainer}>
              <div style={styles.errorHeader}>
                <span style={styles.errorIcon}>❌</span>
                <h3 style={styles.errorTitle}>エラーが発生しました</h3>
              </div>
              <pre style={styles.errorMessage}>{error}</pre>
              <button onClick={handleReset} style={styles.retryButton}>
                🔄 もう一度試す
              </button>
            </div>
          </section>
        )}

        {/* 結果表示 */}
        {result && !progress.isLoading && (
          <section>
            <ImportResult result={result} />
            <div style={styles.buttonContainer}>
              <button onClick={handleReset} style={styles.newImportButton}>
                ➕ 新しいインポート
              </button>
            </div>
          </section>
        )}

        {/* 使い方ガイド */}
        {!selectedStock && (
          <section style={styles.guideSection}>
            <h2 style={styles.guideSectionHeading}>使い方</h2>
            <ol style={styles.guideList}>
              <li style={styles.guideListItem}>
                <strong>銘柄コードを入力:</strong> インポートしたい銘柄の4桁コードを入力してください（例: 7203）
              </li>
              <li style={styles.guideListItem}>
                <strong>CSVファイルを選択:</strong> 株価データが記載されたCSVファイルをアップロードしてください
              </li>
              <li style={styles.guideListItem}>
                <strong>設定を確認:</strong> 重複データの扱いを選択してください
              </li>
              <li style={styles.guideListItem}>
                <strong>インポート実行:</strong> 「インポート実行」ボタンをクリックしてください
              </li>
            </ol>
          </section>
        )}
      </main>
    </div>
  );
};

// スタイル定義
const styles: { [key: string]: React.CSSProperties } = {
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '24px',
  },
  header: {
    marginBottom: '32px',
    borderBottom: '2px solid #1976d2',
    paddingBottom: '16px',
  },
  title: {
    fontSize: '32px',
    fontWeight: 'bold',
    color: '#1976d2',
    margin: '0 0 8px 0',
  },
  subtitle: {
    fontSize: '16px',
    color: '#666',
    margin: 0,
  },
  main: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  settingsSection: {
    backgroundColor: '#fff',
    padding: '24px',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
  },
  sectionHeading: {
    fontSize: '20px',
    fontWeight: 'bold',
    marginBottom: '16px',
    color: '#333',
  },
  settingsContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  settingGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  settingLabel: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#555',
  },
  select: {
    padding: '10px 12px',
    fontSize: '14px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    backgroundColor: '#fff',
    cursor: 'pointer',
  },
  buttonContainer: {
    display: 'flex',
    justifyContent: 'center',
    marginTop: '8px',
  },
  importButton: {
    padding: '14px 32px',
    backgroundColor: '#1976d2',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: 'bold',
    transition: 'background-color 0.2s',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
  },
  errorContainer: {
    backgroundColor: '#ffebee',
    padding: '24px',
    borderRadius: '8px',
    border: '2px solid #f44336',
  },
  errorHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '16px',
  },
  errorIcon: {
    fontSize: '28px',
  },
  errorTitle: {
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#c62828',
    margin: 0,
  },
  errorMessage: {
    backgroundColor: '#fff',
    padding: '16px',
    borderRadius: '4px',
    fontSize: '14px',
    color: '#d32f2f',
    border: '1px solid #ef9a9a',
    marginBottom: '16px',
    whiteSpace: 'pre-wrap',
    wordWrap: 'break-word',
    fontFamily: 'monospace',
  },
  retryButton: {
    padding: '12px 24px',
    backgroundColor: '#f44336',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold',
    transition: 'background-color 0.2s',
  },
  newImportButton: {
    padding: '14px 32px',
    backgroundColor: '#4caf50',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: 'bold',
    transition: 'background-color 0.2s',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
  },
  guideSection: {
    backgroundColor: '#e3f2fd',
    padding: '24px',
    borderRadius: '8px',
    border: '1px solid #1976d2',
  },
  guideSectionHeading: {
    fontSize: '20px',
    fontWeight: 'bold',
    marginBottom: '16px',
    color: '#1565c0',
  },
  guideList: {
    margin: 0,
    paddingLeft: '24px',
    color: '#0d47a1',
  },
  guideListItem: {
    marginBottom: '12px',
    fontSize: '14px',
    lineHeight: '1.6',
  },
};
