/**
 * 株一覧ページ
 * 登録済み株銘柄の一覧表示と新規登録への導線
 */

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { StockList } from '../components/StockList';
import { fetchStocks } from '../services/stockApi';
import { Stock } from '../types/stock';
import './StocksPage.css';

/**
 * 株一覧ページコンポーネント
 */
export const StocksPage: React.FC = () => {
  const navigate = useNavigate();
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [filteredStocks, setFilteredStocks] = useState<Stock[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 初回ロード時に株一覧を取得
  useEffect(() => {
    loadStocks();
  }, []);

  // 検索クエリが変更されたら絞り込み
  useEffect(() => {
    if (!searchQuery) {
      setFilteredStocks(stocks);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = stocks.filter(
      (stock) =>
        stock.stockCode.toLowerCase().includes(query) ||
        stock.stockName.toLowerCase().includes(query)
    );
    setFilteredStocks(filtered);
  }, [searchQuery, stocks]);

  /**
   * 株一覧を取得
   */
  const loadStocks = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await fetchStocks();
      setStocks(data);
      setFilteredStocks(data);
    } catch (err: any) {
      setError(err.message || '株一覧の取得に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * チャート表示ボタンのクリックハンドラー
   */
  const handleChartClick = (stockCode: string) => {
    navigate(`/chart/${stockCode}`);
  };

  /**
   * 新規登録ボタンのクリックハンドラー
   */
  const handleNewStock = () => {
    navigate('/stocks/new');
  };

  return (
    <div className="stocks-page">
      <div className="page-header">
        <h1>株一覧</h1>
        <button className="new-button" onClick={handleNewStock}>
          + 新規登録
        </button>
      </div>

      {/* 検索ボックス */}
      <div className="search-box">
        <input
          type="text"
          placeholder="銘柄コードまたは銘柄名で検索"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          disabled={isLoading}
        />
      </div>

      {/* ローディング */}
      {isLoading && <p className="loading">読み込み中...</p>}

      {/* エラー */}
      {error && <p className="error">{error}</p>}

      {/* 空の場合 */}
      {!isLoading && !error && stocks.length === 0 && (
        <p className="empty-message">
          登録されている株がありません。新規登録してください。
        </p>
      )}

      {/* 検索結果が空の場合 */}
      {!isLoading && !error && stocks.length > 0 && filteredStocks.length === 0 && (
        <p className="empty-message">
          検索条件に一致する株が見つかりませんでした。
        </p>
      )}

      {/* 株一覧テーブル */}
      {!isLoading && !error && filteredStocks.length > 0 && (
        <>
          <StockList stocks={filteredStocks} onChartClick={handleChartClick} />
          <p className="result-count">
            表示: {filteredStocks.length}件 / 全{stocks.length}件
          </p>
        </>
      )}
    </div>
  );
};
