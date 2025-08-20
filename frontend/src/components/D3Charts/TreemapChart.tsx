import React, { useRef, useEffect, useState } from 'react'
import * as d3 from 'd3'

interface TreemapData {
  id: string
  name: string
  value: number
  category?: string
  children?: TreemapData[]
  color?: string
}

interface TreemapChartProps {
  data: TreemapData
  width?: number
  height?: number
  onCellClick?: (data: TreemapData) => void
  onCellHover?: (data: TreemapData | null) => void
}

const TreemapChart: React.FC<TreemapChartProps> = ({
  data,
  width = 800,
  height = 500,
  onCellClick,
  onCellHover
}) => {
  const svgRef = useRef<SVGSVGElement>(null)
  const [selectedCell, setSelectedCell] = useState<TreemapData | null>(null)
  const [tooltip, setTooltip] = useState<{ x: number; y: number; content: string } | null>(null)

  useEffect(() => {
    if (!svgRef.current || !data) return

    // 清除現有內容
    d3.select(svgRef.current).selectAll('*').remove()

    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height)

    // 創建 treemap 佈局
    const root = d3.hierarchy(data)
      .sum(d => d.value)
      .sort((a, b) => (b.value || 0) - (a.value || 0))

    const treemap = d3.treemap<TreemapData>()
      .size([width, height])
      .padding(2)
      .round(true)

    treemap(root)

    // 顏色方案
    const colorScale = d3.scaleOrdinal<string>()
      .domain(['食物', '交通', '娛樂', '購物', '醫療', '教育', '其他'])
      .range(['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57', '#FF9FF3', '#A8E6CF'])

    // 創建漸變定義
    const defs = svg.append('defs')
    
    // 為每個類別創建漸變
    colorScale.domain().forEach(category => {
      const gradient = defs.append('linearGradient')
        .attr('id', `gradient-${category.replace(/\s+/g, '-')}`)
        .attr('x1', '0%').attr('y1', '0%')
        .attr('x2', '100%').attr('y2', '100%')

      gradient.append('stop')
        .attr('offset', '0%')
        .attr('stop-color', colorScale(category))
        .attr('stop-opacity', 1)

      gradient.append('stop')
        .attr('offset', '100%')
        .attr('stop-color', d3.color(colorScale(category))?.darker(0.3)?.toString() || colorScale(category))
        .attr('stop-opacity', 1)
    })

    // 創建單元格
    const cell = svg.selectAll('g')
      .data(root.leaves())
      .enter().append('g')
      .attr('class', 'cell')
      .attr('transform', d => `translate(${(d as any).x0},${(d as any).y0})`)
      .style('cursor', 'pointer')

    // 單元格矩形
    cell.append('rect')
      .attr('width', d => Math.max(0, (d as any).x1 - (d as any).x0))
      .attr('height', d => Math.max(0, (d as any).y1 - (d as any).y0))
      .attr('fill', d => {
        const category = d.data.category || d.data.name
        return `url(#gradient-${category.replace(/\s+/g, '-')})`
      })
      .attr('stroke', '#fff')
      .attr('stroke-width', 2)
      .attr('rx', 4)
      .style('filter', 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))')
      .on('mouseover', function(event, d) {
        d3.select(this)
          .transition()
          .duration(200)
          .style('filter', 'drop-shadow(0 4px 8px rgba(0,0,0,0.2))')
          .attr('stroke-width', 3)

        // 顯示 tooltip
        const rect = svgRef.current?.getBoundingClientRect()
        if (rect) {
          setTooltip({
            x: event.clientX - rect.left,
            y: event.clientY - rect.top,
            content: `${d.data.name}\n金額: NT$ ${d.data.value.toLocaleString()}\n佔比: ${((d.data.value / root.value!) * 100).toFixed(1)}%`
          })
        }

        onCellHover?.(d.data)
      })
      .on('mouseout', function(event, d) {
        d3.select(this)
          .transition()
          .duration(200)
          .style('filter', 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))')
          .attr('stroke-width', 2)

        setTooltip(null)
        onCellHover?.(null)
      })
      .on('click', (event, d) => {
        event.stopPropagation()
        setSelectedCell(selectedCell?.id === d.data.id ? null : d.data)
        onCellClick?.(d.data)
      })

    // 單元格文字標籤
    cell.append('text')
      .attr('x', d => ((d as any).x1 - (d as any).x0) / 2)
      .attr('y', d => ((d as any).y1 - (d as any).y0) / 2 - 5)
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'middle')
      .attr('font-size', d => {
        const area = ((d as any).x1 - (d as any).x0) * ((d as any).y1 - (d as any).y0)
        return Math.min(14, Math.sqrt(area) / 8) + 'px'
      })
      .attr('font-weight', 'bold')
      .attr('fill', '#fff')
      .style('pointer-events', 'none')
      .text(d => {
        const area = ((d as any).x1 - (d as any).x0) * ((d as any).y1 - (d as any).y0)
        return area > 1000 ? d.data.name : ''
      })

    // 單元格數值標籤
    cell.append('text')
      .attr('x', d => ((d as any).x1 - (d as any).x0) / 2)
      .attr('y', d => ((d as any).y1 - (d as any).y0) / 2 + 12)
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'middle')
      .attr('font-size', d => {
        const area = ((d as any).x1 - (d as any).x0) * ((d as any).y1 - (d as any).y0)
        return Math.min(12, Math.sqrt(area) / 10) + 'px'
      })
      .attr('fill', '#fff')
      .style('pointer-events', 'none')
      .text(d => {
        const area = ((d as any).x1 - (d as any).x0) * ((d as any).y1 - (d as any).y0)
        return area > 800 ? `NT$ ${d.data.value.toLocaleString()}` : ''
      })

    // 百分比標籤
    cell.append('text')
      .attr('x', d => ((d as any).x1 - (d as any).x0) / 2)
      .attr('y', d => ((d as any).y1 - (d as any).y0) / 2 + 26)
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'middle')
      .attr('font-size', d => {
        const area = ((d as any).x1 - (d as any).x0) * ((d as any).y1 - (d as any).y0)
        return Math.min(10, Math.sqrt(area) / 12) + 'px'
      })
      .attr('fill', '#fff')
      .attr('opacity', 0.9)
      .style('pointer-events', 'none')
      .text(d => {
        const area = ((d as any).x1 - (d as any).x0) * ((d as any).y1 - (d as any).y0)
        const percentage = ((d.data.value / root.value!) * 100)
        return area > 600 && percentage > 2 ? `${percentage.toFixed(1)}%` : ''
      })

    // 添加圖例
    const legend = svg.append('g')
      .attr('class', 'legend')
      .attr('transform', `translate(${width - 150}, 20)`)

    const legendData = colorScale.domain().map(d => ({
      name: d,
      color: colorScale(d)
    }))

    const legendItems = legend.selectAll('.legend-item')
      .data(legendData)
      .enter().append('g')
      .attr('class', 'legend-item')
      .attr('transform', (d, i) => `translate(0, ${i * 20})`)

    legendItems.append('rect')
      .attr('width', 12)
      .attr('height', 12)
      .attr('fill', d => d.color)
      .attr('stroke', '#fff')
      .attr('stroke-width', 1)
      .attr('rx', 2)

    legendItems.append('text')
      .text(d => d.name)
      .attr('x', 18)
      .attr('y', 6)
      .attr('dy', '0.35em')
      .attr('font-size', '11px')
      .attr('fill', '#374151')

    // 添加統計資訊
    const stats = svg.append('g')
      .attr('class', 'stats')
      .attr('transform', 'translate(20, 20)')

    stats.append('rect')
      .attr('width', 200)
      .attr('height', 60)
      .attr('fill', 'rgba(255, 255, 255, 0.9)')
      .attr('stroke', '#E5E7EB')
      .attr('stroke-width', 1)
      .attr('rx', 8)

    stats.append('text')
      .text(`總計: NT$ ${root.value!.toLocaleString()}`)
      .attr('x', 10)
      .attr('y', 20)
      .attr('font-size', '14px')
      .attr('font-weight', 'bold')
      .attr('fill', '#374151')

    stats.append('text')
      .text(`項目數: ${root.leaves().length}`)
      .attr('x', 10)
      .attr('y', 40)
      .attr('font-size', '12px')
      .attr('fill', '#6B7280')

  }, [data, width, height, onCellClick, onCellHover])

  return (
    <div className="relative">
      <svg ref={svgRef} className="border border-gray-300 rounded-lg bg-white" />
      
      {tooltip && (
        <div
          className="absolute bg-gray-800 text-white text-xs rounded px-2 py-1 pointer-events-none z-10"
          style={{
            left: tooltip.x + 10,
            top: tooltip.y - 10,
            whiteSpace: 'pre-line'
          }}
        >
          {tooltip.content}
        </div>
      )}
      
      {selectedCell && (
        <div className="absolute top-4 right-4 bg-white border border-gray-300 rounded-lg p-4 shadow-lg z-10">
          <h4 className="font-semibold text-gray-800 mb-2">詳細資訊</h4>
          <div className="space-y-1 text-sm">
            <div><span className="font-medium">項目:</span> {selectedCell.name}</div>
            <div><span className="font-medium">金額:</span> NT$ {selectedCell.value.toLocaleString()}</div>
            {selectedCell.category && (
              <div><span className="font-medium">分類:</span> {selectedCell.category}</div>
            )}
          </div>
          <button
            onClick={() => setSelectedCell(null)}
            className="mt-2 text-xs text-gray-600 hover:text-gray-800"
          >
            關閉
          </button>
        </div>
      )}
    </div>
  )
}

export default TreemapChart