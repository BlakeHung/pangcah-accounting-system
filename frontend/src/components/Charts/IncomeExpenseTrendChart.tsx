import React from 'react';
import EChartsWrapper from './EChartsWrapper';
import { defaultGrid, defaultTooltip, defaultToolbox } from './chartConfig';

interface TrendDataPoint {
  date: string;
  income: number;
  expense: number;
}

interface IncomeExpenseTrendChartProps {
  data: TrendDataPoint[];
  title?: string;
  height?: number;
  loading?: boolean;
}

const IncomeExpenseTrendChart: React.FC<IncomeExpenseTrendChartProps> = ({
  data,
  title = '收支趨勢分析',
  height = 400,
  loading = false
}) => {
  const option: any = {
    title: {
      text: title,
      left: 'center',
      textStyle: {
        fontSize: 16,
        fontWeight: 'bolder' as const,
        color: '#374151'
      }
    },
    grid: defaultGrid,
    tooltip: {
      trigger: 'axis' as const,
      backgroundColor: 'rgba(50, 50, 50, 0.9)',
      borderColor: '#333',
      borderWidth: 1,
      textStyle: {
        color: '#fff',
        fontSize: 12
      },
      axisPointer: {
        type: 'cross' as const
      },
      formatter: (params: any) => {
        const date = params[0].axisValue;
        let result = `<div style="padding: 8px;"><div style="margin-bottom: 8px; font-weight: bold;">${date}</div>`;
        
        params.forEach((param: any) => {
          result += `
            <div style="display: flex; align-items: center; margin-bottom: 4px;">
              <span style="display: inline-block; width: 10px; height: 10px; border-radius: 50%; background-color: ${param.color}; margin-right: 8px;"></span>
              ${param.seriesName}: NT$ ${param.value.toLocaleString()}
            </div>
          `;
        });
        
        result += '</div>';
        return result;
      }
    },
    toolbox: defaultToolbox,
    legend: {
      data: ['收入 (部落進項)', '支出 (部落開銷)'],
      top: 30,
      left: 'center',
      textStyle: {
        fontSize: 12,
        color: '#374151'
      }
    },
    xAxis: {
      type: 'category' as const,
      data: data.map(d => d.date),
      axisLine: {
        lineStyle: {
          color: '#E5E7EB'
        }
      },
      axisLabel: {
        color: '#6B7280',
        fontSize: 11
      }
    },
    yAxis: {
      type: 'value' as const,
      name: '金額 (NT$)',
      nameTextStyle: {
        color: '#6B7280',
        fontSize: 11
      },
      axisLabel: {
        formatter: 'NT$ {value}',
        color: '#6B7280',
        fontSize: 11
      },
      axisLine: {
        show: false
      },
      axisTick: {
        show: false
      },
      splitLine: {
        lineStyle: {
          color: '#F3F4F6',
          type: 'dashed' as const
        }
      }
    },
    series: [
      {
        name: '收入 (部落進項)',
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        data: data.map(d => d.income),
        lineStyle: {
          width: 3,
          color: '#4CAF50' // papa-emerald 綠色
        },
        itemStyle: {
          color: '#4CAF50',
          borderColor: '#fff',
          borderWidth: 2
        },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              {
                offset: 0,
                color: 'rgba(76, 175, 80, 0.3)'
              },
              {
                offset: 1,
                color: 'rgba(76, 175, 80, 0.05)'
              }
            ]
          }
        }
      },
      {
        name: '支出 (部落開銷)',
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        data: data.map(d => d.expense),
        lineStyle: {
          width: 3,
          color: '#FF7043' // papa-tide 橙色
        },
        itemStyle: {
          color: '#FF7043',
          borderColor: '#fff',
          borderWidth: 2
        },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              {
                offset: 0,
                color: 'rgba(255, 112, 67, 0.3)'
              },
              {
                offset: 1,
                color: 'rgba(255, 112, 67, 0.05)'
              }
            ]
          }
        }
      }
    ]
  };

  const handleEvents = {
    click: (params: any) => {
      console.log('點擊數據點:', params);
      // 這裡可以添加點擊事件處理，例如跳轉到詳細頁面
    }
  };

  return (
    <EChartsWrapper
      option={option}
      height={height}
      loading={loading}
      onEvents={handleEvents}
    />
  );
};

export default IncomeExpenseTrendChart;