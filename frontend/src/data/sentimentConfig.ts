import { SentimentConfig } from '../types/stock';

/**
 * センチメント別の表示設定
 */
export const sentimentConfig: SentimentConfig = {
  positive: {
    color: '#4CAF50',        // 緑（ポジティブ）
    label: 'ポジティブ'
  },
  negative: {
    color: '#F44336',        // 赤（ネガティブ）
    label: 'ネガティブ'
  },
  neutral: {
    color: '#9E9E9E',        // グレー（中立）
    label: '中立'
  }
};
