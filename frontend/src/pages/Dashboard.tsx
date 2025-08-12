import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { useQuery } from '@tanstack/react-query'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  BarElement,
} from 'chart.js'
import { Line, Doughnut, Bar } from 'react-chartjs-2'
import Layout from '../components/Layout'

// 註冊 Chart.js 組件
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  BarElement
)

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
  description: string
  is_income: boolean
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

interface Expense {
  id: number
  amount: string
  description: string
  date: string
  category: number
  category_name: string
  group: number
  group_name: string
  event?: number
  event_name?: string
  user_name: string
  splits: Array<{
    user: number
    user_name: string
    amount: string
  }>
}

// PAPA 文化圖標組件
const PAPAIcons = {
  Sun: () => <span className="papa-sun-icon" />,
  Mountain: () => <span className="papa-mountain-icon" />,
  Wave: () => <span className="papa-wave-icon" />,
  House: () => <span className="papa-house-icon" />,
  Betel: () => <span className="papa-betel-icon" />,
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate()
  const [user, setUser] = useState<User | null>(null)

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
        const categories: Category[] = categoriesRes.data.results || []
        const events: Event[] = eventsRes.data.results || []
        const expenses: Expense[] = expensesRes.data.results || []

        // 計算統計數據
        // 注意：後端儲存邏輯 - 負數代表支出，正數代表收入
        const totalExpenses = expenses.reduce((sum, expense) => {
          const amount = parseFloat(expense.amount)
          // 負數金額代表支出，取絕對值
          return sum + (amount < 0 ? Math.abs(amount) : 0)
        }, 0)

        const totalIncome = expenses.reduce((sum, expense) => {
          const amount = parseFloat(expense.amount)
          // 正數金額代表收入
          return sum + (amount > 0 ? amount : 0)
        }, 0)

        const balance = totalIncome - totalExpenses

        // 按分類統計
        const categoryStats = categories.map(category => {
          const categoryExpenses = expenses.filter(expense => 
            expense.category === category.id
          )
          const total = categoryExpenses.reduce((sum, expense) => 
            sum + Math.abs(parseFloat(expense.amount)), 0
          )
          return { ...category, total, count: categoryExpenses.length }
        })

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

  // 計算月度趨勢 - 保留原有邏輯
  const calculateMonthlyTrend = (expenses: Expense[]) => {
    const monthlyStats: { [key: string]: { income: number, expense: number } } = {}
    
    expenses.forEach(expense => {
      const date = new Date(expense.date)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      const amount = parseFloat(expense.amount)
      
      if (!monthlyStats[monthKey]) {
        monthlyStats[monthKey] = { income: 0, expense: 0 }
      }
      
      // 後端邏輯：正數=收入，負數=支出
      if (amount > 0) {
        monthlyStats[monthKey].income += amount
      } else {
        monthlyStats[monthKey].expense += Math.abs(amount)
      }
    })

    const labels = Object.keys(monthlyStats).sort().slice(-6)
    const incomeData = labels.map(label => monthlyStats[label]?.income || 0)
    const expenseData = labels.map(label => monthlyStats[label]?.expense || 0)

    return { labels, incomeData, expenseData }
  }

  // 圖表配置
  const lineChartData = dashboardData?.monthlyData ? {
    labels: dashboardData.monthlyData.labels.map(label => {
      const [year, month] = label.split('-')
      return `${year}年${month}月`
    }),
    datasets: [
      {
        label: '收入 (部落進項)',
        data: dashboardData.monthlyData.incomeData,
        borderColor: '#4CAF50', // papa-emerald
        backgroundColor: 'rgba(76, 175, 80, 0.1)',
        tension: 0.4,
      },
      {
        label: '支出 (部落開銷)',
        data: dashboardData.monthlyData.expenseData,
        borderColor: '#FF7043', // papa-tide  
        backgroundColor: 'rgba(255, 112, 67, 0.1)',
        tension: 0.4,
      }
    ]
  } : null

  const doughnutData = dashboardData?.categoryStats ? {
    labels: dashboardData.categoryStats.filter(cat => cat.total > 0).map(cat => cat.name),
    datasets: [{
      data: dashboardData.categoryStats.filter(cat => cat.total > 0).map(cat => cat.total),
      backgroundColor: [
        '#4CAF50', // papa-emerald
        '#FF7043', // papa-tide
        '#E91E63', // papa-ocean
        '#FF8F00', // papa-dawn
        '#689F38', // papa-betel
        '#546E7A', // papa-cave
      ],
      borderWidth: 2,
      borderColor: '#FFFFFF',
    }]
  } : null

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
        <section className="rounded-2xl p-6" style={{ backgroundColor: '#543622' }}>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white mb-1">
                歡迎回來，{user?.name || user?.username}
              </h1>
              <p className="text-white/80 text-sm">
                今日記帳管理
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => navigate('/transactions/new')}
                className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
              >
                <span>➕</span>
                <span>新增記錄</span>
              </button>
              <button
                onClick={() => navigate('/transactions')}
                className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
              >
                <span>📊</span>
                <span>查看記錄</span>
              </button>
            </div>
          </div>
        </section>

        {/* 統計卡片網格 - 文化化升級 */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* 總支出 - 上山總額 */}
          <div className="bg-white rounded-lg p-6 shadow-papa-soft hover:shadow-papa-medium transition-all duration-300 border-l-4" style={{ borderLeftColor: '#FF7043', backgroundColor: 'rgba(255, 112, 67, 0.05)' }}>
            <div className="flex items-center gap-4">
              <div className="text-4xl opacity-80">⛰️</div>
              <div>
                <h3 className="text-sm font-medium text-papa-cave mb-1">總支出</h3>
                <p className="text-2xl font-bold" style={{ color: '#FF7043' }}>
                  NT$ {(stats?.totalExpenses || 0).toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          {/* 本月支出 - 本月上山 */}
          <div className="bg-white rounded-lg p-6 shadow-papa-soft hover:shadow-papa-medium transition-all duration-300 border-l-4" style={{ borderLeftColor: '#546E7A', backgroundColor: 'rgba(84, 106, 122, 0.05)' }}>
            <div className="flex items-center gap-4">
              <div className="text-4xl opacity-80">🌙</div>
              <div>
                <h3 className="text-sm font-medium text-papa-cave mb-1">本月支出</h3>
                <p className="text-2xl font-bold" style={{ color: '#546E7A' }}>
                  NT$ {(stats?.totalExpenses || 0).toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          {/* 總收入 - 下海總額 */}
          <div className="bg-white rounded-lg p-6 shadow-papa-soft hover:shadow-papa-medium transition-all duration-300 border-l-4" style={{ borderLeftColor: '#4CAF50', backgroundColor: 'rgba(76, 175, 80, 0.05)' }}>
            <div className="flex items-center gap-4">
              <div className="text-4xl opacity-80">🌊</div>
              <div>
                <h3 className="text-sm font-medium text-papa-cave mb-1">總收入</h3>
                <p className="text-2xl font-bold" style={{ color: '#4CAF50' }}>
                  NT$ {(stats?.totalIncome || 0).toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          {/* 群組管理 - 部落共享 */}
          <div className="bg-white rounded-lg p-6 shadow-papa-soft hover:shadow-papa-medium transition-all duration-300 border-l-4" style={{ borderLeftColor: '#689F38', backgroundColor: 'rgba(104, 159, 56, 0.05)' }}>
            <div className="flex items-center gap-4">
              <div className="text-4xl opacity-80">🏛️</div>
              <div>
                <h3 className="text-sm font-medium text-papa-cave mb-1">管理群組</h3>
                <p className="text-2xl font-bold" style={{ color: '#689F38' }}>
                  {stats?.groupCount || 0}
                </p>
                <span className="text-xs text-papa-cave opacity-60">個群組</span>
              </div>
            </div>
          </div>
        </section>

        {/* 圖表區域 - 文化化升級 */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-2xl p-6 shadow-papa-soft">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold text-papa-stone font-display">
                  收支趨勢
                </h3>
                <p className="text-sm text-papa-cave opacity-70">近6個月收支變化</p>
              </div>
              <div className="text-2xl opacity-60">🌊</div>
            </div>
            <div className="h-80">
              {lineChartData ? (
                <Line 
                  data={lineChartData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { 
                        position: 'top',
                        labels: {
                          usePointStyle: true,
                          font: { size: 12 }
                        }
                      },
                      title: { display: false }
                    },
                    scales: {
                      y: { 
                        beginAtZero: true,
                        grid: {
                          color: 'rgba(84, 106, 122, 0.1)'
                        }
                      },
                      x: {
                        grid: {
                          color: 'rgba(84, 106, 122, 0.1)'
                        }
                      }
                    },
                    elements: {
                      line: {
                        tension: 0.4
                      }
                    }
                  }}
                />
              ) : (
                <div className="flex items-center justify-center h-full text-papa-cave">
                  <div className="text-center">
                    <div className="text-4xl opacity-60 mb-4">🌊</div>
                    <p>暫無數據</p>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <div className="bg-white rounded-2xl p-6 shadow-papa-soft">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold text-papa-stone font-display">支出分類</h3>
              </div>
              <div className="text-2xl opacity-60">⛰️</div>
            </div>
            <div className="h-80">
              {doughnutData ? (
                <Doughnut 
                  data={doughnutData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { 
                        position: 'bottom',
                        labels: {
                          usePointStyle: true,
                          font: { size: 11 }
                        }
                      }
                    }
                  }}
                />
              ) : (
                <div className="flex items-center justify-center h-full text-papa-cave">
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
        <section className="mb-8 bg-white rounded-2xl p-6 shadow-papa-soft">
          <h3 className="text-lg font-bold text-papa-stone mb-4">常用功能</h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button
              className="flex flex-col items-center gap-2 p-4 rounded-xl bg-emerald-50 hover:bg-emerald-100 transition-colors"
              onClick={() => navigate('/transactions/new')}
            >
              <div className="text-2xl">➕</div>
              <span className="text-sm font-medium text-emerald-700">新增記錄</span>
            </button>

            <button
              className="flex flex-col items-center gap-2 p-4 rounded-xl hover:opacity-90 transition-all"
              style={{ backgroundColor: 'rgba(233, 30, 99, 0.1)' }}
              onClick={() => navigate('/transactions')}
            >
              <div className="text-2xl">📊</div>
              <span className="text-sm font-medium" style={{ color: 'var(--papa-ocean-pink)' }}>查看記錄</span>
            </button>

            <button
              className="flex flex-col items-center gap-2 p-4 rounded-xl bg-purple-50 hover:bg-purple-100 transition-colors"
              onClick={() => navigate('/activities')}
            >
              <div className="text-2xl">🎉</div>
              <span className="text-sm font-medium text-purple-700">活動管理</span>
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
              dashboardData.recentTransactions.map((transaction: Expense, index) => (
                <div 
                  key={transaction.id} 
                  className={`flex items-center p-4 cursor-pointer hover:bg-papa-mist/30 transition-colors ${index !== dashboardData.recentTransactions.length - 1 ? 'border-b border-papa-cave/10' : ''}`}
                  onClick={() => navigate(`/transactions/${transaction.id}`)}
                  title="點擊查看詳情"
                >
                  <div className={`flex items-center justify-center w-12 h-12 rounded-full mr-4 ${parseFloat(transaction.amount) > 0 ? 'bg-emerald-50' : 'bg-orange-50'}`}>
                    <span className="text-xl">
                      {parseFloat(transaction.amount) > 0 ? '🌊' : '⛰️'}
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
                  <div className={`text-right font-bold ${parseFloat(transaction.amount) > 0 ? 'text-emerald-600' : 'text-orange-600'}`}>
                    {parseFloat(transaction.amount) > 0 ? '+' : ''}NT$ {Math.abs(parseFloat(transaction.amount)).toLocaleString()}
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
            className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-4 text-white text-center shadow-lg active:scale-95 transition-transform"
          >
            <div className="text-2xl mb-2">➕</div>
            <div className="text-sm font-medium">新增記錄</div>
          </button>
          <button
            onClick={() => navigate('/transactions')}
            className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-4 text-white text-center shadow-lg active:scale-95 transition-transform"
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
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl mb-2">👥</div>
              <p className="text-xs text-gray-600 mb-1">群組数量</p>
              <p className="font-bold text-purple-600 text-sm">{stats?.groupCount || 0}</p>
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
            {dashboardData?.recentTransactions?.slice(0, 5).map((transaction: Expense) => (
              <div 
                key={transaction.id} 
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg active:bg-gray-100 transition-colors"
                onClick={() => navigate(`/transactions/${transaction.id}`)}
              >
                <div className="flex items-center gap-3">
                  <div className="text-lg">
                    {parseFloat(transaction.amount) > 0 ? '🌊' : '⛰️'}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{transaction.description || '交易記錄'}</p>
                    <p className="text-xs text-gray-500">{new Date(transaction.date).toLocaleDateString('zh-TW')}</p>
                  </div>
                </div>
                <div className={`font-bold text-sm ${parseFloat(transaction.amount) > 0 ? 'text-emerald-600' : 'text-orange-600'}`}>
                  {parseFloat(transaction.amount) > 0 ? '+' : ''}NT$ {Math.abs(parseFloat(transaction.amount)).toLocaleString()}
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