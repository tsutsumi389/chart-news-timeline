/**
 * バックエンドエントリーポイント
 */

import { startServer } from './server';

// 環境変数から設定を取得
const PORT = parseInt(process.env.PORT || '3000', 10);
const HOST = process.env.HOST || '0.0.0.0';

// サーバー起動
startServer(PORT, HOST);
