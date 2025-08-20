import React, { useState, useEffect } from 'react'
import { useRealtimeData } from '../../hooks/useWebSocket'
import LiveTransactionFeed from './LiveTransactionFeed'
import ActiveUsersWidget from './ActiveUsersWidget'
import SystemHealthMetrics from './SystemHealthMetrics'
import RealtimeStatsCards from './RealtimeStatsCards'
import { RealtimeStats, SystemStatus, LiveFeedItem } from '../../types/realtime'

const RealtimeDashboard: React.FC = () => {
  const { isConnected, subscribe, connectionStatus } = useRealtimeData()
  const [realtimeStats, setRealtimeStats] = useState<RealtimeStats>({
    todayExpenses: 0,
    todayIncome: 0,
    monthlyExpenses: 0,
    monthlyIncome: 0,
    activeUsers: 0,
    transactionCount: 0,
    lastUpdated: new Date().toISOString()
  })
  
  const [systemStatus, setSystemStatus] = useState<SystemStatus>({
    activeUsers: 0,
    totalTransactions: 0,
    systemHealth: 'healthy',
    serverLoad: 0,
    databaseStatus: 'connected',
    lastUpdated: new Date().toISOString()
  })

  const [liveFeed, setLiveFeed] = useState<LiveFeedItem[]>([])

  useEffect(() => {
    // 訂閱即時統計資料
    const unsubscribeStats = subscribe('realtime_stats', (data: RealtimeStats) => {
      setRealtimeStats(data)
    })

    // 訂閱系統狀態
    const unsubscribeSystem = subscribe('system_status', (data: SystemStatus) => {
      setSystemStatus(data)
    })

    // 訂閱即時交易
    const unsubscribeTransactions = subscribe('transaction_created', (data: any) => {
      const newItem: LiveFeedItem = {
        id: `tx_${Date.now()}`,
        type: 'transaction',
        icon: data.type === 'income' ? '💰' : '💸',
        title: `新增${data.type === 'income' ? '收入' : '支出'}`,
        description: `${data.userName} 記錄了 NT$ ${data.amount.toLocaleString()} - ${data.description}`,
        timestamp: data.timestamp,
        severity: data.type === 'income' ? 'success' : 'info',
        data
      }
      
      setLiveFeed(prev => [newItem, ...prev].slice(0, 50)) // 只保留最近50條
    })

    // 訂閱用戶活動
    const unsubscribeActivity = subscribe('user_activity', (data: any) => {
      if (data.action === 'login') {
        const newItem: LiveFeedItem = {
          id: `activity_${Date.now()}`,
          type: 'user_join',
          icon: '👋',
          title: '用戶上線',
          description: `${data.userName} 加入了系統`,
          timestamp: data.timestamp,
          severity: 'info'
        }
        setLiveFeed(prev => [newItem, ...prev].slice(0, 50))
      }
    })

    // 訂閱預算警報
    const unsubscribeBudget = subscribe('budget_alert', (data: any) => {
      const newItem: LiveFeedItem = {
        id: `budget_${Date.now()}`,
        type: 'budget_alert',
        icon: data.type === 'exceeded' ? '🚨' : '⚠️',
        title: data.type === 'exceeded' ? '預算超支' : '預算警告',
        description: `${data.category} 類別${data.type === 'exceeded' ? '已超過' : '接近'}預算限額`,
        timestamp: data.timestamp,
        severity: data.type === 'exceeded' ? 'error' : 'warning',
        data
      }
      setLiveFeed(prev => [newItem, ...prev].slice(0, 50))
    })

    return () => {
      unsubscribeStats()
      unsubscribeSystem()
      unsubscribeTransactions()
      unsubscribeActivity()
      unsubscribeBudget()
    }
  }, [subscribe])

  // 模擬資料生成 (用於展示)
  useEffect(() => {
    const interval = setInterval(() => {
      if (isConnected) {
        // 模擬即時統計更新
        setRealtimeStats(prev => ({
          ...prev,
          todayExpenses: prev.todayExpenses + Math.random() * 1000,
          todayIncome: prev.todayIncome + Math.random() * 1500,
          transactionCount: prev.transactionCount + Math.floor(Math.random() * 3),
          lastUpdated: new Date().toISOString()
        }))

        // 模擬系統狀態更新
        setSystemStatus(prev => ({
          ...prev,
          serverLoad: Math.random() * 100,
          activeUsers: Math.floor(Math.random() * 20) + 5,
          totalTransactions: prev.totalTransactions + Math.floor(Math.random() * 5),
          lastUpdated: new Date().toISOString()
        }))
      }
    }, 5000) // 每5秒更新一次

    return () => clearInterval(interval)
  }, [isConnected])

  const getConnectionStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return 'text-green-600'
      case 'connecting': return 'text-yellow-600'
      case 'reconnecting': return 'text-orange-600'
      case 'disconnected': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  const getConnectionStatusText = () => {
    switch (connectionStatus) {
      case 'connected': return '即時連接正常'
      case 'connecting': return '正在連接...'
      case 'reconnecting': return '重新連接中...'
      case 'disconnected': return '連接中斷'
      default: return '未知狀態'
    }
  }

  return (
    <div className="space-y-6">
      {/* 標題與連接狀態 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">即時監控中心</h1>
          <p className="text-gray-600">系統狀態與用戶活動的即時監控</p>
        </div>
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${
            isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'
          }`} />
          <span className={`text-sm font-medium ${getConnectionStatusColor()}`}>
            {getConnectionStatusText()}
          </span>
        </div>
      </div>

      {/* 即時統計卡片 */}
      <RealtimeStatsCards stats={realtimeStats} />

      {/* 主要監控區域 */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* 即時交易動態 - 佔據較大空間 */}
        <div className="xl:col-span-2">
          <LiveTransactionFeed 
            items={liveFeed}
            isConnected={isConnected}
          />
        </div>

        {/* 側邊欄監控組件 */}
        <div className="space-y-6">
          {/* 活躍用戶 */}
          <ActiveUsersWidget 
            activeUsers={systemStatus.activeUsers}
            isConnected={isConnected}
          />

          {/* 系統健康度 */}
          <SystemHealthMetrics 
            status={systemStatus}
            isConnected={isConnected}
          />
        </div>
      </div>
    </div>
  )
}

export default RealtimeDashboard