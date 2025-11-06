/**
 * ニュースバリデーター
 * ニュースデータのバリデーション（日時形式、タイトル長、URL形式、センチメント値チェック）
 */

import { NewsItem, Sentiment } from '../types/newsImport';

/**
 * ニュースバリデータークラス
 */
export class NewsValidator {
  /**
   * ニュースアイテムのバリデーション
   * @param item ニュースアイテム
   * @returns エラーメッセージ（正常な場合はnull）
   */
  validate(item: NewsItem): string | null {
    // 公開日時チェック
    const dateTimeError = this.validateDateTime(item.publishedAt);
    if (dateTimeError) {
      return dateTimeError;
    }

    // タイトルチェック
    const titleError = this.validateTitle(item.title);
    if (titleError) {
      return titleError;
    }

    // URL形式チェック
    if (item.url) {
      const urlError = this.validateUrl(item.url);
      if (urlError) {
        return urlError;
      }
    }

    // ソース長チェック
    if (item.source) {
      const sourceError = this.validateSource(item.source);
      if (sourceError) {
        return sourceError;
      }
    }

    // センチメント値チェック
    if (item.sentiment) {
      const sentimentError = this.validateSentiment(item.sentiment);
      if (sentimentError) {
        return sentimentError;
      }
    }

    // センチメントスコア範囲チェック
    if (item.sentimentScore !== undefined) {
      const scoreError = this.validateSentimentScore(item.sentimentScore);
      if (scoreError) {
        return scoreError;
      }
    }

    return null;
  }

  /**
   * 日時形式チェック（YYYY-MM-DD HH:MM:SS または ISO 8601）
   * @param dateTimeString 日時文字列
   * @returns エラーメッセージ（正常な場合はnull）
   */
  private validateDateTime(dateTimeString: string): string | null {
    // 空文字チェック
    if (!dateTimeString || dateTimeString.trim() === '') {
      return '公開日時が空です';
    }

    // 日付オブジェクトに変換
    const date = new Date(dateTimeString);
    if (isNaN(date.getTime())) {
      return '公開日時の形式が不正です（YYYY-MM-DD HH:MM:SS形式またはISO 8601形式で入力してください）';
    }

    // 未来の日付チェック
    const now = new Date();
    if (date > now) {
      return '未来の日時は指定できません';
    }

    // 1900年以前の日付チェック（データの妥当性）
    const minDate = new Date('1900-01-01');
    if (date < minDate) {
      return '1900年以前の日時は指定できません';
    }

    return null;
  }

  /**
   * タイトルチェック
   * @param title タイトル
   * @returns エラーメッセージ（正常な場合はnull）
   */
  private validateTitle(title: string): string | null {
    // 必須チェック
    if (!title || title.trim() === '') {
      return 'タイトルは必須です';
    }

    // 長さチェック
    if (title.length > 255) {
      return 'タイトルは255文字以内で入力してください';
    }

    return null;
  }

  /**
   * URL形式チェック
   * @param urlString URL文字列
   * @returns エラーメッセージ（正常な場合はnull）
   */
  private validateUrl(urlString: string): string | null {
    // 長さチェック
    if (urlString.length > 500) {
      return 'URLは500文字以内で入力してください';
    }

    // URL形式チェック
    try {
      const url = new URL(urlString);
      if (url.protocol !== 'http:' && url.protocol !== 'https:') {
        return 'URLはhttp://またはhttps://で始まる必要があります';
      }
    } catch {
      return 'URLの形式が不正です（http://またはhttps://で始まる必要があります）';
    }

    return null;
  }

  /**
   * ソース長チェック
   * @param source ソース
   * @returns エラーメッセージ（正常な場合はnull）
   */
  private validateSource(source: string): string | null {
    if (source.length > 100) {
      return 'ソースは100文字以内で入力してください';
    }
    return null;
  }

  /**
   * センチメント値チェック
   * @param sentiment センチメント
   * @returns エラーメッセージ（正常な場合はnull）
   */
  private validateSentiment(sentiment: Sentiment): string | null {
    const validSentiments: Sentiment[] = ['positive', 'negative', 'neutral'];
    if (!validSentiments.includes(sentiment)) {
      return 'センチメントはpositive、negative、neutralのいずれかである必要があります';
    }
    return null;
  }

  /**
   * センチメントスコア範囲チェック
   * @param score センチメントスコア
   * @returns エラーメッセージ（正常な場合はnull）
   */
  private validateSentimentScore(score: number): string | null {
    if (score < -1.0 || score > 1.0) {
      return 'センチメントスコアは-1.00〜1.00の範囲内である必要があります';
    }
    return null;
  }
}

// シングルトンインスタンスをエクスポート
export const newsValidator = new NewsValidator();
