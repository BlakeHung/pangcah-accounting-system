import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { useQuery } from '@tanstack/react-query'
import { useSnackbar } from '../contexts/SnackbarContext'
import Layout from '../components/Layout'
import {
  IncomeExpenseTrendChart,
  CategoryPieChart,
  GroupComparisonChart,
  BarChart
} from '../components/Charts'
import { DashboardExpense } from '../types/expense'
import { DashboardConfig } from '../types/dashboard'
import { mockExpenseData, mockCategories } from '../utils/mockData'
import { 
  loadDashboardConfig, 
  checkAndCreateAlerts,
  loadAlertNotifications
} from '../utils/dashboardConfig'

interface User {
  username: string
  name: string
  role: string
  managed_groups?: Array<{
    id: number
    name: string
  }>
}

interface Group {
  id: number
  name: string
  description: string
  managers: User[]
  members: Array<{
    id: number
    username: string
    name: string
  }>
  member_count: number
}

interface Category {
  id: number
  name: string
  type: 'EXPENSE' | 'INCOME'
  is_default: boolean
  created_at?: string
  updated_at?: string
  // 保留舊欄位兼容性
  description?: string
  is_income?: boolean
}

interface Event {
  id: number
  name: string
  description: string
  start_date: string
  end_date: string
  location: string
  group: number
}

// 使用共用的 DashboardExpense 類型定義

// Dashboard 圖標組件
const DashboardIcons = {
  Sun: () => <span>☀️</span>,
  Mountain: () => <span>⛰️</span>,
  Wave: () => <span>🌊</span>,
  House: () => <span>🏠</span>,
  Betel: () => <span>🌿</span>,
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate()
  const { showSnackbar } = useSnackbar()
  const [user, setUser] = useState<User | null>(null)
  const [config, setConfig] = useState<DashboardConfig | null>(null)
  const [unreadNotifications, setUnreadNotifications] = useState(0)

  useEffect(() => {
    const token = localStorage.getItem('access_token')
    const userData = localStorage.getItem('user')
    
    if (!token || !userData) {
      navigate('/login')
      return
    }

    try {
      const parsedUser = JSON.parse(userData)
      setUser(parsedUser)
      
      // 設置 axios 認證頭
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
      
      // 載入儀表板配置
      const dashboardConfig = loadDashboardConfig()
      setConfig(dashboardConfig)
      
      // 載入未讀通知數量
      const notifications = loadAlertNotifications()
      const unread = notifications.filter(n => !n.read).length
      setUnreadNotifications(unread)
    } catch (error) {
      console.error('Failed to parse user data:', error)
      navigate('/login')
    }
  }, [navigate])

  // 獲取統計資料 - 保留原有邏輯
  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => {
      try {
        const [groupsRes, categoriesRes, eventsRes, expensesRes] = await Promise.all([
          axios.get('/api/v1/groups/'),
          axios.get('/api/v1/categories/'),
          axios.get('/api/v1/events/'),
          axios.get('/api/v1/expenses/')
        ])

        const groups: Group[] = groupsRes.data.results || []
        const events: Event[] = eventsRes.data.results || []
        
        // 初始化 expenses 和 categories
        let rawExpenses = expensesRes.data.results || []
        let categories: Category[] = categoriesRes.data.results || []
        
        // 轉換後端數據格式為前端需要的格式
        let expenses: DashboardExpense[] = rawExpenses.map((expense: any) => ({
          id: expense.id,
          amount: expense.amount,
          type: expense.type,
          description: expense.description,
          date: expense.date,
          category: expense.category?.id || expense.category,  // 處理物件或數字的情況
          category_name: expense.category_name || expense.category?.name,
          group: expense.group?.id || expense.group,
          group_name: expense.group_name || expense.group?.name,
          event: expense.event?.id || expense.event,
          event_name: expense.event_name,
          user_name: expense.user?.name || expense.user_name,
          splits: expense.splits || []
        }))
        
        // 如果沒有數據，使用模擬數據進行測試
        const USE_MOCK_DATA = false // 設為 true 可強制使用模擬數據
        if ((expenses.length === 0 && categories.length === 0) || USE_MOCK_DATA) {
          console.log('⚠️ 使用模擬數據進行測試')
          expenses = mockExpenseData as DashboardExpense[]
          categories = mockCategories as Category[]
        }
        
        // 開發模式下顯示調試信息
        if (import.meta.env.DEV) {
          console.log('Dashboard 數據統計 - 總交易數:', expenses.length)
          if (expenses.length === 0) {
            console.warn('⚠️ 後端API無數據，使用模擬數據')
          }
        }

        // 計算統計數據
        // 使用 type 字段來區分收入和支出
        const totalExpenses = expenses.reduce((sum, expense) => {
          if (expense.type === 'EXPENSE') {
            return sum + Math.abs(parseFloat(String(expense.amount)))
          }
          return sum
        }, 0)

        const totalIncome = expenses.reduce((sum, expense) => {
          if (expense.type === 'INCOME') {
            return sum + Math.abs(parseFloat(String(expense.amount)))
          }
          return sum
        }, 0)

        const balance = totalIncome - totalExpenses

        // 按分類統計（只統計支出）
        const categoryStats = categories
          .filter(category => category.type === 'EXPENSE')  // 只處理支出類別
          .map(category => {
            const categoryExpenses = expenses.filter(expense => 
              expense.category === category.id && expense.type === 'EXPENSE'
            )
            const total = categoryExpenses.reduce((sum, expense) => 
              sum + Math.abs(parseFloat(String(expense.amount))), 0
            )
            return { ...category, total, count: categoryExpenses.length }
          })
        
        // 開發模式下顯示分類統計
        if (import.meta.env.DEV && categoryStats.some(c => c.total > 0)) {
          console.log('支出分類統計:', categoryStats.filter(c => c.total > 0).map(c => `${c.name}: NT$${c.total}`).join(', '))
        }

        // 最近交易
        const recentTransactions = expenses
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
          .slice(0, 10)

        // 月度趨勢數據
        const monthlyData = calculateMonthlyTrend(expenses)

        return {
          summary: {
            totalExpenses,
            totalIncome,
            balance,
            groupCount: groups.length,
            eventCount: events.length
          },
          groups,
          categories,
          events,
          expenses,
          categoryStats,
          recentTransactions,
          monthlyData
        }
      } catch (error) {
        console.error('Dashboard data fetch error:', error)
        throw error
      }
    },
    enabled: !!user
  })

  // 計算月度趨勢 - 使用 type 字段
  const calculateMonthlyTrend = (expenses: DashboardExpense[]) => {
    const monthlyStats: { [key: string]: { income: number, expense: number } } = {}
    
    expenses.forEach(expense => {
      const date = new Date(expense.date)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      const amount = Math.abs(parseFloat(String(expense.amount)))
      
      if (!monthlyStats[monthKey]) {
        monthlyStats[monthKey] = { income: 0, expense: 0 }
      }
      
      // 使用 type 字段來區分收入和支出
      if (expense.type === 'INCOME') {
        monthlyStats[monthKey].income += amount
      } else if (expense.type === 'EXPENSE') {
        monthlyStats[monthKey].expense += amount
      }
    })

    const labels = Object.keys(monthlyStats).sort().slice(-6)
    const incomeData = labels.map(label => monthlyStats[label]?.income || 0)
    const expenseData = labels.map(label => monthlyStats[label]?.expense || 0)

    return { labels, incomeData, expenseData }
  }

  // ECharts 組件已直接在 JSX 中使用數據

  if (isLoading) {
    return (
      <Layout user={user}>
        <div className="papa-loading">
          <div className="papa-sun-loading"></div>
          <p className="papa-loading-text">載入中...</p>
        </div>
      </Layout>
    )
  }

  const stats = dashboardData?.summary

  return (
    <Layout user={user} dashboardData={dashboardData}>
      <div className="space-y-8 md:block hidden">
        {/* 桌面版內容 */}
        {/* 歡迎區域與快速操作 */}
        <section className="bg-gradient-to-r from-[#2E8B57] to-[#5F9EA0] rounded-2xl p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white mb-1">
                歡迎回來，{user?.name || user?.username}
              </h1>
              <p className="text-white/90 text-sm">
                今日記帳管理
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => navigate('/transactions/new')}
                className="bg-white text-[#2E8B57] hover:bg-gray-50 px-5 py-2.5 rounded-lg transition-all flex items-center gap-2 font-medium shadow-sm hover:shadow-md"
              >
                <span>➕</span>
                <span>新增記錄</span>
              </button>
              <button
                onClick={() => navigate('/transactions')}
                className="bg-white/20 hover:bg-white/30 text-white px-5 py-2.5 rounded-lg transition-all flex items-center gap-2 backdrop-blur-sm border border-white/20"
              >
                <span>📊</span>
                <span>查看記錄</span>
              </button>
              <button
                onClick={() => navigate('/analytics')}
                className="bg-white/20 hover:bg-white/30 text-white px-5 py-2.5 rounded-lg transition-all flex items-center gap-2 backdrop-blur-sm border border-white/20"
              >
                <span>📈</span>
                <span>進階分析</span>
              </button>
              <button
                onClick={() => navigate('/dashboard/settings')}
                className="bg-white/20 hover:bg-white/30 text-white px-5 py-2.5 rounded-lg transition-all flex items-center gap-2 backdrop-blur-sm border border-white/20"
              >
                <span>⚙️</span>
                <span>個人化設定</span>
              </button>
            </div>
          </div>
        </section>

        {/* 統計卡片網格 - 文化化升級 */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* 總支出 - 上山總額 */}
          <div className="bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-all duration-300 border-l-4 border-l-red-500">
            <div className="flex items-center gap-4">
              <div className="text-4xl opacity-80">⛰️</div>
              <div>
                <h3 className="text-sm font-medium text-gray-600 mb-1">總支出</h3>
                <p className="text-2xl font-bold text-red-600">
                  NT$ {(stats?.totalExpenses || 0).toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          {/* 本月支出 - 本月上山 */}
          <div className="bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-all duration-300 border-l-4 border-l-[#5F9EA0]">
            <div className="flex items-center gap-4">
              <div className="text-4xl opacity-80">🌙</div>
              <div>
                <h3 className="text-sm font-medium text-gray-600 mb-1">本月支出</h3>
                <p className="text-2xl font-bold text-[#5F9EA0]">
                  NT$ {(stats?.totalExpenses || 0).toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          {/* 總收入 - 下海總額 */}
          <div className="bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-all duration-300 border-l-4 border-l-green-500">
            <div className="flex items-center gap-4">
              <div className="text-4xl opacity-80">🌊</div>
              <div>
                <h3 className="text-sm font-medium text-gray-600 mb-1">總收入</h3>
                <p className="text-2xl font-bold text-green-600">
                  NT$ {(stats?.totalIncome || 0).toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          {/* 群組管理 - 部落共享 */}
          <div className="bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-all duration-300 border-l-4 border-l-[#2E8B57]">
            <div className="flex items-center gap-4">
              <div className="text-4xl opacity-80">🏛️</div>
              <div>
                <h3 className="text-sm font-medium text-gray-600 mb-1">管理群組</h3>
                <p className="text-2xl font-bold text-[#2E8B57]">
                  {stats?.groupCount || 0}
                </p>
                <span className="text-xs text-gray-500">個群組</span>
              </div>
            </div>
          </div>
        </section>

        {/* 圖表區域 - 文化化升級 */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold text-gray-800">
                  收支趨勢
                </h3>
                <p className="text-sm text-gray-500">近6個月收支變化</p>
              </div>
              <div className="text-2xl opacity-60">🌊</div>
            </div>
            <div className="h-80">
              {dashboardData?.monthlyData ? (
                <IncomeExpenseTrendChart 
                  data={dashboardData.monthlyData.labels.map((label, index) => ({
                    date: `${label.split('-')[0]}年${label.split('-')[1]}月`,
                    income: dashboardData.monthlyData.incomeData[index],
                    expense: dashboardData.monthlyData.expenseData[index]
                  }))}
                  title="收支趨勢分析"
                  height={320}
                />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  <div className="text-center">
                    <div className="text-4xl opacity-60 mb-4">🌊</div>
                    <p>暫無數據</p>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold text-gray-800">支出分類</h3>
              </div>
              <div className="text-2xl opacity-60">⛰️</div>
            </div>
            <div className="h-80">
              {(() => {
                // 生產環境下移除調試信息
                const hasData = dashboardData?.categoryStats && dashboardData.categoryStats.some(cat => cat.total > 0)
                return hasData
              })() ? (
                <CategoryPieChart 
                  data={dashboardData.categoryStats
                    .filter(cat => cat.total > 0)
                    .map((cat, index) => ({
                      name: cat.name,
                      value: cat.total,
                      color: ['#4CAF50', '#FF7043', '#E91E63', '#FF8F00', '#689F38', '#546E7A'][index % 6]
                    }))}
                  title="支出分類分布"
                  height={320}
                  type="doughnut"
                />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  <div className="text-center">
                    <div className="text-4xl opacity-60 mb-4">⛰️</div>
                    <p>暫無分類數據</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* 快速操作區 */}
        <section className="mb-8 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-4">常用功能</h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button
              className="flex flex-col items-center gap-2 p-4 rounded-xl bg-green-50 hover:bg-green-100 transition-colors border border-green-200"
              onClick={() => navigate('/transactions/new')}
            >
              <div className="text-2xl">➕</div>
              <span className="text-sm font-medium text-green-700">新增記錄</span>
            </button>

            <button
              className="flex flex-col items-center gap-2 p-4 rounded-xl bg-teal-50 hover:bg-teal-100 transition-colors border border-teal-200"
              onClick={() => navigate('/transactions')}
            >
              <div className="text-2xl">📊</div>
              <span className="text-sm font-medium text-teal-700">查看記錄</span>
            </button>

            <button
              className="flex flex-col items-center gap-2 p-4 rounded-xl bg-emerald-50 hover:bg-emerald-100 transition-colors border border-emerald-200"
              onClick={() => navigate('/activities')}
            >
              <div className="text-2xl">🎉</div>
              <span className="text-sm font-medium text-emerald-700">活動管理</span>
            </button>

            <button
              className="flex flex-col items-center gap-2 p-4 rounded-xl bg-orange-50 hover:bg-orange-100 transition-colors"
              onClick={() => navigate('/groups')}
            >
              <div className="text-2xl">👥</div>
              <span className="text-sm font-medium text-orange-700">群組管理</span>
            </button>
          </div>
        </section>

        {/* 最近交易 */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-papa-stone">
              最近交易
            </h3>
            <button 
              onClick={() => navigate('/transactions')}
              className="text-papa-ocean font-medium hover:text-papa-ocean/80 text-sm flex items-center gap-1"
            >
              查看全部 →
            </button>
          </div>
          <div className="bg-white rounded-2xl shadow-papa-soft overflow-hidden" style={{ backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(84, 54, 34, 0.005) 10px, rgba(84, 54, 34, 0.005) 20px)' }}>
            {dashboardData?.recentTransactions?.length > 0 ? (
              dashboardData.recentTransactions.map((transaction: DashboardExpense, index) => (
                <div 
                  key={transaction.id} 
                  className={`flex items-center p-4 cursor-pointer hover:bg-papa-mist/30 transition-colors ${index !== dashboardData.recentTransactions.length - 1 ? 'border-b border-papa-cave/10' : ''}`}
                  onClick={() => navigate(`/transactions/${transaction.id}`)}
                  title="點擊查看詳情"
                >
                  <div className={`flex items-center justify-center w-12 h-12 rounded-full mr-4 ${transaction.type === 'INCOME' ? 'bg-emerald-50' : 'bg-orange-50'}`}>
                    <span className="text-xl">
                      {transaction.type === 'INCOME' ? '🌊' : '⛰️'}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-papa-stone truncate">
                      {transaction.description || '交易記錄'}
                    </p>
                    <p className="text-sm text-papa-cave opacity-70">
                      {transaction.category_name || '一般分類'} • 
                      {transaction.group_name} • 
                      {new Date(transaction.date).toLocaleDateString('zh-TW')}
                    </p>
                  </div>
                  <div className={`text-right font-bold ${transaction.type === 'INCOME' ? 'text-emerald-600' : 'text-orange-600'}`}>
                    {transaction.type === 'INCOME' ? '+' : ''}NT$ {Math.abs(parseFloat(String(transaction.amount))).toLocaleString()}
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-papa-cave">
                <div className="text-4xl mb-4 opacity-50">☀️</div>
                <p>暫無交易記錄</p>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* 移動版內容 */}
      <div className="block md:hidden">
        {/* 快速動作卡片 */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <button
            onClick={() => navigate('/transactions/new')}
            className="bg-gradient-to-br from-[#5F9EA0] to-[#2E8B57] rounded-2xl p-4 text-white text-center shadow-lg active:scale-95 transition-transform"
          >
            <div className="text-2xl mb-2">➕</div>
            <div className="text-sm font-medium">新增記錄</div>
          </button>
          <button
            onClick={() => navigate('/transactions')}
            className="bg-gradient-to-br from-[#F08080] to-[#CD853F] rounded-2xl p-4 text-white text-center shadow-lg active:scale-95 transition-transform"
          >
            <div className="text-2xl mb-2">📊</div>
            <div className="text-sm font-medium">查看記錄</div>
          </button>
        </div>
        
        {/* 餘額顯示卡片 */}
        <div className="bg-gradient-to-br from-emerald-400 to-emerald-500 rounded-2xl p-6 text-white text-center shadow-lg mb-6">
          <div className="text-sm opacity-90 mb-2">目前餘額</div>
          <div className="text-3xl font-bold mb-2">
            NT$ {((stats?.totalIncome || 0) - (stats?.totalExpenses || 0)).toLocaleString()}
          </div>
          <div className="text-xs opacity-80">
            收入 NT${(stats?.totalIncome || 0).toLocaleString()} - 支出 NT${(stats?.totalExpenses || 0).toLocaleString()}
          </div>
        </div>
        
        <div className="bg-white rounded-2xl p-6 shadow-lg">
          <h3 className="text-lg font-bold text-gray-800 mb-4 text-center">財務概覽</h3>
          
          <div className="grid grid-cols-2 gap-4">
            {/* 總收入 */}
            <div className="text-center p-4 bg-emerald-50 rounded-lg">
              <div className="text-2xl mb-2">🌊</div>
              <p className="text-xs text-gray-600 mb-1">總收入</p>
              <p className="font-bold text-emerald-600 text-sm">NT$ {(stats?.totalIncome || 0).toLocaleString()}</p>
            </div>
            
            {/* 總支出 */}
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-2xl mb-2">⛰️</div>
              <p className="text-xs text-gray-600 mb-1">總支出</p>
              <p className="font-bold text-orange-600 text-sm">NT$ {(stats?.totalExpenses || 0).toLocaleString()}</p>
            </div>
            
            {/* 群組数量 */}
            <div className="text-center p-4 bg-emerald-50 rounded-lg">
              <div className="text-2xl mb-2">👥</div>
              <p className="text-xs text-gray-600 mb-1">群組数量</p>
              <p className="font-bold text-emerald-600 text-sm">{stats?.groupCount || 0}</p>
            </div>
            
            {/* 活動数量 */}
            <div className="text-center p-4 rounded-lg" style={{ backgroundColor: 'rgba(233, 30, 99, 0.1)' }}>
              <div className="text-2xl mb-2">🎉</div>
              <p className="text-xs text-gray-600 mb-1">活動数量</p>
              <p className="font-bold text-sm" style={{ color: 'var(--papa-ocean-pink)' }}>{stats?.eventCount || 0}</p>
            </div>
          </div>
        </div>
        
        {/* 最近交易 */}
        <div className="mt-6 bg-white rounded-2xl p-6 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-800">最近交易</h3>
            <button 
              onClick={() => navigate('/transactions')}
              className="text-sm font-medium"
              style={{ color: 'var(--papa-ocean-pink)' }}
            >
              查看全部
            </button>
          </div>
          <div className="space-y-3">
            {dashboardData?.recentTransactions?.slice(0, 5).map((transaction: DashboardExpense) => (
              <div 
                key={transaction.id} 
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg active:bg-gray-100 transition-colors"
                onClick={() => navigate(`/transactions/${transaction.id}`)}
              >
                <div className="flex items-center gap-3">
                  <div className="text-lg">
                    {transaction.type === 'INCOME' ? '🌊' : '⛰️'}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{transaction.description || '交易記錄'}</p>
                    <p className="text-xs text-gray-500">{new Date(transaction.date).toLocaleDateString('zh-TW')}</p>
                  </div>
                </div>
                <div className={`font-bold text-sm ${transaction.type === 'INCOME' ? 'text-emerald-600' : 'text-orange-600'}`}>
                  {transaction.type === 'INCOME' ? '+' : ''}NT$ {Math.abs(parseFloat(String(transaction.amount))).toLocaleString()}
                </div>
              </div>
            ))}
            {(!dashboardData?.recentTransactions || dashboardData.recentTransactions.length === 0) && (
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-2">📊</div>
                <p className="text-sm">還沒有交易記錄</p>
                <button
                  onClick={() => navigate('/transactions/new')}
                  className="mt-2 text-sm font-medium"
                  style={{ color: 'var(--papa-ocean-pink)' }}
                >
                  立即新增一筆
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  )
}

export default Dashboard