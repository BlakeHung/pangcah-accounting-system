import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import Wrapper from '../components/Wrapper'

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

// PAPA 文化圖標
const PAPAIcons = {
  Activity: () => <span className="text-2xl">🎉</span>,
  Sun: () => <span className="text-2xl">✦</span>,
  Wave: () => <span className="text-2xl">🌊</span>,
  Mountain: () => <span className="text-2xl">⛰️</span>,
  Add: () => <span>➕</span>,
  Edit: () => <span>✏️</span>,
  Delete: () => <span>🗑️</span>,
  Calendar: () => <span>📅</span>,
  Location: () => <span>📍</span>,
  Users: () => <span>👥</span>,
  Manager: () => <span>👑</span>,
  Status: () => <span>🎯</span>,
  Manage: () => <span>⚙️</span>,
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
      case 'PLANNING': return 'bg-papa-dawn/10 text-papa-dawn'
      case 'ACTIVE': return 'bg-papa-emerald/10 text-papa-emerald'
      case 'COMPLETED': return 'bg-papa-ocean/10 text-papa-ocean'
      case 'CANCELLED': return 'bg-papa-cave/10 text-papa-cave'
      default: return 'bg-papa-mist text-papa-stone'
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

  // 根據阿美族傳統祭典類型獲取圖標
  const getActivityIcon = (name: string) => {
    if (name.includes('播種') || name.includes('Misapalaway')) return '🌱'
    if (name.includes('豐年') || name.includes('Ilisin')) return '🎊'
    if (name.includes('收穫') || name.includes('Misaopisaw')) return '🌾'
    if (name.includes('團聚') || name.includes('Misakero')) return '🏘️'
    return '🎉'
  }

  return (
    <Wrapper>
      <div className="space-y-8">
        {/* 頁面標題 */}
        <section className="papa-pattern-bg rounded-2xl p-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-papa-stone mb-2 font-display flex items-center gap-3">
                <PAPAIcons.Activity />
活動管理
              </h1>
              <p className="text-papa-cave text-lg">
管理家庭活動和費用分攟
              </p>
            </div>
            <button
              onClick={() => navigate('/activities/new')}
              className="papa-action-card px-6 py-3 flex items-center gap-2"
            >
              <PAPAIcons.Add />
              <span>籌劃新活動</span>
            </button>
          </div>
        </section>

        {/* 活動統計 */}
        <section className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="papa-stat-card income">
            <div className="papa-stat-content">
              <div className="papa-stat-icon">🌱</div>
              <h3 className="papa-stat-title">規劃中</h3>
              <p className="papa-stat-value">
                {activities?.filter(a => a.status === 'PLANNING').length || 0}
              </p>
            </div>
          </div>
          
          <div className="papa-stat-card expense">
            <div className="papa-stat-content">
              <div className="papa-stat-icon">🎊</div>
              <h3 className="papa-stat-title">進行中</h3>
              <p className="papa-stat-value">
                {activities?.filter(a => a.status === 'ACTIVE').length || 0}
              </p>
            </div>
          </div>
          
          <div className="papa-stat-card groups">
            <div className="papa-stat-content">
              <div className="papa-stat-icon">🌾</div>
              <h3 className="papa-stat-title">已完成</h3>
              <p className="papa-stat-value">
                {activities?.filter(a => a.status === 'COMPLETED').length || 0}
              </p>
            </div>
          </div>
          
          <div className="papa-stat-card events">
            <div className="papa-stat-content">
              <div className="papa-stat-icon">🏘️</div>
              <h3 className="papa-stat-title">總活動</h3>
              <p className="papa-stat-value">{activities?.length || 0}</p>
            </div>
          </div>
        </section>

        {/* 篩選器 */}
        <section className="flex gap-4 items-center">
          <span className="text-papa-stone font-medium">篩選狀態：</span>
          <div className="flex gap-2">
            {['all', 'PLANNING', 'ACTIVE', 'COMPLETED', 'CANCELLED'].map(status => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  statusFilter === status 
                    ? 'bg-papa-ocean text-white' 
                    : 'bg-papa-mist text-papa-stone hover:bg-papa-ocean/10'
                }`}
              >
                {status === 'all' ? '全部' : getStatusLabel(status)}
              </button>
            ))}
          </div>
        </section>

        {/* 活動列表 */}
        <section>
          <div className="papa-divider mb-6"></div>
          <h2 className="text-2xl font-bold text-papa-stone mb-6 font-display">
            活動列表
          </h2>
          
          {isLoading ? (
            <div className="papa-loading">
              <div className="papa-sun-loading"></div>
              <p className="papa-loading-text">載入活動中...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {activities?.map(activity => (
                <div
                  key={activity.id}
                  className="bg-white rounded-2xl p-6 shadow-papa-soft hover:shadow-papa-medium transition-shadow cursor-pointer"
                  onClick={() => setSelectedActivity(activity)}
                >
                  {/* 活動頭部 */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{getActivityIcon(activity.name)}</span>
                      <div>
                        <h3 className="text-xl font-bold text-papa-stone">
                          {activity.name}
                        </h3>
                        <p className="text-sm text-papa-cave">
                          {activity.group.name}
                        </p>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(activity.status)}`}>
                      {getStatusLabel(activity.status)}
                    </span>
                  </div>

                  {/* 活動描述 */}
                  <p className="text-papa-cave mb-4 line-clamp-2">
                    {activity.description}
                  </p>

                  {/* 活動資訊 */}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm text-papa-cave">
                      <PAPAIcons.Calendar />
                      <span>
                        {new Date(activity.start_date).toLocaleDateString('zh-TW')} - 
                        {new Date(activity.end_date).toLocaleDateString('zh-TW')}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-papa-cave">
                      <PAPAIcons.Location />
                      <span>{activity.location || '未指定地點'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-papa-cave">
                      <PAPAIcons.Users />
                      <span>{activity.participants?.length || 0} 位參與者</span>
                    </div>
                  </div>

                  {/* 管理者 */}
                  {activity.managers.length > 0 && (
                    <div className="pt-4 border-t border-papa-tribal/10">
                      <div className="flex items-center gap-2 text-sm">
                        <PAPAIcons.Manager />
                        <span className="text-papa-cave">管理者：</span>
                        <div className="flex flex-wrap gap-1">
                          {activity.managers.map(manager => (
                            <span
                              key={manager.id}
                              className="bg-papa-ocean/10 text-papa-ocean px-2 py-0.5 rounded text-xs"
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
                    <div className="flex gap-2 mt-4 pt-4 border-t border-papa-tribal/10">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          navigate(`/activities/${activity.id}/manage`)
                        }}
                        className="flex-1 bg-papa-ocean text-white py-2 rounded-lg hover:bg-papa-ocean/90 transition-colors text-sm"
                      >
                        <PAPAIcons.Manage /> 管理活動
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          navigate(`/activities/${activity.id}/edit`)
                        }}
                        className="flex-1 bg-papa-emerald text-white py-2 rounded-lg hover:bg-papa-emerald/90 transition-colors text-sm"
                      >
                        <PAPAIcons.Edit /> 編輯
                      </button>
                      {activity.status === 'PLANNING' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            if (confirm('確定要刪除這個活動嗎？')) {
                              deleteActivityMutation.mutate(activity.id)
                            }
                          }}
                          className="flex-1 bg-papa-tide text-white py-2 rounded-lg hover:bg-papa-tide/90 transition-colors text-sm"
                        >
                          <PAPAIcons.Delete /> 刪除
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* 活動詳情 Modal */}
        {selectedActivity && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-8 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <span className="text-4xl">{getActivityIcon(selectedActivity.name)}</span>
                  <div>
                    <h2 className="text-2xl font-bold text-papa-stone font-display">
                      {selectedActivity.name}
                    </h2>
                    <p className="text-papa-cave">{selectedActivity.group.name}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedActivity(null)}
                  className="text-papa-cave hover:text-papa-stone text-2xl"
                >
                  ✕
                </button>
              </div>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-papa-stone mb-2">活動描述</h3>
                  <p className="text-papa-cave">{selectedActivity.description}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-sm font-medium text-papa-cave mb-1">活動狀態</h4>
                    <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedActivity.status)}`}>
                      {getStatusLabel(selectedActivity.status)}
                    </span>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-papa-cave mb-1">活動地點</h4>
                    <p className="text-papa-stone">{selectedActivity.location || '未指定'}</p>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-papa-cave mb-1">開始時間</h4>
                    <p className="text-papa-stone">
                      {new Date(selectedActivity.start_date).toLocaleString('zh-TW')}
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-papa-cave mb-1">結束時間</h4>
                    <p className="text-papa-stone">
                      {new Date(selectedActivity.end_date).toLocaleString('zh-TW')}
                    </p>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold text-papa-stone mb-3">
                    參與者 ({selectedActivity.participants?.length || 0})
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedActivity.participants?.map(participant => (
                      <div
                        key={participant.id}
                        className="bg-papa-mist px-3 py-2 rounded-lg"
                      >
                        {participant.name || participant.username}
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="flex gap-4 pt-4 border-t border-papa-tribal/10">
                  <button
                    onClick={() => {
                      navigate(`/activities/${selectedActivity.id}`)
                      setSelectedActivity(null)
                    }}
                    className="flex-1 bg-papa-ocean text-white py-3 rounded-lg hover:bg-papa-ocean/90 transition-colors"
                  >
                    查看詳情
                  </button>
                  {canManageActivity(selectedActivity) && (
                    <button
                      onClick={() => {
                        navigate(`/activities/${selectedActivity.id}/manage`)
                        setSelectedActivity(null)
                      }}
                      className="flex-1 bg-papa-emerald text-white py-3 rounded-lg hover:bg-papa-emerald/90 transition-colors"
                    >
                      管理活動
                    </button>
                  )}
                  <button
                    onClick={() => setSelectedActivity(null)}
                    className="flex-1 bg-papa-cave/10 text-papa-stone py-3 rounded-lg hover:bg-papa-cave/20 transition-colors"
                  >
                    關閉
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Wrapper>
  )
}

export default Activities