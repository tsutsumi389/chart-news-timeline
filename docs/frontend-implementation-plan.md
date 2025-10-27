# フロントエンド実装計画 - チャート実装

## 技術スタック

- **フレームワーク**: React + TypeScript
- **チャートライブラリ**: Apache ECharts
- **ビルドツール**: Vite

---

## ディレクトリ構造

```
chart-news-timeline/
├── docs/
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   └── StockChart.tsx      # ローソク足チャートコンポーネント
│   │   ├── types/
│   │   │   └── stock.ts            # 型定義
│   │   ├── data/
│   │   │   └── sampleData.ts       # サンプルデータ
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
└── README.md
```

---

## データ型定義

```typescript
// types/stock.ts
export interface CandlestickData {
  date: string;           // 日付 (YYYY-MM-DD)
  open: number;           // 始値
  close: number;          // 終値
  low: number;            // 安値
  high: number;           // 高値
}
```

---

## StockChart コンポーネント

**責務**: ローソク足チャートの描画

**機能**:
- Apache EChartsでローソク足チャート描画
- ズーム・パン操作
- 基本的なツールチップ表示

---

## カラースキーム

- **ローソク足**:
  - 陽線（上昇）: #26A69A（緑）
  - 陰線（下落）: #EF5350（赤）

---

## Apache ECharts 設定例

```typescript
import * as echarts from 'echarts';

export const createChartOption = (stockData: CandlestickData[]) => {
  // データ整形
  const dates = stockData.map(d => d.date);
  const values = stockData.map(d => [d.open, d.close, d.low, d.high]);

  return {
    title: {
      text: '株価ローソク足チャート'
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross'
      }
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
        }
      }
    ]
  };
};
```

---

## サンプルデータ

```typescript
// data/sampleData.ts
export const sampleStockData: CandlestickData[] = [
  { date: '2024-01-15', open: 150.5, close: 152.3, low: 149.8, high: 153.0 },
  { date: '2024-01-16', open: 152.3, close: 151.0, low: 150.5, high: 153.5 },
  { date: '2024-01-17', open: 151.0, close: 154.2, low: 150.8, high: 154.5 },
  // ... 他のデータ
];
```

---

## 実装手順

### Step 1: プロジェクトセットアップ
- [ ] Vite + React + TypeScript プロジェクト作成
- [ ] Apache ECharts インストール
- [ ] ディレクトリ構造作成

### Step 2: チャート実装
- [ ] 型定義ファイル作成 (types/stock.ts)
- [ ] サンプルデータ作成 (data/sampleData.ts)
- [ ] StockChartコンポーネント作成
- [ ] ローソク足チャート表示
- [ ] ズーム・パン機能確認

### Step 3: 動作確認
- [ ] サンプルデータでの表示確認
- [ ] インタラクション（ズーム、パン）確認

---

## 参考リンク

- [Apache ECharts 公式ドキュメント](https://echarts.apache.org/en/index.html)
- [Apache ECharts Candlestick Example](https://echarts.apache.org/examples/en/editor.html?c=candlestick-brush)
- [Vite 公式ドキュメント](https://vitejs.dev/)

---

**作成日**: 2025-10-27
**最終更新**: 2025-10-27
