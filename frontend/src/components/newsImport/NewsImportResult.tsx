import React, { useState } from 'react';
import type { NewsImportResult as NewsImportResultType } from '../../types/newsImport';

interface NewsImportResultProps {
  result: NewsImportResultType;
}

/**
 * ニュースインポート結果表示コンポーネント
 * 成功件数、スキップ件数、エラー件数、エラー詳細を表示
 */
export const NewsImportResult: React.FC<NewsImportResultProps> = ({
  result,
}) => {
  const [showErrors, setShowErrors] = useState(false);

  // 結果の判定
  const isSuccess = result.errorCount === 0 && result.successCount > 0;
  const isPartial = result.errorCount > 0 && result.successCount > 0;
  const isFailed = result.errorCount > 0 && result.successCount === 0;

  // ステータスに応じたスタイル
  const getStatusStyle = () => {
    if (isSuccess) return styles.containerSuccess;
    if (isPartial) return styles.containerWarning;
    if (isFailed) return styles.containerError;
    return {};
  };

  const getStatusIcon = () => {
    if (isSuccess) return '✅';
    if (isPartial) return '⚠️';
    if (isFailed) return '❌';
    return '📊';
  };

  const getStatusTitle = () => {
    if (isSuccess) return 'インポート完了';
    if (isPartial) return 'インポート完了（一部エラー）';
    if (isFailed) return 'インポート失敗';
    return 'インポート結果';
  };

  return (
    <div style={{ ...styles.container, ...getStatusStyle() }}>
      <div style={styles.header}>
        <span style={styles.icon}>{getStatusIcon()}</span>
        <h3 style={styles.title}>{getStatusTitle()}</h3>
      </div>

      <div style={styles.content}>
        {/* サマリー情報 */}
        <div style={styles.summaryContainer}>
          <div style={styles.summaryGrid}>
            <SummaryItem
              label="合計行数"
              value={result.totalRows}
              color="#757575"
              icon="📋"
            />
            <SummaryItem
              label="成功"
              value={result.successCount}
              color="#4caf50"
              icon="✓"
            />
            {result.skipCount > 0 && (
              <SummaryItem
                label="スキップ"
                value={result.skipCount}
                color="#ff9800"
                icon="⊘"
              />
            )}
            {result.errorCount > 0 && (
              <SummaryItem
                label="エラー"
                value={result.errorCount}
                color="#f44336"
                icon="✕"
              />
            )}
          </div>
        </div>

        {/* メタ情報 */}
        <div style={styles.metaContainer}>
          <div style={styles.metaItem}>
            <span style={styles.metaLabel}>銘柄:</span>
            <span style={styles.metaValue}>
              {result.stockCode} - {result.stockName}
            </span>
          </div>
          <div style={styles.metaItem}>
            <span style={styles.metaLabel}>インポート日時:</span>
            <span style={styles.metaValue}>
              {new Date(result.importedAt).toLocaleString('ja-JP')}
            </span>
          </div>
          <div style={styles.metaItem}>
            <span style={styles.metaLabel}>インポートID:</span>
            <span style={styles.metaValue}>{result.importId}</span>
          </div>
        </div>

        {/* エラー詳細 */}
        {result.errors.length > 0 && (
          <div style={styles.errorSection}>
            <button
              onClick={() => setShowErrors(!showErrors)}
              style={styles.errorToggleButton}
            >
              {showErrors ? '▼' : '▶'} エラー詳細を{showErrors ? '非表示' : '表示'}{' '}
              ({result.errors.length}件)
            </button>

            {showErrors && (
              <div style={styles.errorListContainer}>
                <table style={styles.errorTable}>
                  <thead>
                    <tr style={styles.errorTableHeaderRow}>
                      <th style={styles.errorTableHeader}>行番号</th>
                      <th style={styles.errorTableHeader}>公開日時</th>
                      <th style={styles.errorTableHeader}>タイトル</th>
                      <th style={styles.errorTableHeader}>エラー内容</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.errors.map((error, index) => (
                      <tr key={index} style={styles.errorTableRow}>
                        <td style={styles.errorTableCell}>{error.row}</td>
                        <td style={styles.errorTableCell}>{error.publishedAt}</td>
                        <td style={{ ...styles.errorTableCell, ...styles.titleCell }}>
                          {error.title}
                        </td>
                        <td style={styles.errorTableCell}>{error.message}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* 成功メッセージ */}
        {isSuccess && (
          <div style={styles.successMessage}>
            <p style={styles.successText}>
              すべてのニュースが正常にインポートされました！
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * サマリー項目コンポーネント
 */
interface SummaryItemProps {
  label: string;
  value: number;
  color: string;
  icon: string;
}

const SummaryItem: React.FC<SummaryItemProps> = ({
  label,
  value,
  color,
  icon,
}) => {
  return (
    <div style={styles.summaryItem}>
      <span style={styles.summaryIcon}>{icon}</span>
      <div style={styles.summaryContent}>
        <div style={styles.summaryLabel}>{label}</div>
        <div style={{ ...styles.summaryValue, color }}>
          {value.toLocaleString()}
        </div>
      </div>
    </div>
  );
};

// スタイル定義
const styles: { [key: string]: React.CSSProperties } = {
  container: {
    backgroundColor: '#fff',
    padding: '24px',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
    marginBottom: '24px',
  },
  containerSuccess: {
    border: '2px solid #4caf50',
    backgroundColor: '#f1f8f4',
  },
  containerWarning: {
    border: '2px solid #ff9800',
    backgroundColor: '#fff8e1',
  },
  containerError: {
    border: '2px solid #f44336',
    backgroundColor: '#ffebee',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '20px',
  },
  icon: {
    fontSize: '28px',
  },
  title: {
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#333',
    margin: 0,
  },
  content: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  summaryContainer: {
    padding: '16px',
    backgroundColor: '#fff',
    borderRadius: '4px',
    border: '1px solid #e0e0e0',
  },
  summaryGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: '16px',
  },
  summaryItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px',
    backgroundColor: '#f9f9f9',
    borderRadius: '4px',
  },
  summaryIcon: {
    fontSize: '24px',
  },
  summaryContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  summaryLabel: {
    fontSize: '12px',
    color: '#666',
  },
  summaryValue: {
    fontSize: '20px',
    fontWeight: 'bold',
  },
  metaContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    padding: '12px',
    backgroundColor: '#f5f5f5',
    borderRadius: '4px',
  },
  metaItem: {
    fontSize: '14px',
    display: 'flex',
    gap: '8px',
  },
  metaLabel: {
    fontWeight: 'bold',
    color: '#555',
  },
  metaValue: {
    color: '#333',
  },
  errorSection: {
    marginTop: '8px',
  },
  errorToggleButton: {
    padding: '10px 16px',
    backgroundColor: '#f44336',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold',
    width: '100%',
    textAlign: 'left',
    transition: 'background-color 0.2s',
  },
  errorListContainer: {
    marginTop: '12px',
    overflowX: 'auto',
    border: '1px solid #e0e0e0',
    borderRadius: '4px',
  },
  errorTable: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '14px',
  },
  errorTableHeaderRow: {
    backgroundColor: '#ffcdd2',
  },
  errorTableHeader: {
    padding: '12px',
    textAlign: 'left',
    fontWeight: 'bold',
    color: '#b71c1c',
    whiteSpace: 'nowrap',
  },
  errorTableRow: {
    borderBottom: '1px solid #eee',
    backgroundColor: '#fff',
  },
  errorTableCell: {
    padding: '10px 12px',
    color: '#555',
  },
  titleCell: {
    maxWidth: '300px',
    wordBreak: 'break-word',
  },
  successMessage: {
    padding: '16px',
    backgroundColor: '#e8f5e9',
    borderRadius: '4px',
    textAlign: 'center',
  },
  successText: {
    fontSize: '14px',
    fontWeight: 'bold',
    color: '#2e7d32',
    margin: 0,
  },
};
