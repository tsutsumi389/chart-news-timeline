import { CandlestickData, NewsItem } from '../types/stock';
import { sentimentConfig } from '../data/sentimentConfig';

/**
 * ニュースデータをEChartsのmarkPoint形式に変換
 */
const createNewsMarkPoints = (newsData: NewsItem[]) => {
  return newsData.map(news => ({
    name: news.title,
    coord: [news.date, 'max'] as [string, 'max'],  // X軸は日付、Y軸は'max'で上部に配置
    value: news.title,
    itemStyle: {
      color: sentimentConfig[news.sentiment].color
    },
    // カスタムデータを保存（ツールチップで使用）
    newsData: news
  }));
};

/**
 * ツールチップのカスタムフォーマッター
 */
const createTooltipFormatter = () => {
  return (params: any) => {
    // markPointの場合はニュース情報を表示
    if (params.componentSubType === 'markPoint') {
      const newsData: NewsItem = params.data.newsData;
      const sentimentLabel = sentimentConfig[newsData.sentiment].label;

      return `
        <div style="padding: 10px; max-width: 300px;">
          <div style="font-weight: bold; margin-bottom: 5px; font-size: 14px;">
            ${newsData.title}
          </div>
          <div style="color: #666; font-size: 12px; margin-bottom: 8px;">
            ${newsData.date} ${newsData.time || ''}
          </div>
          ${newsData.summary ? `
            <div style="margin-bottom: 8px; line-height: 1.4;">
              ${newsData.summary}
            </div>
          ` : ''}
          <div style="margin-top: 8px; display: flex; align-items: center; justify-content: space-between;">
            <span style="display: inline-block; padding: 3px 10px; background: ${sentimentConfig[newsData.sentiment].color}; color: white; border-radius: 4px; font-size: 11px; font-weight: bold;">
              ${sentimentLabel}
            </span>
            ${newsData.source ? `
              <span style="color: #999; font-size: 11px;">
                ${newsData.source}
              </span>
            ` : ''}
          </div>
        </div>
      `;
    }

    // 通常のローソク足の場合
    if (Array.isArray(params)) {
      const param = params[0];
      if (param && param.data) {
        return `
          <div style="padding: 8px;">
            <div style="font-weight: bold; margin-bottom: 5px;">
              ${param.axisValue}
            </div>
            <div style="font-size: 12px;">
              始値: ${param.data[0]}<br/>
              終値: ${param.data[1]}<br/>
              安値: ${param.data[2]}<br/>
              高値: ${param.data[3]}
            </div>
          </div>
        `;
      }
    }

    return '';
  };
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
      text: '株価ローソク足チャート with ニュース',
      left: 'center',
      top: 10,
      textStyle: {
        fontSize: 18,
        fontWeight: 'bold'
      }
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross'
      },
      formatter: createTooltipFormatter()
    },
    legend: {
      data: ['株価'],
      bottom: 10
    },
    grid: {
      left: '10%',
      right: '10%',
      bottom: '15%',
      top: '15%'
    },
    xAxis: {
      type: 'category',
      data: dates,
      scale: true,
      boundaryGap: false,
      axisLine: { onZero: false },
      splitLine: { show: false },
      min: 'dataMin',
      max: 'dataMax',
      axisLabel: {
        formatter: (value: string) => {
          // 日付を見やすく表示（月/日）
          const date = new Date(value);
          return `${date.getMonth() + 1}/${date.getDate()}`;
        }
      }
    },
    yAxis: {
      scale: true,
      splitArea: {
        show: true
      },
      axisLabel: {
        formatter: '{value}'
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
        bottom: '5%',
        start: 0,
        end: 100,
        height: 30
      }
    ],
    series: [
      {
        name: '株価',
        type: 'candlestick',
        data: values,
        itemStyle: {
          color: '#26A69A',      // 陽線（上昇）
          color0: '#EF5350',     // 陰線（下落）
          borderColor: '#26A69A',
          borderColor0: '#EF5350'
        },
        // ニュースマーカーを追加
        markPoint: {
          symbol: 'pin',         // マーカーのシンボル（ピン型）
          symbolSize: 50,        // マーカーサイズ
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
