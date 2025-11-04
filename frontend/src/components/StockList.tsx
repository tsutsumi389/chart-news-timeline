/**
 * 株一覧コンポーネント
 * 登録済み株銘柄の一覧をテーブル形式で表示
 */

import React from 'react';
import { Stock } from '../types/stock';
import './StockList.css';

interface StockListProps {
  stocks: Stock[];
  onChartClick: (stockCode: string) => void;
}

/**
 * 株一覧コンポーネント
 */
export const StockList: React.FC<StockListProps> = ({ stocks, onChartClick }) => {
  /**
   * 日時フォーマット（YYYY-MM-DD HH:mm:ss）
   */
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  return (
    <div className="stock-list">
      <table className="stock-table">
        <thead>
          <tr>
            <th>銘柄コード</th>
            <th>銘柄名</th>
            <th>登録日時</th>
            <th>アクション</th>
          </tr>
        </thead>
        <tbody>
          {stocks.map((stock) => (
            <tr key={stock.stockId}>
              <td>{stock.stockCode}</td>
              <td>{stock.stockName}</td>
              <td>{formatDate(stock.createdAt)}</td>
              <td>
                <button
                  className="chart-button"
                  onClick={() => onChartClick(stock.stockCode)}
                >
                  チャート
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
