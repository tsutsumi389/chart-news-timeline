/**
 * 株チャート表示ページ
 * 銘柄コードに基づいて株価データを取得し、チャートを表示
 */

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import StockChart from '../components/StockChart';
import { fetchStockPrices } from '../services/stockApi';
import { CandlestickData } from '../types/stock';
import './StockChartPage.css';

/**
 * 株チャート表示ページコンポーネント
 */
export const StockChartPage: React.FC = () => {
  const { stockCode } = useParams<{ stockCode: string }>();
  const navigate = useNavigate();
  const [stockData, setStockData] = useState<CandlestickData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 銘柄コードに基づいて株価データを取得
  useEffect(() => {
    if (!stockCode) {
      setError('銘柄コードが指定されていません');
      setIsLoading(false);
      return;
    }

    loadStockPrices(stockCode);
  }, [stockCode]);

  /**
   * 株価データを取得
   */
  const loadStockPrices = async (code: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await fetchStockPrices(code);
      setStockData(data);
    } catch (err: any) {
      setError(err.message || '株価データの取得に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * 株一覧に戻る
   */
  const handleBackToList = () => {
    navigate('/stocks');
  };

  return (
    <div className="stock-chart-page">
      <div className="page-header">
        <div>
          <h1>株価チャート</h1>
          {stockCode && <p className="stock-code-label">銘柄コード: {stockCode}</p>}
        </div>
        <button className="back-button" onClick={handleBackToList}>
          ← 株一覧に戻る
        </button>
      </div>

      {/* ローディング */}
      {isLoading && <p className="loading">読み込み中...</p>}

      {/* エラー */}
      {error && (
        <div className="error-container">
          <p className="error">{error}</p>
          <button className="retry-button" onClick={() => stockCode && loadStockPrices(stockCode)}>
            再試行
          </button>
        </div>
      )}

      {/* チャート表示 */}
      {!isLoading && !error && stockData.length > 0 && (
        <div className="chart-container">
          <StockChart stockData={stockData} />
        </div>
      )}

      {/* データが空の場合 */}
      {!isLoading && !error && stockData.length === 0 && (
        <p className="empty-message">
          この銘柄の株価データがありません。
        </p>
      )}
    </div>
  );
};
