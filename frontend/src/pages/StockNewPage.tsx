/**
 * 株登録ページ
 * 新規株銘柄の登録フォーム
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { StockForm } from '../components/StockForm';
import { createStock } from '../services/stockApi';
import { CreateStockInput } from '../types/stock';
import './StockNewPage.css';

/**
 * 株登録ページコンポーネント
 */
export const StockNewPage: React.FC = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  /**
   * フォーム送信ハンドラー
   */
  const handleSubmit = async (input: CreateStockInput) => {
    try {
      setIsLoading(true);
      setError(null);
      setSuccessMessage(null);

      await createStock(input);

      setSuccessMessage('株を登録しました');

      // 2秒後に一覧画面へ遷移
      setTimeout(() => {
        navigate('/stocks');
      }, 2000);
    } catch (err: any) {
      setError(err.message || '株の登録に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * キャンセルボタンのハンドラー
   */
  const handleCancel = () => {
    navigate('/stocks');
  };

  return (
    <div className="stock-new-page">
      <h1>株の新規登録</h1>

      {/* エラーバナー */}
      {error && <div className="error-banner">{error}</div>}

      {/* 成功バナー */}
      {successMessage && <div className="success-banner">{successMessage}</div>}

      {/* 登録フォーム */}
      <StockForm
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isLoading={isLoading}
      />
    </div>
  );
};
