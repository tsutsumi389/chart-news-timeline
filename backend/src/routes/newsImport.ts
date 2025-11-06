/**
 * ニュースインポートルート
 * ニュースインポート関連のAPIエンドポイント定義
 */

import { FastifyInstance } from 'fastify';
import * as newsImportController from '../controllers/newsImportController';

/**
 * ニュースインポートルートを登録
 * @param server Fastifyインスタンス
 */
export async function newsImportRoutes(server: FastifyInstance) {
  // CSVファイルアップロードAPI
  server.post(
    '/stocks/:stockCode/news/import/csv',
    newsImportController.importCsv
  );

  // ニュースデータ削除API
  server.delete('/stocks/:stockCode/news', newsImportController.deleteNews);

  // 重複ニュース検出API
  server.post(
    '/stocks/:stockCode/news/check-duplicates',
    newsImportController.checkDuplicates
  );
}
