import { CandlestickData, NewsItem } from '../types/stock';
import { sentimentConfig } from '../data/sentimentConfig';

/**
 * 株価データから各日付の最高値を取得するマップを作成
 */
const createPriceMap = (stockData: CandlestickData[]) => {
  const priceMap: { [date: string]: number } = {};
  stockData.forEach(data => {
    priceMap[data.date] = data.high;
  });
  return priceMap;
};

/**
 * ニュースデータをEChartsのscatterシリーズ形式に変換
 * 吹き出し表示用
 */
const createNewsScatterData = (newsData: NewsItem[], priceMap: { [date: string]: number }) => {
  return newsData.map(news => {
    // その日の最高値を取得（なければ0）
    const price = priceMap[news.date] || 0;

    return {
      value: [news.date, price],
      // カスタムデータを保存（ツールチップで使用）
      newsData: news,
      itemStyle: {
        color: sentimentConfig[news.sentiment].color,
        borderColor: '#fff',
        borderWidth: 2
      },
      label: {
        show: true,
        position: 'top',
        distance: 10,
        formatter: () => news.title.substring(0, 15) + (news.title.length > 15 ? '...' : ''),
        backgroundColor: sentimentConfig[news.sentiment].color,
        color: '#fff',
        padding: [6, 10],
        borderRadius: 6,
        fontSize: 11,
        fontWeight: 'bold',
        shadowColor: 'rgba(0, 0, 0, 0.2)',
        shadowBlur: 4,
        shadowOffsetY: 2
      },
      emphasis: {
        label: {
          show: true,
          fontSize: 12
        },
        itemStyle: {
          borderWidth: 3,
          shadowColor: 'rgba(0, 0, 0, 0.3)',
          shadowBlur: 8
        }
      }
    };
  });
};

/**
 * ツールチップのカスタムフォーマッター
 */
const createTooltipFormatter = () => {
  return (params: any) => {
    // 配列の場合は最初の要素を取得
    const param = Array.isArray(params) ? params[0] : params;

    // ニュースのscatterシリーズの場合
    if (param.seriesName === 'ニュース' && param.data?.newsData) {
      const newsData: NewsItem = param.data.newsData;
      const sentimentLabel = sentimentConfig[newsData.sentiment].label;

      return `
        <div style="padding: 12px; max-width: 350px; background: #fff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.15);">
          <div style="font-weight: bold; margin-bottom: 8px; font-size: 15px; color: #333;">
            ${newsData.title}
          </div>
          <div style="color: #666; font-size: 12px; margin-bottom: 10px;">
            📅 ${newsData.date} ${newsData.time || ''}
          </div>
          ${newsData.summary ? `
            <div style="margin-bottom: 10px; line-height: 1.5; color: #555; font-size: 13px;">
              ${newsData.summary}
            </div>
          ` : ''}
          <div style="margin-top: 10px; display: flex; align-items: center; justify-content: space-between;">
            <span style="display: inline-block; padding: 4px 12px; background: ${sentimentConfig[newsData.sentiment].color}; color: white; border-radius: 5px; font-size: 11px; font-weight: bold;">
              ${sentimentLabel}
            </span>
            ${newsData.source ? `
              <span style="color: #999; font-size: 11px;">
                📰 ${newsData.source}
              </span>
            ` : ''}
          </div>
        </div>
      `;
    }

    // 通常のローソク足の場合
    if (param.seriesName === '株価' && Array.isArray(param.data)) {
      return `
        <div style="padding: 10px; background: #fff; border-radius: 6px;">
          <div style="font-weight: bold; margin-bottom: 6px; color: #333;">
            📊 ${param.axisValue}
          </div>
          <div style="font-size: 12px; color: #555; line-height: 1.6;">
            始値: <strong>${param.data[0]}</strong><br/>
            終値: <strong>${param.data[1]}</strong><br/>
            安値: <strong>${param.data[2]}</strong><br/>
            高値: <strong>${param.data[3]}</strong>
          </div>
        </div>
      `;
    }

    return '';
  };
};

/**
 * チャートオプション作成（ニュース統合版）
 * 吹き出し形式でニュースを表示
 */
export const createChartOptionWithNews = (
  stockData: CandlestickData[],
  newsData: NewsItem[]
) => {
  const dates = stockData.map(d => d.date);
  const values = stockData.map(d => [d.open, d.close, d.low, d.high]);

  // 価格マップを作成
  const priceMap = createPriceMap(stockData);

  // ニュースデータをscatter形式に変換
  const newsScatterData = createNewsScatterData(newsData, priceMap);

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
      trigger: 'item',
      axisPointer: {
        type: 'cross'
      },
      formatter: createTooltipFormatter()
    },
    legend: {
      data: ['株価', 'ニュース'],
      bottom: 10,
      selected: {
        '株価': true,
        'ニュース': true
      }
    },
    grid: {
      left: '10%',
      right: '10%',
      bottom: '15%',
      top: '20%'  // 上部の吹き出しが表示されるよう余裕を持たせる
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
        z: 1  // ローソク足を下のレイヤーに
      },
      {
        name: 'ニュース',
        type: 'scatter',
        data: newsScatterData,
        symbolSize: 12,  // 吹き出しの基点となる円のサイズ
        z: 2,  // ニュースを上のレイヤーに
        animation: true,
        animationDelay: (idx: number) => idx * 50  // 順番にアニメーション
      }
    ]
  };
};
