import React from 'react';

interface ProgressBarProps {
  progress: number; // 0-100
  label?: string;
  showPercentage?: boolean;
}

/**
 * プログレスバーコンポーネント
 * 0-100%の進捗を視覚的に表示
 */
export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  label,
  showPercentage = true,
}) => {
  // 0-100の範囲に制限
  const clampedProgress = Math.min(Math.max(progress, 0), 100);

  return (
    <div style={styles.container}>
      {label && <div style={styles.label}>{label}</div>}

      <div style={styles.barContainer}>
        <div style={styles.barBackground}>
          <div
            style={{
              ...styles.barFill,
              width: `${clampedProgress}%`,
            }}
          />
        </div>

        {showPercentage && (
          <div style={styles.percentage}>{Math.round(clampedProgress)}%</div>
        )}
      </div>
    </div>
  );
};

// スタイル定義
const styles: { [key: string]: React.CSSProperties } = {
  container: {
    width: '100%',
  },
  label: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#555',
    marginBottom: '8px',
  },
  barContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  barBackground: {
    flex: 1,
    height: '24px',
    backgroundColor: '#e0e0e0',
    borderRadius: '12px',
    overflow: 'hidden',
    position: 'relative',
  },
  barFill: {
    height: '100%',
    backgroundColor: '#1976d2',
    transition: 'width 0.3s ease',
    borderRadius: '12px',
  },
  percentage: {
    fontSize: '14px',
    fontWeight: 'bold',
    color: '#1976d2',
    minWidth: '40px',
    textAlign: 'right',
  },
};
