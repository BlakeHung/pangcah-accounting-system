import React from 'react';
import EChartsWrapper from './EChartsWrapper';
import { defaultGrid, defaultTooltip, defaultToolbox } from './chartConfig';

interface ExpenseDataPoint {
  date: string;
  amount: number;
}

interface ExpenseTrendChartProps {
  data: ExpenseDataPoint[];
  title?: string;
  height?: number;
  loading?: boolean;
}

const ExpenseTrendChart: React.FC<ExpenseTrendChartProps> = ({
  data,
  title = '支出趨勢分析',
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
      ...defaultTooltip,
      formatter: (params: any) => {
        const data = params[0];
        return `
          <div style="padding: 8px;">
            <div style="margin-bottom: 4px; font-weight: bold;">${data.axisValue}</div>
            <div style="display: flex; align-items: center;">
              <span style="display: inline-block; width: 10px; height: 10px; border-radius: 50%; background-color: ${data.color}; margin-right: 8px;"></span>
              支出金額: NT$ ${data.value.toLocaleString()}
            </div>
          </div>
        `;
      }
    },
    toolbox: defaultToolbox,
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
          type: 'dashed'
        }
      }
    },
    series: [
      {
        name: '支出',
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        data: data.map(d => d.amount),
        lineStyle: {
          width: 3,
          color: '#4F46E5'
        },
        itemStyle: {
          color: '#4F46E5',
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
                color: 'rgba(79, 70, 229, 0.3)'
              },
              {
                offset: 1,
                color: 'rgba(79, 70, 229, 0.05)'
              }
            ]
          }
        },
        markPoint: {
          data: [
            { 
              type: 'max', 
              name: '最大值',
              itemStyle: {
                color: '#EF4444'
              }
            },
            { 
              type: 'min', 
              name: '最小值',
              itemStyle: {
                color: '#10B981'
              }
            }
          ],
          symbolSize: 60,
          label: {
            fontSize: 10
          }
        },
        markLine: {
          data: [
            { 
              type: 'average', 
              name: '平均值',
              lineStyle: {
                color: '#F59E0B',
                type: 'dashed' as const,
                width: 2
              },
              label: {
                color: '#F59E0B',
                fontSize: 11
              }
            }
          ]
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

export default ExpenseTrendChart;