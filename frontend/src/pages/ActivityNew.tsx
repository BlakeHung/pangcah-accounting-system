import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery } from '@tanstack/react-query'
import axios from 'axios'
import Layout from '../components/Layout'
import { useSnackbar } from '../contexts/SnackbarContext'

interface ManagedGroup {
  id: number
  name: string
  description: string
}

interface User {
  id: number
  username: string
  name: string
  role: string
  managed_groups?: ManagedGroup[]
}

interface Group {
  id: number
  name: string
  description: string
  members: { user: User }[]
}

interface ActivityForm {
  name: string
  description: string
  start_date: string
  end_date: string
  status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED'
  enabled: boolean
  group: number | null
  participants: number[]
}

const ActivityNew: React.FC = () => {
  const navigate = useNavigate()
  const { showSnackbar } = useSnackbar()
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [formData, setFormData] = useState<ActivityForm>({
    name: '',
    description: '',
    start_date: new Date().toISOString().slice(0, 16), // yyyy-MM-ddTHH:mm格式
    end_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 16), // 預設明天
    status: 'ACTIVE',
    enabled: true,
    group: null,
    participants: []
  })
  const [crossGroupParticipants, setCrossGroupParticipants] = useState<number[]>([])
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null)

  // 檢查當前用戶
  useEffect(() => {
    const token = localStorage.getItem('access_token')
    const userData = localStorage.getItem('user')
    
    if (!token || !userData) {
      navigate('/login')
      return
    }
    
    const user = JSON.parse(userData)
    
    // 檢查是否有權限創建活動
    const canCreateActivity = user.role === 'ADMIN' || (user.managed_groups && user.managed_groups.length > 0)
    if (!canCreateActivity) {
      navigate('/activities')
      return
    }
    
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
    setCurrentUser(user)
  }, [navigate])

  // 獲取群組列表
  const { data: groups, isLoading: groupsLoading } = useQuery({
    queryKey: ['groups'],
    queryFn: async (): Promise<Group[]> => {
      const response = await axios.get('/api/v1/groups/')
      return response.data.results || response.data
    },
    enabled: !!currentUser
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

  // 創建活動
  const createActivityMutation = useMutation({
    mutationFn: async (data: ActivityForm) => {
      // 將 participants 重新命名為 participant_ids 以符合後端 API
      // 合併群組內參與者和跨群組參與者
      const allParticipantIds = [...data.participants, ...crossGroupParticipants]
      const requestData = {
        ...data,
        participant_ids: allParticipantIds,
        participants: undefined // 移除原始的 participants 欄位
      }
      delete requestData.participants
      
      const response = await axios.post('/api/v1/events/', requestData)
      return response.data
    },
    onSuccess: (data) => {
      showSnackbar('活動創建成功', 'success')
      navigate(`/activities/${data.id}`)
    },
    onError: (error: any) => {
      console.error('創建活動失敗:', error)
      showSnackbar('創建活動失敗，請檢查輸入內容', 'error')
    }
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }))
  }

  const handleGroupSelect = (groupId: string) => {
    const group = groups?.find(g => g.id === parseInt(groupId)) || null
    setSelectedGroup(group)
    setFormData(prev => ({
      ...prev,
      group: group ? group.id : null,
      participants: [] // 重置參與者選擇
    }))
    setCrossGroupParticipants([]) // 重置跨群組參與者選擇
  }

  const handleParticipantToggle = (userId: number) => {
    setFormData(prev => ({
      ...prev,
      participants: prev.participants.includes(userId)
        ? prev.participants.filter(id => id !== userId)
        : [...prev.participants, userId]
    }))
  }

  const handleSelectAllParticipants = () => {
    if (!selectedGroup) return
    
    const allUserIds = selectedGroup.members.map(member => member.user.id)
    const isAllSelected = allUserIds.every(id => formData.participants.includes(id))
    
    setFormData(prev => ({
      ...prev,
      participants: isAllSelected ? [] : allUserIds
    }))
  }

  const handleCrossGroupParticipantToggle = (userId: number) => {
    setCrossGroupParticipants(prev => 
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    )
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // 驗證必填欄位
    if (!formData.name || !formData.start_date || !formData.end_date) {
      showSnackbar('請填寫所有必填欄位', 'error')
      return
    }

    // 驗證時間邏輯
    const startDate = new Date(formData.start_date)
    const endDate = new Date(formData.end_date)
    
    if (startDate >= endDate) {
      showSnackbar('結束時間必須晚於開始時間', 'error')
      return
    }

    createActivityMutation.mutate(formData)
  }

  if (!currentUser) {
    return (
      <Layout user={currentUser}>
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-[#2E8B57] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">載入中...</p>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout user={currentUser}>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* 頁面標題 */}
        <div className="bg-white rounded-xl p-6 shadow-papa-soft">
          <div className="flex items-center gap-4 mb-4">
            <button 
              onClick={() => navigate('/activities')}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              <span className="text-xl">←</span>
              <span className="text-sm font-medium">返回列表</span>
            </button>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-2xl">
              🎉
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">新增活動</h1>
              <p className="text-gray-600 text-sm">建立新的群組活動或跨群組活動</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 基本資訊 */}
          <div className="bg-white rounded-xl p-6 shadow-papa-soft">
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
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="輸入活動名稱"
                  required
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
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                  placeholder="詳細描述這個活動的內容、目的和注意事項..."
                  rows={4}
                />
              </div>
            </div>
          </div>

          {/* 群組與參與者 */}
          <div className="bg-white rounded-xl p-6 shadow-papa-soft">
            <h2 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
              <span className="text-xl">👥</span>
              群組與參與者
            </h2>
            
            <div className="space-y-6">
              <div>
                <label htmlFor="group" className="block text-sm font-medium text-gray-700 mb-2">
                  選擇主要群組（可選）
                </label>
                <select
                  id="group"
                  value={formData.group || ''}
                  onChange={(e) => handleGroupSelect(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all appearance-none bg-white"
                >
                  <option value="">🚫 不綁定群組（純跨群組活動）</option>
                  {groups?.map(group => (
                    <option key={group.id} value={group.id}>
                      {group.name} ({group.members.length} 位成員)
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  選擇主要群組可以方便管理，但活動也可以不綁定群組
                </p>
              </div>

              {selectedGroup && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-4">
                    選擇群組參與者
                  </label>
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <button
                        type="button"
                        onClick={handleSelectAllParticipants}
                        className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                      >
                        {selectedGroup.members.every(member => formData.participants.includes(member.user.id))
                          ? '取消全選'
                          : '全選成員'
                        }
                      </button>
                      <span className="text-sm text-gray-600">
                        已選擇 {formData.participants.length} / {selectedGroup.members.length} 位成員
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-60 overflow-y-auto">
                      {selectedGroup.members.map(member => (
                        <label key={member.user.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.participants.includes(member.user.id)}
                            onChange={() => handleParticipantToggle(member.user.id)}
                            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {member.user.name || member.user.username}
                            </p>
                            <p className="text-xs text-gray-500">
                              @{member.user.username}
                            </p>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    您可以選擇讓哪些群組成員參與此活動
                  </p>
                </div>
              )}

              {/* 跨群組參與者選擇 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-4">
                  邀請其他用戶
                  {(formData.participants.length > 0 || crossGroupParticipants.length > 0) && (
                    <span className="ml-2 text-xs text-gray-500">
                      (已選擇 {crossGroupParticipants.length} 位外部用戶
                      {formData.participants.length > 0 && `, 群組內: ${formData.participants.length} 位`})
                    </span>
                  )}
                </label>
                
                {allUsers && allUsers.filter(user => 
                  !(selectedGroup?.members.some(member => member.user.id === user.id))
                ).length > 0 ? (
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-60 overflow-y-auto">
                      {allUsers
                        ?.filter(user => 
                          // 排除群組成員（如果有選擇群組的話）
                          !(selectedGroup?.members.some(member => member.user.id === user.id))
                        )
                        .map(user => (
                          <label key={user.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer">
                            <input
                              type="checkbox"
                              checked={crossGroupParticipants.includes(user.id)}
                              onChange={() => handleCrossGroupParticipantToggle(user.id)}
                              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {user.name || user.username}
                              </p>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-500">@{user.username}</span>
                                {user.role === 'ADMIN' && (
                                  <span className="text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded">
                                    管理員
                                  </span>
                                )}
                              </div>
                            </div>
                          </label>
                        ))}
                    </div>
                  </div>
                ) : (
                  <div className="border border-gray-200 rounded-lg p-8 text-center text-gray-500">
                    {selectedGroup ? '沒有其他可邀請的用戶' : '請先選擇群組或載入用戶列表'}
                  </div>
                )}
                <p className="text-xs text-gray-500 mt-2">
                  您可以邀請系統中的任何用戶參與活動
                </p>
              </div>
            </div>
          </div>

          {/* 時間設定 */}
          <div className="bg-white rounded-xl p-6 shadow-papa-soft">
            <h2 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
              <span className="text-xl">⏰</span>
              時間設定
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  required
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
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  required
                />
              </div>
            </div>

            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-2 text-sm">
                <span className="text-blue-700 font-medium">活動時長:</span>
                <span className="text-blue-600">
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
          <div className="bg-white rounded-xl p-6 shadow-papa-soft">
            <h2 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
              <span className="text-xl">⚙️</span>
              狀態設定
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                  初始狀態
                </label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all appearance-none bg-white"
                >
                  <option value="ACTIVE">🟢 進行中</option>
                  <option value="COMPLETED">✅ 已完成</option>
                  <option value="CANCELLED">❌ 已取消</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  通常新活動設定為「進行中」狀態
                </p>
              </div>

              <div className="flex items-center">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    name="enabled"
                    checked={formData.enabled}
                    onChange={handleInputChange}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-700">啟用活動</span>
                    <p className="text-xs text-gray-500">
                      停用的活動不會在前台顯示
                    </p>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* 預覽區域 */}
          <div className="bg-gradient-to-br from-blue-50 to-green-50 rounded-xl p-6 shadow-papa-soft">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span className="text-xl">👁️</span>
              活動預覽
            </h3>
            <div className="bg-white rounded-lg p-4">
              <div className="flex items-start justify-between mb-3">
                <h4 className="text-base font-semibold text-gray-800">
                  {formData.name || '（未設定活動名稱）'}
                </h4>
                <div className="flex gap-2">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                    formData.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 
                    formData.status === 'COMPLETED' ? 'bg-gray-100 text-gray-700' : 
                    'bg-red-100 text-red-700'
                  }`}>
                    {formData.status === 'ACTIVE' ? '進行中' : 
                     formData.status === 'COMPLETED' ? '已完成' : '已取消'}
                  </span>
                  {!formData.enabled && (
                    <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600 font-medium">
                      已停用
                    </span>
                  )}
                </div>
              </div>
              
              {formData.description && (
                <p className="text-sm text-gray-600 mb-3">{formData.description}</p>
              )}
              
              <div className="flex flex-wrap gap-4 text-xs text-gray-500">
                <div className="flex items-center gap-1">
                  <span>📅</span>
                  <span>開始: {formData.start_date ? new Date(formData.start_date).toLocaleString('zh-TW') : '未設定'}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span>🏁</span>
                  <span>結束: {formData.end_date ? new Date(formData.end_date).toLocaleString('zh-TW') : '未設定'}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span>👥</span>
                  <span>參與者: {formData.participants.length + crossGroupParticipants.length} 人</span>
                </div>
              </div>
            </div>
          </div>

          {/* 表單操作 */}
          <div className="bg-white rounded-xl p-6 shadow-papa-soft">
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                type="button"
                onClick={() => navigate('/activities')}
                className="flex-1 sm:flex-none sm:px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                取消
              </button>
              <button
                type="submit"
                disabled={createActivityMutation.isPending}
                className="flex-1 px-8 py-3 bg-[#2E8B57] hover:bg-[#1F5F3F] disabled:bg-blue-400 text-white rounded-lg transition-colors font-medium flex items-center justify-center gap-2"
              >
                {createActivityMutation.isPending ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>創建中...</span>
                  </>
                ) : (
                  <>
                    <span>✓</span>
                    <span>創建活動</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </Layout>
  )
}

export default ActivityNew