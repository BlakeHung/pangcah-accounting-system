import React from 'react'
import ReactECharts from 'echarts-for-react'

interface AreaChartProps {
  data: Array<{
    date: string
    income?: number
    expense?: number
    value?: number
  }>
  title?: string
  smooth?: boolean
  gradient?: boolean
}

const AreaChart: React.FC<AreaChartProps> = ({
  data,
  title = '趨勢分析',
  smooth = true,
  gradient = true
}) => {
  const dates = data.map(d => d.date)
  const hasIncomeExpense = data[0]?.income !== undefined
  
  const series = hasIncomeExpense ? [
    {
      name: '收入',
      type: 'line',
      smooth: smooth,
      symbol: 'circle',
      symbolSize: 6,
      data: data.map(d => d.income || 0),
      areaStyle: gradient ? {
        color: {
          type: 'linear',
          x: 0,
          y: 0,
          x2: 0,
          y2: 1,
          colorStops: [{
            offset: 0,
            color: 'rgba(46, 139, 87, 0.3)'
          }, {
            offset: 1,
            color: 'rgba(46, 139, 87, 0.05)'
          }]
        }
      } : { opacity: 0.3 },
      itemStyle: {
        color: '#2E8B57'
      },
      lineStyle: {
        width: 2,
        color: '#2E8B57'
      }
    },
    {
      name: '支出',
      type: 'line',
      smooth: smooth,
      symbol: 'circle',
      symbolSize: 6,
      data: data.map(d => d.expense || 0),
      areaStyle: gradient ? {
        color: {
          type: 'linear',
          x: 0,
          y: 0,
          x2: 0,
          y2: 1,
          colorStops: [{
            offset: 0,
            color: 'rgba(220, 38, 38, 0.3)'
          }, {
            offset: 1,
            color: 'rgba(220, 38, 38, 0.05)'
          }]
        }
      } : { opacity: 0.3 },
      itemStyle: {
        color: '#DC2626'
      },
      lineStyle: {
        width: 2,
        color: '#DC2626'
      }
    }
  ] : [
    {
      name: '數值',
      type: 'line',
      smooth: smooth,
      symbol: 'circle',
      symbolSize: 6,
      data: data.map(d => d.value || 0),
      areaStyle: gradient ? {
        color: {
          type: 'linear',
          x: 0,
          y: 0,
          x2: 0,
          y2: 1,
          colorStops: [{
            offset: 0,
            color: 'rgba(95, 158, 160, 0.3)'
          }, {
            offset: 1,
            color: 'rgba(95, 158, 160, 0.05)'
          }]
        }
      } : { opacity: 0.3 },
      itemStyle: {
        color: '#5F9EA0'
      },
      lineStyle: {
        width: 2,
        color: '#5F9EA0'
      }
    }
  ]

  const option = {
    title: {
      text: title,
      left: 'center',
      textStyle: {
        fontSize: 16,
        fontWeight: 'bold'
      }
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross',
        label: {
          backgroundColor: '#6a7985'
        }
      },
      formatter: (params: any) => {
        let result = `${params[0].axisValue}<br/>`
        params.forEach((param: any) => {
          const value = param.value.toLocaleString()
          result += `${param.marker} ${param.seriesName}: NT$ ${value}<br/>`
        })
        return result
      }
    },
    legend: {
      bottom: 0,
      data: hasIncomeExpense ? ['收入', '支出'] : ['數值']
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '15%',
      top: '15%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: dates,
      axisLabel: {
        rotate: dates.length > 10 ? 45 : 0,
        interval: dates.length > 20 ? 'auto' : 0
      }
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        formatter: (value: number) => `NT$ ${(value / 1000).toFixed(0)}k`
      }
    },
    series: series
  }

  return (
    <ReactECharts 
      option={option} 
      style={{ height: '100%', minHeight: '300px' }}
      opts={{ renderer: 'svg' }}
    />
  )
}

export default AreaChart