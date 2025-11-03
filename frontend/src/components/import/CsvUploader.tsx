import React, { useState } from 'react';
import { FileDropZone } from '../common/FileDropZone';
import { parseCsvPreview } from '../../utils/csvParser';
import { CsvPreviewData } from '../../types/import';

interface CsvUploaderProps {
  onFileSelect: (file: File) => void;
  disabled?: boolean;
}

/**
 * CSVアップロードコンポーネント
 * ファイル選択、プレビュー表示、フォーマットガイドを提供
 */
export const CsvUploader: React.FC<CsvUploaderProps> = ({ onFileSelect, disabled = false }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<CsvPreviewData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ファイル選択ハンドラ
  const handleFileChange = async (file: File) => {
    setLoading(true);
    setError(null);
    setSelectedFile(file);

    try {
      // プレビューデータを生成（先頭10行）
      const preview = await parseCsvPreview(file, 10);
      setPreviewData(preview);
      onFileSelect(file);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '不明なエラーが発生しました';
      setError(errorMessage);
      setPreviewData(null);
      setSelectedFile(null);
    } finally {
      setLoading(false);
    }
  };

  // ファイルクリア
  const handleClearFile = () => {
    setSelectedFile(null);
    setPreviewData(null);
    setError(null);
  };

  return (
    <div className="csv-uploader" style={styles.container}>
      <h2 style={styles.heading}>CSVファイルアップロード</h2>

      {!selectedFile ? (
        <>
          <FileDropZone onDrop={handleFileChange} accept=".csv" disabled={disabled} maxSizeMB={10} />
          <CsvFormatGuide />
        </>
      ) : (
        <>
          <div style={styles.fileInfoContainer}>
            <div style={styles.fileInfo}>
              <span style={styles.fileIcon}>📄</span>
              <div style={styles.fileDetails}>
                <div style={styles.fileName}>{selectedFile.name}</div>
                <div style={styles.fileSize}>
                  {(selectedFile.size / 1024).toFixed(2)} KB
                </div>
              </div>
            </div>
            <button
              onClick={handleClearFile}
              disabled={disabled}
              style={{
                ...styles.clearButton,
                ...(disabled ? styles.clearButtonDisabled : {}),
              }}
            >
              ✕ クリア
            </button>
          </div>

          {loading && (
            <div style={styles.loadingContainer}>
              <span style={styles.loadingText}>プレビューを生成中...</span>
            </div>
          )}

          {error && (
            <div style={styles.errorContainer}>
              <span style={styles.errorIcon}>⚠️</span>
              <span style={styles.errorText}>{error}</span>
            </div>
          )}

          {previewData && !error && <CsvPreview data={previewData} />}
        </>
      )}
    </div>
  );
};

/**
 * CSVプレビューコンポーネント
 */
interface CsvPreviewProps {
  data: CsvPreviewData;
}

const CsvPreview: React.FC<CsvPreviewProps> = ({ data }) => {
  return (
    <div style={styles.previewContainer}>
      <h3 style={styles.previewHeading}>
        プレビュー（全{data.totalRows}行中、先頭{data.rows.length}行を表示）
      </h3>

      <div style={styles.tableContainer}>
        <table style={styles.table}>
          <thead>
            <tr style={styles.tableHeaderRow}>
              {data.headers.map((header, index) => (
                <th key={index} style={styles.tableHeader}>
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.rows.map((row, rowIndex) => (
              <tr key={rowIndex} style={styles.tableRow}>
                {row.map((cell, cellIndex) => (
                  <td key={cellIndex} style={styles.tableCell}>
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

/**
 * CSVフォーマットガイドコンポーネント
 */
const CsvFormatGuide: React.FC = () => {
  return (
    <div style={styles.guideContainer}>
      <h3 style={styles.guideHeading}>CSVフォーマット</h3>

      <div style={styles.guideContent}>
        <p style={styles.guideText}>以下の形式でCSVファイルを作成してください:</p>

        <div style={styles.codeBlock}>
          <pre style={styles.codeText}>
            {`日付,始値,高値,安値,終値,出来高
2024-01-15,150.5,153.0,149.8,152.3,15000000
2024-01-16,152.3,153.5,150.5,151.0,14500000
2024-01-17,151.0,152.8,150.2,152.5,13800000`}
          </pre>
        </div>

        <ul style={styles.guideList}>
          <li style={styles.guideListItem}>
            <strong>日付:</strong> YYYY-MM-DD形式（例: 2024-01-15）
          </li>
          <li style={styles.guideListItem}>
            <strong>始値/高値/安値/終値:</strong> 小数点以下2桁まで（正の数値）
          </li>
          <li style={styles.guideListItem}>
            <strong>出来高:</strong> 整数（0以上）
          </li>
          <li style={styles.guideListItem}>
            <strong>制約:</strong> 高値 ≥ 始値/終値/安値、安値 ≤ 始値/終値/高値
          </li>
        </ul>
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
  heading: {
    fontSize: '20px',
    fontWeight: 'bold',
    marginBottom: '16px',
    color: '#333',
  },
  fileInfoContainer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px',
    backgroundColor: '#e8f5e9',
    borderRadius: '4px',
    marginBottom: '16px',
  },
  fileInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  fileIcon: {
    fontSize: '24px',
  },
  fileDetails: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  fileName: {
    fontSize: '14px',
    fontWeight: 'bold',
    color: '#1b5e20',
  },
  fileSize: {
    fontSize: '12px',
    color: '#2e7d32',
  },
  clearButton: {
    padding: '8px 16px',
    backgroundColor: '#f44336',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold',
    transition: 'background-color 0.2s',
  },
  clearButtonDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
  loadingContainer: {
    padding: '12px',
    backgroundColor: '#e3f2fd',
    borderRadius: '4px',
    marginBottom: '16px',
  },
  loadingText: {
    color: '#1976d2',
    fontSize: '14px',
  },
  errorContainer: {
    display: 'flex',
    alignItems: 'center',
    padding: '12px',
    backgroundColor: '#ffebee',
    borderRadius: '4px',
    marginBottom: '16px',
  },
  errorIcon: {
    marginRight: '8px',
    fontSize: '16px',
  },
  errorText: {
    color: '#d32f2f',
    fontSize: '14px',
  },
  previewContainer: {
    marginTop: '16px',
  },
  previewHeading: {
    fontSize: '16px',
    fontWeight: 'bold',
    marginBottom: '12px',
    color: '#333',
  },
  tableContainer: {
    overflowX: 'auto',
    border: '1px solid #ddd',
    borderRadius: '4px',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '14px',
  },
  tableHeaderRow: {
    backgroundColor: '#f5f5f5',
  },
  tableHeader: {
    padding: '12px',
    textAlign: 'left',
    fontWeight: 'bold',
    borderBottom: '2px solid #ddd',
    color: '#333',
  },
  tableRow: {
    borderBottom: '1px solid #eee',
  },
  tableCell: {
    padding: '10px 12px',
    color: '#555',
  },
  guideContainer: {
    marginTop: '24px',
    padding: '16px',
    backgroundColor: '#f9f9f9',
    borderRadius: '4px',
    border: '1px solid #e0e0e0',
  },
  guideHeading: {
    fontSize: '16px',
    fontWeight: 'bold',
    marginBottom: '12px',
    color: '#333',
  },
  guideContent: {
    fontSize: '14px',
  },
  guideText: {
    marginBottom: '12px',
    color: '#555',
  },
  codeBlock: {
    backgroundColor: '#fff',
    padding: '12px',
    borderRadius: '4px',
    border: '1px solid #ddd',
    marginBottom: '16px',
    overflowX: 'auto',
  },
  codeText: {
    margin: 0,
    fontSize: '13px',
    fontFamily: 'monospace',
    color: '#333',
  },
  guideList: {
    margin: 0,
    paddingLeft: '20px',
  },
  guideListItem: {
    marginBottom: '8px',
    color: '#555',
  },
};
