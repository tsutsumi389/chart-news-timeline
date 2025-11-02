import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 データベースにシードデータを投入中...');

  // 既存データをクリーンアップ
  await prisma.news.deleteMany({});
  await prisma.stockPrice.deleteMany({});
  await prisma.stock.deleteMany({});
  console.log('✅ 既存データをクリーンアップしました');

  // 株マスタ作成
  const stock = await prisma.stock.create({
    data: {
      stockCode: '7203',
      stockName: 'トヨタ自動車',
    },
  });

  console.log(`✅ 株マスタ作成: ${stock.stockName} (${stock.stockCode})`);

  // 株価データ作成（sampleData.tsの内容）
  const priceData = [
    { tradeDate: new Date('2024-01-15'), openPrice: 150.5, closePrice: 152.3, lowPrice: 149.8, highPrice: 153.0, volume: 15000000 },
    { tradeDate: new Date('2024-01-16'), openPrice: 152.3, closePrice: 151.0, lowPrice: 150.5, highPrice: 153.5, volume: 14500000 },
    { tradeDate: new Date('2024-01-17'), openPrice: 151.0, closePrice: 154.2, lowPrice: 150.8, highPrice: 154.5, volume: 16200000 },
    { tradeDate: new Date('2024-01-18'), openPrice: 154.2, closePrice: 153.8, lowPrice: 152.5, highPrice: 155.0, volume: 15800000 },
    { tradeDate: new Date('2024-01-19'), openPrice: 153.8, closePrice: 156.5, lowPrice: 153.5, highPrice: 157.0, volume: 17500000 },
    // 大きな上昇(好材料ニュース想定)
    { tradeDate: new Date('2024-01-22'), openPrice: 156.5, closePrice: 162.0, lowPrice: 156.0, highPrice: 162.5, volume: 25000000 },
    { tradeDate: new Date('2024-01-23'), openPrice: 162.0, closePrice: 161.5, lowPrice: 160.0, highPrice: 163.0, volume: 18500000 },
    { tradeDate: new Date('2024-01-24'), openPrice: 161.5, closePrice: 160.2, lowPrice: 159.5, highPrice: 162.0, volume: 16800000 },
    { tradeDate: new Date('2024-01-25'), openPrice: 160.2, closePrice: 158.5, lowPrice: 157.8, highPrice: 161.0, volume: 15200000 },
    { tradeDate: new Date('2024-01-26'), openPrice: 158.5, closePrice: 159.8, lowPrice: 157.5, highPrice: 160.5, volume: 14900000 },
    // 横ばい期間
    { tradeDate: new Date('2024-01-29'), openPrice: 159.8, closePrice: 160.2, lowPrice: 158.5, highPrice: 161.0, volume: 14300000 },
    { tradeDate: new Date('2024-01-30'), openPrice: 160.2, closePrice: 159.5, lowPrice: 158.0, highPrice: 161.5, volume: 15100000 },
    { tradeDate: new Date('2024-01-31'), openPrice: 159.5, closePrice: 160.8, lowPrice: 159.0, highPrice: 161.5, volume: 14700000 },
    { tradeDate: new Date('2024-02-01'), openPrice: 160.8, closePrice: 161.2, lowPrice: 159.5, highPrice: 162.0, volume: 15400000 },
    { tradeDate: new Date('2024-02-02'), openPrice: 161.2, closePrice: 160.5, lowPrice: 159.0, highPrice: 162.5, volume: 14800000 },
    // 急落(悪材料ニュース想定)
    { tradeDate: new Date('2024-02-05'), openPrice: 160.5, closePrice: 155.0, lowPrice: 154.5, highPrice: 161.0, volume: 28000000 },
    { tradeDate: new Date('2024-02-06'), openPrice: 155.0, closePrice: 153.2, lowPrice: 152.0, highPrice: 156.0, volume: 24500000 },
    { tradeDate: new Date('2024-02-07'), openPrice: 153.2, closePrice: 154.5, lowPrice: 152.5, highPrice: 155.5, volume: 18200000 },
    { tradeDate: new Date('2024-02-08'), openPrice: 154.5, closePrice: 156.0, lowPrice: 153.8, highPrice: 156.8, volume: 16500000 },
    { tradeDate: new Date('2024-02-09'), openPrice: 156.0, closePrice: 157.5, lowPrice: 155.5, highPrice: 158.0, volume: 15800000 },
    // 回復トレンド
    { tradeDate: new Date('2024-02-12'), openPrice: 157.5, closePrice: 159.0, lowPrice: 157.0, highPrice: 159.5, volume: 16200000 },
    { tradeDate: new Date('2024-02-13'), openPrice: 159.0, closePrice: 160.5, lowPrice: 158.5, highPrice: 161.0, volume: 15900000 },
    { tradeDate: new Date('2024-02-14'), openPrice: 160.5, closePrice: 162.0, lowPrice: 160.0, highPrice: 162.5, volume: 16800000 },
    { tradeDate: new Date('2024-02-15'), openPrice: 162.0, closePrice: 163.5, lowPrice: 161.5, highPrice: 164.0, volume: 17500000 },
    { tradeDate: new Date('2024-02-16'), openPrice: 163.5, closePrice: 165.0, lowPrice: 163.0, highPrice: 165.5, volume: 18200000 },
    // 高値圏での推移
    { tradeDate: new Date('2024-02-19'), openPrice: 165.0, closePrice: 164.5, lowPrice: 163.0, highPrice: 166.0, volume: 16500000 },
    { tradeDate: new Date('2024-02-20'), openPrice: 164.5, closePrice: 166.0, lowPrice: 164.0, highPrice: 167.0, volume: 17800000 },
    { tradeDate: new Date('2024-02-21'), openPrice: 166.0, closePrice: 165.2, lowPrice: 164.0, highPrice: 167.5, volume: 16200000 },
    { tradeDate: new Date('2024-02-22'), openPrice: 165.2, closePrice: 167.5, lowPrice: 165.0, highPrice: 168.0, volume: 18500000 },
    { tradeDate: new Date('2024-02-23'), openPrice: 167.5, closePrice: 166.8, lowPrice: 165.5, highPrice: 168.5, volume: 17200000 },
  ];

  await prisma.stockPrice.createMany({
    data: priceData.map(price => ({
      stockId: stock.stockId,
      ...price,
    })),
  });

  console.log(`✅ 株価データ作成: ${priceData.length}件`);

  // ニュースデータ作成（sampleNewsData.tsの内容）
  const newsData = [
    {
      publishedAt: new Date('2024-01-15T09:30:00'),
      title: '新製品発表で市場の期待高まる',
      summary: '当社は革新的な新製品ラインを発表しました。アナリストは今後の売上成長に期待を示しています。',
      sentiment: 'positive' as const,
      source: '日経新聞',
      url: 'https://example.com/news/001',
    },
    {
      publishedAt: new Date('2024-01-22T10:00:00'),
      title: '大手企業との戦略的提携を発表',
      summary: '業界最大手との長期パートナーシップ契約を締結。両社の技術を組み合わせた新サービス開発を進める予定。',
      sentiment: 'positive' as const,
      source: 'Bloomberg',
      url: 'https://example.com/news/002',
    },
    {
      publishedAt: new Date('2024-01-30T14:00:00'),
      title: '四半期業績発表、予想通りの結果',
      summary: '第4四半期の決算を発表。売上高、利益ともに市場予想と概ね一致する結果となりました。',
      sentiment: 'neutral' as const,
      source: 'Reuters',
      url: 'https://example.com/news/003',
    },
    {
      publishedAt: new Date('2024-02-05T11:30:00'),
      title: '主要製品のリコール問題が発覚',
      summary: '主力製品の一部に品質問題が見つかり、約10万個のリコールを実施すると発表。今期業績への影響が懸念される。',
      sentiment: 'negative' as const,
      source: '日経新聞',
      url: 'https://example.com/news/004',
    },
    {
      publishedAt: new Date('2024-02-06T15:00:00'),
      title: '規制当局が調査開始を通知',
      summary: '事業慣行に関して規制当局からの調査開始通知を受領。詳細は現時点では不明。',
      sentiment: 'negative' as const,
      source: 'Wall Street Journal',
      url: 'https://example.com/news/005',
    },
    {
      publishedAt: new Date('2024-02-12T09:00:00'),
      title: 'リコール問題の解決策を発表',
      summary: '品質問題に対する包括的な解決策と再発防止策を発表。市場の懸念が和らぐ見込み。',
      sentiment: 'positive' as const,
      source: 'Bloomberg',
      url: 'https://example.com/news/006',
    },
    {
      publishedAt: new Date('2024-02-19T10:30:00'),
      title: '海外市場での事業拡大を計画',
      summary: 'アジア太平洋地域での事業拡大計画を発表。今後3年間で10拠点を新設予定。',
      sentiment: 'positive' as const,
      source: '日経新聞',
      url: 'https://example.com/news/007',
    },
    {
      publishedAt: new Date('2024-02-21T13:00:00'),
      title: '業界全体の市場動向レポート公開',
      summary: '業界団体が市場動向に関する年次レポートを公開。当社の市場シェアは横ばいとの分析。',
      sentiment: 'neutral' as const,
      source: 'Reuters',
      url: 'https://example.com/news/008',
    },
  ];

  await prisma.news.createMany({
    data: newsData.map(news => ({
      stockId: stock.stockId,
      ...news,
    })),
  });

  console.log(`✅ ニュースデータ作成: ${newsData.length}件`);
  console.log('🎉 シードデータ投入完了!');
}

main()
  .catch((e) => {
    console.error('❌ シードデータ投入エラー:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
