import React from 'react'
import ReactECharts from 'echarts-for-react'

interface BarChartProps {
  data: Array<{
    name: string
    value: number
    type?: string
  }>
  title?: string
  colors?: string[]
  horizontal?: boolean
  stacked?: boolean
  showPercentage?: boolean
}

const BarChart: React.FC<BarChartProps> = ({
  data,
  title = '柱狀圖',
  colors = ['#2E8B57', '#5F9EA0', '#4682B4', '#6495ED'],
  horizontal = false,
  stacked = false,
  showPercentage = false
}) => {
  // 準備圖表數據
  const categories = [...new Set(data.map(d => d.name))]
  const types = data[0]?.type ? [...new Set(data.map(d => d.type))] : ['value']
  
  const series = types.map((type, index) => ({
    name: type === 'value' ? '數值' : type,
    type: 'bar',
    stack: stacked ? 'total' : undefined,
    data: categories.map(cat => {
      const item = data.find(d => d.name === cat && (d.type === type || !d.type))
      return item?.value || 0
    }),
    itemStyle: {
      color: colors[index % colors.length]
    },
    label: {
      show: showPercentage,
      position: horizontal ? 'right' : 'top',
      formatter: (params: any) => {
        if (showPercentage) {
          const total = data.reduce((sum, d) => sum + d.value, 0)
          const percentage = ((params.value / total) * 100).toFixed(1)
          return `${percentage}%`
        }
        return params.value.toLocaleString()
      }
    }
  }))

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
        type: 'shadow'
      },
      formatter: (params: any) => {
        let result = `${params[0].axisValue}<br/>`
        params.forEach((param: any) => {
          const value = param.value.toLocaleString()
          const percentage = showPercentage 
            ? ` (${((param.value / data.reduce((sum, d) => sum + d.value, 0)) * 100).toFixed(1)}%)`
            : ''
          result += `${param.marker} ${param.seriesName}: NT$ ${value}${percentage}<br/>`
        })
        return result
      }
    },
    legend: {
      show: types.length > 1,
      bottom: 0
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: types.length > 1 ? '15%' : '10%',
      top: '15%',
      containLabel: true
    },
    xAxis: horizontal ? {
      type: 'value',
      axisLabel: {
        formatter: (value: number) => `NT$ ${value.toLocaleString()}`
      }
    } : {
      type: 'category',
      data: categories,
      axisLabel: {
        rotate: categories.length > 5 ? 45 : 0,
        interval: 0
      }
    },
    yAxis: horizontal ? {
      type: 'category',
      data: categories
    } : {
      type: 'value',
      axisLabel: {
        formatter: (value: number) => `NT$ ${value.toLocaleString()}`
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

export default BarChart