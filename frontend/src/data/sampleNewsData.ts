import { NewsItem } from '../types/stock';

/**
 * サンプルニュースデータ
 * 株価変動に影響を与えるニュースイベントを想定
 */
export const sampleNewsData: NewsItem[] = [
  {
    id: 'news-001',
    date: '2024-01-15',
    time: '09:30:00',
    title: '新製品発表で市場の期待高まる',
    summary: '当社は革新的な新製品ラインを発表しました。アナリストは今後の売上成長に期待を示しています。',
    sentiment: 'positive',
    source: '日経新聞',
    url: 'https://example.com/news/001'
  },
  {
    id: 'news-002',
    date: '2024-01-22',
    time: '10:00:00',
    title: '大手企業との戦略的提携を発表',
    summary: '業界最大手との長期パートナーシップ契約を締結。両社の技術を組み合わせた新サービス開発を進める予定。',
    sentiment: 'positive',
    source: 'Bloomberg',
    url: 'https://example.com/news/002'
  },
  {
    id: 'news-003',
    date: '2024-01-30',
    time: '14:00:00',
    title: '四半期業績発表、予想通りの結果',
    summary: '第4四半期の決算を発表。売上高、利益ともに市場予想と概ね一致する結果となりました。',
    sentiment: 'neutral',
    source: 'Reuters',
    url: 'https://example.com/news/003'
  },
  {
    id: 'news-004',
    date: '2024-02-05',
    time: '11:30:00',
    title: '主要製品のリコール問題が発覚',
    summary: '主力製品の一部に品質問題が見つかり、約10万個のリコールを実施すると発表。今期業績への影響が懸念される。',
    sentiment: 'negative',
    source: '日経新聞',
    url: 'https://example.com/news/004'
  },
  {
    id: 'news-005',
    date: '2024-02-06',
    time: '15:00:00',
    title: '規制当局が調査開始を通知',
    summary: '事業慣行に関して規制当局からの調査開始通知を受領。詳細は現時点では不明。',
    sentiment: 'negative',
    source: 'Wall Street Journal',
    url: 'https://example.com/news/005'
  },
  {
    id: 'news-006',
    date: '2024-02-12',
    time: '09:00:00',
    title: 'リコール問題の解決策を発表',
    summary: '品質問題に対する包括的な解決策と再発防止策を発表。市場の懸念が和らぐ見込み。',
    sentiment: 'positive',
    source: 'Bloomberg',
    url: 'https://example.com/news/006'
  },
  {
    id: 'news-007',
    date: '2024-02-19',
    time: '10:30:00',
    title: '海外市場での事業拡大を計画',
    summary: 'アジア太平洋地域での事業拡大計画を発表。今後3年間で10拠点を新設予定。',
    sentiment: 'positive',
    source: '日経新聞',
    url: 'https://example.com/news/007'
  },
  {
    id: 'news-008',
    date: '2024-02-21',
    time: '13:00:00',
    title: '業界全体の市場動向レポート公開',
    summary: '業界団体が市場動向に関する年次レポートを公開。当社の市場シェアは横ばいとの分析。',
    sentiment: 'neutral',
    source: 'Reuters',
    url: 'https://example.com/news/008'
  }
];
