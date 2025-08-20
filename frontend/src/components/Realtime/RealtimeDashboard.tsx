import React, { useState, useEffect } from 'react'
import LiveTransactionFeed from './LiveTransactionFeed'
import ActiveUsersWidget from './ActiveUsersWidget'
import SystemHealthMetrics from './SystemHealthMetrics'
import RealtimeStatsCards from './RealtimeStatsCards'
import { RealtimeStats, SystemStatus, LiveFeedItem } from '../../types/realtime'

const RealtimeDashboard: React.FC = () => {
  // WebSocket 功能暫時禁用 - 使用靜態資料展示
  const isConnected = false
  const connectionStatus = 'disabled' as const
  
  const [realtimeStats] = useState<RealtimeStats>({
    todayExpenses: 12500,
    todayIncome: 8000,
    monthlyExpenses: 385000,
    monthlyIncome: 420000,
    activeUsers: 3,
    transactionCount: 156,
    lastUpdated: new Date().toISOString()
  })
  
  const [systemStatus] = useState<SystemStatus>({
    activeUsers: 3,
    totalTransactions: 156,
    systemHealth: 'healthy',
    serverLoad: 15,
    databaseStatus: 'connected',
    lastUpdated: new Date().toISOString()
  })

  const [liveFeed] = useState<LiveFeedItem[]>([
    {
      id: 'demo_1',
      type: 'transaction',
      icon: '💸',
      title: '新增支出',
      description: '範例：午餐支出 NT$ 150',
      timestamp: new Date().toISOString(),
      severity: 'info'
    },
    {
      id: 'demo_2',
      type: 'user_join',
      icon: '👋',
      title: '用戶活動',
      description: '範例：用戶登入系統',
      timestamp: new Date().toISOString(),
      severity: 'info'
    },
    {
      id: 'demo_3',
      type: 'budget_alert',
      icon: '⚠️',
      title: '預算提醒',
      description: '範例：食物類別接近預算限額',
      timestamp: new Date().toISOString(),
      severity: 'warning'
    }
  ])

  return (
    <div className="space-y-6">
      {/* 標題與狀態提示 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">即時監控中心</h1>
          <p className="text-gray-600">系統狀態與用戶活動監控</p>
        </div>
        
        {/* 功能暫時關閉提示 */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-2">
          <div className="flex items-center gap-2">
            <span className="text-yellow-600">⚠️</span>
            <div>
              <p className="text-sm font-medium text-yellow-800">即時監控功能維護中</p>
              <p className="text-xs text-yellow-600">目前顯示為示範資料</p>
            </div>
          </div>
        </div>
      </div>

      {/* 即時統計卡片 - 顯示靜態資料 */}
      <RealtimeStatsCards stats={realtimeStats} />

      {/* 主要監控區域 */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* 即時交易動態 - 顯示範例資料 */}
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

      {/* 額外的說明訊息 */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-2">
          <span className="text-blue-600 mt-0.5">ℹ️</span>
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">關於即時監控功能</p>
            <p>為了優化系統資源使用，即時監控功能目前暫時關閉。</p>
            <p>您仍可以透過報表功能查看歷史資料與統計分析。</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default RealtimeDashboard