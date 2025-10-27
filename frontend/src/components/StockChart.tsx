import { useEffect, useRef } from 'react';
import * as echarts from 'echarts';
import { CandlestickData } from '../types/stock';

interface StockChartProps {
  data: CandlestickData[];
}

/**
 * ローソク足チャートコンポーネント
 * Apache EChartsを使用して株価のローソク足チャートを表示する
 */
const StockChart: React.FC<StockChartProps> = ({ data }) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstanceRef = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    if (!chartRef.current) return;

    // チャートインスタンスの初期化
    chartInstanceRef.current = echarts.init(chartRef.current);

    // データの整形: ECharts形式に変換
    const dates = data.map(d => d.date);
    const values = data.map(d => [d.open, d.close, d.low, d.high]);

    // チャートオプションの設定
    const option: echarts.EChartsOption = {
      title: {
        text: '株価ローソク足チャート',
        left: 'center',
        textStyle: {
          fontSize: 18,
          fontWeight: 'bold',
        },
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'cross',
        },
        formatter: function (params: any) {
          const param = params[0];
          const data = param.data;
          return `
            <div style="font-weight: bold; margin-bottom: 5px;">${param.name}</div>
            <div>始値: ${data[1]}</div>
            <div>終値: ${data[2]}</div>
            <div>安値: ${data[3]}</div>
            <div>高値: ${data[4]}</div>
          `;
        },
      },
      grid: {
        left: '10%',
        right: '10%',
        bottom: '20%',
        top: '15%',
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
      },
      yAxis: {
        scale: true,
        splitArea: {
          show: true,
        },
      },
      dataZoom: [
        {
          type: 'inside',
          start: 0,
          end: 100,
        },
        {
          show: true,
          type: 'slider',
          top: '90%',
          start: 0,
          end: 100,
        },
      ],
      series: [
        {
          name: '株価',
          type: 'candlestick',
          data: values,
          itemStyle: {
            color: '#26A69A',       // 陽線（上昇）
            color0: '#EF5350',      // 陰線（下落）
            borderColor: '#26A69A',
            borderColor0: '#EF5350',
          },
        },
      ],
    };

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
  }, [data]);

  return (
    <div
      ref={chartRef}
      style={{
        width: '100%',
        height: '600px',
      }}
    />
  );
};

export default StockChart;
