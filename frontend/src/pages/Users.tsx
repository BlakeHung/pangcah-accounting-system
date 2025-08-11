import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import Wrapper from '../components/Wrapper'

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

// PAPA 文化圖標
const PAPAIcons = {
  Users: () => <span className="text-2xl">👥</span>,
  Admin: () => <span className="text-2xl">👑</span>,
  User: () => <span className="text-2xl">👤</span>,
  Total: () => <span className="text-2xl">📋</span>,
  Add: () => <span>➕</span>,
  Edit: () => <span>✏️</span>,
  Delete: () => <span>🗑️</span>,
  View: () => <span>👁️</span>,
  Email: () => <span>📧</span>,
  Status: () => <span>📊</span>,
  Date: () => <span>📅</span>,
  Time: () => <span>🕐</span>,
  Manager: () => <span>👑</span>,
  Group: () => <span>👥</span>,
  Active: () => <span className="text-green-500">✓</span>,
  Inactive: () => <span className="text-red-500">✗</span>,
  Empty: () => <span className="text-6xl">👥</span>,
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

  // 根據阿美族傳統階層獲取用戶圖標
  const getUserIcon = (role: string) => {
    return role === 'ADMIN' ? '👑' : '👤'
  }

  const getUserAvatarFallback = (name: string) => {
    return name.charAt(0).toUpperCase()
  }

  return (
    <Wrapper>
      <div className="space-y-8">
        {/* 頁面標題 */}
        <section className="papa-pattern-bg rounded-2xl p-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-papa-stone mb-2 font-display flex items-center gap-3">
                <PAPAIcons.Users />
                用戶管理
              </h1>
              <p className="text-papa-cave text-lg">
                管理系統用戶和權限
              </p>
            </div>
            {canManageUsers() && (
              <button
                onClick={() => setShowCreateForm(true)}
                className="papa-action-card px-6 py-3 flex items-center gap-2"
              >
                <PAPAIcons.Add />
                <span>新增族人</span>
              </button>
            )}
          </div>
        </section>

        {/* 統計摘要 */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="papa-stat-card groups">
            <div className="papa-stat-content">
              <div className="papa-stat-icon">
                <PAPAIcons.Total />
              </div>
              <h3 className="papa-stat-title">總族人數</h3>
              <p className="papa-stat-value">{users?.length || 0}</p>
            </div>
          </div>
          
          <div className="papa-stat-card expense">
            <div className="papa-stat-content">
              <div className="papa-stat-icon">
                <PAPAIcons.Admin />
              </div>
              <h3 className="papa-stat-title">管理員</h3>
              <p className="papa-stat-value">
                {users?.filter(u => u.role === 'ADMIN').length || 0}
              </p>
            </div>
          </div>
          
          <div className="papa-stat-card income">
            <div className="papa-stat-content">
              <div className="papa-stat-icon">
                <PAPAIcons.User />
              </div>
              <h3 className="papa-stat-title">一般族人</h3>
              <p className="papa-stat-value">
                {users?.filter(u => u.role === 'USER').length || 0}
              </p>
            </div>
          </div>
        </section>

        {/* 族人列表 */}
        <section>
          <div className="papa-divider mb-6"></div>
          <h2 className="text-2xl font-bold text-papa-stone mb-6 font-display">
            族人列表
          </h2>
          
          {usersLoading ? (
            <div className="papa-loading">
              <div className="papa-sun-loading"></div>
              <p className="papa-loading-text">載入族人資料中...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {users && users.length > 0 ? (
                users.map(user => (
                  <div
                    key={user.id}
                    className="bg-white rounded-2xl p-6 shadow-papa-soft hover:shadow-papa-medium transition-shadow papa-cultural-float"
                  >
                    {/* 用戶頭部 */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-16 h-16 rounded-full bg-papa-ocean/10 flex items-center justify-center">
                          {user.image ? (
                            <img src={user.image} alt={user.name} className="w-16 h-16 rounded-full object-cover" />
                          ) : (
                            <span className="text-2xl font-bold text-papa-ocean">
                              {getUserAvatarFallback(user.name)}
                            </span>
                          )}
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-papa-stone flex items-center gap-2">
                            {getUserIcon(user.role)}
                            {user.name}
                          </h3>
                          <p className="text-sm text-papa-cave">@{user.username}</p>
                          <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium mt-1 ${
                            user.role === 'ADMIN' ? 'bg-papa-dawn/10 text-papa-dawn' : 'bg-papa-emerald/10 text-papa-emerald'
                          }`}>
                            {getRoleDisplayName(user.role)}
                          </span>
                        </div>
                      </div>
                      
                      {/* 操作按鈕 */}
                      {canManageUsers() && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleViewDetails(user)}
                            className="text-papa-ocean hover:text-papa-ocean/80"
                          >
                            <PAPAIcons.View />
                          </button>
                          <button
                            onClick={() => handleEdit(user)}
                            className="text-papa-emerald hover:text-papa-emerald/80"
                          >
                            <PAPAIcons.Edit />
                          </button>
                          {user.id !== currentUser?.id && (
                            <button
                              onClick={() => handleDelete(user)}
                              className="text-papa-tide hover:text-papa-tide/80"
                            >
                              <PAPAIcons.Delete />
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    {/* 用戶資訊 */}
                    <div className="space-y-2 text-sm text-papa-cave">
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1">
                          <PAPAIcons.Email /> 信箱
                        </span>
                        <span className="truncate text-right" title={user.email}>
                          {user.email.length > 20 ? user.email.substring(0, 20) + '...' : user.email}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1">
                          <PAPAIcons.Status /> 狀態
                        </span>
                        <div className="flex items-center gap-1">
                          {user.is_active ? <PAPAIcons.Active /> : <PAPAIcons.Inactive />}
                          <span>{getStatusDisplayName(user.is_active)}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1">
                          <PAPAIcons.Date /> 加入時間
                        </span>
                        <span>
                          {new Date(user.date_joined).toLocaleDateString('zh-TW')}
                        </span>
                      </div>
                      
                      {user.last_login && (
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1">
                            <PAPAIcons.Time /> 最後登入
                          </span>
                          <span>
                            {new Date(user.last_login).toLocaleDateString('zh-TW')}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    <button
                      onClick={() => handleViewDetails(user)}
                      className="mt-4 w-full bg-papa-ocean text-white py-2 rounded-lg hover:bg-papa-ocean/90 transition-colors text-sm"
                    >
                      查看詳細資料
                    </button>
                  </div>
                ))
              ) : (
                <div className="col-span-full text-center py-16">
                  <div className="papa-loading">
                    <PAPAIcons.Empty />
                    <div className="mt-4">
                      <h3 className="text-xl font-bold text-papa-stone mb-2">
                        暫無族人資料
                      </h3>
                      <p className="text-papa-cave mb-6">
                        尚無用戶資料，點擊上方按鈕新增用戶
                      </p>
                      {canManageUsers() && (
                        <button
                          onClick={() => setShowCreateForm(true)}
                          className="papa-action-card px-6 py-3"
                        >
                          <PAPAIcons.Add /> 開始建檔
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </section>

        {/* 用戶詳情 Modal */}
        {selectedUser && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-full bg-papa-ocean/10 flex items-center justify-center">
                    {selectedUser.image ? (
                      <img src={selectedUser.image} alt={selectedUser.name} className="w-20 h-20 rounded-full object-cover" />
                    ) : (
                      <span className="text-3xl font-bold text-papa-ocean">
                        {getUserAvatarFallback(selectedUser.name)}
                      </span>
                    )}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-papa-stone font-display flex items-center gap-2">
                      {getUserIcon(selectedUser.role)}
                      {selectedUser.name}
                    </h2>
                    <p className="text-papa-cave">@{selectedUser.username}</p>
                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium mt-1 ${
                      selectedUser.role === 'ADMIN' ? 'bg-papa-dawn/10 text-papa-dawn' : 'bg-papa-emerald/10 text-papa-emerald'
                    }`}>
                      {getRoleDisplayName(selectedUser.role)}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedUser(null)}
                  className="text-papa-cave hover:text-papa-stone text-2xl"
                >
                  ✕
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* 基本資訊 */}
                <div>
                  <h3 className="text-lg font-semibold text-papa-stone mb-4">
                    📋 基本資訊
                  </h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-papa-cave">信箱：</span>
                      <span className="text-papa-stone">{selectedUser.email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-papa-cave">狀態：</span>
                      <div className="flex items-center gap-1">
                        {selectedUser.is_active ? <PAPAIcons.Active /> : <PAPAIcons.Inactive />}
                        <span className="text-papa-stone">{getStatusDisplayName(selectedUser.is_active)}</span>
                      </div>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-papa-cave">加入時間：</span>
                      <span className="text-papa-stone">
                        {new Date(selectedUser.date_joined).toLocaleString('zh-TW')}
                      </span>
                    </div>
                    {selectedUser.last_login && (
                      <div className="flex justify-between">
                        <span className="text-papa-cave">最後登入：</span>
                        <span className="text-papa-stone">
                          {new Date(selectedUser.last_login).toLocaleString('zh-TW')}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* 管理的群組 */}
                <div>
                  <h3 className="text-lg font-semibold text-papa-stone mb-4">
                    👑 管理的群組 ({selectedUser.managed_groups?.length || 0})
                  </h3>
                  {selectedUser.managed_groups?.length > 0 ? (
                    <div className="space-y-2">
                      {selectedUser.managed_groups.map(group => (
                        <div
                          key={group.id}
                          className="bg-papa-dawn/10 p-3 rounded-lg"
                        >
                          <div className="font-medium text-papa-stone">{group.name}</div>
                          <div className="text-xs text-papa-cave">{group.description}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-papa-cave text-sm">此族人未管理任何群組</p>
                  )}
                </div>

                {/* 參與的群組 */}
                <div className="md:col-span-2">
                  <h3 className="text-lg font-semibold text-papa-stone mb-4">
                    👥 參與的群組 ({selectedUser.groups?.length || 0})
                  </h3>
                  {selectedUser.groups?.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {selectedUser.groups.map(group => (
                        <div
                          key={group.id}
                          className="bg-papa-mist p-3 rounded-lg"
                        >
                          <div className="font-medium text-papa-stone">{group.name}</div>
                          <div className="text-xs text-papa-cave">{group.description}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-papa-cave text-sm">此族人未參與任何群組</p>
                  )}
                </div>
              </div>

              <div className="flex gap-4 mt-8">
                <button
                  onClick={() => setSelectedUser(null)}
                  className="flex-1 bg-papa-cave/10 text-papa-stone py-3 rounded-lg hover:bg-papa-cave/20 transition-colors"
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
                <h2 className="text-2xl font-bold text-papa-stone font-display">
                  {editingUser ? '編輯族人資料' : '新增族人'}
                </h2>
                <button
                  onClick={() => {
                    setShowCreateForm(false)
                    setEditingUser(null)
                    resetForm()
                  }}
                  className="text-papa-cave hover:text-papa-stone text-2xl"
                >
                  ✕
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-papa-stone mb-2">
                    用戶名 *
                  </label>
                  <input
                    type="text"
                    value={userForm.username}
                    onChange={(e) => setUserForm({ ...userForm, username: e.target.value })}
                    className="w-full px-4 py-2 border border-papa-tribal/20 rounded-lg focus:outline-none focus:border-papa-ocean disabled:bg-gray-100"
                    placeholder="輸入用戶名"
                    disabled={!!editingUser}
                    required
                  />
                  {editingUser && (
                    <p className="text-xs text-papa-cave mt-1">用戶名創建後無法修改</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-papa-stone mb-2">
                    姓名 *
                  </label>
                  <input
                    type="text"
                    value={userForm.name}
                    onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                    className="w-full px-4 py-2 border border-papa-tribal/20 rounded-lg focus:outline-none focus:border-papa-ocean"
                    placeholder="輸入真實姓名"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-papa-stone mb-2">
                    信箱 *
                  </label>
                  <input
                    type="email"
                    value={userForm.email}
                    onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                    className="w-full px-4 py-2 border border-papa-tribal/20 rounded-lg focus:outline-none focus:border-papa-ocean"
                    placeholder="輸入信箱地址"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-papa-stone mb-2">
                    角色
                  </label>
                  <select
                    value={userForm.role}
                    onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
                    className="w-full px-4 py-2 border border-papa-tribal/20 rounded-lg focus:outline-none focus:border-papa-ocean"
                  >
                    <option value="USER">一般族人</option>
                    <option value="ADMIN">管理員</option>
                  </select>
                </div>

                {editingUser ? (
                  <div>
                    <label className="flex items-center gap-3 mb-3">
                      <input
                        type="checkbox"
                        checked={showPasswordField}
                        onChange={(e) => setShowPasswordField(e.target.checked)}
                        className="text-papa-ocean focus:ring-papa-ocean"
                      />
                      <span className="text-sm text-papa-stone">修改密碼</span>
                    </label>
                    {showPasswordField && (
                      <input
                        type="password"
                        value={userForm.password}
                        onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                        className="w-full px-4 py-2 border border-papa-tribal/20 rounded-lg focus:outline-none focus:border-papa-ocean"
                        placeholder="輸入新密碼"
                        required={showPasswordField}
                      />
                    )}
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-papa-stone mb-2">
                      密碼 *
                    </label>
                    <input
                      type="password"
                      value={userForm.password}
                      onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                      className="w-full px-4 py-2 border border-papa-tribal/20 rounded-lg focus:outline-none focus:border-papa-ocean"
                      placeholder="輸入密碼"
                      required
                    />
                  </div>
                )}

                <div>
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={userForm.is_active}
                      onChange={(e) => setUserForm({ ...userForm, is_active: e.target.checked })}
                      className="text-papa-ocean focus:ring-papa-ocean"
                    />
                    <span className="text-sm text-papa-stone">啟用帳戶</span>
                  </label>
                </div>
                
                <div className="flex gap-4">
                  <button
                    type="submit"
                    className="flex-1 bg-papa-ocean text-white py-3 rounded-lg hover:bg-papa-ocean/90 transition-colors disabled:opacity-50"
                    disabled={createUserMutation.isPending || updateUserMutation.isPending}
                  >
                    {(createUserMutation.isPending || updateUserMutation.isPending) 
                      ? '處理中...' 
                      : editingUser ? '更新資料' : '創建族人'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateForm(false)
                      setEditingUser(null)
                      resetForm()
                    }}
                    className="flex-1 bg-papa-cave/10 text-papa-stone py-3 rounded-lg hover:bg-papa-cave/20 transition-colors"
                  >
                    取消
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Wrapper>
  )
}

export default Users