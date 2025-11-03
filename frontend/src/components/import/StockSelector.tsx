import React, { useState } from 'react';
import { Stock } from '../../types/stock';

interface StockSelectorProps {
  onSelect: (stock: Stock | null) => void;
  disabled?: boolean;
}

/**
 * 銘柄選択コンポーネント
 * 銘柄コードを入力すると自動で銘柄情報を取得し、親コンポーネントに通知する
 */
export const StockSelector: React.FC<StockSelectorProps> = ({ onSelect, disabled = false }) => {
  const [stockCode, setStockCode] = useState('');
  const [stock, setStock] = useState<Stock | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 銘柄コード入力ハンドラ
  const handleStockCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const code = e.target.value;
    setStockCode(code);

    // 4桁入力されたら自動で銘柄情報を取得
    if (code.length === 4) {
      fetchStockInfo(code);
    } else {
      setStock(null);
      setError(null);
      onSelect(null);
    }
  };

  // 銘柄情報取得
  const fetchStockInfo = async (code: string) => {
    setLoading(true);
    setError(null);

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const response = await fetch(`${apiUrl}/api/v1/stocks/${code}`);

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('銘柄が見つかりませんでした');
        }
        throw new Error('銘柄情報の取得に失敗しました');
      }

      const data = await response.json();

      if (data.success && data.data) {
        const stockData: Stock = {
          stockId: data.data.stockId,
          stockCode: data.data.stockCode,
          stockName: data.data.stockName,
        };
        setStock(stockData);
        onSelect(stockData);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '不明なエラーが発生しました';
      setError(errorMessage);
      setStock(null);
      onSelect(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="stock-selector" style={styles.container}>
      <h2 style={styles.heading}>銘柄選択</h2>

      <div style={styles.inputGroup}>
        <label htmlFor="stockCode" style={styles.label}>
          銘柄コード（4桁）
        </label>
        <input
          id="stockCode"
          type="text"
          value={stockCode}
          onChange={handleStockCodeChange}
          placeholder="例: 7203"
          maxLength={4}
          disabled={disabled || loading}
          style={{
            ...styles.input,
            ...(disabled || loading ? styles.inputDisabled : {}),
          }}
        />
      </div>

      {loading && (
        <div style={styles.loadingContainer}>
          <span style={styles.loadingText}>銘柄情報を取得中...</span>
        </div>
      )}

      {error && (
        <div style={styles.errorContainer}>
          <span style={styles.errorIcon}>⚠️</span>
          <span style={styles.errorText}>{error}</span>
        </div>
      )}

      {stock && !error && (
        <div style={styles.stockInfoContainer}>
          <div style={styles.stockInfoLabel}>選択された銘柄:</div>
          <div style={styles.stockInfo}>
            <span style={styles.stockCode}>{stock.stockCode}</span>
            <span style={styles.stockName}>{stock.stockName}</span>
          </div>
        </div>
      )}
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
  inputGroup: {
    marginBottom: '16px',
  },
  label: {
    display: 'block',
    fontSize: '14px',
    fontWeight: '500',
    marginBottom: '8px',
    color: '#555',
  },
  input: {
    width: '100%',
    padding: '10px 12px',
    fontSize: '16px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    boxSizing: 'border-box',
    transition: 'border-color 0.2s',
  },
  inputDisabled: {
    backgroundColor: '#f5f5f5',
    cursor: 'not-allowed',
  },
  loadingContainer: {
    padding: '12px',
    backgroundColor: '#e3f2fd',
    borderRadius: '4px',
    marginTop: '12px',
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
    marginTop: '12px',
  },
  errorIcon: {
    marginRight: '8px',
    fontSize: '16px',
  },
  errorText: {
    color: '#d32f2f',
    fontSize: '14px',
  },
  stockInfoContainer: {
    marginTop: '16px',
    padding: '16px',
    backgroundColor: '#e8f5e9',
    borderRadius: '4px',
  },
  stockInfoLabel: {
    fontSize: '12px',
    color: '#2e7d32',
    marginBottom: '8px',
    fontWeight: '500',
  },
  stockInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  stockCode: {
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#1b5e20',
  },
  stockName: {
    fontSize: '16px',
    color: '#2e7d32',
  },
};
