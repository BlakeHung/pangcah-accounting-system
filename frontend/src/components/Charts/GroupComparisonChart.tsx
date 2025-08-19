import React from 'react';
import EChartsWrapper from './EChartsWrapper';
import { defaultGrid, defaultTooltip, defaultLegend } from './chartConfig';

interface GroupExpenseData {
  groupName: string;
  totalExpense: number;
  memberCount: number;
  avgExpense: number;
}

interface GroupComparisonChartProps {
  data: GroupExpenseData[];
  title?: string;
  height?: number;
  loading?: boolean;
  metric?: 'total' | 'average';
}

const GroupComparisonChart: React.FC<GroupComparisonChartProps> = ({
  data,
  title = '群組支出對比',
  height = 400,
  loading = false,
  metric = 'total'
}) => {
  const sortedData = [...data].sort((a, b) => {
    const aValue = metric === 'total' ? a.totalExpense : a.avgExpense;
    const bValue = metric === 'total' ? b.totalExpense : b.avgExpense;
    return bValue - aValue;
  });

  const option: any = {
    title: {
      text: title,
      subtext: metric === 'total' ? '各群組總支出比較' : '各群組平均支出比較',
      left: 'center',
      textStyle: {
        fontSize: 16,
        fontWeight: 'bolder' as const,
        color: '#374151'
      },
      subtextStyle: {
        fontSize: 12,
        color: '#6B7280'
      }
    },
    grid: {
      ...defaultGrid,
      left: '5%',
      right: '5%',
      bottom: '15%'
    },
    tooltip: {
      ...defaultTooltip,
      trigger: 'axis' as const,
      axisPointer: {
        type: 'shadow' as const
      },
      formatter: (params: any) => {
        const data = params[0];
        const groupData = sortedData[data.dataIndex];
        return `
          <div style="padding: 8px;">
            <div style="margin-bottom: 8px; font-weight: bold; font-size: 14px;">${groupData.groupName}</div>
            <div style="margin-bottom: 4px;">
              <span style="color: #6B7280;">總支出:</span>
              <span style="margin-left: 8px; font-weight: bold;">NT$ ${groupData.totalExpense.toLocaleString()}</span>
            </div>
            <div style="margin-bottom: 4px;">
              <span style="color: #6B7280;">成員數:</span>
              <span style="margin-left: 8px;">${groupData.memberCount} 人</span>
            </div>
            <div>
              <span style="color: #6B7280;">平均支出:</span>
              <span style="margin-left: 8px;">NT$ ${groupData.avgExpense.toLocaleString()}</span>
            </div>
          </div>
        `;
      }
    },
    xAxis: {
      type: 'category' as const,
      data: sortedData.map(item => item.groupName),
      axisLabel: {
        color: '#6B7280',
        fontSize: 11,
        rotate: sortedData.length > 6 ? 45 : 0,
        interval: 0
      },
      axisLine: {
        lineStyle: {
          color: '#E5E7EB'
        }
      },
      axisTick: {
        alignWithLabel: true
      }
    },
    yAxis: {
      type: 'value' as const,
      name: metric === 'total' ? '總支出 (NT$)' : '平均支出 (NT$)',
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
        name: metric === 'total' ? '總支出' : '平均支出',
        type: 'bar',
        data: sortedData.map((item, index) => ({
          value: metric === 'total' ? item.totalExpense : item.avgExpense,
          itemStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                {
                  offset: 0,
                  color: index === 0 ? '#4F46E5' : index === 1 ? '#10B981' : '#F59E0B'
                },
                {
                  offset: 1,
                  color: index === 0 ? '#6366F1' : index === 1 ? '#34D399' : '#FBBF24'
                }
              ]
            },
            borderRadius: [4, 4, 0, 0],
            borderColor: '#fff',
            borderWidth: 1
          }
        })),
        barWidth: '60%',
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowColor: 'rgba(0, 0, 0, 0.3)'
          }
        },
        label: {
          show: true,
          position: 'top',
          formatter: (params: any) => {
            return `NT$ ${params.value.toLocaleString()}`;
          },
          fontSize: 10,
          color: '#374151'
        },
        animationDelay: (idx: number) => idx * 100
      }
    ]
  };

  const handleEvents = {
    click: (params: any) => {
      const groupData = sortedData[params.dataIndex];
      console.log('點擊群組:', groupData.groupName);
      // 這裡可以添加點擊事件處理，例如跳轉到群組詳細頁面
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

export default GroupComparisonChart;