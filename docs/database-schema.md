# データベーステーブル定義

## 概要

Chart News Timelineアプリケーションで使用する3つのテーブル定義。
日本株の株価データとニュース情報を管理する。

---

## 1. 株マスタテーブル (stocks)

日本株の基本情報を管理するマスタテーブル。

### テーブル定義

| カラム名 | データ型 | NULL | キー | デフォルト | 説明 |
|---------|---------|------|------|-----------|------|
| stock_id | INT | NOT NULL | PK | AUTO_INCREMENT | 株ID（主キー） |
| stock_code | VARCHAR(4) | NOT NULL | UNIQUE | - | 証券コード（4桁、例: 7203） |
| stock_name | VARCHAR(100) | NOT NULL | - | - | 銘柄名（例: トヨタ自動車） |
| created_at | TIMESTAMP | NOT NULL | - | CURRENT_TIMESTAMP | 作成日時 |
| updated_at | TIMESTAMP | NOT NULL | - | CURRENT_TIMESTAMP ON UPDATE | 更新日時 |

### インデックス

```sql
PRIMARY KEY (stock_id)
UNIQUE INDEX idx_stock_code (stock_code)
```

### 備考

- `stock_code`: 日本株の証券コードは4桁の数字（例: 7203=トヨタ自動車）

---

## 2. 株価テーブル (stock_prices)

日足の株価データ（OHLC）を格納するテーブル。

### テーブル定義

| カラム名 | データ型 | NULL | キー | デフォルト | 説明 |
|---------|---------|------|------|-----------|------|
| price_id | BIGINT | NOT NULL | PK | AUTO_INCREMENT | 株価ID（主キー） |
| stock_id | INT | NOT NULL | FK | - | 株ID（外部キー） |
| trade_date | DATE | NOT NULL | - | - | 取引日 |
| open_price | DECIMAL(10,2) | NOT NULL | - | - | 始値 |
| high_price | DECIMAL(10,2) | NOT NULL | - | - | 高値 |
| low_price | DECIMAL(10,2) | NOT NULL | - | - | 安値 |
| close_price | DECIMAL(10,2) | NOT NULL | - | - | 終値 |
| volume | BIGINT | NOT NULL | - | - | 出来高 |
| created_at | TIMESTAMP | NOT NULL | - | CURRENT_TIMESTAMP | 作成日時 |
| updated_at | TIMESTAMP | NOT NULL | - | CURRENT_TIMESTAMP ON UPDATE | 更新日時 |

### インデックス

```sql
PRIMARY KEY (price_id)
UNIQUE INDEX idx_stock_date (stock_id, trade_date)
INDEX idx_trade_date (trade_date)
FOREIGN KEY (stock_id) REFERENCES stocks(stock_id) ON DELETE CASCADE
```

### 備考

- `trade_date`: 取引日（土日祝は除く）
- `DECIMAL(10,2)`: 小数点以下2桁まで対応（例: 1234.56円）
- `volume`: 出来高は大きな数値になるため BIGINT を使用
- ユニークインデックスにより、同一銘柄・同一日付のデータ重複を防止

---

## 3. ニューステーブル (news)

株価に影響を与える可能性のあるニュース情報を管理するテーブル。

### テーブル定義

| カラム名 | データ型 | NULL | キー | デフォルト | 説明 |
|---------|---------|------|------|-----------|------|
| news_id | BIGINT | NOT NULL | PK | AUTO_INCREMENT | ニュースID（主キー） |
| stock_id | INT | NOT NULL | FK | - | 株ID（外部キー） |
| published_at | TIMESTAMP | NOT NULL | - | - | ニュース公開日時 |
| title | VARCHAR(255) | NOT NULL | - | - | ニュースタイトル |
| summary | TEXT | NULL | - | - | ニュース要約 |
| url | VARCHAR(500) | NULL | - | - | ニュース記事URL |
| source | VARCHAR(100) | NULL | - | - | ニュースソース（例: 日経新聞、Bloomberg） |
| sentiment | ENUM('positive', 'negative', 'neutral') | NULL | - | 'neutral' | センチメント分析結果 |
| sentiment_score | DECIMAL(3,2) | NULL | - | - | センチメントスコア（-1.00 〜 1.00） |
| created_at | TIMESTAMP | NOT NULL | - | CURRENT_TIMESTAMP | 作成日時 |
| updated_at | TIMESTAMP | NOT NULL | - | CURRENT_TIMESTAMP ON UPDATE | 更新日時 |

### インデックス

```sql
PRIMARY KEY (news_id)
INDEX idx_stock_published (stock_id, published_at)
INDEX idx_published_at (published_at)
INDEX idx_sentiment (sentiment)
FOREIGN KEY (stock_id) REFERENCES stocks(stock_id) ON DELETE CASCADE
```

### 備考

- `published_at`: ニュースの公開日時（タイムゾーンは JST 想定）
- `sentiment`: ポジティブ/ネガティブ/ニュートラルの3段階
- `sentiment_score`: 将来的な機械学習による数値スコア（-1=超ネガティブ、0=中立、1=超ポジティブ）
- チャート上のマーカー表示時、`sentiment` に応じて色分け（positive=緑、negative=赤、neutral=灰色）

---

## テーブル間のリレーション

```
stocks (1) ----< (N) stock_prices
  |
  |
  +-------------< (N) news
```

- 1つの株（stocks）に対して、複数の株価データ（stock_prices）が存在
- 1つの株（stocks）に対して、複数のニュース（news）が存在

---

## サンプルデータ

### stocks テーブル

```sql
INSERT INTO stocks (stock_code, stock_name) VALUES
('7203', 'トヨタ自動車'),
('9984', 'ソフトバンクグループ'),
('6758', 'ソニーグループ');
```

### stock_prices テーブル

```sql
INSERT INTO stock_prices (stock_id, trade_date, open_price, high_price, low_price, close_price, volume) VALUES
(1, '2024-01-04', 2450.00, 2480.00, 2440.00, 2475.00, 15000000),
(1, '2024-01-05', 2475.00, 2490.00, 2460.00, 2485.00, 14500000),
(1, '2024-01-09', 2485.00, 2500.00, 2475.00, 2495.00, 16000000);
```

### news テーブル

```sql
INSERT INTO news (stock_id, published_at, title, summary, source, sentiment, sentiment_score) VALUES
(1, '2024-01-05 09:00:00', 'トヨタ、2024年世界販売台数で過去最高を記録',
 '2024年の世界販売台数が前年比7%増となり、過去最高を更新した。',
 '日経新聞', 'positive', 0.85),
(1, '2024-01-08 15:30:00', 'トヨタ、米国工場で生産一時停止',
 '部品供給の遅延により、米国の一部工場で生産を一時停止する。',
 'Bloomberg', 'negative', -0.60);
```

---

## データベースエンジン推奨設定

### MySQL / MariaDB

```sql
-- 文字コード: UTF-8
CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ストレージエンジン: InnoDB（トランザクション対応）
ENGINE=InnoDB;
```

### PostgreSQL

```sql
-- 文字コード: UTF-8
ENCODING 'UTF8' LC_COLLATE 'ja_JP.UTF-8' LC_CTYPE 'ja_JP.UTF-8';
```

---

## マイグレーション戦略

将来的にデータベーススキーマを管理する際の推奨ツール:

- **Prisma**: TypeScript環境との相性が良い
- **TypeORM**: NestJS等のフレームワークと統合しやすい
- **Knex.js**: シンプルで柔軟なマイグレーション管理

Phase 2（バックエンド実装）開始時に、マイグレーションツールの選定と導入を行う。
