import React from 'react';

/**
 * センチメントの型
 */
type Sentiment = 'positive' | 'negative' | 'neutral';

interface SentimentBadgeProps {
  sentiment: Sentiment;
  score?: number;
  size?: 'small' | 'medium' | 'large';
}

/**
 * センチメントバッジコンポーネント
 * センチメント（positive/negative/neutral）を視覚的に表示
 */
export const SentimentBadge: React.FC<SentimentBadgeProps> = ({
  sentiment,
  score,
  size = 'medium',
}) => {
  const config = getSentimentConfig(sentiment);
  const sizeStyle = getSizeStyle(size);

  return (
    <div style={{ ...styles.container, ...sizeStyle.container }}>
      <span style={{ ...styles.dot, backgroundColor: config.color }}></span>
      <span style={{ ...styles.label, ...sizeStyle.label }}>{config.label}</span>
      {score !== undefined && (
        <span style={{ ...styles.score, ...sizeStyle.score }}>
          ({score > 0 ? '+' : ''}{score.toFixed(2)})
        </span>
      )}
    </div>
  );
};

/**
 * センチメント設定を取得
 */
function getSentimentConfig(sentiment: Sentiment) {
  switch (sentiment) {
    case 'positive':
      return {
        label: 'ポジティブ',
        color: '#4caf50', // 緑
      };
    case 'negative':
      return {
        label: 'ネガティブ',
        color: '#f44336', // 赤
      };
    case 'neutral':
    default:
      return {
        label: 'ニュートラル',
        color: '#9e9e9e', // グレー
      };
  }
}

/**
 * サイズ別スタイルを取得
 */
function getSizeStyle(size: 'small' | 'medium' | 'large') {
  switch (size) {
    case 'small':
      return {
        container: { gap: '4px' },
        label: { fontSize: '11px' },
        score: { fontSize: '10px' },
      };
    case 'large':
      return {
        container: { gap: '8px' },
        label: { fontSize: '16px' },
        score: { fontSize: '14px' },
      };
    case 'medium':
    default:
      return {
        container: { gap: '6px' },
        label: { fontSize: '13px' },
        score: { fontSize: '12px' },
      };
  }
}

// スタイル定義
const styles: { [key: string]: React.CSSProperties } = {
  container: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '4px 8px',
    backgroundColor: '#f5f5f5',
    borderRadius: '12px',
    border: '1px solid #e0e0e0',
  },
  dot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
  },
  label: {
    fontWeight: '500',
    color: '#333',
  },
  score: {
    color: '#666',
    fontWeight: 'normal',
  },
};
