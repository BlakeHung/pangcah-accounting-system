import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import Layout from '../components/Layout'
import { useSnackbar } from '../contexts/SnackbarContext'

interface User {
  id: number
  username: string
  name: string
  role: string
}

interface ActivityParticipant {
  id: number
  user: User
  joined_at: string
  split_option: 'NO_SPLIT' | 'PARTIAL_SPLIT' | 'FULL_SPLIT'
  is_active: boolean
}

interface Group {
  id: number
  name: string
  members: { user: User }[]
}

interface Activity {
  id: number
  name: string
  description: string
  start_date: string
  end_date: string
  status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED'
  enabled: boolean
  is_user_manager: boolean
  group: number
  group_name: string
  managers: User[]
  participants: ActivityParticipant[]
  created_at: string
  updated_at: string
}

interface ActivityForm {
  name: string
  description: string
  start_date: string
  end_date: string
  status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED'
  enabled: boolean
}

const ActivityEdit: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { showSnackbar } = useSnackbar()
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [groupMembers, setGroupMembers] = useState<Group | null>(null)
  const [formData, setFormData] = useState<ActivityForm>({
    name: '',
    description: '',
    start_date: '',
    end_date: '',
    status: 'ACTIVE',
    enabled: true
  })

  // 檢查當前用戶
  useEffect(() => {
    const token = localStorage.getItem('access_token')
    const userData = localStorage.getItem('user')
    
    if (!token || !userData) {
      navigate('/login')
      return
    }
    
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
    setCurrentUser(JSON.parse(userData))
  }, [navigate])
  
  // 獲取活動詳情
  const { data: activity, isLoading, error } = useQuery({
    queryKey: ['activity', id],
    queryFn: async (): Promise<Activity> => {
      const response = await axios.get(`/api/v1/events/${id}/`)
      return response.data
    },
    enabled: !!id && !!currentUser
  })

  // 獲取群組成員
  const { data: groupData } = useQuery({
    queryKey: ['group', activity?.group],
    queryFn: async (): Promise<Group> => {
      const response = await axios.get(`/api/v1/groups/${activity?.group}/`)
      return response.data
    },
    enabled: !!activity?.group
  })

  // 獲取所有用戶（用於跨群組邀請）
  const { data: allUsers } = useQuery({
    queryKey: ['users'],
    queryFn: async (): Promise<User[]> => {
      const response = await axios.get('/api/v1/auth/users/')
      return response.data.results || response.data
    },
    enabled: !!currentUser
  })

  // 在活動資料載入後檢查權限並填充表單
  useEffect(() => {
    if (activity) {
      // 檢查權限
      if (!activity.is_user_manager) {
        navigate('/activities')
        return
      }
      
      // 填充表單
      setFormData({
        name: activity.name,
        description: activity.description,
        start_date: new Date(activity.start_date).toISOString().slice(0, 16),
        end_date: new Date(activity.end_date).toISOString().slice(0, 16),
        status: activity.status,
        enabled: activity.enabled
      })
    }
  }, [activity, navigate])

  // 更新活動
  const updateActivityMutation = useMutation({
    mutationFn: async (data: ActivityForm) => {
      const response = await axios.put(`/api/v1/events/${id}/`, data)
      return response.data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['activity', id] })
      queryClient.invalidateQueries({ queryKey: ['activities'] })
      showSnackbar('活動已成功更新', 'success')
      navigate(`/activities/${data.id}`)
    },
    onError: (error: any) => {
      console.error('更新活動失敗:', error)
      showSnackbar('更新活動失敗，請檢查輸入內容', 'error')
    }
  })

  // 邀請用戶加入活動
  const inviteParticipantMutation = useMutation({
    mutationFn: async (userId: number) => {
      const response = await axios.post(`/api/v1/events/${id}/invite_participant/`, {
        user_id: userId,
        split_option: 'FULL_SPLIT'
      })
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activity', id] })
      showSnackbar('成功邀請參與者', 'success')
    },
    onError: (error: any) => {
      console.error('邀請參與者失敗:', error)
      const errorMessage = error.response?.data?.error || '邀請參與者失敗，請稍後再試'
      showSnackbar(errorMessage, 'error')
    }
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // 驗證必填欄位
    if (!formData.name || !formData.start_date || !formData.end_date) {
      alert('請填寫所有必填欄位')
      return
    }

    // 驗證時間邏輯
    const startDate = new Date(formData.start_date)
    const endDate = new Date(formData.end_date)
    
    if (startDate >= endDate) {
      alert('結束時間必須晚於開始時間')
      return
    }

    updateActivityMutation.mutate(formData)
  }

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'ACTIVE': return 'bg-green-100 text-green-600'
      case 'COMPLETED': return 'bg-blue-100 text-blue-600'
      case 'CANCELLED': return 'bg-red-100 text-red-600'
      default: return 'bg-gray-100 text-gray-600'
    }
  }

  const getStatusLabel = (status: string) => {
    switch(status) {
      case 'ACTIVE': return '進行中'
      case 'COMPLETED': return '已完成'
      case 'CANCELLED': return '已取消'
      default: return status
    }
  }

  if (isLoading) {
    return (
      <Layout user={currentUser}>
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">載入中...</p>
          </div>
        </div>
      </Layout>
    )
  }

  if (error || !activity) {
    return (
      <Layout user={currentUser}>
        <div className="max-w-2xl mx-auto mt-8">
          <div className="bg-white rounded-xl p-8 shadow-lg text-center">
            <div className="text-6xl mb-4">❌</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">找不到活動</h2>
            <p className="text-gray-600 mb-6">您要編輯的活動不存在或已被刪除。</p>
            <button 
              onClick={() => navigate('/activities')} 
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors font-medium"
            >
              返回活動列表
            </button>
          </div>
        </div>
      </Layout>
    )
  }

  if (!currentUser) {
    return (
      <Layout user={currentUser}>
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">載入中...</p>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout user={currentUser}>
      <div className="max-w-5xl mx-auto space-y-6">
        {/* 頁面標題 */}
        <div className="bg-white rounded-xl p-6 shadow-lg">
          <div className="flex items-center gap-4 mb-4">
            <button 
              className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
              onClick={() => navigate(`/activities/${id}`)}
            >
              <span className="text-xl">←</span>
              <span className="text-sm font-medium">返回詳情</span>
            </button>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-2xl">
              ✏️
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">編輯活動</h1>
              <p className="text-gray-600 text-sm">修改活動資訊和管理參與者</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* 主要表單區域 */}
          <div className="xl:col-span-2 space-y-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* 基本資訊 */}
              <div className="bg-white rounded-xl p-6 shadow-lg">
                <h2 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                  <span className="text-xl">📝</span>
                  基本資訊
                </h2>
                
                <div className="space-y-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                      活動名稱 *
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="輸入活動名稱"
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                  </div>

                  <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                      活動描述
                    </label>
                    <textarea
                      id="description"
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      placeholder="詳細描述這個活動的內容、目的和注意事項..."
                      rows={4}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* 時間設定 */}
              <div className="bg-white rounded-xl p-6 shadow-lg">
                <h2 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                  <span className="text-xl">⏰</span>
                  時間設定
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label htmlFor="start_date" className="block text-sm font-medium text-gray-700 mb-2">
                      開始時間 *
                    </label>
                    <input
                      type="datetime-local"
                      id="start_date"
                      name="start_date"
                      value={formData.start_date}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                  </div>

                  <div>
                    <label htmlFor="end_date" className="block text-sm font-medium text-gray-700 mb-2">
                      結束時間 *
                    </label>
                    <input
                      type="datetime-local"
                      id="end_date"
                      name="end_date"
                      value={formData.end_date}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                  </div>
                </div>

                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-blue-800">活動時長:</span>
                    <span className="text-sm text-blue-700">
                      {(() => {
                        const start = new Date(formData.start_date)
                        const end = new Date(formData.end_date)
                        const diffMs = end.getTime() - start.getTime()
                        if (diffMs <= 0) return '請檢查時間設定'
                        
                        const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
                        const diffDays = Math.floor(diffHours / 24)
                        
                        if (diffDays > 0) {
                          return `${diffDays} 天 ${diffHours % 24} 小時`
                        } else {
                          return `${diffHours} 小時`
                        }
                      })()}
                    </span>
                  </div>
                </div>
              </div>

              {/* 狀態設定 */}
              <div className="bg-white rounded-xl p-6 shadow-lg">
                <h2 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                  <span className="text-xl">⚙️</span>
                  狀態設定
                </h2>
                
                <div className="space-y-4">
                  <div>
                    <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                      活動狀態
                    </label>
                    <select
                      id="status"
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white"
                    >
                      <option value="ACTIVE">進行中</option>
                      <option value="COMPLETED">已完成</option>
                      <option value="CANCELLED">已取消</option>
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                      更改活動狀態會影響相關功能的使用
                    </p>
                  </div>

                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      id="enabled"
                      name="enabled"
                      checked={formData.enabled}
                      onChange={handleInputChange}
                      className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <div>
                      <label htmlFor="enabled" className="text-sm font-medium text-gray-700">
                        啟用活動
                      </label>
                      <p className="text-xs text-gray-500 mt-1">
                        停用的活動不會在前台顯示，但仍可在管理介面中管理
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* 表單操作 */}
              <div className="bg-white rounded-xl p-6 shadow-lg">
                <div className="flex flex-col sm:flex-row gap-4">
                  <button
                    type="button"
                    onClick={() => navigate(`/activities/${id}`)}
                    className="flex-1 sm:flex-none sm:px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                  >
                    取消
                  </button>
                  <button
                    type="submit"
                    disabled={updateActivityMutation.isPending}
                    className="flex-1 px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {updateActivityMutation.isPending ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        <span>更新中...</span>
                      </>
                    ) : (
                      <>
                        <span>✓</span>
                        <span>更新活動</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>

            {/* 參與者管理 */}
            <div className="bg-white rounded-xl p-6 shadow-lg">
              <h2 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                <span className="text-xl">👥</span>
                參與者管理
              </h2>
              
              {/* 當前參與者列表 */}
              <div className="mb-6">
                <h3 className="text-md font-semibold text-gray-800 mb-4">
                  目前參與者 ({activity?.participants?.filter(p => p.is_active).length || 0} 人)
                </h3>
                <div className="space-y-2">
                  {activity?.participants?.filter(p => p.is_active).map(participant => (
                    <div key={participant.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-800">
                            {participant.user.name || participant.user.username}
                          </span>
                          {activity.managers.some(m => m.id === participant.user.id) && (
                            <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                              管理者
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500">
                          加入時間: {new Date(participant.joined_at).toLocaleDateString('zh-TW')}
                        </p>
                      </div>
                    </div>
                  ))}
                  {(!activity?.participants || activity.participants.filter(p => p.is_active).length === 0) && (
                    <div className="text-center py-8">
                      <div className="text-4xl mb-2">👤</div>
                      <p className="text-gray-500">目前沒有參與者</p>
                    </div>
                  )}
                </div>
              </div>

              {/* 邀請群組成員 */}
              {groupData && (
                <div className="mb-6">
                  <h3 className="text-md font-semibold text-gray-800 mb-4">邀請群組成員</h3>
                  <div className="space-y-2">
                    {groupData.members
                      .filter(member => !activity?.participants?.some(p => p.user.id === member.user.id && p.is_active))
                      .map(member => (
                        <div key={member.user.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <div className="font-medium text-gray-800">
                              {member.user.name || member.user.username}
                            </div>
                            <div className="text-sm text-gray-500">
                              @{member.user.username}
                            </div>
                          </div>
                          <button
                            type="button"
                            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium disabled:opacity-50"
                            onClick={() => inviteParticipantMutation.mutate(member.user.id)}
                            disabled={inviteParticipantMutation.isPending}
                          >
                            邀請
                          </button>
                        </div>
                      ))}
                    {groupData.members.filter(member => 
                      !activity?.participants?.some(p => p.user.id === member.user.id && p.is_active)
                    ).length === 0 && (
                      <div className="text-center py-8">
                        <div className="text-4xl mb-2">✅</div>
                        <p className="text-gray-500">群組中的所有成員都已是參與者</p>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    您可以邀請群組中的其他成員加入此活動
                  </p>
                </div>
              )}

              {/* 邀請其他用戶 */}
              {allUsers && (
                <div>
                  <h3 className="text-md font-semibold text-gray-800 mb-4">邀請其他用戶</h3>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {allUsers
                      .filter(user => 
                        // 排除已經是參與者的用戶
                        !activity?.participants?.some(p => p.user.id === user.id && p.is_active) &&
                        // 排除群組成員（已在上方顯示）
                        !(groupData?.members.some(member => member.user.id === user.id))
                      )
                      .map(user => (
                        <div key={user.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <div className="font-medium text-gray-800">
                              {user.name || user.username}
                            </div>
                            <div className="text-sm text-gray-500">
                              @{user.username} • {user.role === 'ADMIN' ? '系統管理員' : 
                               user.role === 'GROUP_MANAGER' ? '群組管理員' : '一般用戶'}
                            </div>
                          </div>
                          <button
                            type="button"
                            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium disabled:opacity-50"
                            onClick={() => inviteParticipantMutation.mutate(user.id)}
                            disabled={inviteParticipantMutation.isPending}
                          >
                            邀請
                          </button>
                        </div>
                      ))}
                    {allUsers.filter(user => 
                      !activity?.participants?.some(p => p.user.id === user.id && p.is_active) &&
                      !(groupData?.members.some(member => member.user.id === user.id))
                    ).length === 0 && (
                      <div className="text-center py-8">
                        <div className="text-4xl mb-2">🔍</div>
                        <p className="text-gray-500">沒有其他可邀請的用戶</p>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    您可以邀請系統中的任何用戶加入此活動，不限於群組成員
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* 側邊預覽區域 */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl p-6 shadow-lg sticky top-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <span className="text-xl">👁️</span>
                活動預覽
              </h3>
              <div className="space-y-4">
                <div>
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="text-xl font-bold text-gray-800 line-clamp-2">
                      {formData.name || '活動名稱'}
                    </h4>
                  </div>
                  <div className="flex flex-wrap gap-2 mb-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(formData.status)}`}>
                      {getStatusLabel(formData.status)}
                    </span>
                    {!formData.enabled && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
                        已停用
                      </span>
                    )}
                  </div>
                </div>
                
                {formData.description && (
                  <div>
                    <p className="text-sm text-gray-600 line-clamp-3">{formData.description}</p>
                  </div>
                )}
                
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">🗓️ 開始:</span>
                    <span className="text-gray-800">
                      {formData.start_date ? new Date(formData.start_date).toLocaleString('zh-TW') : '未設定'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">🏁 結束:</span>
                    <span className="text-gray-800">
                      {formData.end_date ? new Date(formData.end_date).toLocaleString('zh-TW') : '未設定'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">👥 參與者:</span>
                    <span className="text-gray-800">
                      {activity?.participants?.filter(p => p.is_active).length || 0} 人
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}

export default ActivityEdit