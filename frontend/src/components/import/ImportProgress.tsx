import React from 'react';
import { ProgressBar } from '../common/ProgressBar';

interface ImportProgressProps {
  isLoading: boolean;
  progress?: number;
  statusMessage?: string;
}

/**
 * インポート進捗表示コンポーネント
 * インポート実行中の進捗とステータスを表示
 */
export const ImportProgress: React.FC<ImportProgressProps> = ({
  isLoading,
  progress = 0,
  statusMessage = 'インポート中...',
}) => {
  if (!isLoading) {
    return null;
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <span style={styles.icon}>⏳</span>
        <h3 style={styles.title}>インポート実行中</h3>
      </div>

      <div style={styles.content}>
        <ProgressBar progress={progress} label={statusMessage} showPercentage={true} />

        <div style={styles.messageContainer}>
          <p style={styles.message}>
            データをインポートしています。しばらくお待ちください...
          </p>
        </div>
      </div>
    </div>
  );
};

// スタイル定義
const styles: { [key: string]: React.CSSProperties } = {
  container: {
    backgroundColor: '#e3f2fd',
    padding: '24px',
    borderRadius: '8px',
    border: '2px solid #1976d2',
    marginBottom: '24px',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '20px',
  },
  icon: {
    fontSize: '24px',
  },
  title: {
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#1565c0',
    margin: 0,
  },
  content: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  messageContainer: {
    paddingTop: '8px',
  },
  message: {
    fontSize: '14px',
    color: '#0d47a1',
    margin: 0,
    textAlign: 'center',
  },
};
