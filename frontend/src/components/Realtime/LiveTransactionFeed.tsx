import React from 'react'
import { LiveFeedItem } from '../../types/realtime'

interface LiveTransactionFeedProps {
  items: LiveFeedItem[]
  isConnected: boolean
}

const LiveTransactionFeed: React.FC<LiveTransactionFeedProps> = ({ items, isConnected }) => {
  const getSeverityColor = (severity?: string) => {
    switch (severity) {
      case 'success': return 'bg-green-50 border-l-green-500'
      case 'warning': return 'bg-yellow-50 border-l-yellow-500'
      case 'error': return 'bg-red-50 border-l-red-500'
      default: return 'bg-blue-50 border-l-blue-500'
    }
  }

  const formatTime = (timestamp: string) => {
    const now = new Date()
    const time = new Date(timestamp)
    const diffMs = now.getTime() - time.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))
    
    if (diffMins < 1) return '剛剛'
    if (diffMins < 60) return `${diffMins} 分鐘前`
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)} 小時前`
    return time.toLocaleDateString('zh-TW')
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">即時動態</h3>
          <p className="text-sm text-gray-600">系統內的最新活動</p>
        </div>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${
            isConnected ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
          }`} />
          <span className="text-xs text-gray-500">
            {isConnected ? '即時更新' : '離線模式'}
          </span>
        </div>
      </div>

      <div className="max-h-96 overflow-y-auto">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-500">
            <div className="text-4xl mb-3">📡</div>
            <p className="text-lg font-medium">等待即時資料</p>
            <p className="text-sm">當有新活動時會在這裡顯示</p>
          </div>
        ) : (
          <div className="space-y-1">
            {items.map((item, index) => (
              <div
                key={item.id}
                className={`p-4 border-l-4 transition-all duration-300 hover:bg-gray-50 ${
                  getSeverityColor(item.severity)
                } ${
                  index === 0 ? 'animate-slideInRight' : ''
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <span className="text-xl flex-shrink-0">{item.icon}</span>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-800 text-sm">
                        {item.title}
                      </h4>
                      <p className="text-gray-600 text-sm mt-1 break-words">
                        {item.description}
                      </p>
                      {item.data && item.type === 'budget_alert' && (
                        <div className="mt-2 text-xs text-gray-500">
                          <div className="flex items-center gap-4">
                            <span>目前: NT$ {item.data.currentAmount?.toLocaleString()}</span>
                            <span>預算: NT$ {item.data.budgetLimit?.toLocaleString()}</span>
                            <span className={`px-2 py-1 rounded-full ${
                              item.data.percentage > 100 
                                ? 'bg-red-100 text-red-700' 
                                : 'bg-yellow-100 text-yellow-700'
                            }`}>
                              {item.data.percentage?.toFixed(0)}%
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                    {formatTime(item.timestamp)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {items.length > 0 && (
        <div className="px-6 py-3 border-t border-gray-200 bg-gray-50 text-center">
          <span className="text-xs text-gray-500">
            顯示最近 {items.length} 項活動
          </span>
        </div>
      )}
    </div>
  )
}

export default LiveTransactionFeed