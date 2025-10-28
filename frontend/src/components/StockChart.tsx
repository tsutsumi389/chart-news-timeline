import { useEffect, useRef } from 'react';
import * as echarts from 'echarts';
import { CandlestickData, NewsItem } from '../types/stock';
import { createChartOptionWithNews } from '../utils/chartOptions';

interface StockChartProps {
  stockData: CandlestickData[];
  newsData?: NewsItem[];
  height?: string;
}

/**
 * ローソク足チャート with ニュース表示コンポーネント
 * Apache EChartsを使用して株価のローソク足チャートとニュースマーカーを表示する
 */
const StockChart: React.FC<StockChartProps> = ({
  stockData,
  newsData = [],
  height = '600px'
}) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstanceRef = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    if (!chartRef.current) return;

    // チャートインスタンスの初期化
    chartInstanceRef.current = echarts.init(chartRef.current);

    // チャートオプションの設定（ニュース統合版）
    const option = createChartOptionWithNews(stockData, newsData);

    // チャートの描画
    chartInstanceRef.current.setOption(option);

    // ウィンドウリサイズ時のチャートリサイズ処理
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

  return (
    <div
      ref={chartRef}
      style={{
        width: '100%',
        height: height,
      }}
    />
  );
};

export default StockChart;
