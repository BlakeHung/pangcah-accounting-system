import React from 'react';
import EChartsWrapper from './EChartsWrapper';
import { defaultTooltip } from './chartConfig';

interface CategoryData {
  name: string;
  value: number;
  color?: string;
}

interface CategoryPieChartProps {
  data: CategoryData[];
  title?: string;
  height?: number;
  loading?: boolean;
  type?: 'pie' | 'doughnut';
}

const CategoryPieChart: React.FC<CategoryPieChartProps> = ({
  data,
  title = '支出分類分布',
  height = 400,
  loading = false,
  type = 'doughnut'
}) => {
  // 計算總金額用於百分比計算
  const total = data.reduce((sum, item) => sum + item.value, 0);

  const option: any = {
    title: {
      text: title,
      left: 'center',
      top: 20,
      textStyle: {
        fontSize: 16,
        fontWeight: 'bolder' as const,
        color: '#374151'
      }
    },
    tooltip: {
      ...defaultTooltip,
      trigger: 'item' as const,
      formatter: (params: any) => {
        const percentage = ((params.value / total) * 100).toFixed(1);
        return `
          <div style="padding: 8px;">
            <div style="margin-bottom: 4px; font-weight: bold;">${params.name}</div>
            <div style="display: flex; align-items: center; margin-bottom: 4px;">
              <span style="display: inline-block; width: 10px; height: 10px; border-radius: 50%; background-color: ${params.color}; margin-right: 8px;"></span>
              金額: NT$ ${params.value.toLocaleString()}
            </div>
            <div style="color: #6B7280; font-size: 11px;">
              佔比: ${percentage}%
            </div>
          </div>
        `;
      }
    },
    legend: {
      orient: 'vertical' as const,
      left: 'left',
      top: 'middle',
      textStyle: {
        fontSize: 12,
        color: '#374151'
      },
      formatter: (name: string) => {
        const item = data.find(d => d.name === name);
        if (item) {
          const percentage = ((item.value / total) * 100).toFixed(1);
          return `${name} (${percentage}%)`;
        }
        return name;
      }
    },
    series: [
      {
        name: '支出分類',
        type: 'pie',
        radius: type === 'doughnut' ? ['40%', '70%'] : '60%',
        center: ['60%', '50%'],
        data: data.map(item => ({
          name: item.name,
          value: item.value,
          itemStyle: {
            color: item.color,
            borderColor: '#fff',
            borderWidth: 2
          }
        })),
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          },
          label: {
            show: true,
            fontSize: 14,
            fontWeight: 'bold'
          }
        },
        label: {
          show: true,
          position: 'outside',
          formatter: '{b}: {d}%',
          fontSize: 11,
          color: '#374151'
        },
        labelLine: {
          show: true,
          length: 15,
          length2: 10,
          lineStyle: {
            color: '#D1D5DB'
          }
        },
        animationType: 'scale',
        animationEasing: 'elasticOut',
        animationDelay: (idx: number) => idx * 50
      }
    ]
  };

  // 如果是環形圖，添加中心文字
  if (type === 'doughnut') {
    option.title = {
      ...option.title,
      subtext: `總計: NT$ ${total.toLocaleString()}`,
      left: '60%',
      top: 45,
      textAlign: 'center',
      subtextStyle: {
        fontSize: 14,
        color: '#6B7280'
      }
    };
  }

  const handleEvents = {
    click: (params: any) => {
      console.log('點擊分類:', params.name, params.value);
      // 這裡可以添加點擊事件處理，例如篩選該分類的詳細資料
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

export default CategoryPieChart;