/**
 * 株登録フォームコンポーネント
 * 新規株銘柄の登録フォーム（銘柄コード・銘柄名入力）
 */

import React, { useState } from 'react';
import { CreateStockInput } from '../types/stock';
import './StockForm.css';

interface StockFormProps {
  onSubmit: (input: CreateStockInput) => Promise<void>;
  onCancel: () => void;
  isLoading: boolean;
}

/**
 * 株登録フォームコンポーネント
 */
export const StockForm: React.FC<StockFormProps> = ({
  onSubmit,
  onCancel,
  isLoading,
}) => {
  const [stockCode, setStockCode] = useState('');
  const [stockName, setStockName] = useState('');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  /**
   * フロントエンドバリデーション
   */
  const validate = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!stockCode) {
      newErrors.stockCode = '銘柄コードは必須です';
    } else if (!/^[A-Za-z0-9]{4}$/.test(stockCode)) {
      newErrors.stockCode = '銘柄コードは英数字4桁である必要があります';
    }

    if (!stockName) {
      newErrors.stockName = '銘柄名は必須です';
    } else if (stockName.length > 100) {
      newErrors.stockName = '銘柄名は100文字以内で入力してください';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * 送信処理
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    try {
      await onSubmit({
        stockCode: stockCode.trim().toUpperCase(), // 大文字に統一
        stockName: stockName.trim(),
      });
    } catch (error) {
      // エラーは親コンポーネントで処理
    }
  };

  return (
    <form className="stock-form" onSubmit={handleSubmit}>
      <div className="form-group">
        <label htmlFor="stockCode">
          銘柄コード <span className="required">*</span>
        </label>
        <input
          id="stockCode"
          type="text"
          value={stockCode}
          onChange={(e) => setStockCode(e.target.value)}
          placeholder="7203 または AAPL"
          maxLength={4}
          disabled={isLoading}
        />
        {errors.stockCode && (
          <p className="error-message">{errors.stockCode}</p>
        )}
        <p className="help-text">英数字4桁の証券コードを入力してください</p>
      </div>

      <div className="form-group">
        <label htmlFor="stockName">
          銘柄名 <span className="required">*</span>
        </label>
        <input
          id="stockName"
          type="text"
          value={stockName}
          onChange={(e) => setStockName(e.target.value)}
          placeholder="トヨタ自動車"
          maxLength={100}
          disabled={isLoading}
        />
        {errors.stockName && (
          <p className="error-message">{errors.stockName}</p>
        )}
        <p className="help-text">
          銘柄名を入力してください（100文字以内）
        </p>
      </div>

      <div className="form-actions">
        <button
          type="button"
          className="cancel-button"
          onClick={onCancel}
          disabled={isLoading}
        >
          キャンセル
        </button>
        <button
          type="submit"
          className="submit-button"
          disabled={isLoading}
        >
          {isLoading ? '登録中...' : '登録'}
        </button>
      </div>
    </form>
  );
};
