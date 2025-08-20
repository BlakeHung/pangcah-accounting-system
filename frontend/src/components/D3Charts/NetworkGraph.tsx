import React, { useRef, useEffect, useState } from 'react'
import * as d3 from 'd3'

interface NetworkNode extends d3.SimulationNodeDatum {
  id: string
  name: string
  group: string
  value: number
  type: 'user' | 'category' | 'transaction'
  color?: string
}

interface NetworkLink extends d3.SimulationLinkDatum<NetworkNode> {
  source: string | NetworkNode
  target: string | NetworkNode
  value: number
  type: 'expense' | 'income' | 'transfer'
}

interface NetworkGraphProps {
  nodes: NetworkNode[]
  links: NetworkLink[]
  width?: number
  height?: number
  onNodeClick?: (node: NetworkNode) => void
  onNodeHover?: (node: NetworkNode | null) => void
}

const NetworkGraph: React.FC<NetworkGraphProps> = ({
  nodes,
  links,
  width = 800,
  height = 600,
  onNodeClick,
  onNodeHover
}) => {
  const svgRef = useRef<SVGSVGElement>(null)
  const [selectedNode, setSelectedNode] = useState<NetworkNode | null>(null)
  const [tooltip, setTooltip] = useState<{ x: number; y: number; content: string } | null>(null)

  useEffect(() => {
    if (!svgRef.current || !nodes.length) return

    // 清除現有內容
    d3.select(svgRef.current).selectAll('*').remove()

    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height)

    // 創建縮放行為
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.5, 3])
      .on('zoom', (event) => {
        container.attr('transform', event.transform)
      })

    svg.call(zoom)

    const container = svg.append('g')

    // 定義節點半徑函數 (需要在使用前定義)
    const getNodeRadius = (value: number) => {
      return Math.sqrt(value) * 0.5 + 5
    }

    // 定義顏色方案
    const colorScale = d3.scaleOrdinal<string>()
      .domain(['user', 'category', 'transaction'])
      .range(['#4F46E5', '#10B981', '#F59E0B'])

    // 創建力導向模擬
    const simulation = d3.forceSimulation<NetworkNode>(nodes)
      .force('link', d3.forceLink<NetworkNode, NetworkLink>(links)
        .id(d => d.id)
        .distance(d => 50 + d.value * 0.1)
        .strength(0.5)
      )
      .force('charge', d3.forceManyBody()
        .strength(-300)
        .distanceMax(200)
      )
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide()
        .radius(d => getNodeRadius((d as NetworkNode).value) + 2)
      )

    // 創建連接線
    const link = container.append('g')
      .attr('class', 'links')
      .selectAll('line')
      .data(links)
      .enter().append('line')
      .attr('stroke', d => d.type === 'income' ? '#10B981' : d.type === 'expense' ? '#EF4444' : '#6B7280')
      .attr('stroke-opacity', 0.6)
      .attr('stroke-width', d => Math.sqrt(d.value) * 0.1 + 1)
      .attr('stroke-dasharray', d => d.type === 'transfer' ? '5,5' : null)

    // 創建節點組
    const node = container.append('g')
      .attr('class', 'nodes')
      .selectAll('g')
      .data(nodes)
      .enter().append('g')
      .attr('class', 'node')
      .style('cursor', 'pointer')
      .call(d3.drag<SVGGElement, NetworkNode>()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended)
      )

    // 節點圓圈
    node.append('circle')
      .attr('r', d => getNodeRadius(d.value))
      .attr('fill', d => d.color || colorScale(d.type))
      .attr('stroke', '#fff')
      .attr('stroke-width', 2)
      .style('filter', 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))')

    // 節點文字標籤
    node.append('text')
      .text(d => d.name)
      .attr('font-size', '12px')
      .attr('font-weight', 'bold')
      .attr('text-anchor', 'middle')
      .attr('dy', d => getNodeRadius(d.value) + 15)
      .attr('fill', '#374151')
      .style('pointer-events', 'none')

    // 節點值標籤
    node.append('text')
      .text(d => d.type === 'user' ? '' : `NT$ ${d.value.toLocaleString()}`)
      .attr('font-size', '10px')
      .attr('text-anchor', 'middle')
      .attr('dy', 4)
      .attr('fill', '#fff')
      .style('pointer-events', 'none')

    // 添加互動事件
    node
      .on('click', (event, d) => {
        event.stopPropagation()
        setSelectedNode(selectedNode?.id === d.id ? null : d)
        onNodeClick?.(d)
      })
      .on('mouseover', (event, d) => {
        // 高亮相關節點和連線
        const connectedNodes = new Set<string>()
        const connectedLinks = links.filter(l => 
          l.source === d.id || l.target === d.id
        )
        
        connectedLinks.forEach(l => {
          connectedNodes.add(typeof l.source === 'string' ? l.source : (l.source as NetworkNode).id)
          connectedNodes.add(typeof l.target === 'string' ? l.target : (l.target as NetworkNode).id)
        })

        // 降低未連接節點的透明度
        node.style('opacity', n => connectedNodes.has(n.id) ? 1 : 0.3)
        link.style('opacity', l => 
          (typeof l.source === 'string' ? l.source : (l.source as NetworkNode).id) === d.id ||
          (typeof l.target === 'string' ? l.target : (l.target as NetworkNode).id) === d.id ? 1 : 0.1
        )

        // 顯示 tooltip
        const rect = svgRef.current?.getBoundingClientRect()
        if (rect) {
          setTooltip({
            x: event.clientX - rect.left,
            y: event.clientY - rect.top,
            content: `${d.name}\n類型: ${d.type === 'user' ? '用戶' : d.type === 'category' ? '分類' : '交易'}\n值: NT$ ${d.value.toLocaleString()}`
          })
        }

        onNodeHover?.(d)
      })
      .on('mouseout', () => {
        // 恢復所有節點和連線的透明度
        node.style('opacity', 1)
        link.style('opacity', 0.6)
        setTooltip(null)
        onNodeHover?.(null)
      })

    // 添加圖例
    const legend = svg.append('g')
      .attr('class', 'legend')
      .attr('transform', `translate(${width - 150}, 20)`)

    const legendData = [
      { type: 'user', label: '用戶', color: '#4F46E5' },
      { type: 'category', label: '分類', color: '#10B981' },
      { type: 'transaction', label: '交易', color: '#F59E0B' }
    ]

    const legendItems = legend.selectAll('.legend-item')
      .data(legendData)
      .enter().append('g')
      .attr('class', 'legend-item')
      .attr('transform', (d, i) => `translate(0, ${i * 25})`)

    legendItems.append('circle')
      .attr('r', 8)
      .attr('fill', d => d.color)
      .attr('stroke', '#fff')
      .attr('stroke-width', 1)

    legendItems.append('text')
      .text(d => d.label)
      .attr('x', 15)
      .attr('dy', 4)
      .attr('font-size', '12px')
      .attr('fill', '#374151')

    // 模擬更新
    simulation.on('tick', () => {
      link
        .attr('x1', d => (d.source as NetworkNode).x || 0)
        .attr('y1', d => (d.source as NetworkNode).y || 0)
        .attr('x2', d => (d.target as NetworkNode).x || 0)
        .attr('y2', d => (d.target as NetworkNode).y || 0)

      node
        .attr('transform', d => `translate(${d.x || 0},${d.y || 0})`)
    })

    // 拖拽函數
    function dragstarted(event: any, d: NetworkNode) {
      if (!event.active) simulation.alphaTarget(0.3).restart()
      d.fx = d.x
      d.fy = d.y
    }

    function dragged(event: any, d: NetworkNode) {
      d.fx = event.x
      d.fy = event.y
    }

    function dragended(event: any, d: NetworkNode) {
      if (!event.active) simulation.alphaTarget(0)
      d.fx = null
      d.fy = null
    }

    // 清理函數
    return () => {
      simulation.stop()
    }

  }, [nodes, links, width, height, onNodeClick, onNodeHover])

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
      
      {selectedNode && (
        <div className="absolute top-4 left-4 bg-white border border-gray-300 rounded-lg p-4 shadow-lg z-10">
          <h4 className="font-semibold text-gray-800 mb-2">節點詳情</h4>
          <div className="space-y-1 text-sm">
            <div><span className="font-medium">名稱:</span> {selectedNode.name}</div>
            <div><span className="font-medium">類型:</span> {
              selectedNode.type === 'user' ? '用戶' :
              selectedNode.type === 'category' ? '分類' : '交易'
            }</div>
            <div><span className="font-medium">群組:</span> {selectedNode.group}</div>
            <div><span className="font-medium">值:</span> NT$ {selectedNode.value.toLocaleString()}</div>
          </div>
          <button
            onClick={() => setSelectedNode(null)}
            className="mt-2 text-xs text-gray-600 hover:text-gray-800"
          >
            關閉
          </button>
        </div>
      )}
    </div>
  )
}

export default NetworkGraph