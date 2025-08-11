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

// PAPA 文化圖標
const PAPAIcons = {
  Category: () => <span className="text-2xl">🏷️</span>,
  Expense: () => <span className="text-2xl">💸</span>,
  Income: () => <span className="text-2xl">🌾</span>,
  Total: () => <span className="text-2xl">📋</span>,
  Add: () => <span>➕</span>,
  Edit: () => <span>✏️</span>,
  Delete: () => <span>🗑️</span>,
  Calendar: () => <span>📅</span>,
  Update: () => <span>🔄</span>,
  Default: () => <span>🔹</span>,
  Empty: () => <span className="text-6xl">📂</span>,
}

const Categories: React.FC = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [typeFilter, setTypeFilter] = useState<string>('ALL')
  const [categoryForm, setCategoryForm] = useState<CategoryForm>({
    name: '',
    type: 'EXPENSE',
    is_default: false
  })

  // 獲取當前用戶
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}')

  // 獲取分類列表
  const { data: categories, isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: async (): Promise<Category[]> => {
      const response = await axios.get('/api/v1/categories/')
      return Array.isArray(response.data.results) ? response.data.results : response.data
    }
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

  const canManageCategories = (): boolean => {
    return currentUser?.role === 'ADMIN'
  }

  // 根據阿美族傳統分類獲取圖標
  const getCategoryIcon = (categoryName: string) => {
    if (categoryName.includes('食物') || categoryName.includes('餐飲')) return '🍽️'
    if (categoryName.includes('交通')) return '🚌'
    if (categoryName.includes('住宿')) return '🏠'
    if (categoryName.includes('祭典') || categoryName.includes('文化')) return '🎊'
    if (categoryName.includes('醫療')) return '🏥'
    if (categoryName.includes('教育')) return '📚'
    if (categoryName.includes('工具')) return '🔧'
    if (categoryName.includes('衣物')) return '👕'
    return '🏷️'
  }

  const getTypeColor = (type: string) => {
    return type === 'EXPENSE' ? 'text-papa-tide' : 'text-papa-emerald'
  }

  return (
    <Wrapper>
      <div className="space-y-8">
        {/* 頁面標題 */}
        <section className="papa-pattern-bg rounded-2xl p-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-papa-stone mb-2 font-display flex items-center gap-3">
                <PAPAIcons.Category />
分類管理
              </h1>
              <p className="text-papa-cave text-lg">
管理收入和支出分類
              </p>
            </div>
            {canManageCategories() && (
              <button
                onClick={() => setShowCreateForm(true)}
                className="papa-action-card px-6 py-3 flex items-center gap-2"
              >
                <PAPAIcons.Add />
                <span>建立新分類</span>
              </button>
            )}
          </div>
        </section>

        {/* 統計摘要 */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="papa-stat-card expense">
            <div className="papa-stat-content">
              <div className="papa-stat-icon">
                <PAPAIcons.Expense />
              </div>
              <h3 className="papa-stat-title">支出分類</h3>
              <p className="papa-stat-value">
                {filteredCategories.filter(c => c.type === 'EXPENSE').length}
              </p>
            </div>
          </div>
          
          <div className="papa-stat-card income">
            <div className="papa-stat-content">
              <div className="papa-stat-icon">
                <PAPAIcons.Income />
              </div>
              <h3 className="papa-stat-title">收入分類</h3>
              <p className="papa-stat-value">
                {filteredCategories.filter(c => c.type === 'INCOME').length}
              </p>
            </div>
          </div>
          
          <div className="papa-stat-card groups">
            <div className="papa-stat-content">
              <div className="papa-stat-icon">
                <PAPAIcons.Total />
              </div>
              <h3 className="papa-stat-title">總分類數</h3>
              <p className="papa-stat-value">{filteredCategories.length}</p>
            </div>
          </div>
        </section>

        {/* 篩選器 */}
        <section className="flex gap-4 items-center">
          <span className="text-papa-stone font-medium">篩選類型：</span>
          <div className="flex gap-2">
            {['ALL', 'EXPENSE', 'INCOME'].map(type => (
              <button
                key={type}
                onClick={() => setTypeFilter(type)}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  typeFilter === type 
                    ? 'bg-papa-ocean text-white' 
                    : 'bg-papa-mist text-papa-stone hover:bg-papa-ocean/10'
                }`}
              >
                {type === 'ALL' ? '全部' : type === 'EXPENSE' ? '支出分類' : '收入分類'}
              </button>
            ))}
          </div>
        </section>

        {/* 分類列表 */}
        <section>
          <div className="papa-divider mb-6"></div>
          <h2 className="text-2xl font-bold text-papa-stone mb-6 font-display">
            分類列表
          </h2>
          
          {isLoading ? (
            <div className="papa-loading">
              <div className="papa-sun-loading"></div>
              <p className="papa-loading-text">載入分類中...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCategories.length > 0 ? (
                filteredCategories.map(category => (
                  <div
                    key={category.id}
                    className="bg-white rounded-2xl p-6 shadow-papa-soft hover:shadow-papa-medium transition-shadow papa-cultural-float"
                  >
                    {/* 分類頭部 */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <span className="text-3xl">{getCategoryIcon(category.name)}</span>
                        <div>
                          <h3 className="text-lg font-bold text-papa-stone">
                            {category.name}
                          </h3>
                          <div className="flex gap-2 mt-1">
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                              category.type === 'EXPENSE' ? 'bg-papa-tide/10 text-papa-tide' : 'bg-papa-emerald/10 text-papa-emerald'
                            }`}>
                              {getTypeDisplay(category.type)}
                            </span>
                            {category.is_default && (
                              <span className="bg-papa-dawn/10 text-papa-dawn px-2 py-0.5 rounded text-xs font-medium flex items-center gap-1">
                                <PAPAIcons.Default /> 預設
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {/* 操作按鈕 */}
                      {canManageCategories() && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit(category)}
                            className="text-papa-ocean hover:text-papa-ocean/80"
                          >
                            <PAPAIcons.Edit />
                          </button>
                          {!category.is_default && (
                            <button
                              onClick={() => handleDelete(category)}
                              className="text-papa-tide hover:text-papa-tide/80"
                            >
                              <PAPAIcons.Delete />
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    {/* 分類資訊 */}
                    <div className="space-y-2 text-sm text-papa-cave">
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1">
                          <PAPAIcons.Calendar /> 創建時間
                        </span>
                        <span>
                          {new Date(category.created_at).toLocaleDateString('zh-TW')}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1">
                          <PAPAIcons.Update /> 最後更新
                        </span>
                        <span>
                          {new Date(category.updated_at).toLocaleDateString('zh-TW')}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-full text-center py-16">
                  <div className="papa-loading">
                    <PAPAIcons.Empty />
                    <div className="mt-4">
                      <h3 className="text-xl font-bold text-papa-stone mb-2">
                        暫無分類設定
                      </h3>
                      <p className="text-papa-cave mb-6">
尚無分類資料，點擊上方按鈕新增分類
                      </p>
                      {canManageCategories() && (
                        <button
                          onClick={() => setShowCreateForm(true)}
                          className="papa-action-card px-6 py-3"
                        >
                          <PAPAIcons.Add /> 開始分類
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </section>

        {/* 創建/編輯表單 Modal */}
        {showCreateForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-papa-stone font-display">
                  {editingCategory ? '編輯分類' : '建立新分類'}
                </h2>
                <button
                  onClick={() => {
                    setShowCreateForm(false)
                    setEditingCategory(null)
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
                    分類名稱 *
                  </label>
                  <input
                    type="text"
                    value={categoryForm.name}
                    onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                    className="w-full px-4 py-2 border border-papa-tribal/20 rounded-lg focus:outline-none focus:border-papa-ocean"
                    placeholder="如：食物、交通、住宿、祭典..."
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-papa-stone mb-2">
                    分類類型 *
                  </label>
                  <select
                    value={categoryForm.type}
                    onChange={(e) => setCategoryForm({ ...categoryForm, type: e.target.value as 'EXPENSE' | 'INCOME' })}
                    className="w-full px-4 py-2 border border-papa-tribal/20 rounded-lg focus:outline-none focus:border-papa-ocean"
                  >
                    <option value="EXPENSE">支出分類</option>
                    <option value="INCOME">收入分類</option>
                  </select>
                </div>

                <div>
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={categoryForm.is_default}
                      onChange={(e) => setCategoryForm({ ...categoryForm, is_default: e.target.checked })}
                      className="text-papa-ocean focus:ring-papa-ocean"
                    />
                    <span className="text-sm text-papa-stone">設為預設分類</span>
                  </label>
                  <p className="text-xs text-papa-cave mt-1 ml-6">
                    預設分類不能被刪除，適合用於常用的分類項目
                  </p>
                </div>
                
                <div className="flex gap-4">
                  <button
                    type="submit"
                    className="flex-1 bg-papa-ocean text-white py-3 rounded-lg hover:bg-papa-ocean/90 transition-colors disabled:opacity-50"
                    disabled={createCategoryMutation.isPending || updateCategoryMutation.isPending}
                  >
                    {(createCategoryMutation.isPending || updateCategoryMutation.isPending) 
                      ? '處理中...' 
                      : editingCategory ? '更新分類' : '創建分類'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateForm(false)
                      setEditingCategory(null)
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

export default Categories