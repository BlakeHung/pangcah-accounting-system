import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import Layout from '../components/Layout'

interface User {
  id: number
  username: string
  name: string
  role: string
}

interface Group {
  id: number
  name: string
}

interface Activity {
  id: number
  name: string
  description: string
  start_date: string
  end_date: string
  location: string
  status: 'PLANNING' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED'
  group: Group
  managers: User[]
  participants: User[]
  created_at: string
  created_by: User
}


const Activities: React.FC = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>('all')

  // 獲取當前用戶
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}')

  // 獲取活動列表
  const { data: activities, isLoading } = useQuery({
    queryKey: ['activities', statusFilter],
    queryFn: async () => {
      let url = '/api/v1/events/'
      if (statusFilter !== 'all') {
        url += `?status=${statusFilter}`
      }
      const response = await axios.get(url)
      return response.data.results as Activity[]
    }
  })

  // 刪除活動
  const deleteActivityMutation = useMutation({
    mutationFn: async (id: number) => {
      await axios.delete(`/api/v1/events/${id}/`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activities'] })
      setSelectedActivity(null)
    }
  })

  // 更新活動狀態
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number, status: string }) => {
      await axios.patch(`/api/v1/events/${id}/`, { status })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activities'] })
    }
  })

  const canManageActivity = (activity: Activity) => {
    return currentUser.role === 'ADMIN' || 
           activity.managers.some(m => m.id === currentUser.id)
  }

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'PLANNING': return 'bg-orange-100 text-orange-600'
      case 'ACTIVE': return 'bg-green-100 text-green-600'
      case 'COMPLETED': return 'bg-blue-100 text-blue-600'
      case 'CANCELLED': return 'bg-red-100 text-red-600'
      default: return 'bg-gray-100 text-gray-600'
    }
  }

  const getStatusLabel = (status: string) => {
    switch(status) {
      case 'PLANNING': return '規劃中'
      case 'ACTIVE': return '進行中'
      case 'COMPLETED': return '已完成'
      case 'CANCELLED': return '已取消'
      default: return status
    }
  }

  const getActivityIcon = (name: string) => {
    if (name.includes('播種') || name.includes('種植')) return '🌱'
    if (name.includes('豐年') || name.includes('慶典')) return '🎊'
    if (name.includes('收穫') || name.includes('採收')) return '🌾'
    if (name.includes('團聚') || name.includes('聚會')) return '🏘️'
    if (name.includes('旅遊') || name.includes('旅行')) return '🚌'
    if (name.includes('運動') || name.includes('健身')) return '🏃'
    return '🎉'
  }

  return (
    <Layout user={currentUser}>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* 頁面標題 */}
        <div className="bg-white rounded-xl p-6 shadow-lg">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2 flex items-center gap-3">
                <span className="text-2xl">🎉</span>
                活動管理
              </h1>
              <p className="text-gray-600 text-sm md:text-base">
                管理和追蹤所有活動項目
              </p>
            </div>
            <button
              onClick={() => navigate('/activities/new')}
              className="bg-[#2E8B57] hover:bg-[#1F5F3F] text-white px-4 py-2 rounded-lg transition-colors font-medium flex items-center gap-2 text-sm shadow-sm"
            >
              <span>➕</span>
              <span className="hidden sm:inline">新增活動</span>
              <span className="sm:hidden">新增</span>
            </button>
          </div>
        </div>

        {/* 活動統計 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-6 shadow-lg border-l-4 border-orange-400">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-600 mb-1">規劃中</h3>
                <p className="text-2xl font-bold text-orange-600">
                  {activities?.filter(a => a.status === 'PLANNING').length || 0}
                </p>
              </div>
              <div className="text-3xl opacity-80">🌱</div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-6 shadow-lg border-l-4 border-green-400">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-600 mb-1">進行中</h3>
                <p className="text-2xl font-bold text-green-600">
                  {activities?.filter(a => a.status === 'ACTIVE').length || 0}
                </p>
              </div>
              <div className="text-3xl opacity-80">🎊</div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-6 shadow-lg border-l-4 border-blue-400">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-600 mb-1">已完成</h3>
                <p className="text-2xl font-bold text-blue-600">
                  {activities?.filter(a => a.status === 'COMPLETED').length || 0}
                </p>
              </div>
              <div className="text-3xl opacity-80">🌾</div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-6 shadow-lg border-l-4 border-purple-400">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-600 mb-1">總活動</h3>
                <p className="text-2xl font-bold text-purple-600">{activities?.length || 0}</p>
              </div>
              <div className="text-3xl opacity-80">📊</div>
            </div>
          </div>
        </div>

        {/* 篩選器 */}
        <div className="bg-white rounded-xl p-6 shadow-lg">
          <div className="flex flex-wrap gap-4 items-center">
            <span className="text-gray-800 font-medium">篩選狀態：</span>
            <div className="flex flex-wrap gap-2">
              {['all', 'PLANNING', 'ACTIVE', 'COMPLETED', 'CANCELLED'].map(status => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-4 py-2 rounded-lg transition-colors text-sm font-medium ${
                    statusFilter === status 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {status === 'all' ? '全部' : getStatusLabel(status)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 活動列表 */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-800">
              活動列表 ({activities?.length || 0})
            </h2>
          </div>
          
          {isLoading ? (
            <div className="flex items-center justify-center min-h-96">
              <div className="text-center">
                <div className="w-8 h-8 border-2 border-[#2E8B57] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-600">載入活動中...</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {activities && activities.length > 0 ? (
                activities.map(activity => (
                  <div
                    key={activity.id}
                    className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-200 cursor-pointer"
                    onClick={() => setSelectedActivity(activity)}
                  >
                    {/* 活動頭部 */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-xl flex-shrink-0">
                          {getActivityIcon(activity.name)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-base font-semibold text-gray-800 truncate">
                            {activity.name}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {activity.group.name}
                          </p>
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium flex-shrink-0 ${getStatusColor(activity.status)}`}>
                        {getStatusLabel(activity.status)}
                      </span>
                    </div>

                    {/* 活動描述 */}
                    {activity.description && (
                      <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                        {activity.description}
                      </p>
                    )}

                    {/* 活動資訊 */}
                    <div className="space-y-2 mb-4 text-sm">
                      <div className="flex items-center justify-between text-gray-600">
                        <span className="flex items-center gap-1">
                          📅 時間
                        </span>
                        <span className="text-right">
                          {new Date(activity.start_date).toLocaleDateString('zh-TW')} - {new Date(activity.end_date).toLocaleDateString('zh-TW')}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-gray-600">
                        <span className="flex items-center gap-1">
                          📍 地點
                        </span>
                        <span className="truncate text-right max-w-[60%]" title={activity.location || '未指定地點'}>
                          {activity.location || '未指定地點'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-gray-600">
                        <span className="flex items-center gap-1">
                          👥 參與者
                        </span>
                        <span>{activity.participants?.length || 0} 人</span>
                      </div>
                    </div>

                    {/* 管理者 */}
                    {activity.managers.length > 0 && (
                      <div className="border-t border-gray-100 pt-3 mb-4">
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-gray-600 flex items-center gap-1">
                            👑 管理者：
                          </span>
                          <div className="flex flex-wrap gap-1">
                            {activity.managers.map(manager => (
                              <span
                                key={manager.id}
                                className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs"
                              >
                                {manager.name || manager.username}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 操作按鈕 */}
                    {canManageActivity(activity) && (
                      <div className="flex gap-2 border-t border-gray-100 pt-3" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => navigate(`/activities/${activity.id}/manage`)}
                          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-3 rounded-lg transition-colors text-sm font-medium flex items-center justify-center gap-1"
                        >
                          <span>⚙️</span>
                          <span>管理</span>
                        </button>
                        <button
                          onClick={() => navigate(`/activities/${activity.id}/edit`)}
                          className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-3 rounded-lg transition-colors text-sm font-medium flex items-center justify-center gap-1"
                        >
                          <span>✏️</span>
                          <span>編輯</span>
                        </button>
                        {activity.status === 'PLANNING' && (
                          <button
                            onClick={() => {
                              if (confirm('確定要刪除這個活動嗎？')) {
                                deleteActivityMutation.mutate(activity.id)
                              }
                            }}
                            className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 px-3 rounded-lg transition-colors text-sm font-medium flex items-center justify-center gap-1"
                          >
                            <span>🗑️</span>
                            <span>刪除</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="col-span-full">
                  <div className="bg-white rounded-xl p-12 shadow-lg text-center">
                    <div className="text-6xl mb-4 opacity-50">🎉</div>
                    <h3 className="text-xl font-bold text-gray-800 mb-2">
                      暫無活動資料
                    </h3>
                    <p className="text-gray-600 mb-6">
                      尚無活動資料，點擊上方按鈕新增活動
                    </p>
                    <button
                      onClick={() => navigate('/activities/new')}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors font-medium"
                    >
                      ➕ 新增活動
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 活動詳情 Modal */}
        {selectedActivity && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-2xl">
                    {getActivityIcon(selectedActivity.name)}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800">
                      {selectedActivity.name}
                    </h2>
                    <p className="text-gray-600">{selectedActivity.group.name}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedActivity(null)}
                  className="text-gray-400 hover:text-gray-600 text-2xl transition-colors"
                >
                  ✕
                </button>
              </div>
              
              <div className="space-y-6">
                {selectedActivity.description && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-gray-800 mb-2 flex items-center gap-2">
                      <span>📝</span>
                      活動描述
                    </h3>
                    <p className="text-gray-600">{selectedActivity.description}</p>
                  </div>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                      <span>ℹ️</span>
                      活動資訊
                    </h3>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">狀態：</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedActivity.status)}`}>
                          {getStatusLabel(selectedActivity.status)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">地點：</span>
                        <span className="text-gray-800">{selectedActivity.location || '未指定'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">開始時間：</span>
                        <span className="text-gray-800">
                          {new Date(selectedActivity.start_date).toLocaleString('zh-TW')}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">結束時間：</span>
                        <span className="text-gray-800">
                          {new Date(selectedActivity.end_date).toLocaleString('zh-TW')}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">創建者：</span>
                        <span className="text-gray-800">{selectedActivity.created_by.name || selectedActivity.created_by.username}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-green-50 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                      <span>👑</span>
                      管理者 ({selectedActivity.managers.length})
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedActivity.managers.length > 0 ? (
                        selectedActivity.managers.map(manager => (
                          <div
                            key={manager.id}
                            className="bg-green-100 text-green-700 px-3 py-2 rounded-lg flex items-center gap-2 text-sm"
                          >
                            <span>👑</span>
                            <span className="font-medium">{manager.name || manager.username}</span>
                          </div>
                        ))
                      ) : (
                        <div className="text-gray-500 text-sm">暫無管理者</div>
                      )}
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <span>👥</span>
                    參與者 ({selectedActivity.participants?.length || 0})
                  </h3>
                  {selectedActivity.participants && selectedActivity.participants.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 max-h-60 overflow-y-auto">
                      {selectedActivity.participants.map(participant => (
                        <div
                          key={participant.id}
                          className="bg-gray-50 px-3 py-2 rounded-lg flex items-center gap-2"
                        >
                          <span className="text-sm">👤</span>
                          <span className="text-sm flex-1 truncate">{participant.name || participant.username}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-gray-500 text-center py-8">
                      此活動暫無參與者
                    </div>
                  )}
                </div>
                
                <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-200">
                  <button
                    onClick={() => {
                      navigate(`/activities/${selectedActivity.id}`)
                      setSelectedActivity(null)
                    }}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg transition-colors font-medium"
                  >
                    查看詳情
                  </button>
                  {canManageActivity(selectedActivity) && (
                    <button
                      onClick={() => {
                        navigate(`/activities/${selectedActivity.id}/manage`)
                        setSelectedActivity(null)
                      }}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg transition-colors font-medium"
                    >
                      管理活動
                    </button>
                  )}
                  <button
                    onClick={() => setSelectedActivity(null)}
                    className="flex-1 sm:flex-none sm:px-6 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-lg transition-colors font-medium"
                  >
                    關閉
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}

export default Activities