import React, { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import Layout from '../components/Layout'
import './Users.css'

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
  const [currentUser, setCurrentUser] = useState<User | null>(null)
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

  // 檢查當前用戶並設置 axios headers
  useEffect(() => {
    const token = localStorage.getItem('access_token')
    const userData = localStorage.getItem('user')
    
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
    }
    
    if (userData) {
      const user = JSON.parse(userData)
      setCurrentUser(user)
    }
  }, [])

  // 獲取用戶列表
  const { data: users, isLoading: usersLoading, error: usersError } = useQuery({
    queryKey: ['users'],
    queryFn: async (): Promise<User[]> => {
      try {
        const response = await axios.get('/api/v1/auth/users/')
        console.log('Users API response:', response.data)
        
        // 確保返回數組
        if (Array.isArray(response.data)) {
          return response.data
        } else if (response.data && Array.isArray(response.data.results)) {
          // 處理分頁響應
          return response.data.results
        } else {
          console.error('API 返回數據不是數組:', response.data)
          return []
        }
      } catch (error) {
        console.error('獲取用戶列表失敗:', error)
        throw error
      }
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

  if (usersLoading) {
    return (
      <Layout user={currentUser}>
        <div className="loading">載入中...</div>
      </Layout>
    )
  }

  if (usersError) {
    return (
      <Layout user={currentUser}>
        <div className="loading">
          載入用戶列表失敗: {usersError instanceof Error ? usersError.message : '未知錯誤'}
        </div>
      </Layout>
    )
  }

  return (
    <Layout user={currentUser}>

      <div className="users-header">
        <h1>👥 用戶管理</h1>
        {canManageUsers() && (
          <button 
            className="create-button"
            onClick={() => setShowCreateForm(true)}
          >
            + 創建用戶
          </button>
        )}
      </div>

      <div className="users-content">
        <div className="users-list">
          <h2>系統用戶 ({users?.length || 0})</h2>
          <div className="users-grid">
            {(users && Array.isArray(users)) ? users.map(user => (
              <div key={user.id} className="user-card">
                <div className="user-header">
                  <div className="user-avatar">
                    {user.image ? (
                      <img src={user.image} alt={user.name} />
                    ) : (
                      <div className="avatar-placeholder">
                        {user.name.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div className="user-basic-info">
                    <h3>{user.name}</h3>
                    <span className="username">@{user.username}</span>
                    <span className={`role-badge ${user.role.toLowerCase()}`}>
                      {getRoleDisplayName(user.role)}
                    </span>
                  </div>
                  {canManageUsers() && (
                    <div className="user-actions">
                      <button 
                        className="edit-btn"
                        onClick={() => handleEdit(user)}
                      >
                        ✏️
                      </button>
                      {user.id !== currentUser?.id && (
                        <button 
                          className="delete-btn"
                          onClick={() => handleDelete(user)}
                        >
                          🗑️
                        </button>
                      )}
                    </div>
                  )}
                </div>
                
                <div className="user-info">
                  <div className="info-item">
                    <span className="label">📧 信箱:</span>
                    <span className="value">{user.email}</span>
                  </div>
                  
                  <div className="info-item">
                    <span className="label">📊 狀態:</span>
                    <span className={`status-badge ${user.is_active ? 'active' : 'inactive'}`}>
                      {getStatusDisplayName(user.is_active)}
                    </span>
                  </div>
                  
                  <div className="info-item">
                    <span className="label">📅 加入時間:</span>
                    <span className="value">
                      {new Date(user.date_joined).toLocaleDateString()}
                    </span>
                  </div>
                  
                  {user.last_login && (
                    <div className="info-item">
                      <span className="label">🕐 最後登入:</span>
                      <span className="value">
                        {new Date(user.last_login).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>

                <button 
                  className="view-details-btn"
                  onClick={() => handleViewDetails(user)}
                >
                  查看詳情
                </button>
              </div>
            )) : (
              <div className="no-users">沒有用戶數據</div>
            )}
          </div>
        </div>

        {/* 用戶詳情側邊欄 */}
        {selectedUser && (
          <div className="user-details-sidebar">
            <div className="sidebar-header">
              <h3>{selectedUser.name}</h3>
              <button 
                className="close-btn"
                onClick={() => setSelectedUser(null)}
              >
                ✕
              </button>
            </div>
            
            <div className="sidebar-content">
              <div className="detail-section">
                <h4>📋 基本資訊</h4>
                <div className="user-profile">
                  <div className="profile-avatar">
                    {selectedUser.image ? (
                      <img src={selectedUser.image} alt={selectedUser.name} />
                    ) : (
                      <div className="avatar-placeholder large">
                        {selectedUser.name.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div className="profile-info">
                    <p><strong>姓名:</strong> {selectedUser.name}</p>
                    <p><strong>用戶名:</strong> @{selectedUser.username}</p>
                    <p><strong>信箱:</strong> {selectedUser.email}</p>
                    <p><strong>角色:</strong> {getRoleDisplayName(selectedUser.role)}</p>
                    <p><strong>狀態:</strong> 
                      <span className={`status-badge ${selectedUser.is_active ? 'active' : 'inactive'}`}>
                        {getStatusDisplayName(selectedUser.is_active)}
                      </span>
                    </p>
                  </div>
                </div>
              </div>

              <div className="detail-section">
                <h4>👑 管理的群組 ({selectedUser.managed_groups.length})</h4>
                {selectedUser.managed_groups.length > 0 ? (
                  <ul className="group-list">
                    {selectedUser.managed_groups.map(group => (
                      <li key={group.id} className="group-item manager">
                        <span className="group-name">{group.name}</span>
                        <span className="group-desc">{group.description}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="no-data">此用戶未管理任何群組</p>
                )}
              </div>

              <div className="detail-section">
                <h4>👥 參與的群組 ({selectedUser.groups.length})</h4>
                {selectedUser.groups.length > 0 ? (
                  <ul className="group-list">
                    {selectedUser.groups.map(group => (
                      <li key={group.id} className="group-item">
                        <span className="group-name">{group.name}</span>
                        <span className="group-desc">{group.description}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="no-data">此用戶未參與任何群組</p>
                )}
              </div>

              <div className="detail-section">
                <h4>🕐 時間記錄</h4>
                <div className="time-info">
                  <p><strong>加入時間:</strong> {new Date(selectedUser.date_joined).toLocaleString()}</p>
                  {selectedUser.last_login && (
                    <p><strong>最後登入:</strong> {new Date(selectedUser.last_login).toLocaleString()}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 創建/編輯用戶表單 */}
      {showCreateForm && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>{editingUser ? '編輯用戶' : '創建用戶'}</h3>
              <button 
                className="close-btn"
                onClick={() => {
                  setShowCreateForm(false)
                  setEditingUser(null)
                  resetForm()
                }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="user-form">
              <div className="form-group">
                <label>用戶名</label>
                <input
                  type="text"
                  value={userForm.username}
                  onChange={(e) => setUserForm({ ...userForm, username: e.target.value })}
                  required
                  placeholder="輸入用戶名"
                  disabled={!!editingUser}
                />
                {editingUser && (
                  <small className="form-hint">用戶名創建後無法修改</small>
                )}
              </div>

              <div className="form-group">
                <label>姓名</label>
                <input
                  type="text"
                  value={userForm.name}
                  onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                  required
                  placeholder="輸入真實姓名"
                />
              </div>

              <div className="form-group">
                <label>信箱</label>
                <input
                  type="email"
                  value={userForm.email}
                  onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                  required
                  placeholder="輸入信箱地址"
                />
              </div>

              <div className="form-group">
                <label>角色</label>
                <select
                  value={userForm.role}
                  onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
                >
                  <option value="USER">一般用戶</option>
                  <option value="ADMIN">系統管理員</option>
                </select>
              </div>

              {editingUser ? (
                <div className="form-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={showPasswordField}
                      onChange={(e) => setShowPasswordField(e.target.checked)}
                    />
                    修改密碼
                  </label>
                  {showPasswordField && (
                    <input
                      type="password"
                      value={userForm.password}
                      onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                      placeholder="輸入新密碼"
                      required={showPasswordField}
                    />
                  )}
                </div>
              ) : (
                <div className="form-group">
                  <label>密碼</label>
                  <input
                    type="password"
                    value={userForm.password}
                    onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                    required
                    placeholder="輸入密碼"
                  />
                </div>
              )}

              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={userForm.is_active}
                    onChange={(e) => setUserForm({ ...userForm, is_active: e.target.checked })}
                  />
                  啟用帳戶
                </label>
              </div>

              <div className="form-actions">
                <button type="submit" className="submit-btn">
                  {editingUser ? '更新用戶' : '創建用戶'}
                </button>
                <button 
                  type="button" 
                  className="cancel-btn"
                  onClick={() => {
                    setShowCreateForm(false)
                    setEditingUser(null)
                    resetForm()
                  }}
                >
                  取消
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  )
}

export default Users