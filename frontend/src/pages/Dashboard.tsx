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
import './Dashboard.css'

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
    name: string
    user?: User
    is_system_user: boolean
  }>
  member_count: number
  created_at: string
}

interface Category {
  id: number
  name: string
  type: 'EXPENSE' | 'INCOME'
  color: string
  is_default: boolean
  created_at: string
}

interface Activity {
  id: number
  name: string
  description: string
  status: 'ACTIVE' | 'COMPLETED' | 'PLANNED' | 'CANCELLED'
  start_date: string
  end_date?: string
  budget?: number
  group: {
    id: number
    name: string
  }
  created_by: User
  managers: User[]
  created_at: string
}

interface Expense {
  id: number
  amount: number
  type: 'EXPENSE' | 'INCOME'
  date: string
  description: string
  user: User
  category: Category
  event?: Activity
  group?: Group
  created_at: string
}

interface DashboardStats {
  totalExpenses: number
  monthlyExpenses: number
  activeEvents: number
  totalCategories: number
  managedGroups: number
  participatingGroups: number
  expensesTrend: Array<{
    date: string
    amount: number
  }>
  categoryDistribution: Array<{
    category: string
    amount: number
  }>
  groupExpenses: Array<{
    groupName: string
    amount: number
  }>
}

const Dashboard: React.FC = () => {
  const [user, setUser] = useState<User | null>(null)
  const navigate = useNavigate()

  // 檢查登入狀態
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
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
    } catch (error) {
      console.error('用戶資料解析失敗:', error)
      navigate('/login')
    }
  }, [navigate])

  // 使用 React Query 獲取數據
  const { data: groups = [], isLoading: groupsLoading } = useQuery({
    queryKey: ['groups'],
    queryFn: async () => {
      try {
        const response = await axios.get('/api/v1/groups/')
        return Array.isArray(response.data.results) ? response.data.results : 
               Array.isArray(response.data) ? response.data : []
      } catch (error) {
        console.warn('Failed to fetch groups:', error)
        return []
      }
    },
    enabled: !!user,
    retry: 2,
  })

  const { data: categories = [], isLoading: categoriesLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      try {
        const response = await axios.get('/api/v1/categories/')
        return Array.isArray(response.data.results) ? response.data.results : 
               Array.isArray(response.data) ? response.data : []
      } catch (error) {
        console.warn('Failed to fetch categories:', error)
        return []
      }
    },
    enabled: !!user,
    retry: 2,
  })

  const { data: activities = [], isLoading: activitiesLoading } = useQuery({
    queryKey: ['activities'],
    queryFn: async () => {
      try {
        const response = await axios.get('/api/v1/events/')
        return Array.isArray(response.data.results) ? response.data.results : 
               Array.isArray(response.data) ? response.data : []
      } catch (error) {
        console.warn('Failed to fetch activities:', error)
        return []
      }
    },
    enabled: !!user,
    retry: 2,
  })

  const { data: expenses = [], isLoading: expensesLoading, error: expensesError } = useQuery({
    queryKey: ['expenses'],
    queryFn: async () => {
      try {
        const response = await axios.get('/api/v1/expenses/')
        return Array.isArray(response.data.results) ? response.data.results : 
               Array.isArray(response.data) ? response.data : []
      } catch (error) {
        console.warn('Failed to fetch expenses:', error)
        return []
      }
    },
    enabled: !!user,
    retry: 2,
  })

  // 計算真實統計數據
  const calculateStats = (): DashboardStats => {
    if (!user) {
      return {
        totalExpenses: 0,
        monthlyExpenses: 0,
        activeEvents: 0,
        totalCategories: 0,
        managedGroups: 0,
        participatingGroups: 0,
        expensesTrend: [],
        categoryDistribution: [],
        groupExpenses: []
      }
    }

    // 群組統計 - 檢查 managed_groups 而不是 managers 數組
    const managedGroups = user.managed_groups ? user.managed_groups.length : 0
    const participatingGroups = groups.filter(group =>
      group.members.some(member => 
        member.user && member.user.username === user.username
      )
    ).length

    // 活動統計
    const activeEvents = activities.filter(activity => 
      activity.status === 'ACTIVE' || activity.status === 'PLANNED'
    ).length

    // 分類統計
    const expenseCategories = categories.filter(cat => cat.type === 'EXPENSE')
    const totalCategories = expenseCategories.length
    // 支出統計（使用真實數據）
    const totalExpenses = expenses.reduce((sum: number, expense: any) => 
      sum + parseFloat(expense.amount || 0), 0)
    
    const currentMonth = new Date().getMonth()
    const currentYear = new Date().getFullYear()
    const monthlyExpenses = expenses
      .filter((expense: any) => {
        const expenseDate = new Date(expense.date || expense.created_at)
        return expenseDate.getMonth() === currentMonth && 
               expenseDate.getFullYear() === currentYear
      })
      .reduce((sum: number, expense: any) => sum + parseFloat(expense.amount || 0), 0)

    // 真實的月度趨勢數據（過去6個月）
    const expensesTrend = Array.from({ length: 6 }, (_, i) => {
      const date = new Date()
      date.setMonth(date.getMonth() - 5 + i)
      const monthExpenses = expenses
        .filter((expense: any) => {
          const expenseDate = new Date(expense.date || expense.created_at)
          return expenseDate.getMonth() === date.getMonth() && 
                 expenseDate.getFullYear() === date.getFullYear()
        })
        .reduce((sum: number, expense: any) => sum + parseFloat(expense.amount || 0), 0)
      
      return {
        date: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`,
        amount: monthExpenses
      }
    })

    // 真實的分類分布數據
    const categoryDistribution = expenseCategories.map(category => {
      const categoryExpenses = expenses
        .filter((expense: any) => expense.category && expense.category.id === category.id)
        .reduce((sum: number, expense: any) => sum + parseFloat(expense.amount || 0), 0)
      
      return {
        category: category.name,
        amount: categoryExpenses
      }
    }).filter(item => item.amount > 0) // 只顯示有支出的分類

    // 調試信息
    console.log('🔍 分類分布調試信息:')
    console.log('expenseCategories:', expenseCategories)
    console.log('expenses count:', expenses.length)
    console.log('expenses sample:', expenses.slice(0, 2))
    console.log('categoryDistribution result:', categoryDistribution)
    
    // 詳細調試每個分類的匹配情況
    expenseCategories.forEach(category => {
      const matchingExpenses = expenses.filter((expense: any) => 
        expense.category && expense.category.id === category.id
      )
      console.log(`分類 ${category.name} (ID: ${category.id}):`, matchingExpenses.length, '筆支出')
      if (matchingExpenses.length > 0) {
        console.log('  樣本:', matchingExpenses[0])
      }
    })

    // 真實的群組支出分布
    const groupExpenses = groups.map(group => {
      const groupExpensesAmount = expenses
        .filter((expense: any) => expense.group && expense.group.id === group.id)
        .reduce((sum: number, expense: any) => sum + parseFloat(expense.amount || 0), 0)
      
      return {
        groupName: group.name,
        amount: groupExpensesAmount
      }
    }).filter(item => item.amount > 0) // 只顯示有支出的群組

    return {
      totalExpenses,
      monthlyExpenses,
      activeEvents,
      totalCategories,
      managedGroups,
      participatingGroups,
      expensesTrend,
      categoryDistribution,
      groupExpenses
    }
  }

  const stats = calculateStats()
  
  // 用戶要求的測試輸出
  console.log('📊 stats.categoryDistribution:', stats.categoryDistribution)


  // 趨勢圖表配置
  const trendChartData = {
    labels: stats.expensesTrend.map(item => {
      const date = new Date(item.date + '-01')
      return `${date.getFullYear()}年${date.getMonth() + 1}月`
    }),
    datasets: [
      {
        label: '月度支出 (NT$)',
        data: stats.expensesTrend.map(item => item.amount),
        borderColor: 'rgb(102, 126, 234)',
        backgroundColor: 'rgba(102, 126, 234, 0.1)',
        tension: 0.4,
        fill: true,
        pointBackgroundColor: 'rgb(102, 126, 234)',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 5,
      },
    ],
  }

  // 分類分布圖表配置
  const categoryChartData = {
    labels: stats.categoryDistribution.map(item => item.category),
    datasets: [
      {
        data: stats.categoryDistribution.map(item => item.amount),
        backgroundColor: [
          'rgba(102, 126, 234, 0.8)',
          'rgba(118, 75, 162, 0.8)',
          'rgba(255, 159, 64, 0.8)',
          'rgba(255, 99, 132, 0.8)',
          'rgba(34, 197, 94, 0.8)',
          'rgba(59, 130, 246, 0.8)',
        ],
        borderWidth: 0,
      },
    ],
  }

  // 群組支出分布圖表配置
  const groupExpensesChartData = {
    labels: stats.groupExpenses.map(item => item.groupName),
    datasets: [
      {
        label: '群組支出',
        data: stats.groupExpenses.map(item => item.amount),
        backgroundColor: [
          'rgba(34, 197, 94, 0.8)',
          'rgba(59, 130, 246, 0.8)',
          'rgba(168, 85, 247, 0.8)',
          'rgba(236, 72, 153, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(239, 68, 68, 0.8)',
        ],
        borderWidth: 0,
      },
    ],
  }

  if (!user) {
    return (
      <div className="loading-container">
        <div className="loading-spinner">載入中...</div>
      </div>
    )
  }

  // 顯示載入狀態
  if (groupsLoading || categoriesLoading || activitiesLoading || expensesLoading) {
    return (
      <Layout user={user}>
        <div className="loading-container">
          <div className="loading-spinner">載入統計數據中...</div>
        </div>
      </Layout>
    )
  }

  // 顯示錯誤狀態（如果有錯誤但仍有部分資料）
  if (expensesError && expenses.length === 0) {
    console.warn('Dashboard expenses loading error:', expensesError)
  }

  return (
    <Layout user={user}>
      <div className="dashboard-content">
        {/* 統計卡片 */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">💰</div>
            <div className="stat-content">
              <h3>總支出</h3>
              <p className="stat-value">NT$ {stats.totalExpenses.toLocaleString()}</p>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">📅</div>
            <div className="stat-content">
              <h3>本月支出</h3>
              <p className="stat-value">NT$ {stats.monthlyExpenses.toLocaleString()}</p>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">👑</div>
            <div className="stat-content">
              <h3>管理群組</h3>
              <p className="stat-value">{stats.managedGroups} 個</p>
              {user.role === 'ADMIN' && <small>（超級管理員）</small>}
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">👥</div>
            <div className="stat-content">
              <h3>參與群組</h3>
              <p className="stat-value">{stats.participatingGroups} 個</p>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">🎉</div>
            <div className="stat-content">
              <h3>進行中活動</h3>
              <p className="stat-value">{stats.activeEvents} 個</p>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">📊</div>
            <div className="stat-content">
              <h3>支出分類</h3>
              <p className="stat-value">{stats.totalCategories} 類</p>
            </div>
          </div>
        </div>

        {/* 圖表區域 */}
        <div className="charts-grid">
          <div className="chart-card">
            <h3>支出趨勢</h3>
            <div className="chart-container">
              <Line 
                data={trendChartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      display: false,
                    },
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      ticks: {
                        callback: function(value: any) {
                          return 'NT$ ' + Number(value).toLocaleString()
                        }
                      }
                    },
                    x: {
                      ticks: {
                        maxRotation: 45
                      }
                    }
                  }
                }}
              />
            </div>
          </div>

          <div className="chart-card">
            <h3>分類分布</h3>
            <div className="chart-container">
              {stats.categoryDistribution.length > 0 ? (
                <Doughnut 
                  data={categoryChartData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'bottom' as const,
                      },
                      tooltip: {
                        callbacks: {
                          label: function(context: any) {
                            const label = context.label || ''
                            const value = Number(context.raw || context.parsed || 0)
                            const total = context.dataset.data.reduce((sum: number, val: number) => sum + val, 0)
                            const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0
                            return `${label}: NT$ ${value.toLocaleString()} (${percentage}%)`
                          }
                        }
                      }
                    },
                  }}
                />
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#718096' }}>
                  暫無分類分布資料
                </div>
              )}
            </div>
          </div>

          {stats.groupExpenses.length > 0 && (
            <div className="chart-card">
              <h3>群組支出分布</h3>
              <div className="chart-container">
                <Bar 
                  data={groupExpensesChartData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        display: false,
                      },
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        ticks: {
                          callback: function(value: any) {
                            return 'NT$ ' + Number(value).toLocaleString()
                          }
                        }
                      },
                      x: {
                        ticks: {
                          maxRotation: 45
                        }
                      }
                    }
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* 快速操作 */}
        <div className="quick-actions">
          <h3>快速操作</h3>
          <div className="actions-grid">
            <button 
              className="action-button"
              onClick={() => navigate('/transactions/new')}
            >
              <span className="action-icon">➕</span>
              新增支出
            </button>
            {(user.role === 'ADMIN' || (user.managed_groups && user.managed_groups.length > 0)) && (
              <button 
                className="action-button"
                onClick={() => navigate('/activities/new')}
              >
                <span className="action-icon">🎯</span>
                創建活動
              </button>
            )}
            <button 
              className="action-button"
              onClick={() => navigate('/groups')}
            >
              <span className="action-icon">👥</span>
              管理群組
            </button>
            <button 
              className="action-button"
              onClick={() => navigate('/analytics')}
            >
              <span className="action-icon">📈</span>
              查看報表
            </button>
          </div>
        </div>
      </div>
    </Layout>
  )
}

export default Dashboard