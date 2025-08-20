import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import Layout from '../components/Layout'
import DateRangeFilter, { calculateDateRange, DateRange } from '../components/DateRangeFilter'
import {
  BarChart,
  AreaChart,
  CategoryPieChart,
  IncomeExpenseTrendChart
} from '../components/Charts'
import { DashboardExpense } from '../types/expense'
import { exportToCSV, exportStatsToCSV, exportToPDF } from '../utils/exportUtils'

interface User {
  id: number
  username: string
  name: string
  role: string
}

interface AnalyticsData {
  expenses: DashboardExpense[]
  summary: {
    totalIncome: number
    totalExpense: number
    netAmount: number
    transactionCount: number
    averageExpense: number
    averageIncome: number
  }
  topCategories: Array<{
    name: string
    value: number
    type: 'INCOME' | 'EXPENSE'
    percentage: number
  }>
  monthlyComparison: Array<{
    month: string
    currentYear: number
    lastYear: number
  }>
  groupAnalytics: Array<{
    groupName: string
    totalExpense: number
    totalIncome: number
    memberCount: number
  }>
}

const Analytics: React.FC = () => {
  const navigate = useNavigate()
  const [user, setUser] = useState<User | null>(null)
  const [selectedRange, setSelectedRange] = useState('month')
  const [customStartDate, setCustomStartDate] = useState('')
  const [customEndDate, setCustomEndDate] = useState('')
  const [activeTab, setActiveTab] = useState<'overview' | 'trends' | 'categories' | 'comparison'>('overview')

  useEffect(() => {
    const token = localStorage.getItem('access_token')
    const userData = localStorage.getItem('user')
    
    if (!token || !userData) {
      navigate('/login')
      return
    }
    
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
    setUser(JSON.parse(userData))
  }, [navigate])

  // 計算實際日期範圍
  const getDateRange = (): DateRange => {
    if (selectedRange === 'custom' && customStartDate && customEndDate) {
      return {
        startDate: customStartDate,
        endDate: customEndDate,
        label: '自訂範圍'
      }
    }
    return calculateDateRange(selectedRange)
  }

  const dateRange = getDateRange()

  // 獲取分析數據
  const { data: analyticsData, isLoading } = useQuery({
    queryKey: ['analytics', dateRange.startDate, dateRange.endDate],
    queryFn: async (): Promise<AnalyticsData> => {
      try {
        // 獲取支出記錄
        const expensesRes = await axios.get('/api/v1/expenses/', {
          params: {
            start_date: dateRange.startDate,
            end_date: dateRange.endDate
          }
        })
        
        const expenses: DashboardExpense[] = (expensesRes.data.results || expensesRes.data).map((expense: any) => ({
          id: expense.id,
          amount: expense.amount,
          type: expense.type,
          date: expense.date,
          description: expense.description,
          category: expense.category?.id || expense.category,
          category_name: expense.category_name || expense.category?.name,
          group: expense.group?.id || expense.group,
          group_name: expense.group_name || expense.group?.name,
          user_name: expense.user_name || expense.user?.name
        }))

        // 計算統計數據
        const totalIncome = expenses
          .filter(e => e.type === 'INCOME')
          .reduce((sum, e) => sum + Math.abs(parseFloat(String(e.amount))), 0)
        
        const totalExpense = expenses
          .filter(e => e.type === 'EXPENSE')
          .reduce((sum, e) => sum + Math.abs(parseFloat(String(e.amount))), 0)

        const incomeTransactions = expenses.filter(e => e.type === 'INCOME')
        const expenseTransactions = expenses.filter(e => e.type === 'EXPENSE')

        // 計算分類統計
        const categoryStats = new Map<string, { value: number, type: 'INCOME' | 'EXPENSE' }>()
        expenses.forEach(expense => {
          const key = expense.category_name || '未分類'
          const current = categoryStats.get(key) || { value: 0, type: expense.type }
          categoryStats.set(key, {
            value: current.value + Math.abs(parseFloat(String(expense.amount))),
            type: expense.type
          })
        })

        const topCategories = Array.from(categoryStats.entries())
          .map(([name, data]) => ({
            name,
            value: data.value,
            type: data.type,
            percentage: data.type === 'EXPENSE' 
              ? (data.value / totalExpense) * 100
              : (data.value / totalIncome) * 100
          }))
          .sort((a, b) => b.value - a.value)
          .slice(0, 10)

        // 計算月度對比
        const currentYear = new Date().getFullYear()
        const monthlyData = new Map<string, { current: number, last: number }>()
        
        expenses.forEach(expense => {
          const date = new Date(expense.date)
          const year = date.getFullYear()
          const month = date.getMonth() + 1
          const monthKey = `${month}月`
          
          const current = monthlyData.get(monthKey) || { current: 0, last: 0 }
          const amount = Math.abs(parseFloat(String(expense.amount)))
          
          if (year === currentYear) {
            current.current += amount
          } else if (year === currentYear - 1) {
            current.last += amount
          }
          
          monthlyData.set(monthKey, current)
        })

        const monthlyComparison = Array.from(monthlyData.entries())
          .map(([month, data]) => ({
            month,
            currentYear: data.current,
            lastYear: data.last
          }))

        // 群組分析
        const groupStats = new Map<string, { expense: number, income: number, count: number }>()
        expenses.forEach(expense => {
          const groupName = expense.group_name || '個人'
          const current = groupStats.get(groupName) || { expense: 0, income: 0, count: 0 }
          const amount = Math.abs(parseFloat(String(expense.amount)))
          
          if (expense.type === 'EXPENSE') {
            current.expense += amount
          } else {
            current.income += amount
          }
          current.count++
          
          groupStats.set(groupName, current)
        })

        const groupAnalytics = Array.from(groupStats.entries())
          .map(([groupName, data]) => ({
            groupName,
            totalExpense: data.expense,
            totalIncome: data.income,
            memberCount: data.count
          }))

        return {
          expenses,
          summary: {
            totalIncome,
            totalExpense,
            netAmount: totalIncome - totalExpense,
            transactionCount: expenses.length,
            averageExpense: expenseTransactions.length > 0 
              ? totalExpense / expenseTransactions.length 
              : 0,
            averageIncome: incomeTransactions.length > 0 
              ? totalIncome / incomeTransactions.length 
              : 0
          },
          topCategories,
          monthlyComparison,
          groupAnalytics
        }
      } catch (error) {
        console.error('Failed to fetch analytics data:', error)
        throw error
      }
    },
    enabled: !!user
  })

  if (isLoading) {
    return (
      <Layout user={user}>
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-[#2E8B57] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">載入分析數據中...</p>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout user={user}>
      <div id="analytics-content" className="space-y-6">
        {/* 頁面標題 */}
        <div className="bg-white rounded-xl p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-800 mb-2 flex items-center gap-2">
                <span className="text-2xl">📈</span>
                進階分析
              </h1>
              <p className="text-gray-600">
                深入分析您的財務數據 - {dateRange.label}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {/* 導出按鈕 */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    if (analyticsData?.expenses) {
                      exportToCSV(analyticsData.expenses, `財務資料_${dateRange.label}`)
                    }
                  }}
                  className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg transition-colors text-sm font-medium flex items-center gap-1"
                  disabled={!analyticsData?.expenses}
                >
                  <span>📊</span>
                  <span>CSV</span>
                </button>
                <button
                  onClick={() => {
                    if (analyticsData) {
                      exportStatsToCSV(
                        analyticsData.summary,
                        analyticsData.topCategories,
                        `統計報表_${dateRange.label}`
                      )
                    }
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg transition-colors text-sm font-medium flex items-center gap-1"
                  disabled={!analyticsData}
                >
                  <span>📋</span>
                  <span>報表</span>
                </button>
                <button
                  onClick={() => exportToPDF('analytics-content', `財務分析報表_${dateRange.label}`)}
                  className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg transition-colors text-sm font-medium flex items-center gap-1"
                >
                  <span>📄</span>
                  <span>PDF</span>
                </button>
              </div>
              <button
                onClick={() => navigate('/dashboard')}
                className="text-gray-600 hover:text-gray-800 transition-colors"
              >
                返回儀表板
              </button>
            </div>
          </div>
        </div>

        {/* 時間範圍篩選 */}
        <DateRangeFilter
          selectedRange={selectedRange}
          onRangeChange={setSelectedRange}
          customStartDate={customStartDate}
          customEndDate={customEndDate}
          onCustomDateChange={(start, end) => {
            setCustomStartDate(start)
            setCustomEndDate(end)
          }}
        />

        {/* 統計摘要卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg p-6 shadow-sm border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">總收入</p>
                <p className="text-2xl font-bold text-green-600">
                  NT$ {analyticsData?.summary.totalIncome.toLocaleString() || 0}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  平均: NT$ {analyticsData?.summary.averageIncome.toLocaleString() || 0}
                </p>
              </div>
              <span className="text-3xl">💰</span>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border-l-4 border-red-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">總支出</p>
                <p className="text-2xl font-bold text-red-600">
                  NT$ {analyticsData?.summary.totalExpense.toLocaleString() || 0}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  平均: NT$ {analyticsData?.summary.averageExpense.toLocaleString() || 0}
                </p>
              </div>
              <span className="text-3xl">💸</span>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">淨額</p>
                <p className={`text-2xl font-bold ${
                  (analyticsData?.summary.netAmount || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  NT$ {analyticsData?.summary.netAmount.toLocaleString() || 0}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {(analyticsData?.summary.netAmount || 0) >= 0 ? '盈餘' : '赤字'}
                </p>
              </div>
              <span className="text-3xl">⚖️</span>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border-l-4 border-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">交易筆數</p>
                <p className="text-2xl font-bold text-purple-600">
                  {analyticsData?.summary.transactionCount || 0}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {dateRange.label}期間
                </p>
              </div>
              <span className="text-3xl">📊</span>
            </div>
          </div>
        </div>

        {/* 分頁導航 */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {[
                { key: 'overview', label: '總覽', icon: '📊' },
                { key: 'trends', label: '趨勢分析', icon: '📈' },
                { key: 'categories', label: '分類分析', icon: '🏷️' },
                { key: 'comparison', label: '期間對比', icon: '🔄' }
              ].map(tab => (
                <button
                  key={tab.key}
                  className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                    activeTab === tab.key
                      ? 'border-[#2E8B57] text-[#2E8B57]'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                  onClick={() => setActiveTab(tab.key as any)}
                >
                  <span className="mr-2">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* 分頁內容 */}
          <div className="p-6">
            {activeTab === 'overview' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 收支趨勢面積圖 */}
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="h-80">
                    {analyticsData?.expenses && (
                      <AreaChart
                        title="收支趨勢"
                        data={(() => {
                          const dailyData = new Map<string, { income: number, expense: number }>()
                          analyticsData.expenses.forEach(expense => {
                            const date = expense.date.split('T')[0]
                            const current = dailyData.get(date) || { income: 0, expense: 0 }
                            const amount = Math.abs(parseFloat(String(expense.amount)))
                            
                            if (expense.type === 'INCOME') {
                              current.income += amount
                            } else {
                              current.expense += amount
                            }
                            
                            dailyData.set(date, current)
                          })
                          
                          return Array.from(dailyData.entries())
                            .sort((a, b) => a[0].localeCompare(b[0]))
                            .map(([date, data]) => ({
                              date: new Date(date).toLocaleDateString('zh-TW'),
                              income: data.income,
                              expense: data.expense
                            }))
                        })()}
                      />
                    )}
                  </div>
                </div>

                {/* 分類餅圖 */}
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="h-80">
                    {analyticsData?.topCategories && (
                      <CategoryPieChart
                        title="支出分類分佈"
                        data={analyticsData.topCategories
                          .filter(cat => cat.type === 'EXPENSE')
                          .map(cat => ({
                            name: cat.name,
                            value: cat.value,
                            percentage: cat.percentage
                          }))}
                        mode="pie"
                      />
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'trends' && (
              <div className="space-y-6">
                {/* 月度趨勢 */}
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="h-96">
                    {analyticsData?.expenses && (
                      <IncomeExpenseTrendChart
                        data={(() => {
                          const monthlyData = new Map<string, { income: number, expense: number }>()
                          analyticsData.expenses.forEach(expense => {
                            const date = new Date(expense.date)
                            const monthKey = `${date.getFullYear()}年${date.getMonth() + 1}月`
                            const current = monthlyData.get(monthKey) || { income: 0, expense: 0 }
                            const amount = Math.abs(parseFloat(String(expense.amount)))
                            
                            if (expense.type === 'INCOME') {
                              current.income += amount
                            } else {
                              current.expense += amount
                            }
                            
                            monthlyData.set(monthKey, current)
                          })
                          
                          return Array.from(monthlyData.entries())
                            .sort((a, b) => a[0].localeCompare(b[0]))
                            .map(([date, data]) => ({
                              date,
                              income: data.income,
                              expense: data.expense
                            }))
                        })()}
                      />
                    )}
                  </div>
                </div>

                {/* 每日平均 */}
                <div className="bg-gray-50 rounded-xl p-4">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">每日平均統計</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center">
                      <p className="text-sm text-gray-600">平均每日收入</p>
                      <p className="text-2xl font-bold text-green-600">
                        NT$ {Math.round((analyticsData?.summary.totalIncome || 0) / 30).toLocaleString()}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-600">平均每日支出</p>
                      <p className="text-2xl font-bold text-red-600">
                        NT$ {Math.round((analyticsData?.summary.totalExpense || 0) / 30).toLocaleString()}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-600">平均每日淨額</p>
                      <p className={`text-2xl font-bold ${
                        (analyticsData?.summary.netAmount || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        NT$ {Math.round((analyticsData?.summary.netAmount || 0) / 30).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'categories' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 支出分類柱狀圖 */}
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="h-80">
                    {analyticsData?.topCategories && (
                      <BarChart
                        title="支出分類排行"
                        data={analyticsData.topCategories
                          .filter(cat => cat.type === 'EXPENSE')
                          .slice(0, 8)
                          .map(cat => ({
                            name: cat.name,
                            value: cat.value
                          }))}
                        colors={['#DC2626']}
                        horizontal={true}
                      />
                    )}
                  </div>
                </div>

                {/* 收入分類柱狀圖 */}
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="h-80">
                    {analyticsData?.topCategories && (
                      <BarChart
                        title="收入分類排行"
                        data={analyticsData.topCategories
                          .filter(cat => cat.type === 'INCOME')
                          .slice(0, 8)
                          .map(cat => ({
                            name: cat.name,
                            value: cat.value
                          }))}
                        colors={['#2E8B57']}
                        horizontal={true}
                      />
                    )}
                  </div>
                </div>

                {/* 分類詳細列表 */}
                <div className="lg:col-span-2 bg-gray-50 rounded-xl p-4">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">分類詳細統計</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-2 px-4 text-sm font-medium text-gray-700">分類名稱</th>
                          <th className="text-center py-2 px-4 text-sm font-medium text-gray-700">類型</th>
                          <th className="text-right py-2 px-4 text-sm font-medium text-gray-700">金額</th>
                          <th className="text-right py-2 px-4 text-sm font-medium text-gray-700">佔比</th>
                        </tr>
                      </thead>
                      <tbody>
                        {analyticsData?.topCategories.map((category, index) => (
                          <tr key={index} className="border-b border-gray-100 hover:bg-white transition-colors">
                            <td className="py-3 px-4 text-sm text-gray-800">{category.name}</td>
                            <td className="py-3 px-4 text-center">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                category.type === 'EXPENSE' 
                                  ? 'bg-red-100 text-red-600' 
                                  : 'bg-green-100 text-green-600'
                              }`}>
                                {category.type === 'EXPENSE' ? '支出' : '收入'}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right text-sm font-medium text-gray-800">
                              NT$ {category.value.toLocaleString()}
                            </td>
                            <td className="py-3 px-4 text-right text-sm text-gray-600">
                              {category.percentage.toFixed(1)}%
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'comparison' && (
              <div className="space-y-6">
                {/* 年度對比 */}
                {analyticsData?.monthlyComparison && analyticsData.monthlyComparison.length > 0 && (
                  <div className="bg-gray-50 rounded-xl p-4">
                    <div className="h-96">
                      <BarChart
                        title="年度對比分析"
                        data={analyticsData.monthlyComparison.flatMap(item => [
                          {
                            name: item.month,
                            value: item.currentYear,
                            type: '今年'
                          },
                          {
                            name: item.month,
                            value: item.lastYear,
                            type: '去年'
                          }
                        ])}
                        colors={['#2E8B57', '#5F9EA0']}
                        stacked={false}
                      />
                    </div>
                  </div>
                )}

                {/* 群組分析 */}
                {analyticsData?.groupAnalytics && analyticsData.groupAnalytics.length > 0 && (
                  <div className="bg-gray-50 rounded-xl p-4">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">群組財務分析</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {analyticsData.groupAnalytics.map((group, index) => (
                        <div key={index} className="bg-white rounded-lg p-4 shadow-sm">
                          <h4 className="font-medium text-gray-800 mb-2">{group.groupName}</h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-600">總支出:</span>
                              <span className="font-medium text-red-600">
                                NT$ {group.totalExpense.toLocaleString()}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">總收入:</span>
                              <span className="font-medium text-green-600">
                                NT$ {group.totalIncome.toLocaleString()}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">交易數:</span>
                              <span className="font-medium text-gray-800">{group.memberCount}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  )
}

export default Analytics