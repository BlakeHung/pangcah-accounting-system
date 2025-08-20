import React, { useState, useEffect } from 'react'

interface ActiveUsersWidgetProps {
  activeUsers: number
  isConnected: boolean
}

interface MockUser {
  id: string
  name: string
  avatar: string
  lastActivity: string
  status: 'online' | 'idle' | 'busy'
}

const ActiveUsersWidget: React.FC<ActiveUsersWidgetProps> = ({ activeUsers, isConnected }) => {
  const [users, setUsers] = useState<MockUser[]>([])

  // 生成模擬用戶資料
  useEffect(() => {
    const generateMockUsers = (count: number): MockUser[] => {
      const names = ['小美', '阿明', '小華', '雅婷', '志豪', '佩君', '建宏', '淑芬', '俊傑', '婉玲']
      const avatars = ['👩', '👨', '🧑', '👵', '👴', '👩‍💼', '👨‍💼', '👩‍🎓', '👨‍🎓', '🧑‍💻']
      const statuses: ('online' | 'idle' | 'busy')[] = ['online', 'idle', 'busy']
      
      return Array.from({ length: Math.min(count, 10) }, (_, i) => ({
        id: `user_${i}`,
        name: names[i % names.length],
        avatar: avatars[i % avatars.length],
        lastActivity: new Date(Date.now() - Math.random() * 30 * 60 * 1000).toISOString(),
        status: statuses[Math.floor(Math.random() * statuses.length)]
      }))
    }

    if (activeUsers > 0) {
      setUsers(generateMockUsers(activeUsers))
    } else {
      setUsers([])
    }
  }, [activeUsers])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-500'
      case 'idle': return 'bg-yellow-500'
      case 'busy': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'online': return '線上'
      case 'idle': return '閒置'
      case 'busy': return '忙碌'
      default: return '離線'
    }
  }

  const formatLastActivity = (timestamp: string) => {
    const now = new Date()
    const time = new Date(timestamp)
    const diffMs = now.getTime() - time.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))
    
    if (diffMins < 1) return '剛剛活躍'
    if (diffMins < 60) return `${diffMins} 分鐘前活躍`
    return `${Math.floor(diffMins / 60)} 小時前活躍`
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-800">活躍用戶</h3>
            <p className="text-sm text-gray-600">
              {isConnected ? `${activeUsers} 位用戶在線` : '離線狀態'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              isConnected ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
            }`}>
              <span className="text-lg">👥</span>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6">
        {users.length === 0 ? (
          <div className="text-center py-6 text-gray-500">
            <div className="text-3xl mb-2">😴</div>
            <p className="text-sm">目前沒有用戶在線</p>
          </div>
        ) : (
          <div className="space-y-3">
            {users.map(user => (
              <div key={user.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                      <span className="text-sm">{user.avatar}</span>
                    </div>
                    <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${
                      getStatusColor(user.status)
                    }`} />
                  </div>
                  <div>
                    <p className="font-medium text-gray-800 text-sm">{user.name}</p>
                    <p className="text-xs text-gray-500">
                      {formatLastActivity(user.lastActivity)}
                    </p>
                  </div>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  user.status === 'online' ? 'bg-green-100 text-green-700' :
                  user.status === 'idle' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {getStatusText(user.status)}
                </span>
              </div>
            ))}
          </div>
        )}

        {users.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="text-center text-xs text-gray-500">
              總共 {activeUsers} 位活躍用戶
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ActiveUsersWidget