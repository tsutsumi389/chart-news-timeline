# ニュース表示機能 実装計画

## 概要

このドキュメントでは、ローソク足チャートにニュース情報を統合して表示する機能の実装計画を定義します。ニュースはチャート上にマーカーとして表示され、ホバー時にツールチップでニュース詳細を表示します。

---

## 目標

1. ローソク足チャート上にニュースマーカーを表示
2. ニュースマーカーにホバーするとツールチップでニュース詳細を表示
3. センチメント分析に基づいてマーカーを色分け（ポジティブ/ネガティブ/中立）
4. サンプルニュースデータを使用してフロントエンドで動作検証

---

## データ型定義

### NewsItem型

```typescript
// types/stock.ts に追加

/**
 * ニュース項目の型定義
 */
export interface NewsItem {
  id: string;                    // ニュースID
  date: string;                  // 日付 (YYYY-MM-DD)
  time?: string;                 // 時刻 (HH:mm:ss) ※オプション
  title: string;                 // ニュースタイトル
  summary?: string;              // 要約 ※オプション
  url?: string;                  // ニュース元URL ※オプション
  sentiment: 'positive' | 'negative' | 'neutral';  // センチメント
  source?: string;               // ニュースソース名 ※オプション
}

/**
 * センチメント情報の型定義
 */
export interface SentimentConfig {
  positive: {
    color: string;
    label: string;
  };
  negative: {
    color: string;
    label: string;
  };
  neutral: {
    color: string;
    label: string;
  };
}
```

---

## センチメント別カラースキーム

```typescript
// data/sentimentConfig.ts

export const sentimentConfig: SentimentConfig = {
  positive: {
    color: '#4CAF50',        // 緑（ポジティブ）
    label: 'ポジティブ'
  },
  negative: {
    color: '#F44336',        // 赤（ネガティブ）
    label: 'ネガティブ'
  },
  neutral: {
    color: '#9E9E9E',        // グレー（中立）
    label: '中立'
  }
};
```

---

## サンプルニュースデータ

```typescript
// data/sampleNewsData.ts

import { NewsItem } from '../types/stock';

export const sampleNewsData: NewsItem[] = [
  {
    id: 'news-001',
    date: '2024-01-15',
    time: '09:30:00',
    title: '新製品発表で株価上昇',
    summary: '当社は革新的な新製品を発表しました。市場からの評価は非常に高く、投資家の期待が高まっています。',
    sentiment: 'positive',
    source: '日経新聞',
    url: 'https://example.com/news/001'
  },
  {
    id: 'news-002',
    date: '2024-01-16',
    time: '14:00:00',
    title: '四半期決算が予想を下回る',
    summary: '第3四半期の決算発表があり、売上高が市場予想を下回りました。',
    sentiment: 'negative',
    source: 'Bloomberg',
    url: 'https://example.com/news/002'
  },
  {
    id: 'news-003',
    date: '2024-01-17',
    time: '10:15:00',
    title: '業界動向レポート発表',
    summary: '業界全体の動向に関するレポートが発表されました。',
    sentiment: 'neutral',
    source: 'Reuters',
    url: 'https://example.com/news/003'
  },
  {
    id: 'news-004',
    date: '2024-01-18',
    time: '11:00:00',
    title: '新規パートナーシップ締結',
    summary: '大手企業との戦略的パートナーシップが発表され、今後の成長が期待されています。',
    sentiment: 'positive',
    source: '日経新聞',
    url: 'https://example.com/news/004'
  },
  {
    id: 'news-005',
    date: '2024-01-19',
    time: '15:30:00',
    title: '規制当局による調査開始',
    summary: '規制当局が当社の事業慣行について調査を開始したと発表されました。',
    sentiment: 'negative',
    source: 'Wall Street Journal',
    url: 'https://example.com/news/005'
  }
];
```

---

## ECharts設定：ニュースマーカー追加

### markPoint を使用したニュース表示

```typescript
// components/StockChart.tsx の設定例

import { NewsItem } from '../types/stock';
import { sentimentConfig } from '../data/sentimentConfig';

/**
 * ニュースデータをEChartsのmarkPoint形式に変換
 */
const createNewsMarkPoints = (newsData: NewsItem[]) => {
  return newsData.map(news => ({
    name: news.title,
    coord: [news.date, 'max'],  // X軸は日付、Y軸は'max'で上部に配置
    value: news.title,
    itemStyle: {
      color: sentimentConfig[news.sentiment].color
    },
    // カスタムデータを保存（ツールチップで使用）
    newsData: news
  }));
};

/**
 * チャートオプション作成（ニュース統合版）
 */
export const createChartOptionWithNews = (
  stockData: CandlestickData[],
  newsData: NewsItem[]
) => {
  const dates = stockData.map(d => d.date);
  const values = stockData.map(d => [d.open, d.close, d.low, d.high]);
  const newsMarkPoints = createNewsMarkPoints(newsData);

  return {
    title: {
      text: '株価ローソク足チャート with ニュース'
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross'
      },
      // カスタムツールチップフォーマット
      formatter: (params: any) => {
        // markPointの場合はニュース情報を表示
        if (params.componentSubType === 'markPoint') {
          const newsData = params.data.newsData;
          const sentimentLabel = sentimentConfig[newsData.sentiment].label;

          return `
            <div style="padding: 10px;">
              <div style="font-weight: bold; margin-bottom: 5px;">
                ${newsData.title}
              </div>
              <div style="color: #666; font-size: 12px; margin-bottom: 5px;">
                ${newsData.date} ${newsData.time || ''}
              </div>
              ${newsData.summary ? `
                <div style="margin-bottom: 5px;">
                  ${newsData.summary}
                </div>
              ` : ''}
              <div style="margin-top: 5px;">
                <span style="display: inline-block; padding: 2px 8px; background: ${sentimentConfig[newsData.sentiment].color}; color: white; border-radius: 3px; font-size: 11px;">
                  ${sentimentLabel}
                </span>
                ${newsData.source ? `
                  <span style="color: #999; font-size: 11px; margin-left: 8px;">
                    ${newsData.source}
                  </span>
                ` : ''}
              </div>
            </div>
          `;
        }

        // 通常のローソク足の場合
        return `
          日付: ${params[0].axisValue}<br/>
          始値: ${params[0].data[0]}<br/>
          終値: ${params[0].data[1]}<br/>
          安値: ${params[0].data[2]}<br/>
          高値: ${params[0].data[3]}
        `;
      }
    },
    legend: {
      data: ['株価', 'ニュース'],
      bottom: 10
    },
    grid: {
      left: '10%',
      right: '10%',
      bottom: '20%'
    },
    xAxis: {
      type: 'category',
      data: dates,
      scale: true,
      boundaryGap: false,
      axisLine: { onZero: false },
      splitLine: { show: false },
      min: 'dataMin',
      max: 'dataMax'
    },
    yAxis: {
      scale: true,
      splitArea: {
        show: true
      }
    },
    dataZoom: [
      {
        type: 'inside',
        start: 0,
        end: 100
      },
      {
        show: true,
        type: 'slider',
        top: '90%',
        start: 0,
        end: 100
      }
    ],
    series: [
      {
        name: '株価',
        type: 'candlestick',
        data: values,
        itemStyle: {
          color: '#26A69A',      // 陽線
          color0: '#EF5350',     // 陰線
          borderColor: '#26A69A',
          borderColor0: '#EF5350'
        },
        // ニュースマーカーを追加
        markPoint: {
          symbol: 'pin',         // マーカーのシンボル（ピン型）
          symbolSize: 40,        // マーカーサイズ
          data: newsMarkPoints,
          label: {
            show: false          // マーカー上のラベルは非表示
          },
          emphasis: {
            label: {
              show: false
            }
          }
        }
      }
    ]
  };
};
```

---

## コンポーネント設計

### StockChart コンポーネント（更新版）

```typescript
// components/StockChart.tsx

import React, { useEffect, useRef } from 'react';
import * as echarts from 'echarts';
import { CandlestickData, NewsItem } from '../types/stock';
import { createChartOptionWithNews } from '../utils/chartOptions';

interface StockChartProps {
  stockData: CandlestickData[];
  newsData: NewsItem[];
  height?: string;
}

/**
 * ローソク足チャート with ニュース表示コンポーネント
 */
export const StockChart: React.FC<StockChartProps> = ({
  stockData,
  newsData,
  height = '600px'
}) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstanceRef = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    if (!chartRef.current) return;

    // チャートインスタンス初期化
    chartInstanceRef.current = echarts.init(chartRef.current);

    // チャートオプション設定
    const option = createChartOptionWithNews(stockData, newsData);
    chartInstanceRef.current.setOption(option);

    // リサイズ対応
    const handleResize = () => {
      chartInstanceRef.current?.resize();
    };
    window.addEventListener('resize', handleResize);

    // クリーンアップ
    return () => {
      window.removeEventListener('resize', handleResize);
      chartInstanceRef.current?.dispose();
    };
  }, [stockData, newsData]);

  return <div ref={chartRef} style={{ width: '100%', height }} />;
};
```

### App.tsx（統合例）

```typescript
// App.tsx

import React from 'react';
import { StockChart } from './components/StockChart';
import { sampleStockData } from './data/sampleData';
import { sampleNewsData } from './data/sampleNewsData';
import './App.css';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>Chart News Timeline</h1>
        <p>株価チャートとニュースの統合表示</p>
      </header>

      <main style={{ padding: '20px' }}>
        <StockChart
          stockData={sampleStockData}
          newsData={sampleNewsData}
          height="700px"
        />
      </main>
    </div>
  );
}

export default App;
```

---

## ディレクトリ構造（更新版）

```
frontend/
├── src/
│   ├── components/
│   │   └── StockChart.tsx          # チャートコンポーネント（ニュース対応）
│   ├── types/
│   │   └── stock.ts                # 型定義（NewsItem追加）
│   ├── data/
│   │   ├── sampleData.ts           # 株価サンプルデータ
│   │   ├── sampleNewsData.ts       # ニュースサンプルデータ（新規）
│   │   └── sentimentConfig.ts      # センチメント設定（新規）
│   ├── utils/
│   │   └── chartOptions.ts         # チャート設定ユーティリティ（新規）
│   ├── App.tsx
│   ├── App.css
│   └── main.tsx
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## 実装手順

### Step 1: 型定義の拡張
- [x] `types/stock.ts` に `NewsItem` 型を追加
- [x] `types/stock.ts` に `SentimentConfig` 型を追加

### Step 2: データとユーティリティの作成
- [x] `data/sentimentConfig.ts` 作成（センチメント設定）
- [x] `data/sampleNewsData.ts` 作成（サンプルニュースデータ）
- [x] `utils/chartOptions.ts` 作成（チャート設定ロジック）

### Step 3: チャートコンポーネントの更新
- [ ] `StockChart.tsx` を更新してニュースデータを受け取る
- [ ] markPoint を使用してニュースマーカーを表示
- [ ] カスタムツールチップでニュース詳細を表示
- [ ] センチメント別の色分け実装

### Step 4: App.tsx の更新
- [ ] サンプルニュースデータをインポート
- [ ] StockChart コンポーネントにニュースデータを渡す

### Step 5: 動作確認
- [ ] チャート上にニュースマーカーが表示されることを確認
- [ ] マーカーにホバーするとツールチップが表示されることを確認
- [ ] センチメント別に色分けされていることを確認
- [ ] ズーム・パン操作時もマーカーが正しく動作することを確認

### Step 6: UIの改善（オプション）
- [ ] ニュースフィルター機能（センチメント別表示/非表示）
- [ ] ニュースマーカーのアイコンカスタマイズ
- [ ] ニュース一覧パネルの追加
- [ ] マーカークリックでニュース詳細モーダル表示

---

## 技術的な注意点

### 1. ECharts markPoint の配置

```typescript
// Y軸の位置指定オプション
coord: [news.date, 'max']     // チャートの上部に配置
coord: [news.date, 'min']     // チャートの下部に配置
coord: [news.date, stockPrice] // 特定の株価位置に配置
```

### 2. ツールチップのカスタマイズ

- `tooltip.formatter` を使用してHTML形式でカスタマイズ
- `params.componentSubType` で markPoint かどうかを判定
- センチメントに応じた色付けバッジを表示

### 3. パフォーマンス考慮

- ニュースデータが大量の場合は、表示範囲内のニュースのみを markPoint に設定
- dataZoom の変更イベントをリッスンして動的にマーカーを更新

### 4. 日付のマッピング

- ニュースの日付と株価データの日付を正確にマッピング
- 取引時間外のニュースは最も近い取引日に表示

---

## 将来の拡張案

### Phase 2: バックエンド統合後
- データベースからニュースデータを取得
- リアルタイムニュース更新機能
- ニュース検索・フィルタリング機能

### Phase 3: 高度な機能
- センチメント分析の自動化（AI/ML統合）
- ニュースと株価の相関分析
- アラート機能（重要ニュース通知）
- 複数銘柄の比較表示

---

## 参考リンク

- [ECharts markPoint Documentation](https://echarts.apache.org/en/option.html#series-candlestick.markPoint)
- [ECharts Tooltip Formatter](https://echarts.apache.org/en/option.html#tooltip.formatter)
- [ECharts Candlestick with markPoint Example](https://echarts.apache.org/examples/en/editor.html?c=candlestick-sh)

---

**作成日**: 2025-10-29
**最終更新**: 2025-10-29
**ステータス**: 設計完了・実装待ち
