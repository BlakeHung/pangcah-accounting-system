import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Layout from '../components/Layout'
import { useSnackbar } from '../contexts/SnackbarContext'

interface User {
  id: number
  username: string
  name: string
  email: string
  role: string
}

interface ActivityParticipant {
  id: number
  user: User
  joined_at: string
  split_option: 'NO_SPLIT' | 'PARTIAL_SPLIT' | 'FULL_SPLIT'
  is_active: boolean
  can_adjust_splits: boolean
}

interface ActivityLog {
  id: number
  action_type: string
  description: string
  operator: User | null
  timestamp: string
  metadata: any
}

interface Activity {
  id: number
  name: string
  description: string
  start_date: string
  end_date: string
  status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED'
  group: number
  group_name: string
  managers: User[]
  is_locked: boolean
  settlement_date: string | null
  budget: number | null
  participants: ActivityParticipant[]
  participant_count: number
  total_expenses: number
  is_user_manager: boolean
  is_user_participant: boolean
  created_at: string
}

interface Expense {
  id: number
  amount: number
  type: 'EXPENSE' | 'INCOME'
  date: string
  description: string
  category_name: string
  user: User
  splits: ExpenseSplit[]
  can_user_edit: boolean
  split_total: number
}

interface ExpenseSplit {
  id: number
  participant: User
  split_type: string
  split_value: number
  calculated_amount: number
  is_adjusted: boolean
  can_user_adjust: boolean
}

const ActivityManager: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { showSnackbar } = useSnackbar()
  const [user, setUser] = useState<User | null>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'expenses' | 'participants' | 'logs'>('overview')
  const [showJoinModal, setShowJoinModal] = useState(false)
  const [joinOption, setJoinOption] = useState<'NO_SPLIT' | 'PARTIAL_SPLIT' | 'FULL_SPLIT'>('FULL_SPLIT')

  // 檢查登入狀態
  useEffect(() => {
    const token = localStorage.getItem('access_token')
    const userData = localStorage.getItem('user')
    
    if (!token || !userData) {
      navigate('/login')
      return
    }
    
    try {
      const parsedUser = JSON.parse(userData)
      setUser(parsedUser)
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
    } catch (error) {
      console.error('用戶資料解析失敗:', error)
      navigate('/login')
    }
  }, [navigate])

  // 獲取活動詳情
  const { data: activity, isLoading: activityLoading } = useQuery<Activity>({
    queryKey: ['activity', id],
    queryFn: async () => {
      const response = await axios.get(`/api/v1/events/${id}/`)
      return response.data
    },
    enabled: !!user && !!id,
  })

  // 獲取活動支出
  const { data: expenses = [] } = useQuery<Expense[]>({
    queryKey: ['activity-expenses', id],
    queryFn: async () => {
      const response = await axios.get('/api/v1/expenses/', {
        params: { event: id }
      })
      return response.data.results || []
    },
    enabled: !!user && !!id,
  })

  // 獲取活動記錄
  const { data: logs = [] } = useQuery<ActivityLog[]>({
    queryKey: ['activity-logs', id],
    queryFn: async () => {
      const response = await axios.get(`/api/v1/events/${id}/logs/`)
      return response.data
    },
    enabled: !!user && !!id,
  })

  // 加入活動
  const joinActivityMutation = useMutation({
    mutationFn: async (data: { split_option: string; partial_split_expenses?: number[] }) => {
      const response = await axios.post(`/api/v1/events/${id}/join/`, data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activity', id] })
      setShowJoinModal(false)
      showSnackbar('🎉 成功加入活動！', 'success')
    },
    onError: (error) => {
      console.error('加入活動失敗:', error)
      showSnackbar('❌ 加入活動失敗，請稍後再試', 'error')
    }
  })

  // 離開活動
  const leaveActivityMutation = useMutation({
    mutationFn: async () => {
      const response = await axios.post(`/api/v1/events/${id}/leave/`)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activity', id] })
      showSnackbar('👋 已成功離開活動', 'success')
    },
    onError: (error) => {
      console.error('離開活動失敗:', error)
      showSnackbar('❌ 離開活動失敗，請稍後再試', 'error')
    }
  })

  // 執行結算
  const settlementMutation = useMutation({
    mutationFn: async () => {
      const response = await axios.post(`/api/v1/events/${id}/settlement/`)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activity', id] })
      showSnackbar('💰 活動結算已完成！', 'success')
    },
    onError: (error) => {
      console.error('結算失敗:', error)
      showSnackbar('❌ 活動結算失敗，請稍後再試', 'error')
    }
  })

  // 添加管理者
  const addManagerMutation = useMutation({
    mutationFn: async (userId: number) => {
      const response = await axios.post(`/api/v1/events/${id}/add_manager/`, { user_id: userId })
      return response.data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['activity', id] })
      showSnackbar(`👑 ${data.message}`, 'success')
    },
    onError: (error: any) => {
      console.error('添加管理者失敗:', error)
      const errorMessage = error.response?.data?.error || '添加管理者失敗，請稍後再試'
      showSnackbar(`❌ ${errorMessage}`, 'error')
    }
  })

  // 移除管理者
  const removeManagerMutation = useMutation({
    mutationFn: async (userId: number) => {
      const response = await axios.post(`/api/v1/events/${id}/remove_manager/`, { user_id: userId })
      return response.data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['activity', id] })
      showSnackbar(`🚫 ${data.message}`, 'success')
    },
    onError: (error: any) => {
      console.error('移除管理者失敗:', error)
      const errorMessage = error.response?.data?.error || '移除管理者失敗，請稍後再試'
      showSnackbar(`❌ ${errorMessage}`, 'error')
    }
  })

  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'ACTIVE': return '進行中'
      case 'COMPLETED': return '已完成'
      case 'CANCELLED': return '已取消'
      default: return status
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-100 text-green-600'
      case 'COMPLETED': return 'bg-blue-100 text-blue-600'
      case 'CANCELLED': return 'bg-red-100 text-red-600'
      default: return 'bg-gray-100 text-gray-600'
    }
  }

  const getSplitOptionDisplay = (option: string) => {
    switch (option) {
      case 'NO_SPLIT': return '不分攤先前費用'
      case 'PARTIAL_SPLIT': return '部分分攤費用'
      case 'FULL_SPLIT': return '分攤所有費用'
      default: return option
    }
  }

  const getSplitOptionColor = (option: string) => {
    switch (option) {
      case 'NO_SPLIT': return 'bg-gray-100 text-gray-600'
      case 'PARTIAL_SPLIT': return 'bg-yellow-100 text-yellow-600'
      case 'FULL_SPLIT': return 'bg-green-100 text-green-600'
      default: return 'bg-gray-100 text-gray-600'
    }
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-[#2E8B57] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">載入中...</p>
        </div>
      </div>
    )
  }

  if (activityLoading) {
    return (
      <Layout user={user}>
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-[#2E8B57] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">載入活動資料中...</p>
          </div>
        </div>
      </Layout>
    )
  }

  if (!activity) {
    return (
      <Layout user={user}>
        <div className="max-w-2xl mx-auto mt-8">
          <div className="bg-white rounded-xl p-8 shadow-lg text-center">
            <div className="text-6xl mb-4">❌</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">找不到活動</h2>
            <p className="text-gray-600 mb-6">您要查看的活動不存在或已被刪除。</p>
            <button 
              onClick={() => navigate('/activities')} 
              className="bg-[#2E8B57] hover:bg-[#1F5F3F] text-white px-6 py-3 rounded-lg transition-colors font-medium"
            >
              返回活動列表
            </button>
          </div>
        </div>
      </Layout>
    )
  }

  const isBeforeStart = new Date(activity.start_date) > new Date()
  const isInProgress = new Date(activity.start_date) <= new Date() && activity.status === 'ACTIVE'
  const canJoin = !activity.is_user_participant && (isBeforeStart || activity.is_user_manager)
  const canManage = activity.is_user_manager
  const canLeave = activity.is_user_participant || activity.is_user_manager

  return (
    <Layout user={user}>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* 活動標題和操作 */}
        <div className="bg-white rounded-xl p-6 shadow-lg">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-4 mb-4">
                <button 
                  className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
                  onClick={() => navigate('/activities')}
                >
                  <span className="text-xl">←</span>
                  <span className="text-sm font-medium">返回列表</span>
                </button>
              </div>
              
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-2xl">
                  🎉
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-800">{activity.name}</h1>
                  <p className="text-gray-600 text-sm">{activity.group_name}</p>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(activity.status)}`}>
                  {getStatusDisplay(activity.status)}
                </span>
                {activity.is_locked && (
                  <span className="px-3 py-1 bg-purple-100 text-purple-600 rounded-full text-sm font-medium">
                    🔒 已結算鎖定
                  </span>
                )}
                {canManage && (
                  <span className="px-3 py-1 bg-orange-100 text-orange-600 rounded-full text-sm font-medium">
                    👑 管理者
                  </span>
                )}
              </div>
            </div>
            
            <div className="flex flex-wrap gap-3">
              {canJoin && (
                <button 
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors font-medium flex items-center gap-2"
                  onClick={() => setShowJoinModal(true)}
                >
                  <span>➕</span>
                  <span>加入活動</span>
                </button>
              )}
              
              {canLeave && !activity.is_locked && (
                <button 
                  className="border border-gray-300 text-gray-700 hover:bg-gray-50 px-4 py-2 rounded-lg transition-colors font-medium flex items-center gap-2 disabled:opacity-50"
                  onClick={() => leaveActivityMutation.mutate()}
                  disabled={leaveActivityMutation.isPending}
                >
                  <span>🚪</span>
                  <span>{activity.is_user_manager && !activity.is_user_participant ? '移除管理權限' : '離開活動'}</span>
                </button>
              )}
              
              {canManage && activity.status === 'ACTIVE' && (
                <button 
                  className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors font-medium flex items-center gap-2 disabled:opacity-50"
                  onClick={() => settlementMutation.mutate()}
                  disabled={settlementMutation.isPending}
                >
                  <span>💰</span>
                  <span>執行結算</span>
                </button>
              )}
              
              {canManage && (
                <button 
                  className="border border-gray-300 text-gray-700 hover:bg-gray-50 px-4 py-2 rounded-lg transition-colors font-medium flex items-center gap-2"
                  onClick={() => navigate(`/activities/${id}/edit`)}
                >
                  <span>✏️</span>
                  <span>編輯活動</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* 活動基本資訊 */}
        <div className="bg-white rounded-xl p-6 shadow-lg">
          <h2 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
            <span className="text-xl">ℹ️</span>
            活動資訊
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">群組</label>
              <span className="text-gray-800">{activity.group_name}</span>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">開始時間</label>
              <span className="text-gray-800">{new Date(activity.start_date).toLocaleString('zh-TW')}</span>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">結束時間</label>
              <span className="text-gray-800">{new Date(activity.end_date).toLocaleString('zh-TW')}</span>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">參與人數</label>
              <span className="text-gray-800">{activity.participant_count} 人</span>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">總支出</label>
              <span className="text-gray-800 font-semibold">NT$ {activity.total_expenses?.toLocaleString() || 0}</span>
            </div>
            {activity.budget && (
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">預算</label>
                <span className="text-gray-800">NT$ {activity.budget.toLocaleString()}</span>
              </div>
            )}
          </div>
          
          {activity.description && (
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-2">活動描述</label>
              <p className="text-gray-800 bg-gray-50 rounded-lg p-4">{activity.description}</p>
            </div>
          )}
        </div>

        {/* 分頁導航 */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {[
                { key: 'overview', label: '總覽', icon: '📊' },
                { key: 'expenses', label: `支出記錄 (${expenses.length})`, icon: '💸' },
                { key: 'participants', label: `參與者 (${activity.participant_count})`, icon: '👥' },
                { key: 'logs', label: `活動記錄 (${logs.length})`, icon: '📝' }
              ].map(tab => (
                <button
                  key={tab.key}
                  className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                    activeTab === tab.key
                      ? 'border-[#2E8B57] text-[#2E8B57]'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                  onClick={() => setActiveTab(tab.key as any)}
                >
                  <span className="mr-2">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* 分頁內容 */}
          <div className="p-6">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* 管理者卡片 */}
                  <div className="bg-gray-50 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                      <span>👑</span>
                      管理者
                    </h3>
                    <div className="space-y-3">
                      {activity.managers.map(manager => (
                        <div key={manager.id} className="flex items-center justify-between p-3 bg-white rounded-lg">
                          <div>
                            <div className="font-medium text-gray-800">
                              {manager.name || manager.username}
                            </div>
                            <div className="text-sm text-gray-500">
                              {manager.role === 'ADMIN' ? '系統管理員' : '活動管理者'}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* 支出統計卡片 */}
                  <div className="bg-gray-50 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                      <span>📈</span>
                      支出統計
                    </h3>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">總支出</span>
                        <span className="text-xl font-bold text-gray-800">
                          NT$ {activity.total_expenses?.toLocaleString() || 0}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">支出筆數</span>
                        <span className="text-lg font-semibold text-gray-800">{expenses.length}</span>
                      </div>
                      {activity.budget && (
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">預算執行率</span>
                          <span className="text-lg font-semibold text-gray-800">
                            {((activity.total_expenses || 0) / activity.budget * 100).toFixed(1)}%
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'expenses' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-800">支出記錄</h3>
                  {((activity.status === 'ACTIVE' && activity.is_user_participant) || 
                    activity.is_user_manager || 
                    user?.role === 'ADMIN') && 
                    !activity.is_locked && (
                    <button 
                      className="bg-[#2E8B57] hover:bg-[#1F5F3F] text-white px-4 py-2 rounded-lg transition-colors font-medium flex items-center gap-2"
                      onClick={() => navigate('/transactions/new', { 
                        state: { defaultActivity: activity.id } 
                      })}
                    >
                      <span>➕</span>
                      <span>新增支出</span>
                    </button>
                  )}
                </div>
                
                <div className="space-y-4">
                  {expenses.map(expense => (
                    <div key={expense.id} className="bg-gray-50 rounded-xl p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="text-lg font-semibold text-gray-800">{expense.description}</h4>
                            <span className="text-xl font-bold text-gray-800">
                              NT$ {expense.amount.toLocaleString()}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-3">
                            <span className="flex items-center gap-1">
                              📂 {expense.category_name}
                            </span>
                            <span className="flex items-center gap-1">
                              📅 {new Date(expense.date).toLocaleDateString('zh-TW')}
                            </span>
                            <span className="flex items-center gap-1">
                              👤 {expense.user.name || expense.user.username}
                            </span>
                          </div>
                          <div className="text-sm text-gray-600">
                            分攤：{expense.splits.length} 人，總計 NT$ {expense.split_total.toLocaleString()}
                          </div>
                        </div>
                        {expense.can_user_edit && (
                          <button 
                            className="ml-4 border border-gray-300 text-gray-700 hover:bg-gray-100 px-3 py-1 rounded-lg transition-colors text-sm font-medium"
                            onClick={() => navigate(`/transactions/${expense.id}`)}
                          >
                            查看/編輯
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  {expenses.length === 0 && (
                    <div className="text-center py-12">
                      <div className="text-6xl mb-4">💸</div>
                      <h3 className="text-xl font-bold text-gray-800 mb-2">暫無支出記錄</h3>
                      <p className="text-gray-600">目前還沒有支出記錄</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'participants' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-800">參與者列表</h3>
                
                <div className="space-y-4">
                  {activity.participants.map(participant => (
                    <div key={participant.id} className="bg-gray-50 rounded-xl p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="text-lg font-semibold text-gray-800">
                              {participant.user.name || participant.user.username}
                            </span>
                            {activity.managers.some(m => m.id === participant.user.id) && (
                              <span className="px-2 py-1 bg-orange-100 text-orange-600 rounded-full text-xs font-medium">
                                👑 管理者
                              </span>
                            )}
                            {participant.can_adjust_splits && (
                              <span className="px-2 py-1 bg-blue-100 text-blue-600 rounded-full text-xs font-medium">
                                🔧 可調整分攤
                              </span>
                            )}
                          </div>
                          
                          <div className="text-sm text-gray-600 space-y-1">
                            <div>📧 {participant.user.email}</div>
                            <div className="flex items-center gap-4">
                              <span>📅 加入時間: {new Date(participant.joined_at).toLocaleDateString('zh-TW')}</span>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSplitOptionColor(participant.split_option)}`}>
                                {getSplitOptionDisplay(participant.split_option)}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        {canManage && participant.user.id !== user?.id && (
                          <div className="flex gap-2">
                            {activity.managers.some(m => m.id === participant.user.id) ? (
                              <button
                                className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-lg transition-colors text-sm font-medium disabled:opacity-50"
                                onClick={() => removeManagerMutation.mutate(participant.user.id)}
                                disabled={removeManagerMutation.isPending}
                              >
                                移除管理者
                              </button>
                            ) : (
                              <button
                                className="bg-[#2E8B57] hover:bg-[#1F5F3F] text-white px-3 py-1 rounded-lg transition-colors text-sm font-medium disabled:opacity-50"
                                onClick={() => addManagerMutation.mutate(participant.user.id)}
                                disabled={addManagerMutation.isPending}
                              >
                                設為管理者
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'logs' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-800">活動記錄</h3>
                
                <div className="space-y-3">
                  {logs.map(log => (
                    <div key={log.id} className="bg-gray-50 rounded-xl p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="text-gray-800 font-medium">{log.description}</div>
                          {log.operator && (
                            <div className="text-sm text-gray-600">
                              操作者: {log.operator.name || log.operator.username}
                            </div>
                          )}
                        </div>
                        <div className="text-sm text-gray-500 ml-4">
                          {new Date(log.timestamp).toLocaleString('zh-TW')}
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {logs.length === 0 && (
                    <div className="text-center py-12">
                      <div className="text-6xl mb-4">📝</div>
                      <h3 className="text-xl font-bold text-gray-800 mb-2">暫無操作記錄</h3>
                      <p className="text-gray-600">目前還沒有操作記錄</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 加入活動模態框 */}
        {showJoinModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-8 max-w-md w-full">
              <h3 className="text-xl font-bold text-gray-800 mb-4">加入活動</h3>
              <p className="text-gray-600 mb-6">選擇您的費用分攤方式：</p>
              
              <div className="space-y-3 mb-6">
                <label className="flex items-start gap-3 p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                  <input
                    type="radio"
                    value="FULL_SPLIT"
                    checked={joinOption === 'FULL_SPLIT'}
                    onChange={(e) => setJoinOption(e.target.value as any)}
                    className="mt-1 w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                  />
                  <div>
                    <div className="font-medium text-gray-800">分攤所有費用</div>
                    <div className="text-sm text-gray-600">承擔活動從開始到當前的所有費用</div>
                  </div>
                </label>
                
                <label className="flex items-start gap-3 p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                  <input
                    type="radio"
                    value="NO_SPLIT"
                    checked={joinOption === 'NO_SPLIT'}
                    onChange={(e) => setJoinOption(e.target.value as any)}
                    className="mt-1 w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                  />
                  <div>
                    <div className="font-medium text-gray-800">不分攤先前費用</div>
                    <div className="text-sm text-gray-600">只承擔加入時點之後的費用</div>
                  </div>
                </label>
                
                <label className="flex items-start gap-3 p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                  <input
                    type="radio"
                    value="PARTIAL_SPLIT"
                    checked={joinOption === 'PARTIAL_SPLIT'}
                    onChange={(e) => setJoinOption(e.target.value as any)}
                    className="mt-1 w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                  />
                  <div>
                    <div className="font-medium text-gray-800">部分分攤費用</div>
                    <div className="text-sm text-gray-600">選擇特定支出項目進行分攤</div>
                  </div>
                </label>
              </div>
              
              <div className="flex gap-3">
                <button 
                  className="flex-1 border border-gray-300 text-gray-700 hover:bg-gray-50 py-3 rounded-lg transition-colors font-medium"
                  onClick={() => setShowJoinModal(false)}
                >
                  取消
                </button>
                <button 
                  className="flex-1 bg-[#2E8B57] hover:bg-[#1F5F3F] text-white py-3 rounded-lg transition-colors font-medium flex items-center justify-center gap-2 disabled:opacity-50"
                  onClick={() => joinActivityMutation.mutate({ split_option: joinOption })}
                  disabled={joinActivityMutation.isPending}
                >
                  {joinActivityMutation.isPending ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>處理中...</span>
                    </>
                  ) : (
                    <>
                      <span>✓</span>
                      <span>確認加入</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}

export default ActivityManager