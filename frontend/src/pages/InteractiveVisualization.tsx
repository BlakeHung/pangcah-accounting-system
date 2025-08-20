import React, { useState } from 'react'
import Layout from '../components/Layout'
import { NetworkGraph, SankeyDiagram, TreemapChart } from '../components/D3Charts'
import { useSnackbar } from '../contexts/SnackbarContext'

const InteractiveVisualization: React.FC = () => {
  const { showSnackbar } = useSnackbar()
  const [activeTab, setActiveTab] = useState<'network' | 'sankey' | 'treemap'>('network')

  // 網路圖示資料
  const networkNodes = [
    { id: 'user1', name: '小美', group: 'users', value: 25000, type: 'user' as const },
    { id: 'user2', name: '阿明', group: 'users', value: 18000, type: 'user' as const },
    { id: 'user3', name: '小華', group: 'users', value: 22000, type: 'user' as const },
    { id: 'cat1', name: '食物', group: 'categories', value: 15000, type: 'category' as const },
    { id: 'cat2', name: '交通', group: 'categories', value: 8000, type: 'category' as const },
    { id: 'cat3', name: '娛樂', group: 'categories', value: 12000, type: 'category' as const },
    { id: 'cat4', name: '購物', group: 'categories', value: 20000, type: 'category' as const },
    { id: 'tx1', name: '午餐', group: 'transactions', value: 150, type: 'transaction' as const },
    { id: 'tx2', name: '公車', group: 'transactions', value: 30, type: 'transaction' as const },
    { id: 'tx3', name: '電影', group: 'transactions', value: 350, type: 'transaction' as const }
  ]

  const networkLinks = [
    { source: 'user1', target: 'cat1', value: 8000, type: 'expense' as const },
    { source: 'user1', target: 'cat3', value: 5000, type: 'expense' as const },
    { source: 'user2', target: 'cat2', value: 3000, type: 'expense' as const },
    { source: 'user2', target: 'cat4', value: 10000, type: 'expense' as const },
    { source: 'user3', target: 'cat1', value: 7000, type: 'expense' as const },
    { source: 'user3', target: 'cat3', value: 7000, type: 'expense' as const },
    { source: 'cat1', target: 'tx1', value: 150, type: 'expense' as const },
    { source: 'cat2', target: 'tx2', value: 30, type: 'expense' as const },
    { source: 'cat3', target: 'tx3', value: 350, type: 'expense' as const }
  ]

  // Sankey 圖資料
  const sankeyNodes = [
    { id: 'salary', name: '薪水', category: 'income' },
    { id: 'freelance', name: '接案', category: 'income' },
    { id: 'food', name: '食物', category: 'expense' },
    { id: 'transport', name: '交通', category: 'expense' },
    { id: 'entertainment', name: '娛樂', category: 'expense' },
    { id: 'savings', name: '儲蓄', category: 'expense' }
  ]

  const sankeyLinks = [
    { source: 'salary', target: 'food', value: 15000 },
    { source: 'salary', target: 'transport', value: 5000 },
    { source: 'salary', target: 'entertainment', value: 8000 },
    { source: 'salary', target: 'savings', value: 20000 },
    { source: 'freelance', target: 'food', value: 3000 },
    { source: 'freelance', target: 'entertainment', value: 7000 }
  ]

  // Treemap 資料
  const treemapData = {
    id: 'root',
    name: '總支出',
    value: 0,
    children: [
      {
        id: 'food',
        name: '食物',
        value: 15000,
        category: '食物',
        children: [
          { id: 'breakfast', name: '早餐', value: 3000, category: '食物' },
          { id: 'lunch', name: '午餐', value: 6000, category: '食物' },
          { id: 'dinner', name: '晚餐', value: 4000, category: '食物' },
          { id: 'snacks', name: '零食', value: 2000, category: '食物' }
        ]
      },
      {
        id: 'transport',
        name: '交通',
        value: 8000,
        category: '交通',
        children: [
          { id: 'bus', name: '公車', value: 2000, category: '交通' },
          { id: 'taxi', name: '計程車', value: 3000, category: '交通' },
          { id: 'train', name: '火車', value: 3000, category: '交通' }
        ]
      },
      {
        id: 'entertainment',
        name: '娛樂',
        value: 12000,
        category: '娛樂',
        children: [
          { id: 'movies', name: '電影', value: 4000, category: '娛樂' },
          { id: 'games', name: '遊戲', value: 3000, category: '娛樂' },
          { id: 'sports', name: '運動', value: 5000, category: '娛樂' }
        ]
      },
      {
        id: 'shopping',
        name: '購物',
        value: 20000,
        category: '購物',
        children: [
          { id: 'clothes', name: '衣服', value: 12000, category: '購物' },
          { id: 'electronics', name: '電子產品', value: 8000, category: '購物' }
        ]
      }
    ]
  }

  const handleNodeClick = (node: any) => {
    showSnackbar(`點擊了節點: ${node.name}`, 'info')
  }

  const handleLinkClick = (link: any) => {
    showSnackbar(`點擊了連接: ${link.source} → ${link.target}`, 'info')
  }

  const handleCellClick = (cell: any) => {
    showSnackbar(`點擊了區塊: ${cell.name} (NT$ ${cell.value.toLocaleString()})`, 'info')
  }

  const tabs = [
    { id: 'network', label: '關係網路圖', icon: '🕸️' },
    { id: 'sankey', label: '資金流向圖', icon: '🌊' },
    { id: 'treemap', label: '樹狀結構圖', icon: '🌳' }
  ]

  return (
    <Layout>
      <div className="p-6 space-y-6">
        {/* 標題 */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">互動式資料視覺化</h1>
          <p className="text-gray-600">使用 D3.js 技術的進階資料視覺化展示</p>
        </div>

        {/* 分頁標籤 */}
        <div className="flex justify-center">
          <div className="inline-flex bg-gray-100 rounded-lg p-1">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* 視覺化內容 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6">
            {activeTab === 'network' && (
              <div>
                <div className="mb-4">
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">用戶支出關係網路</h3>
                  <p className="text-gray-600">展示用戶、分類和交易之間的關聯性，節點大小代表金額大小</p>
                </div>
                <div className="flex justify-center">
                  <NetworkGraph
                    nodes={networkNodes}
                    links={networkLinks}
                    width={800}
                    height={500}
                    onNodeClick={handleNodeClick}
                  />
                </div>
                <div className="mt-4 text-sm text-gray-500 space-y-1">
                  <p>• 可拖拽節點改變位置</p>
                  <p>• 點擊節點查看詳細資訊</p>
                  <p>• 滑鼠懸停可高亮相關連接</p>
                </div>
              </div>
            )}

            {activeTab === 'sankey' && (
              <div>
                <div className="mb-4">
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">收支流向分析</h3>
                  <p className="text-gray-600">顯示資金從收入來源到支出類別的流動軌跡</p>
                </div>
                <div className="flex justify-center">
                  <SankeyDiagram
                    nodes={sankeyNodes}
                    links={sankeyLinks}
                    width={800}
                    height={400}
                    onNodeClick={handleNodeClick}
                    onLinkClick={handleLinkClick}
                  />
                </div>
                <div className="mt-4 text-sm text-gray-500 space-y-1">
                  <p>• 連線粗細代表金額大小</p>
                  <p>• 點擊節點或連線查看詳情</p>
                  <p>• 顏色漸變顯示資金流向</p>
                </div>
              </div>
            )}

            {activeTab === 'treemap' && (
              <div>
                <div className="mb-4">
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">支出結構分析</h3>
                  <p className="text-gray-600">以面積大小展示各類支出的比重和層級關係</p>
                </div>
                <div className="flex justify-center">
                  <TreemapChart
                    data={treemapData}
                    width={800}
                    height={500}
                    onCellClick={handleCellClick}
                  />
                </div>
                <div className="mt-4 text-sm text-gray-500 space-y-1">
                  <p>• 矩形面積代表支出金額</p>
                  <p>• 顏色區分不同支出類別</p>
                  <p>• 點擊區塊查看詳細資訊</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 技術說明 */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h4 className="font-semibold text-blue-800 mb-3">🔧 技術特色</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <h5 className="font-medium text-blue-700 mb-2">互動體驗</h5>
              <ul className="text-blue-600 space-y-1">
                <li>• 滑鼠懸停顯示詳情</li>
                <li>• 點擊互動與篩選</li>
                <li>• 拖拽與縮放操作</li>
              </ul>
            </div>
            <div>
              <h5 className="font-medium text-blue-700 mb-2">視覺效果</h5>
              <ul className="text-blue-600 space-y-1">
                <li>• 平滑動畫過渡</li>
                <li>• 動態顏色映射</li>
                <li>• 響應式佈局設計</li>
              </ul>
            </div>
            <div>
              <h5 className="font-medium text-blue-700 mb-2">資料洞察</h5>
              <ul className="text-blue-600 space-y-1">
                <li>• 多維度關係分析</li>
                <li>• 層級結構展示</li>
                <li>• 趨勢模式識別</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}

export default InteractiveVisualization