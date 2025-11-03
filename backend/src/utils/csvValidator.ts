/**
 * CSVバリデーター
 * CSV行のデータバリデーション（日付形式、価格妥当性、OHLC関係性チェック）
 */

import { CsvRow } from '../types/import';

/**
 * CSVバリデータークラス
 */
export class CsvValidator {
  /**
   * CSV行のバリデーション
   * @param row CSV行データ
   * @returns エラーメッセージ（正常な場合はnull）
   */
  validate(row: CsvRow): string | null {
    // 日付形式チェック
    const dateError = this.validateDate(row.date);
    if (dateError) {
      return dateError;
    }

    // 価格の正数チェック
    const positiveError = this.validatePositiveNumbers(row);
    if (positiveError) {
      return positiveError;
    }

    // OHLC関係性チェック
    const ohlcError = this.validateOhlcRelationship(row);
    if (ohlcError) {
      return ohlcError;
    }

    // 出来高チェック
    const volumeError = this.validateVolume(row.volume);
    if (volumeError) {
      return volumeError;
    }

    return null;
  }

  /**
   * 日付形式チェック（YYYY-MM-DD）
   * @param dateString 日付文字列
   * @returns エラーメッセージ（正常な場合はnull）
   */
  private validateDate(dateString: string): string | null {
    // YYYY-MM-DD形式の正規表現
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(dateString)) {
      return '日付形式が不正です（YYYY-MM-DD形式で入力してください）';
    }

    // 日付要素を抽出
    const [year, month, day] = dateString.split('-').map(Number);

    // 実際の日付として有効かチェック（2月30日などを検出）
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return '無効な日付です';
    }

    // 入力された年月日と実際の年月日が一致するかチェック
    // （2024-02-30は自動的に2024-03-01に変換されるため）
    if (
      date.getFullYear() !== year ||
      date.getMonth() + 1 !== month ||
      date.getDate() !== day
    ) {
      return '無効な日付です';
    }

    // 未来の日付チェック
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (date > today) {
      return '未来の日付は指定できません';
    }

    // 1900年以前の日付チェック（データの妥当性）
    const minDate = new Date('1900-01-01');
    if (date < minDate) {
      return '1900年以前の日付は指定できません';
    }

    return null;
  }

  /**
   * 価格の正数チェック
   * @param row CSV行データ
   * @returns エラーメッセージ（正常な場合はnull）
   */
  private validatePositiveNumbers(row: CsvRow): string | null {
    if (row.open <= 0) {
      return '始値は正の数値である必要があります';
    }
    if (row.high <= 0) {
      return '高値は正の数値である必要があります';
    }
    if (row.low <= 0) {
      return '安値は正の数値である必要があります';
    }
    if (row.close <= 0) {
      return '終値は正の数値である必要があります';
    }
    return null;
  }

  /**
   * OHLC関係性チェック
   * - 高値は全ての価格以上
   * - 安値は全ての価格以下
   * @param row CSV行データ
   * @returns エラーメッセージ（正常な場合はnull）
   */
  private validateOhlcRelationship(row: CsvRow): string | null {
    // 高値が安値より低い
    if (row.high < row.low) {
      return '高値が安値より低い値です';
    }

    // 高値が始値または終値より低い
    if (row.high < row.open) {
      return '高値が始値より低い値です';
    }
    if (row.high < row.close) {
      return '高値が終値より低い値です';
    }

    // 安値が始値または終値より高い
    if (row.low > row.open) {
      return '安値が始値より高い値です';
    }
    if (row.low > row.close) {
      return '安値が終値より高い値です';
    }

    // 異常値チェック（極端な値段差）
    const maxPrice = Math.max(row.open, row.high, row.low, row.close);
    const minPrice = Math.min(row.open, row.high, row.low, row.close);
    const priceRange = maxPrice - minPrice;
    const avgPrice = (maxPrice + minPrice) / 2;

    // 値幅が平均価格の50%を超える場合は警告（ストップ高・ストップ安を考慮）
    if (priceRange > avgPrice * 0.5) {
      return '1日の値動きが異常に大きいです（データを確認してください）';
    }

    return null;
  }

  /**
   * 出来高チェック
   * @param volume 出来高
   * @returns エラーメッセージ（正常な場合はnull）
   */
  private validateVolume(volume: number): string | null {
    // 負の値チェック
    if (volume < 0) {
      return '出来高は0以上である必要があります';
    }

    // 整数チェック
    if (!Number.isInteger(volume)) {
      return '出来高は整数である必要があります';
    }

    // 異常に大きい値のチェック（1兆株以上は異常値とみなす）
    const MAX_VOLUME = 1_000_000_000_000;
    if (volume > MAX_VOLUME) {
      return '出来高が異常に大きいです（データを確認してください）';
    }

    return null;
  }
}

// シングルトンインスタンスをエクスポート
export const csvValidator = new CsvValidator();
