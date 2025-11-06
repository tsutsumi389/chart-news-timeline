import React from 'react';
import type { NewsItem } from '../../types/newsImport';
import { SentimentBadge } from './SentimentBadge';

interface NewsPreviewProps {
  items: NewsItem[];
  maxRows?: number;
}

/**
 * ニュースプレビューコンポーネント
 * アップロード前のニュースデータをテーブル形式で表示
 */
export const NewsPreview: React.FC<NewsPreviewProps> = ({
  items,
  maxRows = 10,
}) => {
  const displayItems = items.slice(0, maxRows);

  return (
    <div style={styles.container}>
      <h3 style={styles.heading}>
        プレビュー（全{items.length}行中、先頭{displayItems.length}行を表示）
      </h3>

      <div style={styles.tableContainer}>
        <table style={styles.table}>
          <thead>
            <tr style={styles.tableHeaderRow}>
              <th style={styles.tableHeader}>公開日時</th>
              <th style={styles.tableHeader}>タイトル</th>
              <th style={styles.tableHeader}>ソース</th>
              <th style={styles.tableHeader}>センチメント</th>
            </tr>
          </thead>
          <tbody>
            {displayItems.map((news, index) => (
              <tr key={index} style={styles.tableRow}>
                <td style={styles.tableCell}>
                  {formatDateTime(news.publishedAt)}
                </td>
                <td style={{ ...styles.tableCell, ...styles.titleCell }}>
                  {news.title}
                  {news.url && (
                    <a
                      href={news.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={styles.urlLink}
                    >
                      🔗
                    </a>
                  )}
                </td>
                <td style={styles.tableCell}>{news.source || '-'}</td>
                <td style={styles.tableCell}>
                  <SentimentBadge
                    sentiment={news.sentiment || 'neutral'}
                    score={news.sentimentScore}
                    size="small"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {items.length > maxRows && (
        <div style={styles.moreInfo}>
          残り {items.length - maxRows} 件のニュースがあります
        </div>
      )}
    </div>
  );
};

/**
 * 日時をフォーマット
 * @param dateTimeString 日時文字列
 * @returns フォーマット済み日時
 */
function formatDateTime(dateTimeString: string): string {
  try {
    const date = new Date(dateTimeString);
    if (isNaN(date.getTime())) {
      return dateTimeString;
    }

    return date.toLocaleString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateTimeString;
  }
}

// スタイル定義
const styles: { [key: string]: React.CSSProperties } = {
  container: {
    marginTop: '16px',
  },
  heading: {
    fontSize: '16px',
    fontWeight: 'bold',
    marginBottom: '12px',
    color: '#333',
  },
  tableContainer: {
    overflowX: 'auto',
    border: '1px solid #ddd',
    borderRadius: '4px',
    maxHeight: '400px',
    overflowY: 'auto',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '14px',
  },
  tableHeaderRow: {
    backgroundColor: '#f5f5f5',
    position: 'sticky',
    top: 0,
    zIndex: 1,
  },
  tableHeader: {
    padding: '12px',
    textAlign: 'left',
    fontWeight: 'bold',
    borderBottom: '2px solid #ddd',
    color: '#333',
    whiteSpace: 'nowrap',
  },
  tableRow: {
    borderBottom: '1px solid #eee',
  },
  tableCell: {
    padding: '10px 12px',
    color: '#555',
    verticalAlign: 'top',
  },
  titleCell: {
    maxWidth: '400px',
    wordBreak: 'break-word',
  },
  urlLink: {
    marginLeft: '8px',
    textDecoration: 'none',
    fontSize: '16px',
  },
  moreInfo: {
    marginTop: '12px',
    padding: '8px',
    backgroundColor: '#f9f9f9',
    borderRadius: '4px',
    textAlign: 'center',
    color: '#666',
    fontSize: '13px',
  },
};
