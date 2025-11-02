-- CreateEnum
CREATE TYPE "Sentiment" AS ENUM ('positive', 'negative', 'neutral');

-- CreateTable
CREATE TABLE "stocks" (
    "stock_id" SERIAL NOT NULL,
    "stock_code" VARCHAR(4) NOT NULL,
    "stock_name" VARCHAR(100) NOT NULL,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP NOT NULL,

    CONSTRAINT "stocks_pkey" PRIMARY KEY ("stock_id")
);

-- CreateTable
CREATE TABLE "stock_prices" (
    "price_id" BIGSERIAL NOT NULL,
    "stock_id" INTEGER NOT NULL,
    "trade_date" DATE NOT NULL,
    "open_price" DECIMAL(10,2) NOT NULL,
    "high_price" DECIMAL(10,2) NOT NULL,
    "low_price" DECIMAL(10,2) NOT NULL,
    "close_price" DECIMAL(10,2) NOT NULL,
    "volume" BIGINT NOT NULL,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP NOT NULL,

    CONSTRAINT "stock_prices_pkey" PRIMARY KEY ("price_id")
);

-- CreateTable
CREATE TABLE "news" (
    "news_id" BIGSERIAL NOT NULL,
    "stock_id" INTEGER NOT NULL,
    "published_at" TIMESTAMP NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "summary" TEXT,
    "url" VARCHAR(500),
    "source" VARCHAR(100),
    "sentiment" "Sentiment" DEFAULT 'neutral',
    "sentiment_score" DECIMAL(3,2),
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP NOT NULL,

    CONSTRAINT "news_pkey" PRIMARY KEY ("news_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "stocks_stock_code_key" ON "stocks"("stock_code");

-- CreateIndex
CREATE INDEX "idx_trade_date" ON "stock_prices"("trade_date");

-- CreateIndex
CREATE UNIQUE INDEX "idx_stock_date" ON "stock_prices"("stock_id", "trade_date");

-- CreateIndex
CREATE INDEX "idx_stock_published" ON "news"("stock_id", "published_at");

-- CreateIndex
CREATE INDEX "idx_published_at" ON "news"("published_at");

-- CreateIndex
CREATE INDEX "idx_sentiment" ON "news"("sentiment");

-- AddForeignKey
ALTER TABLE "stock_prices" ADD CONSTRAINT "stock_prices_stock_id_fkey" FOREIGN KEY ("stock_id") REFERENCES "stocks"("stock_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "news" ADD CONSTRAINT "news_stock_id_fkey" FOREIGN KEY ("stock_id") REFERENCES "stocks"("stock_id") ON DELETE CASCADE ON UPDATE CASCADE;
