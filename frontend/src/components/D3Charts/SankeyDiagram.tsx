import React, { useRef, useEffect, useState } from 'react'
import * as d3 from 'd3'

interface SankeyNode {
  id: string
  name: string
  category: string
  value?: number
}

interface SankeyLink {
  source: string
  target: string
  value: number
  category?: string
}

interface SankeyNodeWithPosition extends SankeyNode {
  x: number
  y: number
  dy: number
}

interface SankeyDiagramProps {
  nodes: SankeyNode[]
  links: SankeyLink[]
  width?: number
  height?: number
  onNodeClick?: (node: SankeyNode) => void
  onLinkClick?: (link: SankeyLink) => void
}

const SankeyDiagram: React.FC<SankeyDiagramProps> = ({
  nodes,
  links,
  width = 800,
  height = 500,
  onNodeClick,
  onLinkClick
}) => {
  const svgRef = useRef<SVGSVGElement>(null)
  const [tooltip, setTooltip] = useState<{ x: number; y: number; content: string } | null>(null)

  useEffect(() => {
    if (!svgRef.current || !nodes.length || !links.length) return

    // 清除現有內容
    d3.select(svgRef.current).selectAll('*').remove()

    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height)

    const margin = { top: 20, right: 20, bottom: 20, left: 20 }
    const innerWidth = width - margin.left - margin.right
    const innerHeight = height - margin.top - margin.bottom

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left}, ${margin.top})`)

    // 創建簡化的 Sankey 佈局
    const createSankeyLayout = (): { nodes: SankeyNodeWithPosition[], links: SankeyLink[] } => {
      // 計算節點位置
      const nodeMap = new Map<string, SankeyNodeWithPosition>(
        nodes.map(d => [d.id, { ...d, x: 0, y: 0, dy: 0 }])
      )
      
      // 根據類別分配 X 位置
      const categories = Array.from(new Set(nodes.map(d => d.category)))
      const xScale = d3.scalePoint()
        .domain(categories)
        .range([0, innerWidth])
        .padding(0.1)

      // 為每個類別的節點分配 Y 位置
      categories.forEach(category => {
        const categoryNodes = nodes.filter(d => d.category === category)
        const yScale = d3.scaleBand()
          .domain(categoryNodes.map(d => d.id))
          .range([0, innerHeight])
          .padding(0.1)

        categoryNodes.forEach(node => {
          const nodeData = nodeMap.get(node.id)!
          nodeData.x = xScale(category) || 0
          nodeData.y = yScale(node.id) || 0
          nodeData.dy = yScale.bandwidth()
        })
      })

      return { nodes: Array.from(nodeMap.values()), links }
    }

    const sankeyData = createSankeyLayout()
    const sankeyNodes = sankeyData.nodes
    const sankeyLinks = sankeyData.links

    // 顏色方案
    const colorScale = d3.scaleOrdinal<string>()
      .domain(['income', 'expense', 'category', 'user'])
      .range(['#10B981', '#EF4444', '#6366F1', '#F59E0B'])

    // 創建漸變定義
    const defs = svg.append('defs')
    
    sankeyLinks.forEach((link, i) => {
      const sourceNode = sankeyNodes.find(n => n.id === link.source)
      const targetNode = sankeyNodes.find(n => n.id === link.target)
      
      const gradient = defs.append('linearGradient')
        .attr('id', `gradient-${i}`)
        .attr('gradientUnits', 'userSpaceOnUse')
        .attr('x1', sourceNode?.x).attr('y1', sourceNode?.y)
        .attr('x2', targetNode?.x).attr('y2', targetNode?.y)

      gradient.append('stop')
        .attr('offset', '0%')
        .attr('stop-color', colorScale(sourceNode?.category || 'user'))
        .attr('stop-opacity', 0.7)

      gradient.append('stop')
        .attr('offset', '100%')
        .attr('stop-color', colorScale(targetNode?.category || 'category'))
        .attr('stop-opacity', 0.7)
    })

    // 創建連接線的路徑生成器
    const linkPath = (d: SankeyLink) => {
      const source = sankeyNodes.find(n => n.id === d.source)
      const target = sankeyNodes.find(n => n.id === d.target)
      
      if (!source || !target) return ''

      const x0 = source.x + 60 // 節點寬度
      const x1 = target.x
      const xi = d3.interpolateNumber(x0, x1)
      const x2 = xi(0.75) // 控制點位置
      const x3 = xi(0.25)
      
      const y0 = source.y + source.dy / 2
      const y1 = target.y + target.dy / 2

      return `M${x0},${y0}C${x2},${y0} ${x3},${y1} ${x1},${y1}`
    }

    // 繪製連接線
    const link = g.append('g')
      .attr('class', 'links')
      .selectAll('path')
      .data(sankeyLinks)
      .enter().append('path')
      .attr('d', linkPath)
      .attr('stroke', (d, i) => `url(#gradient-${i})`)
      .attr('stroke-width', d => Math.max(1, Math.sqrt(d.value) * 0.5))
      .attr('fill', 'none')
      .attr('opacity', 0.7)
      .style('cursor', 'pointer')
      .on('mouseover', function(event, d) {
        d3.select(this).attr('opacity', 1)
        
        const rect = svgRef.current?.getBoundingClientRect()
        if (rect) {
          setTooltip({
            x: event.clientX - rect.left,
            y: event.clientY - rect.top,
            content: `${d.source} → ${d.target}\n金額: NT$ ${d.value.toLocaleString()}`
          })
        }
      })
      .on('mouseout', function() {
        d3.select(this).attr('opacity', 0.7)
        setTooltip(null)
      })
      .on('click', (event, d) => {
        onLinkClick?.(d)
      })

    // 繪製節點
    const node = g.append('g')
      .attr('class', 'nodes')
      .selectAll('g')
      .data(sankeyNodes)
      .enter().append('g')
      .attr('class', 'node')
      .attr('transform', d => `translate(${d.x}, ${d.y})`)
      .style('cursor', 'pointer')

    // 節點矩形
    node.append('rect')
      .attr('width', 60)
      .attr('height', d => d.dy)
      .attr('fill', d => colorScale(d.category))
      .attr('stroke', '#fff')
      .attr('stroke-width', 2)
      .attr('rx', 4)
      .style('filter', 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))')
      .on('mouseover', function(event, d) {
        d3.select(this).attr('fill', d3.color(colorScale(d.category))?.darker(0.3)?.toString() || colorScale(d.category))
        
        const rect = svgRef.current?.getBoundingClientRect()
        if (rect) {
          setTooltip({
            x: event.clientX - rect.left,
            y: event.clientY - rect.top,
            content: `${d.name}\n類別: ${d.category}\n值: NT$ ${(d.value || 0).toLocaleString()}`
          })
        }
      })
      .on('mouseout', function(event, d) {
        d3.select(this).attr('fill', colorScale(d.category))
        setTooltip(null)
      })
      .on('click', (event, d) => {
        onNodeClick?.(d)
      })

    // 節點標籤
    node.append('text')
      .text(d => d.name)
      .attr('x', 30)
      .attr('y', d => d.dy / 2)
      .attr('dy', '0.35em')
      .attr('text-anchor', 'middle')
      .attr('font-size', '12px')
      .attr('font-weight', 'bold')
      .attr('fill', '#fff')
      .style('pointer-events', 'none')

    // 節點值標籤
    node.append('text')
      .text(d => `NT$ ${(d.value || 0).toLocaleString()}`)
      .attr('x', 30)
      .attr('y', d => d.dy / 2 + 15)
      .attr('text-anchor', 'middle')
      .attr('font-size', '10px')
      .attr('fill', '#fff')
      .style('pointer-events', 'none')

    // 添加類別標籤
    const categories = Array.from(new Set(nodes.map(d => d.category)))
    const categoryLabels = g.append('g')
      .attr('class', 'category-labels')
      .selectAll('text')
      .data(categories)
      .enter().append('text')
      .text((d: string) => {
        switch(d) {
          case 'income': return '收入來源'
          case 'expense': return '支出類別'
          case 'category': return '分類'
          case 'user': return '用戶'
          default: return d
        }
      })
      .attr('x', (d: string) => (d3.scalePoint().domain(categories).range([0, innerWidth]).padding(0.1))(d) || 0)
      .attr('y', -5)
      .attr('text-anchor', 'middle')
      .attr('font-size', '14px')
      .attr('font-weight', 'bold')
      .attr('fill', '#374151')

  }, [nodes, links, width, height, onNodeClick, onLinkClick])

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
    </div>
  )
}

export default SankeyDiagram