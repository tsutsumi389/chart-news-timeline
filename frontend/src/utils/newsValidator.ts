/**
 * ニュースデータのバリデーション
 * 日付形式、タイトル長、URL形式、センチメント値チェック
 */

import type { NewsItem } from '../types/newsImport';

/**
 * バリデーションエラー結果
 */
export interface NewsValidationError {
  field: string;
  message: string;
}

/**
 * 日時形式チェック（YYYY-MM-DD HH:MM:SS または ISO 8601）
 * @param dateTimeString 日時文字列
 * @returns 有効な日時の場合true
 */
function isValidDateTime(dateTimeString: string): boolean {
  if (!dateTimeString || dateTimeString.trim() === '') {
    return false;
  }

  const date = new Date(dateTimeString);
  return date instanceof Date && !isNaN(date.getTime());
}

/**
 * URL形式チェック
 * @param urlString URL文字列
 * @returns 有効なURL（http/https）の場合true
 */
function isValidUrl(urlString: string): boolean {
  try {
    const url = new URL(urlString);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * センチメント値チェック
 * @param sentiment センチメント値
 * @returns 有効なセンチメント値の場合true
 */
function isValidSentiment(
  sentiment: string
): sentiment is 'positive' | 'negative' | 'neutral' {
  return ['positive', 'negative', 'neutral'].includes(sentiment);
}

/**
 * ニュースアイテムのバリデーション
 * @param item ニュースアイテム
 * @returns エラー配列（正常な場合は空配列）
 */
export function validateNewsItem(item: NewsItem): NewsValidationError[] {
  const errors: NewsValidationError[] = [];

  // 公開日時チェック
  if (!isValidDateTime(item.publishedAt)) {
    errors.push({
      field: 'publishedAt',
      message:
        '公開日時の形式が不正です（YYYY-MM-DD HH:MM:SS形式で入力してください）',
    });
  }

  // タイトル必須チェック
  if (!item.title || item.title.trim() === '') {
    errors.push({
      field: 'title',
      message: 'タイトルは必須です',
    });
  }

  // タイトル長チェック
  if (item.title && item.title.length > 255) {
    errors.push({
      field: 'title',
      message: 'タイトルは255文字以内で入力してください',
    });
  }

  // URL形式チェック
  if (item.url && !isValidUrl(item.url)) {
    errors.push({
      field: 'url',
      message:
        'URLの形式が不正です（http://またはhttps://で始まる必要があります）',
    });
  }

  // URL長チェック
  if (item.url && item.url.length > 500) {
    errors.push({
      field: 'url',
      message: 'URLは500文字以内で入力してください',
    });
  }

  // ソース長チェック
  if (item.source && item.source.length > 100) {
    errors.push({
      field: 'source',
      message: 'ソースは100文字以内で入力してください',
    });
  }

  // センチメント値チェック
  if (item.sentiment && !isValidSentiment(item.sentiment)) {
    errors.push({
      field: 'sentiment',
      message:
        'センチメントはpositive、negative、neutralのいずれかである必要があります',
    });
  }

  // センチメントスコア範囲チェック
  if (item.sentimentScore !== undefined) {
    if (item.sentimentScore < -1.0 || item.sentimentScore > 1.0) {
      errors.push({
        field: 'sentimentScore',
        message:
          'センチメントスコアは-1.00〜1.00の範囲内である必要があります',
      });
    }
  }

  return errors;
}

/**
 * ニュースアイテムのシンプルなバリデーション（エラーメッセージのみ）
 * @param item ニュースアイテム
 * @returns エラーメッセージ（正常な場合はnull）
 */
export function validateNewsItemSimple(item: NewsItem): string | null {
  const errors = validateNewsItem(item);

  if (errors.length === 0) {
    return null;
  }

  return errors.map((err) => err.message).join('、');
}

/**
 * 複数のニュースアイテムをバリデーション
 * @param items ニュースアイテム配列
 * @returns バリデーション結果（有効なアイテム、エラー配列）
 */
export function validateNewsItems(items: NewsItem[]): {
  validItems: NewsItem[];
  errors: Array<{
    index: number;
    item: NewsItem;
    errors: NewsValidationError[];
  }>;
} {
  const validItems: NewsItem[] = [];
  const errors: Array<{
    index: number;
    item: NewsItem;
    errors: NewsValidationError[];
  }> = [];

  items.forEach((item, index) => {
    const validationErrors = validateNewsItem(item);

    if (validationErrors.length === 0) {
      validItems.push(item);
    } else {
      errors.push({
        index,
        item,
        errors: validationErrors,
      });
    }
  });

  return { validItems, errors };
}
