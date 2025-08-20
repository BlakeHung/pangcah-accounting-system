import React, { useState, useEffect } from 'react'
import { AlertNotification } from '../types/dashboard'
import { 
  loadAlertNotifications, 
  markNotificationAsRead, 
  clearAllNotifications 
} from '../utils/dashboardConfig'

interface NotificationCenterProps {
  isOpen: boolean
  onClose: () => void
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({ isOpen, onClose }) => {
  const [notifications, setNotifications] = useState<AlertNotification[]>([])

  useEffect(() => {
    if (isOpen) {
      loadNotifications()
    }
  }, [isOpen])

  const loadNotifications = () => {
    const saved = loadAlertNotifications()
    setNotifications(saved)
  }

  const handleMarkAsRead = (notificationId: string) => {
    markNotificationAsRead(notificationId)
    setNotifications(prev => 
      prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
    )
  }

  const handleClearAll = () => {
    clearAllNotifications()
    setNotifications([])
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'expense_limit':
        return '💸'
      case 'income_goal':
        return '💰'
      case 'unusual_spending':
        return '⚠️'
      default:
        return '📢'
    }
  }

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'error':
        return 'border-l-red-500 bg-red-50'
      case 'warning':
        return 'border-l-yellow-500 bg-yellow-50'
      case 'info':
        return 'border-l-blue-500 bg-blue-50'
      default:
        return 'border-l-gray-500 bg-gray-50'
    }
  }

  const unreadCount = notifications.filter(n => !n.read).length

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose} />
      
      <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-xl transform transition-transform">
        <div className="flex flex-col h-full">
          {/* 標題列 */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-gray-800">通知中心</h2>
              {unreadCount > 0 && (
                <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                  {unreadCount}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {notifications.length > 0 && (
                <button
                  onClick={handleClearAll}
                  className="text-sm text-gray-600 hover:text-gray-800 transition-colors"
                >
                  清除全部
                </button>
              )}
              <button
                onClick={onClose}
                className="text-gray-600 hover:text-gray-800 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* 通知列表 */}
          <div className="flex-1 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <div className="text-6xl mb-4">📭</div>
                <p className="text-lg font-medium">暫無通知</p>
                <p className="text-sm">當有新的提醒時會在這裡顯示</p>
              </div>
            ) : (
              <div className="p-4 space-y-3">
                {notifications.map(notification => (
                  <div
                    key={notification.id}
                    className={`p-4 rounded-lg border-l-4 transition-all cursor-pointer ${
                      getLevelColor(notification.level)
                    } ${
                      notification.read ? 'opacity-75' : 'shadow-md'
                    }`}
                    onClick={() => !notification.read && handleMarkAsRead(notification.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-lg">{getNotificationIcon(notification.type)}</span>
                          <h3 className="font-medium text-gray-800 text-sm">
                            {notification.title}
                          </h3>
                          {!notification.read && (
                            <div className="w-2 h-2 bg-red-500 rounded-full" />
                          )}
                        </div>
                        <p className="text-gray-700 text-sm mb-2">
                          {notification.message}
                        </p>
                        <p className="text-gray-500 text-xs">
                          {new Date(notification.timestamp).toLocaleString('zh-TW')}
                        </p>
                      </div>
                    </div>
                    
                    {/* 額外資料顯示 */}
                    {notification.data && notification.type === 'expense_limit' && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <div className="text-xs text-gray-600">
                          <div>實際支出: NT$ {notification.data.amount?.toLocaleString()}</div>
                          <div>設定限額: NT$ {notification.data.limit?.toLocaleString()}</div>
                        </div>
                      </div>
                    )}
                    
                    {notification.data && notification.type === 'income_goal' && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <div className="flex items-center justify-between text-xs text-gray-600">
                          <span>目標進度</span>
                          <span>{notification.data.milestone}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                          <div
                            className="bg-green-600 h-2 rounded-full transition-all"
                            style={{ 
                              width: `${Math.min(100, (notification.data.amount / notification.data.goal) * 100)}%` 
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default NotificationCenter