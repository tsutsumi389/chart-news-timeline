import React, { useState } from 'react';
import { FileDropZone } from '../common/FileDropZone';
import { parseCsvPreview, isCsvFile, isValidFileSize } from '../../utils/newsCsvParser';
import type { CsvPreviewData } from '../../types/newsImport';
import { NewsPreview } from './NewsPreview';

interface NewsCsvUploaderProps {
  onFileSelect: (file: File) => void;
  disabled?: boolean;
}

/**
 * ニュースCSVアップロードコンポーネント
 * ファイル選択、プレビュー表示、フォーマットガイドを提供
 */
export const NewsCsvUploader: React.FC<NewsCsvUploaderProps> = ({
  onFileSelect,
  disabled = false,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<CsvPreviewData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ファイル選択ハンドラ
  const handleFileChange = async (file: File) => {
    setLoading(true);
    setError(null);

    // ファイル検証
    if (!isCsvFile(file)) {
      setError('CSVファイルを選択してください');
      setLoading(false);
      return;
    }

    if (!isValidFileSize(file, 5)) {
      setError('ファイルサイズは5MB以下にしてください');
      setLoading(false);
      return;
    }

    setSelectedFile(file);

    try {
      // プレビューデータを生成
      const preview = await parseCsvPreview(file);

      if (preview.hasError) {
        setError(preview.errorMessage || 'CSVのパースに失敗しました');
        setPreviewData(null);
        setSelectedFile(null);
      } else {
        setPreviewData(preview);
        onFileSelect(file);
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : '不明なエラーが発生しました';
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
    <div style={styles.container}>
      <h2 style={styles.heading}>CSVファイルアップロード</h2>

      {!selectedFile ? (
        <>
          <FileDropZone
            onDrop={handleFileChange}
            accept=".csv"
            disabled={disabled}
            maxSizeMB={5}
          />
          <NewsCsvFormatGuide />
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

          {previewData && !error && previewData.items.length > 0 && (
            <NewsPreview items={previewData.items} maxRows={10} />
          )}
        </>
      )}
    </div>
  );
};

/**
 * ニュースCSVフォーマットガイドコンポーネント
 */
const NewsCsvFormatGuide: React.FC = () => {
  return (
    <div style={styles.guideContainer}>
      <h3 style={styles.guideHeading}>CSVフォーマット</h3>

      <div style={styles.guideContent}>
        <p style={styles.guideText}>
          以下の形式でニュースデータのCSVファイルを作成してください:
        </p>

        <div style={styles.codeBlock}>
          <pre style={styles.codeText}>
            {`公開日時,タイトル,要約,URL,ソース,センチメント,センチメントスコア
2024-01-15 09:00:00,トヨタ、2024年世界販売台数で過去最高を記録,2024年の世界販売台数が前年比7%増となり...,https://example.com/news/1,日経新聞,positive,0.85
2024-01-16 14:30:00,トヨタ、米国工場で生産一時停止,部品供給の遅延により、米国の一部工場で...,https://example.com/news/2,Bloomberg,negative,-0.60
2024-01-17 10:15:00,トヨタ、EV新モデル発表,2025年発売予定の新型電気自動車を発表した。,https://example.com/news/3,ロイター,positive,0.70`}
          </pre>
        </div>

        <ul style={styles.guideList}>
          <li style={styles.guideListItem}>
            <strong>公開日時:</strong> YYYY-MM-DD HH:MM:SS形式（例:
            2024-01-15 09:00:00）【必須】
          </li>
          <li style={styles.guideListItem}>
            <strong>タイトル:</strong> 255文字以内【必須】
          </li>
          <li style={styles.guideListItem}>
            <strong>要約:</strong> 任意のテキスト【任意】
          </li>
          <li style={styles.guideListItem}>
            <strong>URL:</strong> http://またはhttps://で始まるURL、500文字以内【任意】
          </li>
          <li style={styles.guideListItem}>
            <strong>ソース:</strong> ニュースソース名、100文字以内【任意】
          </li>
          <li style={styles.guideListItem}>
            <strong>センチメント:</strong> positive/negative/neutral のいずれか【任意】
          </li>
          <li style={styles.guideListItem}>
            <strong>センチメントスコア:</strong> -1.00 〜 1.00 の範囲【任意】
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
    fontSize: '12px',
    fontFamily: 'monospace',
    color: '#333',
    lineHeight: '1.5',
  },
  guideList: {
    margin: 0,
    paddingLeft: '20px',
  },
  guideListItem: {
    marginBottom: '8px',
    color: '#555',
    lineHeight: '1.6',
  },
};
