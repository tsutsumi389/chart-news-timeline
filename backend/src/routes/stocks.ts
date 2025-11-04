/**
 * 株マスタルート
 * 株一覧・登録・詳細取得のエンドポイント定義
 */

import { FastifyInstance } from 'fastify';
import * as stockController from '../controllers/stockController';

/**
 * 株マスタルートを登録
 * @param fastify Fastifyインスタンス
 */
export async function stockRoutes(fastify: FastifyInstance): Promise<void> {
  // 株一覧取得
  fastify.get('/stocks', stockController.getStocks);

  // 株登録
  fastify.post('/stocks', stockController.createStock);

  // 株詳細取得（IDベース）
  fastify.get('/stocks/id/:stockId', stockController.getStockById);
}
