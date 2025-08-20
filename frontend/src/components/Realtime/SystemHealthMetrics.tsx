import React from 'react'
import { SystemStatus } from '../../types/realtime'

interface SystemHealthMetricsProps {
  status: SystemStatus
  isConnected: boolean
}

const SystemHealthMetrics: React.FC<SystemHealthMetricsProps> = ({ status, isConnected }) => {
  const getHealthColor = (health: string) => {
    switch (health) {
      case 'healthy': return 'text-green-600 bg-green-100'
      case 'warning': return 'text-yellow-600 bg-yellow-100'
      case 'critical': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getHealthIcon = (health: string) => {
    switch (health) {
      case 'healthy': return '✅'
      case 'warning': return '⚠️'
      case 'critical': return '🚨'
      default: return '❓'
    }
  }

  const getLoadColor = (load: number) => {
    if (load < 50) return 'bg-green-500'
    if (load < 80) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  const getDatabaseStatusColor = (dbStatus: string) => {
    switch (dbStatus) {
      case 'connected': return 'text-green-600'
      case 'slow': return 'text-yellow-600'
      case 'disconnected': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  const getDatabaseStatusText = (dbStatus: string) => {
    switch (dbStatus) {
      case 'connected': return '正常連接'
      case 'slow': return '連接緩慢'
      case 'disconnected': return '連接中斷'
      default: return '未知狀態'
    }
  }

  const formatLastUpdated = (timestamp: string) => {
    const now = new Date()
    const time = new Date(timestamp)
    const diffMs = now.getTime() - time.getTime()
    const diffSecs = Math.floor(diffMs / 1000)
    
    if (diffSecs < 60) return `${diffSecs} 秒前更新`
    const diffMins = Math.floor(diffSecs / 60)
    if (diffMins < 60) return `${diffMins} 分鐘前更新`
    return `${Math.floor(diffMins / 60)} 小時前更新`
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-800">系統健康度</h3>
            <p className="text-sm text-gray-600">即時監控系統狀態</p>
          </div>
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${
            getHealthColor(status.systemHealth)
          }`}>
            <span className="mr-2">{getHealthIcon(status.systemHealth)}</span>
            {status.systemHealth === 'healthy' ? '健康' :
             status.systemHealth === 'warning' ? '警告' : '危急'}
          </div>
        </div>
      </div>

      <div className="p-6 space-y-4">
        {/* 伺服器負載 */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">伺服器負載</span>
            <span className="text-sm font-bold text-gray-900">{status.serverLoad.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-1000 ${getLoadColor(status.serverLoad)}`}
              style={{ width: `${Math.min(100, status.serverLoad)}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {status.serverLoad < 50 ? '運行良好' :
             status.serverLoad < 80 ? '負載偏高' : '負載過重'}
          </p>
        </div>

        {/* 資料庫狀態 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">🗃️</span>
            <span className="text-sm font-medium text-gray-700">資料庫</span>
          </div>
          <span className={`text-sm font-medium ${getDatabaseStatusColor(status.databaseStatus)}`}>
            {getDatabaseStatusText(status.databaseStatus)}
          </span>
        </div>

        {/* 總交易數 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">📊</span>
            <span className="text-sm font-medium text-gray-700">總交易數</span>
          </div>
          <span className="text-sm font-bold text-gray-900">
            {status.totalTransactions.toLocaleString()}
          </span>
        </div>

        {/* 活躍用戶 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">👥</span>
            <span className="text-sm font-medium text-gray-700">線上用戶</span>
          </div>
          <span className="text-sm font-bold text-gray-900">
            {status.activeUsers}
          </span>
        </div>

        {/* 更新時間 */}
        <div className="pt-4 border-t border-gray-200">
          <div className="flex items-center justify-center gap-2">
            <div className={`w-2 h-2 rounded-full ${
              isConnected ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
            }`} />
            <span className="text-xs text-gray-500">
              {isConnected ? formatLastUpdated(status.lastUpdated) : '離線狀態'}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SystemHealthMetrics