import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import Layout from '../components/Layout'
import { useSnackbar } from '../contexts/SnackbarContext'

interface User {
  id: number
  username: string
  name: string
  role: string
}

interface GroupMember {
  id: number
  name: string
  user?: User
  is_system_user: boolean
}

interface Group {
  id: number
  name: string
  description: string
  created_by: User
  managers: User[]
  members: GroupMember[]
  member_count: number
  created_at: string
}

interface GroupForm {
  name: string
  description: string
  managers: number[]
}

// PAPA 文化圖標
const PAPAIcons = {
  House: () => <span className="text-2xl">🏘️</span>,
  Add: () => <span>➕</span>,
  Edit: () => <span>✏️</span>,
  Delete: () => <span>🗑️</span>,
  User: () => <span>👤</span>,
  Users: () => <span>👥</span>,
  Manager: () => <span>👑</span>,
}

const Groups: React.FC = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { showSnackbar } = useSnackbar()
  
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingGroup, setEditingGroup] = useState<Group | null>(null)
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null)
  const [groupForm, setGroupForm] = useState<GroupForm>({
    name: '',
    description: '',
    managers: []
  })

  // 獲取當前用戶
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}')

  // 獲取群組列表
  const { data: groups, isLoading } = useQuery({
    queryKey: ['groups'],
    queryFn: async () => {
      try {
        const response = await axios.get('/api/v1/groups/')
        // 檢查是否為佔位資料
        if (response.data[0]?.status === 'placeholder') {
          return [] // 返回空陣列
        }
        return response.data.results || []
      } catch (error) {
        console.warn('無法獲取群組列表:', error)
        return []
      }
    }
  })

  // 獲取所有用戶（用於管理員選擇）
  const { data: allUsers } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      try {
        const response = await axios.get('/api/v1/auth/users/')
        return response.data.results || []
      } catch (error) {
        console.warn('無法獲取用戶列表:', error)
        return []
      }
    }
  })

  // 創建群組
  const createGroupMutation = useMutation({
    mutationFn: async (data: GroupForm) => {
      const response = await axios.post('/api/v1/groups/', data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] })
      setShowCreateForm(false)
      resetForm()
      showSnackbar('群組創建成功！', 'success')
    },
    onError: (error: any) => {
      const message = error.response?.data?.detail || error.message || '群組創建失敗'
      showSnackbar(message, 'error')
    }
  })

  // 更新群組
  const updateGroupMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: GroupForm }) => {
      const response = await axios.put(`/api/v1/groups/${id}/`, data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] })
      setEditingGroup(null)
      setShowCreateForm(false)
      resetForm()
      showSnackbar('群組更新成功！', 'success')
    },
    onError: (error: any) => {
      const message = error.response?.data?.detail || error.message || '群組更新失敗'
      showSnackbar(message, 'error')
      setEditingGroup(null)
      resetForm()
    }
  })

  // 刪除群組
  const deleteGroupMutation = useMutation({
    mutationFn: async (id: number) => {
      await axios.delete(`/api/v1/groups/${id}/`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] })
      showSnackbar('群組刪除成功！', 'success')
    },
    onError: (error: any) => {
      const message = error.response?.data?.detail || error.message || '群組刪除失敗'
      showSnackbar(message, 'error')
    }
  })

  const resetForm = () => {
    setGroupForm({
      name: '',
      description: '',
      managers: []
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (editingGroup) {
      updateGroupMutation.mutate({ id: editingGroup.id, data: groupForm })
    } else {
      createGroupMutation.mutate(groupForm)
    }
  }

  const startEdit = (group: Group) => {
    setEditingGroup(group)
    setGroupForm({
      name: group.name,
      description: group.description,
      managers: group.managers.map(m => m.id)
    })
    setShowCreateForm(true)
  }

  const canManageGroup = (group: Group) => {
    return currentUser.role === 'ADMIN' || 
           group.managers.some(m => m.id === currentUser.id)
  }

  if (isLoading) {
    return (
      <Layout user={currentUser}>
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-[#2E8B57] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">載入群組中...</p>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout user={currentUser}>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* 頁面標題 */}
        <div className="bg-white rounded-xl p-6 shadow-lg">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2 flex items-center gap-3">
                <span className="text-2xl">👥</span>
                群組管理
              </h1>
              <p className="text-gray-600 text-sm md:text-base">
                管理所有群組成員和設定
              </p>
            </div>
            <button
              onClick={() => setShowCreateForm(true)}
              className="bg-[#2E8B57] hover:bg-[#1F5F3F] text-white px-4 py-2 rounded-lg transition-colors font-medium flex items-center gap-2 text-sm"
            >
              <span>➕</span>
              <span className="hidden sm:inline">建立新群組</span>
              <span className="sm:hidden">新建</span>
            </button>
          </div>
        </div>

        {/* 群組統計 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl p-6 shadow-lg border-l-4 border-blue-400">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-600 mb-1">總群組數</h3>
                <p className="text-2xl font-bold text-blue-600">{groups?.length || 0}</p>
              </div>
              <div className="text-3xl opacity-80">🏘️</div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-6 shadow-lg border-l-4 border-green-400">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-600 mb-1">總成員數</h3>
                <p className="text-2xl font-bold text-green-600">
                  {groups?.reduce((sum, g) => sum + g.member_count, 0) || 0}
                </p>
              </div>
              <div className="text-3xl opacity-80">👥</div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-6 shadow-lg border-l-4 border-purple-400">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-600 mb-1">我管理的群組</h3>
                <p className="text-2xl font-bold text-purple-600">
                  {groups?.filter(g => canManageGroup(g)).length || 0}
                </p>
              </div>
              <div className="text-3xl opacity-80">👑</div>
            </div>
          </div>
        </div>

        {/* 群組列表 */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-800">
              群組列表 ({groups?.length || 0})
            </h2>
            <div className="text-sm text-gray-500">
              共 {groups?.reduce((sum, g) => sum + g.member_count, 0) || 0} 位成員
            </div>
          </div>
          
          <div className="space-y-3">
            {groups && groups.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {groups.map(group => (
                  <div
                    key={group.id}
                    className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-200 cursor-pointer"
                    onClick={() => setSelectedGroup(group)}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3 flex-1">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-xl">
                          🏘️
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-base font-semibold text-gray-800 truncate">{group.name}</h3>
                        </div>
                      </div>
                      {canManageGroup(group) && (
                        <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => startEdit(group)}
                            className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors flex items-center justify-center text-sm"
                            title="編輯群組"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => {
                              const confirmMessage = `確定要刪除群組「${group.name}」嗎？此操作無法復原。`
                              if (window.confirm(confirmMessage)) {
                                deleteGroupMutation.mutate(group.id)
                              }
                            }}
                            className="w-8 h-8 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors flex items-center justify-center text-sm"
                            title="刪除群組"
                            disabled={deleteGroupMutation.isPending}
                          >
                            🗑️
                          </button>
                        </div>
                      )}
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">{group.description}</p>
                    
                    <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
                      <span className="flex items-center gap-1">
                        👥 {group.member_count} 位成員
                      </span>
                      <span className="text-xs">
                        {new Date(group.created_at).toLocaleDateString('zh-TW')}
                      </span>
                    </div>
                    
                    {group.managers.length > 0 && (
                      <div className="border-t border-gray-100 pt-3">
                        <p className="text-xs text-gray-500 mb-2">管理者</p>
                        <div className="flex flex-wrap gap-1">
                          {group.managers.map(manager => (
                            <span
                              key={manager.id}
                              className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full"
                            >
                              {manager.name || manager.username}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-xl p-12 shadow-lg text-center">
                <div className="text-6xl mb-4 opacity-50">👥</div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">還沒有群組</h3>
                <p className="text-gray-600 mb-6">建立你的第一個群組，開始管理家族成員吧！</p>
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="bg-[#2E8B57] hover:bg-[#1F5F3F] text-white px-6 py-3 rounded-lg transition-colors font-medium flex items-center gap-2 mx-auto"
                >
                  <span>➕</span>
                  <span>建立新群組</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* 創建/編輯表單 Modal */}
        {showCreateForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">
                {editingGroup ? '編輯群組' : '建立新群組'}
              </h2>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    群組名稱 *
                  </label>
                  <input
                    type="text"
                    value={groupForm.name}
                    onChange={(e) => setGroupForm({ ...groupForm, name: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="輸入群組名稱"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    群組描述 *
                  </label>
                  <textarea
                    value={groupForm.description}
                    onChange={(e) => setGroupForm({ ...groupForm, description: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                    rows={3}
                    placeholder="描述這個群組的目的和用途..."
                    required
                  />
                </div>
                
                {currentUser.role === 'ADMIN' && allUsers && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      群組管理者
                    </label>
                    <select
                      multiple
                      value={groupForm.managers.map(String)}
                      onChange={(e) => {
                        const selectedOptions = Array.from(e.target.selectedOptions)
                        setGroupForm({
                          ...groupForm,
                          managers: selectedOptions.map(option => parseInt(option.value))
                        })
                      }}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      size={5}
                    >
                      {allUsers.map(user => (
                        <option key={user.id} value={user.id}>
                          {user.name || user.username}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                      按住 Ctrl/Cmd 可多選管理者
                    </p>
                  </div>
                )}
                
                <div className="flex flex-col sm:flex-row gap-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateForm(false)
                      setEditingGroup(null)
                      resetForm()
                    }}
                    className="flex-1 sm:flex-none sm:px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                  >
                    取消
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-8 py-3 bg-[#2E8B57] hover:bg-[#1F5F3F] text-white rounded-lg transition-colors font-medium flex items-center justify-center gap-2"
                  >
                    <span>✓</span>
                    <span>{editingGroup ? '更新群組' : '建立群組'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* 群組詳情 Modal */}
        {selectedGroup && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-8 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800">
                  {selectedGroup.name}
                </h2>
                <button
                  onClick={() => setSelectedGroup(null)}
                  className="text-gray-400 hover:text-gray-600 text-2xl transition-colors"
                >
                  ✕
                </button>
              </div>
              
              <p className="text-gray-600 mb-6">{selectedGroup.description}</p>
              
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                      <span>ℹ️</span>
                      群組資訊
                    </h3>
                    <div className="space-y-3 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-600">👤 創建者：</span>
                        <span className="text-gray-800 font-medium">
                          {selectedGroup.created_by.name || selectedGroup.created_by.username}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-600">📅 創建時間：</span>
                        <span className="text-gray-800 font-medium">
                          {new Date(selectedGroup.created_at).toLocaleDateString('zh-TW')}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-600">👥 成員總數：</span>
                        <span className="text-gray-800 font-medium">
                          {selectedGroup.member_count} 人
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-blue-50 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                      <span>👑</span>
                      管理者 ({selectedGroup.managers.length})
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedGroup.managers.length > 0 ? (
                        selectedGroup.managers.map(manager => (
                          <div
                            key={manager.id}
                            className="bg-blue-100 text-blue-700 px-3 py-2 rounded-lg flex items-center gap-2 text-sm"
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
                  <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <span>👥</span>
                    成員列表 ({selectedGroup.members.length})
                  </h3>
                  {selectedGroup.members.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 max-h-60 overflow-y-auto">
                      {selectedGroup.members.map(member => (
                        <div
                          key={member.id}
                          className="bg-gray-50 px-3 py-2 rounded-lg flex items-center gap-2"
                        >
                          <span className="text-sm">👤</span>
                          <span className="text-sm flex-1 truncate">{member.name}</span>
                          {!member.is_system_user && (
                            <span className="text-xs text-orange-600 bg-orange-100 px-1 py-0.5 rounded">
                              外部
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-gray-500 text-center py-8">
                      此群組暫無成員
                    </div>
                  )}
                </div>
                
                <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-200">
                  <button
                    onClick={() => navigate('/activities/new')}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg transition-colors font-medium flex items-center justify-center gap-2"
                  >
                    <span>🎉</span>
                    <span>為此群組建立活動</span>
                  </button>
                  <button
                    onClick={() => setSelectedGroup(null)}
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

export default Groups