import React, { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import Layout from '../components/Layout'
import './Categories.css'

interface User {
  id: number
  username: string
  name: string
  role: string
}

interface Category {
  id: number
  name: string
  type: 'EXPENSE' | 'INCOME'
  is_default: boolean
  created_at: string
  updated_at: string
}

interface CategoryForm {
  name: string
  type: 'EXPENSE' | 'INCOME'
  is_default: boolean
}

const Categories: React.FC = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [typeFilter, setTypeFilter] = useState<string>('ALL')
  const [categoryForm, setCategoryForm] = useState<CategoryForm>({
    name: '',
    type: 'EXPENSE',
    is_default: false
  })

  // 檢查當前用戶
  useEffect(() => {
    const token = localStorage.getItem('access_token')
    const userData = localStorage.getItem('user')
    
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
    }
    
    if (userData) {
      setCurrentUser(JSON.parse(userData))
    }
  }, [])

  // 獲取分類列表
  const { data: categories, isLoading, error } = useQuery({
    queryKey: ['categories'],
    queryFn: async (): Promise<Category[]> => {
      try {
        const response = await axios.get('/api/v1/categories/')
        return Array.isArray(response.data.results) ? response.data.results : response.data
      } catch (error) {
        console.error('獲取分類列表失敗:', error)
        return []
      }
    },
    enabled: !!currentUser
  })

  // 創建分類
  const createCategoryMutation = useMutation({
    mutationFn: async (data: CategoryForm) => {
      const response = await axios.post('/api/v1/categories/', data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      setShowCreateForm(false)
      resetForm()
    },
    onError: (error: any) => {
      console.error('創建分類失敗:', error)
      alert('創建分類失敗，請檢查輸入內容')
    }
  })

  // 更新分類
  const updateCategoryMutation = useMutation({
    mutationFn: async (data: { id: number; categoryData: CategoryForm }) => {
      const response = await axios.put(`/api/v1/categories/${data.id}/`, data.categoryData)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      setEditingCategory(null)
      setShowCreateForm(false)
      resetForm()
    }
  })

  // 刪除分類
  const deleteCategoryMutation = useMutation({
    mutationFn: async (id: number) => {
      await axios.delete(`/api/v1/categories/${id}/`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
    }
  })

  // 過濾分類
  const filteredCategories = categories?.filter(category => {
    if (typeFilter === 'ALL') return true
    return category.type === typeFilter
  }) || []

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!categoryForm.name.trim()) {
      alert('請輸入分類名稱')
      return
    }

    if (editingCategory) {
      updateCategoryMutation.mutate({ id: editingCategory.id, categoryData: categoryForm })
    } else {
      createCategoryMutation.mutate(categoryForm)
    }
  }

  const handleEdit = (category: Category) => {
    setEditingCategory(category)
    setCategoryForm({
      name: category.name,
      type: category.type,
      is_default: category.is_default
    })
    setShowCreateForm(true)
  }

  const handleDelete = (category: Category) => {
    if (category.is_default) {
      alert('預設分類無法刪除')
      return
    }

    if (window.confirm(`確定要刪除分類「${category.name}」嗎？`)) {
      deleteCategoryMutation.mutate(category.id)
    }
  }

  const resetForm = () => {
    setCategoryForm({
      name: '',
      type: 'EXPENSE',
      is_default: false
    })
    setEditingCategory(null)
  }

  const getTypeDisplay = (type: string) => {
    return type === 'EXPENSE' ? '支出' : '收入'
  }

  const getTypeColor = (type: string) => {
    return type === 'EXPENSE' ? 'expense' : 'income'
  }

  const canManageCategories = (): boolean => {
    return currentUser?.role === 'ADMIN'
  }

  if (isLoading) {
    return (
      <Layout user={currentUser}>
        <div className="loading">載入中...</div>
      </Layout>
    )
  }

  if (error) {
    return (
      <Layout user={currentUser}>
        <div className="loading">載入分類列表失敗</div>
      </Layout>
    )
  }

  return (
    <Layout user={currentUser}>
      <div className="categories-container">
        <div className="categories-header">
          <h1>📊 分類管理</h1>
          {canManageCategories() && (
            <button 
              className="create-button"
              onClick={() => setShowCreateForm(true)}
            >
              + 新增分類
            </button>
          )}
        </div>

        {/* 篩選器 */}
        <div className="filters">
          <div className="filter-group">
            <label>類型篩選:</label>
            <select 
              value={typeFilter} 
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="ALL">全部</option>
              <option value="EXPENSE">支出分類</option>
              <option value="INCOME">收入分類</option>
            </select>
          </div>
        </div>

        {/* 統計摘要 */}
        <div className="summary-cards">
          <div className="summary-card expense">
            <div className="summary-icon">💸</div>
            <div className="summary-content">
              <h3>支出分類</h3>
              <p className="summary-count">
                {filteredCategories.filter(c => c.type === 'EXPENSE').length}
              </p>
            </div>
          </div>
          <div className="summary-card income">
            <div className="summary-icon">💰</div>
            <div className="summary-content">
              <h3>收入分類</h3>
              <p className="summary-count">
                {filteredCategories.filter(c => c.type === 'INCOME').length}
              </p>
            </div>
          </div>
          <div className="summary-card total">
            <div className="summary-icon">📋</div>
            <div className="summary-content">
              <h3>總分類數</h3>
              <p className="summary-count">{filteredCategories.length}</p>
            </div>
          </div>
        </div>

        {/* 分類列表 */}
        <div className="categories-grid">
          {filteredCategories.length > 0 ? (
            filteredCategories.map(category => (
              <div key={category.id} className={`category-card ${getTypeColor(category.type)}`}>
                <div className="category-header">
                  <div className="category-title">
                    <h3>{category.name}</h3>
                    <div className="category-badges">
                      <span className={`type-badge ${getTypeColor(category.type)}`}>
                        {getTypeDisplay(category.type)}
                      </span>
                      {category.is_default && (
                        <span className="default-badge">預設</span>
                      )}
                    </div>
                  </div>
                  {canManageCategories() && (
                    <div className="category-actions">
                      <button 
                        className="edit-btn"
                        onClick={() => handleEdit(category)}
                      >
                        編輯
                      </button>
                      {!category.is_default && (
                        <button 
                          className="delete-btn"
                          onClick={() => handleDelete(category)}
                        >
                          刪除
                        </button>
                      )}
                    </div>
                  )}
                </div>
                
                <div className="category-info">
                  <div className="info-row">
                    <span className="info-label">📅 創建時間:</span>
                    <span className="info-value">
                      {new Date(category.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">🔄 最後更新:</span>
                    <span className="info-value">
                      {new Date(category.updated_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="no-categories">
              <div className="empty-state">
                <div className="empty-icon">📂</div>
                <h3>沒有找到分類</h3>
                <p>還沒有任何分類，點擊上方按鈕創建第一個分類吧！</p>
              </div>
            </div>
          )}
        </div>

        {/* 創建/編輯分類表單 */}
        {showCreateForm && (
          <div className="modal-overlay">
            <div className="modal">
              <div className="modal-header">
                <h3>{editingCategory ? '編輯分類' : '新增分類'}</h3>
                <button 
                  className="close-btn"
                  onClick={() => {
                    setShowCreateForm(false)
                    setEditingCategory(null)
                    resetForm()
                  }}
                >
                  ✕
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="category-form">
                <div className="form-group">
                  <label htmlFor="name">分類名稱 *</label>
                  <input
                    type="text"
                    id="name"
                    value={categoryForm.name}
                    onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                    placeholder="輸入分類名稱"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="type">分類類型 *</label>
                  <select
                    id="type"
                    value={categoryForm.type}
                    onChange={(e) => setCategoryForm({ ...categoryForm, type: e.target.value as 'EXPENSE' | 'INCOME' })}
                  >
                    <option value="EXPENSE">支出分類</option>
                    <option value="INCOME">收入分類</option>
                  </select>
                </div>

                <div className="form-group checkbox-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={categoryForm.is_default}
                      onChange={(e) => setCategoryForm({ ...categoryForm, is_default: e.target.checked })}
                    />
                    <span className="checkbox-text">設為預設分類</span>
                  </label>
                  <small className="form-hint">
                    預設分類不能被刪除，適合用於常用的分類項目
                  </small>
                </div>

                <div className="form-actions">
                  <button
                    type="button"
                    className="cancel-btn"
                    onClick={() => {
                      setShowCreateForm(false)
                      setEditingCategory(null)
                      resetForm()
                    }}
                  >
                    取消
                  </button>
                  <button
                    type="submit"
                    className="submit-btn"
                    disabled={createCategoryMutation.isPending || updateCategoryMutation.isPending}
                  >
                    {(createCategoryMutation.isPending || updateCategoryMutation.isPending) 
                      ? '處理中...' 
                      : editingCategory ? '更新分類' : '創建分類'}
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

export default Categories