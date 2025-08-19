import React from 'react';
import ReactECharts from 'echarts-for-react';
import { EChartsOption } from 'echarts';
import { baseChartConfig } from './chartConfig';

interface EChartsWrapperProps {
  option: EChartsOption;
  height?: number | string;
  width?: number | string;
  className?: string;
  loading?: boolean;
  onEvents?: Record<string, (params?: any) => void>;
}

const EChartsWrapper: React.FC<EChartsWrapperProps> = ({
  option,
  height = 400,
  width = '100%',
  className = '',
  loading = false,
  onEvents = {}
}) => {
  // 合併基礎配置和傳入的配置
  const mergedOption = {
    ...baseChartConfig,
    ...option
  };

  return (
    <div className={`echarts-container ${className}`}>
      <ReactECharts
        option={mergedOption}
        style={{ height, width }}
        showLoading={loading}
        onEvents={onEvents}
        opts={{ renderer: 'canvas' }}
      />
    </div>
  );
};

export default EChartsWrapper;