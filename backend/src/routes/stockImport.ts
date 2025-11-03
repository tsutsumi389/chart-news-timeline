/**
 * 株価インポートルート
 * 株価インポート関連のAPIエンドポイント定義
 */

import { FastifyInstance } from 'fastify';
import * as stockImportController from '../controllers/stockImportController';

/**
 * 株価インポートルートを登録
 * @param server Fastifyインスタンス
 */
export async function stockImportRoutes(server: FastifyInstance) {
  // 銘柄情報取得API
  server.get('/stocks/:stockCode', stockImportController.getStock);

  // CSVファイルアップロードAPI
  server.post('/stocks/:stockCode/import/csv', stockImportController.importCsv);

  // 株価データ削除API
  server.delete('/stocks/:stockCode/prices', stockImportController.deletePrices);
}
