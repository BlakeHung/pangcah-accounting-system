import React, { useState, useEffect } from 'react'
import Layout from '../components/Layout'
import { NetworkGraph, SankeyDiagram, TreemapChart } from '../components/D3Charts'
import { useSnackbar } from '../contexts/SnackbarContext'
import axios from 'axios'

interface User {
  id: number
  name: string
  username: string
  totalExpense?: number
}

interface Category {
  id: number
  name: string
  totalAmount?: number
  expenses?: any[]
}

interface Expense {
  id: number
  description: string
  amount: number
  category: Category
  created_by: User
  date: string
}

const InteractiveVisualization: React.FC = () => {
  const { showSnackbar } = useSnackbar()
  const [activeTab, setActiveTab] = useState<'network' | 'sankey' | 'treemap'>('network')
  const [loading, setLoading] = useState(true)
  const [users, setUsers] = useState<User[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  
  // 視覺化選項
  const [selectedCategories, setSelectedCategories] = useState<number[]>([])
  const [selectedUsers, setSelectedUsers] = useState<number[]>([])
  const [dateRange, setDateRange] = useState({ start: '', end: '' })
  const [minAmount, setMinAmount] = useState<number>(0)
  const [maxAmount, setMaxAmount] = useState<number>(0)
  const [showFilters, setShowFilters] = useState(false)

  // 載入資料
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        
        // 並行載入所有資料
        const [usersRes, categoriesRes, expensesRes] = await Promise.all([
          axios.get('/api/v1/auth/users/'),
          axios.get('/api/v1/categories/'),
          axios.get('/api/v1/expenses/')
        ])

        const usersData = usersRes.data.results || usersRes.data || []
        const categoriesData = categoriesRes.data.results || categoriesRes.data || []
        const expensesData = expensesRes.data.results || expensesRes.data || []
        
        setUsers(usersData)
        setCategories(categoriesData)
        setExpenses(expensesData)
        
        // 設置默認篩選選項
        setSelectedCategories(categoriesData.map((cat: Category) => cat.id))
        setSelectedUsers(usersData.map((user: User) => user.id))
        
        // 設置金額範圍
        if (expensesData.length > 0) {
          const amounts = expensesData.map((exp: Expense) => Math.abs(parseFloat(exp.amount.toString())))
          setMinAmount(0)
          setMaxAmount(Math.max(...amounts))
        }
        
      } catch (error) {
        console.error('載入資料失敗:', error)
        showSnackbar('載入資料失敗，將使用示例資料', 'warning')
        // 使用備用示例資料
        setUsers([
          { id: 1, name: '示例用戶1', username: 'user1' },
          { id: 2, name: '示例用戶2', username: 'user2' }
        ])
        setCategories([
          { id: 1, name: '餐飲' },
          { id: 2, name: '交通' },
          { id: 3, name: '購物' }
        ])
        setExpenses([])
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [showSnackbar])

  // 篩選資料
  const getFilteredExpenses = () => {
    return expenses.filter(expense => {
      // 分類篩選
      if (selectedCategories.length > 0 && expense.category?.id && 
          !selectedCategories.includes(expense.category.id)) {
        return false
      }
      
      // 用戶篩選
      if (selectedUsers.length > 0 && expense.created_by?.id && 
          !selectedUsers.includes(expense.created_by.id)) {
        return false
      }
      
      // 金額篩選
      const amount = Math.abs(parseFloat(expense.amount.toString()))
      if (minAmount > 0 && amount < minAmount) return false
      if (maxAmount > 0 && amount > maxAmount) return false
      
      // 日期篩選
      if (dateRange.start || dateRange.end) {
        const expenseDate = new Date(expense.date)
        if (dateRange.start && expenseDate < new Date(dateRange.start)) return false
        if (dateRange.end && expenseDate > new Date(dateRange.end)) return false
      }
      
      return true
    })
  }

  // 處理網路圖資料
  const getNetworkData = () => {
    if (!users.length || !categories.length) return { nodes: [], links: [] }
    
    // 暫時直接使用原始資料，等 API 準備好再啟用篩選
    const filteredExpenses = expenses // getFilteredExpenses()

    // 計算每個用戶和分類的支出總額
    const userExpenses: Record<number, number> = {}
    const categoryExpenses: Record<number, number> = {}
    
    filteredExpenses.forEach(expense => {
      const userId = expense.created_by?.id
      const categoryId = expense.category?.id
      
      if (userId) {
        userExpenses[userId] = (userExpenses[userId] || 0) + parseFloat(expense.amount.toString())
      }
      if (categoryId) {
        categoryExpenses[categoryId] = (categoryExpenses[categoryId] || 0) + parseFloat(expense.amount.toString())
      }
    })

    // 建立節點
    const nodes = [
      // 用戶節點
      ...users.map(user => ({
        id: `user_${user.id}`,
        name: user.name,
        group: 'users',
        value: userExpenses[user.id] || 0,
        type: 'user' as const
      })),
      // 分類節點
      ...categories.map(category => ({
        id: `cat_${category.id}`,
        name: category.name,
        group: 'categories',
        value: categoryExpenses[category.id] || 0,
        type: 'category' as const
      }))
    ]

    // 建立連結
    const links: any[] = []
    filteredExpenses.forEach(expense => {
      const userId = expense.created_by?.id
      const categoryId = expense.category?.id
      
      if (userId && categoryId) {
        links.push({
          source: `user_${userId}`,
          target: `cat_${categoryId}`,
          value: parseFloat(expense.amount.toString()),
          type: 'expense' as const
        })
      }
    })

    return { nodes, links }
  }

  // 處理 Sankey 圖資料
  const getSankeyData = () => {
    if (!categories.length) return { nodes: [], links: [] }
    
    // 暫時直接使用原始資料，等 API 準備好再啟用篩選
    const filteredExpenses = expenses // getFilteredExpenses()

    // 計算分類支出
    const categoryTotals: Record<string, number> = {}
    filteredExpenses.forEach(expense => {
      const categoryName = expense.category?.name
      if (categoryName) {
        categoryTotals[categoryName] = (categoryTotals[categoryName] || 0) + parseFloat(expense.amount.toString())
      }
    })

    const sankeyNodes = [
      { id: 'income_source', name: '收入來源', category: 'income' },
      ...categories.map(cat => ({
        id: cat.name,
        name: cat.name,
        category: 'expense'
      }))
    ]

    const sankeyLinks = categories
      .filter(cat => categoryTotals[cat.name] > 0)
      .map(cat => ({
        source: 'income_source',
        target: cat.name,
        value: categoryTotals[cat.name]
      }))

    return { nodes: sankeyNodes, links: sankeyLinks }
  }

  // 處理 Treemap 資料
  const getTreemapData = () => {
    if (!categories.length) return { id: 'root', name: '無資料', value: 0, children: [] }
    
    // 暫時直接使用原始資料，等 API 準備好再啟用篩選
    const filteredExpenses = expenses // getFilteredExpenses()

    // 基於真實分類資料創建分類群組
    const children = categories
      .map(category => {
        // 找出這個分類下的所有支出
        const categoryExpenses = filteredExpenses.filter(expense => 
          expense.category?.id === category.id || expense.category?.name === category.name
        )
        
        if (categoryExpenses.length === 0) {
          return null // 如果沒有支出，跳過這個分類
        }

        const categoryTotal = categoryExpenses.reduce((sum, exp) => 
          sum + Math.abs(parseFloat(exp.amount.toString())), 0
        )
        
        // 取金額最大的前10筆支出作為子項目
        const topExpenses = categoryExpenses
          .sort((a, b) => Math.abs(parseFloat(b.amount.toString())) - Math.abs(parseFloat(a.amount.toString())))
          .slice(0, 10)
          .map((exp, index) => ({
            id: `expense_${exp.id}`,
            name: exp.description || `支出項目 ${index + 1}`,
            value: Math.abs(parseFloat(exp.amount.toString())),
            category: category.name,
            date: exp.date
          }))

        return {
          id: `category_${category.id}`,
          name: category.name,
          value: categoryTotal,
          category: category.name,
          children: topExpenses,
          expenseCount: categoryExpenses.length
        }
      })
      .filter(Boolean) // 移除空的分類
      .sort((a, b) => b!.value - a!.value) // 按金額大小排序

    const totalValue = children.reduce((sum, child) => sum + (child?.value || 0), 0)

    return {
      id: 'root',
      name: `總支出 (${children.length} 個分類)`,
      value: totalValue,
      children: children.filter(child => child !== null)
    }
  }

  // 獲取處理後的資料
  const networkData = getNetworkData()
  const sankeyData = getSankeyData()
  const treemapData = getTreemapData()

  const handleNodeClick = (node: any) => {
    showSnackbar(`點擊了節點: ${node.name}`, 'info')
  }

  const handleLinkClick = (link: any) => {
    showSnackbar(`點擊了連接: ${link.source} → ${link.target}`, 'info')
  }

  const handleCellClick = (cell: any) => {
    if (cell.category && cell.date) {
      // 這是一筆具體支出
      showSnackbar(`支出詳情: ${cell.name} | ${cell.category} | NT$ ${cell.value.toLocaleString()} | ${new Date(cell.date).toLocaleDateString('zh-TW')}`, 'info')
    } else if (cell.expenseCount) {
      // 這是一個分類
      showSnackbar(`分類詳情: ${cell.name} | 共 ${cell.expenseCount} 筆支出 | 總計 NT$ ${cell.value.toLocaleString()}`, 'info')
    } else {
      // 這是根節點
      showSnackbar(`總覽: ${cell.name} | 總計 NT$ ${cell.value.toLocaleString()}`, 'info')
    }
  }

  const tabs = [
    { id: 'network', label: '關係網路圖', icon: '🕸️' },
    { id: 'sankey', label: '資金流向圖', icon: '🌊' },
    { id: 'treemap', label: '樹狀結構圖', icon: '🌳' }
  ]

  if (loading) {
    return (
      <Layout>
        <div className="p-6 flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">載入資料中...</p>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="p-6 space-y-6">
        {/* 標題 */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">互動式資料視覺化</h1>
          <p className="text-gray-600">使用 D3.js 技術的即時資料視覺化展示</p>
          <div className="mt-2 text-sm text-gray-500">
            資料統計: {users.length} 位用戶，{categories.length} 個分類，{expenses.length} 筆支出
          </div>
          {/* 篩選功能暫時關閉，等 API 準備好再啟用
          <div className="mt-4">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                showFilters 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <span className="mr-2">🔍</span>
              篩選選項
              {getFilteredExpenses().length < expenses.length && (
                <span className="ml-2 bg-white bg-opacity-20 px-2 py-1 rounded-full text-xs">
                  已啟用
                </span>
              )}
            </button>
          </div>
          */}
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

        {/* 篩選面板 - 暫時關閉，等 API 準備好再啟用 */}
        {false && showFilters && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">篩選選項</h3>
            {/* 篩選面板內容已暫時關閉 */}
          </div>
        )}

        {/* 視覺化內容 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6">
            {activeTab === 'network' && (
              <div>
                <div className="mb-4">
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">用戶支出關係網路</h3>
                  <p className="text-gray-600">展示用戶、分類和交易之間的關聯性，節點大小代表金額大小</p>
                </div>
                {networkData.nodes.length > 0 ? (
                  <div className="flex justify-center">
                    <NetworkGraph
                      nodes={networkData.nodes}
                      links={networkData.links}
                      width={800}
                      height={500}
                      onNodeClick={handleNodeClick}
                    />
                  </div>
                ) : (
                  <div className="flex justify-center items-center h-64 bg-gray-50 rounded-lg">
                    <p className="text-gray-500">目前沒有足夠的資料來生成網路圖</p>
                  </div>
                )}
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
                {sankeyData.links.length > 0 ? (
                  <div className="flex justify-center">
                    <SankeyDiagram
                      nodes={sankeyData.nodes}
                      links={sankeyData.links}
                      width={800}
                      height={400}
                      onNodeClick={handleNodeClick}
                      onLinkClick={handleLinkClick}
                    />
                  </div>
                ) : (
                  <div className="flex justify-center items-center h-64 bg-gray-50 rounded-lg">
                    <p className="text-gray-500">目前沒有支出資料來生成流向圖</p>
                  </div>
                )}
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
                  <p className="text-gray-600">基於真實分類資料，以面積大小展示各類支出的比重和層級關係</p>
                </div>
                {treemapData.children && treemapData.children.length > 0 ? (
                  <div className="flex justify-center">
                    <TreemapChart
                      data={treemapData}
                      width={800}
                      height={500}
                      onCellClick={handleCellClick}
                    />
                  </div>
                ) : (
                  <div className="flex justify-center items-center h-64 bg-gray-50 rounded-lg">
                    <p className="text-gray-500">目前沒有支出資料來生成樹狀圖</p>
                  </div>
                )}
                <div className="mt-4 text-sm text-gray-500 space-y-1">
                  <p>• 矩形面積代表支出金額</p>
                  <p>• 顏色區分不同支出類別</p>
                  <p>• 點擊區塊查看詳細資訊</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 技術說明與資料狀態 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h4 className="font-semibold text-blue-800 mb-3">🔧 技術特色</h4>
            <div className="text-sm space-y-2">
              <div>
                <h5 className="font-medium text-blue-700 mb-1">即時資料整合</h5>
                <p className="text-blue-600">• 從真實API動態載入用戶、分類和支出資料</p>
              </div>
              <div>
                <h5 className="font-medium text-blue-700 mb-1">互動體驗</h5>
                <p className="text-blue-600">• D3.js 驅動的響應式視覺化圖表</p>
              </div>
              <div>
                <h5 className="font-medium text-blue-700 mb-1">智能分析</h5>
                <p className="text-blue-600">• 自動計算關係網路和資金流向</p>
              </div>
            </div>
          </div>
          
          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <h4 className="font-semibold text-green-800 mb-3">📊 資料來源狀態</h4>
            <div className="text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-green-700">用戶資料:</span>
                <span className="text-green-600 font-medium">{users.length} 筆</span>
              </div>
              <div className="flex justify-between">
                <span className="text-green-700">分類資料:</span>
                <span className="text-green-600 font-medium">{categories.length} 筆</span>
              </div>
              <div className="flex justify-between">
                <span className="text-green-700">支出資料:</span>
                <span className="text-green-600 font-medium">{expenses.length} 筆</span>
              </div>
              <div className="mt-3 pt-2 border-t border-green-200">
                <p className="text-green-600 text-xs">
                  資料每次頁面載入時自動從後端API更新
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}

export default InteractiveVisualization