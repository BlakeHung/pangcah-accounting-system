import React from 'react'
import { RealtimeStats } from '../../types/realtime'

interface RealtimeStatsCardsProps {
  stats: RealtimeStats
}

const RealtimeStatsCards: React.FC<RealtimeStatsCardsProps> = ({ stats }) => {
  const formatCurrency = (amount: number) => {
    return `NT$ ${amount.toLocaleString('zh-TW', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
  }

  const calculateTrend = (current: number, previous: number) => {
    if (previous === 0) return 0
    return ((current - previous) / previous) * 100
  }

  // 模擬上期資料用於趨勢計算
  const previousStats = {
    todayExpenses: stats.todayExpenses * 0.85,
    todayIncome: stats.todayIncome * 0.92,
    monthlyExpenses: stats.monthlyExpenses * 0.88,
    monthlyIncome: stats.monthlyIncome * 0.94
  }

  const cards = [
    {
      title: '今日支出',
      value: formatCurrency(stats.todayExpenses),
      icon: '💸',
      trend: calculateTrend(stats.todayExpenses, previousStats.todayExpenses),
      bgColor: 'bg-red-50',
      iconColor: 'text-red-600',
      borderColor: 'border-red-200'
    },
    {
      title: '今日收入',
      value: formatCurrency(stats.todayIncome),
      icon: '💰',
      trend: calculateTrend(stats.todayIncome, previousStats.todayIncome),
      bgColor: 'bg-green-50',
      iconColor: 'text-green-600',
      borderColor: 'border-green-200'
    },
    {
      title: '本月支出',
      value: formatCurrency(stats.monthlyExpenses),
      icon: '📊',
      trend: calculateTrend(stats.monthlyExpenses, previousStats.monthlyExpenses),
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-600',
      borderColor: 'border-blue-200'
    },
    {
      title: '本月收入',
      value: formatCurrency(stats.monthlyIncome),
      icon: '💎',
      trend: calculateTrend(stats.monthlyIncome, previousStats.monthlyIncome),
      bgColor: 'bg-purple-50',
      iconColor: 'text-purple-600',
      borderColor: 'border-purple-200'
    },
    {
      title: '活躍用戶',
      value: stats.activeUsers.toString(),
      icon: '👥',
      trend: 0, // 用戶數不顯示趨勢
      bgColor: 'bg-yellow-50',
      iconColor: 'text-yellow-600',
      borderColor: 'border-yellow-200'
    },
    {
      title: '交易筆數',
      value: stats.transactionCount.toLocaleString(),
      icon: '📋',
      trend: 0, // 交易數不顯示趨勢
      bgColor: 'bg-indigo-50',
      iconColor: 'text-indigo-600',
      borderColor: 'border-indigo-200'
    }
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      {cards.map((card, index) => (
        <div
          key={index}
          className={`${card.bgColor} ${card.borderColor} rounded-xl border p-6 transition-all duration-300 hover:shadow-md hover:scale-105`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">
                {card.title}
              </p>
              <p className="text-2xl font-bold text-gray-900 mb-2">
                {card.value}
              </p>
              {card.trend !== 0 && (
                <div className="flex items-center gap-1">
                  <span className={`text-xs font-medium ${
                    card.trend > 0 
                      ? 'text-green-600' 
                      : card.trend < 0 
                        ? 'text-red-600' 
                        : 'text-gray-600'
                  }`}>
                    {card.trend > 0 ? '↗' : card.trend < 0 ? '↘' : '→'}
                    {Math.abs(card.trend).toFixed(1)}%
                  </span>
                  <span className="text-xs text-gray-500">vs 昨日</span>
                </div>
              )}
            </div>
            <div className={`text-3xl ${card.iconColor} opacity-80`}>
              {card.icon}
            </div>
          </div>
          
          {/* 迷你動畫指示器 */}
          <div className="mt-3">
            <div className="w-full bg-white/60 rounded-full h-1">
              <div
                className={`h-1 rounded-full transition-all duration-2000 ${
                  card.trend > 0 ? 'bg-green-400' :
                  card.trend < 0 ? 'bg-red-400' : 'bg-gray-400'
                }`}
                style={{ 
                  width: `${Math.min(100, Math.abs(card.trend) * 2 + 20)}%`,
                  animationDelay: `${index * 200}ms`
                }}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export default RealtimeStatsCards