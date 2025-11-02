/**
 * データベース設定のユニットテスト
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getPrismaClient } from './database';

describe('データベース設定', () => {
  describe('getPrismaClient', () => {
    it('Prismaクライアントのインスタンスを返す', () => {
      const client = getPrismaClient();
      expect(client).toBeDefined();
      expect(client.$connect).toBeDefined();
      expect(client.$disconnect).toBeDefined();
    });

    it('同じインスタンスを返す（シングルトン）', () => {
      const client1 = getPrismaClient();
      const client2 = getPrismaClient();
      expect(client1).toBe(client2);
    });
  });

  // 注: testDatabaseConnection と disconnectDatabase は
  // 実際のデータベース接続を必要とするため、
  // 統合テストで検証することを推奨します
});
