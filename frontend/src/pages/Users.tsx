import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import Layout from '../components/Layout'

interface User {
  id: number
  username: string
  name: string
  email: string
  role: string
  image?: string
  is_active: boolean
  date_joined: string
  last_login?: string
}

interface UserForm {
  username: string
  name: string
  email: string
  role: string
  password?: string
  is_active: boolean
}

interface ManagedGroup {
  id: number
  name: string
  description: string
}

interface UserDetail extends User {
  managed_groups: ManagedGroup[]
  groups: ManagedGroup[]
}

const Users: React.FC = () => {
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [userForm, setUserForm] = useState<UserForm>({
    username: '',
    name: '',
    email: '',
    role: 'USER',
    password: '',
    is_active: true
  })
  const [selectedUser, setSelectedUser] = useState<UserDetail | null>(null)
  const [showPasswordField, setShowPasswordField] = useState(false)

  const queryClient = useQueryClient()
  const navigate = useNavigate()

  // 獲取當前用戶
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}')

  // 獲取用戶列表
  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ['users'],
    queryFn: async (): Promise<User[]> => {
      const response = await axios.get('/api/v1/auth/users/')
      if (Array.isArray(response.data)) {
        return response.data
      } else if (response.data && Array.isArray(response.data.results)) {
        return response.data.results
      }
      return []
    }
  })

  // 獲取用戶詳情
  const fetchUserDetail = async (userId: number): Promise<UserDetail> => {
    const response = await axios.get(`/api/v1/auth/users/${userId}/`)
    return response.data
  }

  // 創建用戶
  const createUserMutation = useMutation({
    mutationFn: async (data: UserForm) => {
      const response = await axios.post('/api/v1/auth/users/', data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      setShowCreateForm(false)
      resetForm()
      alert('用戶創建成功')
    },
    onError: (error: any) => {
      console.error('創建用戶失敗:', error)
      alert('創建用戶失敗，請檢查輸入內容')
    }
  })

  // 更新用戶
  const updateUserMutation = useMutation({
    mutationFn: async (data: { id: number; userData: UserForm }) => {
      const response = await axios.put(`/api/v1/auth/users/${data.id}/`, data.userData)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      setEditingUser(null)
      setShowCreateForm(false)
      resetForm()
      alert('用戶資料更新成功')
    },
    onError: (error: any) => {
      console.error('更新用戶失敗:', error)
      alert('更新用戶失敗，請檢查輸入內容')
    }
  })

  // 刪除用戶
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: number) => {
      await axios.delete(`/api/v1/auth/users/${userId}/`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      setSelectedUser(null)
      alert('用戶已刪除')
    },
    onError: (error: any) => {
      console.error('刪除用戶失敗:', error)
      alert('刪除用戶失敗')
    }
  })

  const resetForm = () => {
    setUserForm({
      username: '',
      name: '',
      email: '',
      role: 'USER',
      password: '',
      is_active: true
    })
    setShowPasswordField(false)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const submitData = { ...userForm }
    
    // 如果是編輯模式且未顯示密碼欄位，則不傳送密碼
    if (editingUser && !showPasswordField) {
      delete submitData.password
    }

    if (editingUser) {
      updateUserMutation.mutate({ id: editingUser.id, userData: submitData })
    } else {
      createUserMutation.mutate(submitData)
    }
  }

  const handleEdit = (user: User) => {
    setEditingUser(user)
    setUserForm({
      username: user.username,
      name: user.name,
      email: user.email,
      role: user.role,
      password: '',
      is_active: user.is_active
    })
    setShowPasswordField(false)
    setShowCreateForm(true)
  }

  const handleDelete = (user: User) => {
    if (user.id === currentUser?.id) {
      alert('無法刪除自己的帳戶')
      return
    }
    
    if (window.confirm(`確定要刪除用戶「${user.name}」嗎？`)) {
      deleteUserMutation.mutate(user.id)
    }
  }

  const handleViewDetails = async (user: User) => {
    try {
      const userDetail = await fetchUserDetail(user.id)
      setSelectedUser(userDetail)
    } catch (error) {
      console.error('獲取用戶詳情失敗:', error)
    }
  }

  const canManageUsers = (): boolean => {
    return currentUser?.role === 'ADMIN'
  }

  const getRoleDisplayName = (role: string): string => {
    return role === 'ADMIN' ? '系統管理員' : '一般用戶'
  }

  const getStatusDisplayName = (isActive: boolean): string => {
    return isActive ? '啟用' : '停用'
  }

  const getUserAvatarFallback = (name: string) => {
    return name.charAt(0).toUpperCase()
  }

  return (
    <Layout user={currentUser}>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* 頁面標題 */}
        <div className="bg-white rounded-xl p-6 shadow-papa-soft">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2 flex items-center gap-3">
                <span className="text-2xl">👥</span>
                用戶管理
              </h1>
              <p className="text-gray-600 text-sm md:text-base">
                管理系統用戶和權限設定
              </p>
            </div>
            {canManageUsers() && (
              <button
                onClick={() => setShowCreateForm(true)}
                className="bg-[#2E8B57] hover:bg-[#1F5F3F] text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2 text-sm font-medium"
              >
                <span>➕</span>
                <span>新增用戶</span>
              </button>
            )}
          </div>
        </div>

        {/* 統計摘要 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl p-6 shadow-papa-soft border-l-4 border-blue-400">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-600 mb-1">總用戶數</h3>
                <p className="text-2xl font-bold text-blue-600">{users?.length || 0}</p>
              </div>
              <div className="text-3xl opacity-80">📋</div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-6 shadow-papa-soft border-l-4 border-purple-400">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-600 mb-1">管理員</h3>
                <p className="text-2xl font-bold text-purple-600">
                  {users?.filter(u => u.role === 'ADMIN').length || 0}
                </p>
              </div>
              <div className="text-3xl opacity-80">👑</div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-6 shadow-papa-soft border-l-4 border-green-400">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-600 mb-1">一般用戶</h3>
                <p className="text-2xl font-bold text-green-600">
                  {users?.filter(u => u.role === 'USER').length || 0}
                </p>
              </div>
              <div className="text-3xl opacity-80">👤</div>
            </div>
          </div>
        </div>

        {/* 用戶列表 */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-800">
              用戶列表 ({users?.length || 0})
            </h2>
          </div>
          
          {usersLoading ? (
            <div className="flex items-center justify-center min-h-96">
              <div className="text-center">
                <div className="w-8 h-8 border-2 border-[#2E8B57] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-600">載入用戶資料中...</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {users && users.length > 0 ? (
                users.map(user => (
                  <div
                    key={user.id}
                    className="bg-white rounded-xl p-6 shadow-papa-soft hover:shadow-papa-medium transition-all duration-200"
                  >
                    {/* 用戶頭部 */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                          {user.image ? (
                            <img src={user.image} alt={user.name} className="w-12 h-12 rounded-full object-cover" />
                          ) : (
                            <span className="text-lg font-bold text-blue-600">
                              {getUserAvatarFallback(user.name)}
                            </span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-base font-semibold text-gray-800 truncate">
                            {user.name}
                          </h3>
                          <p className="text-sm text-gray-500">@{user.username}</p>
                          <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium mt-1 ${
                            user.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' : 'bg-green-100 text-green-700'
                          }`}>
                            {getRoleDisplayName(user.role)}
                          </span>
                        </div>
                      </div>
                      
                      {/* 操作按鈕 */}
                      {canManageUsers() && (
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleViewDetails(user)}
                            className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors flex items-center justify-center text-sm"
                            title="查看詳情"
                          >
                            👁️
                          </button>
                          <button
                            onClick={() => handleEdit(user)}
                            className="w-8 h-8 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 transition-colors flex items-center justify-center text-sm"
                            title="編輯"
                          >
                            ✏️
                          </button>
                          {user.id !== currentUser?.id && (
                            <button
                              onClick={() => handleDelete(user)}
                              className="w-8 h-8 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors flex items-center justify-center text-sm"
                              title="刪除"
                            >
                              🗑️
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    {/* 用戶資訊 */}
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between text-gray-600">
                        <span className="flex items-center gap-1">
                          📧 信箱
                        </span>
                        <span className="truncate text-right max-w-[60%]" title={user.email}>
                          {user.email}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between text-gray-600">
                        <span className="flex items-center gap-1">
                          📊 狀態
                        </span>
                        <div className="flex items-center gap-1">
                          <span className={user.is_active ? 'text-green-500' : 'text-red-500'}>
                            {user.is_active ? '✓' : '✗'}
                          </span>
                          <span>{getStatusDisplayName(user.is_active)}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between text-gray-600">
                        <span className="flex items-center gap-1">
                          📅 加入時間
                        </span>
                        <span>
                          {new Date(user.date_joined).toLocaleDateString('zh-TW')}
                        </span>
                      </div>
                      
                      {user.last_login && (
                        <div className="flex items-center justify-between text-gray-600">
                          <span className="flex items-center gap-1">
                            🕐 最後登入
                          </span>
                          <span>
                            {new Date(user.last_login).toLocaleDateString('zh-TW')}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    <button
                      onClick={() => handleViewDetails(user)}
                      className="mt-4 w-full bg-[#2E8B57] hover:bg-[#1F5F3F] text-white py-2 rounded-lg transition-colors text-sm font-medium"
                    >
                      查看詳細資料
                    </button>
                  </div>
                ))
              ) : (
                <div className="col-span-full">
                  <div className="bg-white rounded-xl p-12 shadow-papa-soft text-center">
                    <div className="text-6xl mb-4 opacity-50">👥</div>
                    <h3 className="text-xl font-bold text-gray-800 mb-2">
                      暫無用戶資料
                    </h3>
                    <p className="text-gray-600 mb-6">
                      尚無用戶資料，點擊上方按鈕新增用戶
                    </p>
                    {canManageUsers() && (
                      <button
                        onClick={() => setShowCreateForm(true)}
                        className="bg-[#2E8B57] hover:bg-[#1F5F3F] text-white px-6 py-3 rounded-lg transition-colors font-medium"
                      >
                        ➕ 開始建檔
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 用戶詳情 Modal */}
        {selectedUser && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
                    {selectedUser.image ? (
                      <img src={selectedUser.image} alt={selectedUser.name} className="w-16 h-16 rounded-full object-cover" />
                    ) : (
                      <span className="text-2xl font-bold text-blue-600">
                        {getUserAvatarFallback(selectedUser.name)}
                      </span>
                    )}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800">
                      {selectedUser.name}
                    </h2>
                    <p className="text-gray-600">@{selectedUser.username}</p>
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium mt-1 ${
                      selectedUser.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' : 'bg-green-100 text-green-700'
                    }`}>
                      {getRoleDisplayName(selectedUser.role)}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedUser(null)}
                  className="text-gray-400 hover:text-gray-600 text-2xl transition-colors"
                >
                  ✕
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* 基本資訊 */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <span>📋</span>
                    基本資訊
                  </h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">信箱：</span>
                      <span className="text-gray-800">{selectedUser.email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">狀態：</span>
                      <div className="flex items-center gap-1">
                        <span className={selectedUser.is_active ? 'text-green-500' : 'text-red-500'}>
                          {selectedUser.is_active ? '✓' : '✗'}
                        </span>
                        <span className="text-gray-800">{getStatusDisplayName(selectedUser.is_active)}</span>
                      </div>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">加入時間：</span>
                      <span className="text-gray-800">
                        {new Date(selectedUser.date_joined).toLocaleString('zh-TW')}
                      </span>
                    </div>
                    {selectedUser.last_login && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">最後登入：</span>
                        <span className="text-gray-800">
                          {new Date(selectedUser.last_login).toLocaleString('zh-TW')}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* 管理的群組 */}
                <div className="bg-purple-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <span>👑</span>
                    管理的群組 ({selectedUser.managed_groups?.length || 0})
                  </h3>
                  {selectedUser.managed_groups?.length > 0 ? (
                    <div className="space-y-2">
                      {selectedUser.managed_groups.map(group => (
                        <div
                          key={group.id}
                          className="bg-white p-3 rounded-lg"
                        >
                          <div className="font-medium text-gray-800">{group.name}</div>
                          <div className="text-xs text-gray-600">{group.description}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-600 text-sm">此用戶未管理任何群組</p>
                  )}
                </div>

                {/* 參與的群組 */}
                <div className="md:col-span-2">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <span>👥</span>
                    參與的群組 ({selectedUser.groups?.length || 0})
                  </h3>
                  {selectedUser.groups?.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {selectedUser.groups.map(group => (
                        <div
                          key={group.id}
                          className="bg-gray-50 p-3 rounded-lg"
                        >
                          <div className="font-medium text-gray-800">{group.name}</div>
                          <div className="text-xs text-gray-600">{group.description}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-600 text-sm">此用戶未參與任何群組</p>
                  )}
                </div>
              </div>

              <div className="flex justify-end mt-8">
                <button
                  onClick={() => setSelectedUser(null)}
                  className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors font-medium"
                >
                  關閉
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 創建/編輯表單 Modal */}
        {showCreateForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800">
                  {editingUser ? '編輯用戶資料' : '新增用戶'}
                </h2>
                <button
                  onClick={() => {
                    setShowCreateForm(false)
                    setEditingUser(null)
                    resetForm()
                  }}
                  className="text-gray-400 hover:text-gray-600 text-2xl transition-colors"
                >
                  ✕
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    用戶名 *
                  </label>
                  <input
                    type="text"
                    value={userForm.username}
                    onChange={(e) => setUserForm({ ...userForm, username: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:bg-gray-100"
                    placeholder="輸入用戶名"
                    disabled={!!editingUser}
                    required
                  />
                  {editingUser && (
                    <p className="text-xs text-gray-500 mt-1">用戶名創建後無法修改</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    姓名 *
                  </label>
                  <input
                    type="text"
                    value={userForm.name}
                    onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="輸入真實姓名"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    信箱 *
                  </label>
                  <input
                    type="email"
                    value={userForm.email}
                    onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="輸入信箱地址"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    角色
                  </label>
                  <select
                    value={userForm.role}
                    onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all appearance-none bg-white"
                  >
                    <option value="USER">👤 一般用戶</option>
                    <option value="ADMIN">👑 系統管理員</option>
                  </select>
                </div>

                {editingUser ? (
                  <div>
                    <label className="flex items-center gap-3 mb-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={showPasswordField}
                        onChange={(e) => setShowPasswordField(e.target.checked)}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">修改密碼</span>
                    </label>
                    {showPasswordField && (
                      <input
                        type="password"
                        value={userForm.password}
                        onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        placeholder="輸入新密碼"
                        required={showPasswordField}
                      />
                    )}
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      密碼 *
                    </label>
                    <input
                      type="password"
                      value={userForm.password}
                      onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="輸入密碼"
                      required
                    />
                  </div>
                )}

                <div>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={userForm.is_active}
                      onChange={(e) => setUserForm({ ...userForm, is_active: e.target.checked })}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">啟用帳戶</span>
                  </label>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateForm(false)
                      setEditingUser(null)
                      resetForm()
                    }}
                    className="flex-1 sm:flex-none sm:px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                  >
                    取消
                  </button>
                  <button
                    type="submit"
                    disabled={createUserMutation.isPending || updateUserMutation.isPending}
                    className="flex-1 px-8 py-3 bg-[#2E8B57] hover:bg-[#1F5F3F] disabled:bg-blue-400 text-white rounded-lg transition-colors font-medium flex items-center justify-center gap-2"
                  >
                    {(createUserMutation.isPending || updateUserMutation.isPending) ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        <span>處理中...</span>
                      </>
                    ) : (
                      <>
                        <span>✓</span>
                        <span>{editingUser ? '更新資料' : '創建用戶'}</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}

export default Users