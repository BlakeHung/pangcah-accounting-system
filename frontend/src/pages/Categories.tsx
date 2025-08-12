import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import Layout from '../components/Layout'

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

  const getCategoryIcon = (categoryName: string) => {
    if (categoryName.includes('食物') || categoryName.includes('餐飲') || categoryName.includes('食')) return '🍽️'
    if (categoryName.includes('交通') || categoryName.includes('車') || categoryName.includes('運輸')) return '🚌'
    if (categoryName.includes('住宿') || categoryName.includes('房') || categoryName.includes('租')) return '🏠'
    if (categoryName.includes('祭典') || categoryName.includes('文化') || categoryName.includes('慶')) return '🎊'
    if (categoryName.includes('醫療') || categoryName.includes('健康') || categoryName.includes('藥')) return '🏥'
    if (categoryName.includes('教育') || categoryName.includes('學習') || categoryName.includes('書')) return '📚'
    if (categoryName.includes('工具') || categoryName.includes('設備') || categoryName.includes('修')) return '🔧'
    if (categoryName.includes('衣物') || categoryName.includes('服裝') || categoryName.includes('衣')) return '👕'
    if (categoryName.includes('娛樂') || categoryName.includes('休閒') || categoryName.includes('遊')) return '🎮'
    if (categoryName.includes('通訊') || categoryName.includes('網路') || categoryName.includes('電話')) return '📱'
    if (categoryName.includes('水電') || categoryName.includes('瓦斯') || categoryName.includes('電費')) return '💡'
    return '🏷️'
  }

  const getTypeColor = (type: string) => {
    return type === 'EXPENSE' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'
  }

  return (
    <Layout user={currentUser}>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* 頁面標題 */}
        <div className="bg-white rounded-xl p-6 shadow-papa-soft">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2 flex items-center gap-3">
                <span className="text-2xl">🏷️</span>
                分類管理
              </h1>
              <p className="text-gray-600 text-sm md:text-base">
                管理收入和支出分類項目
              </p>
            </div>
            {canManageCategories() && (
              <button
                onClick={() => setShowCreateForm(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2 text-sm font-medium"
              >
                <span>➕</span>
                <span className="hidden sm:inline">新增分類</span>
                <span className="sm:hidden">新增</span>
              </button>
            )}
          </div>
        </div>

        {/* 統計摘要 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl p-6 shadow-papa-soft border-l-4 border-red-400">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-600 mb-1">支出分類</h3>
                <p className="text-2xl font-bold text-red-600">
                  {categories?.filter(c => c.type === 'EXPENSE').length || 0}
                </p>
              </div>
              <div className="text-3xl opacity-80">💸</div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-6 shadow-papa-soft border-l-4 border-green-400">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-600 mb-1">收入分類</h3>
                <p className="text-2xl font-bold text-green-600">
                  {categories?.filter(c => c.type === 'INCOME').length || 0}
                </p>
              </div>
              <div className="text-3xl opacity-80">🌾</div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-6 shadow-papa-soft border-l-4 border-blue-400">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-600 mb-1">總分類數</h3>
                <p className="text-2xl font-bold text-blue-600">{categories?.length || 0}</p>
              </div>
              <div className="text-3xl opacity-80">📋</div>
            </div>
          </div>
        </div>

        {/* 篩選器 */}
        <div className="bg-white rounded-xl p-6 shadow-papa-soft">
          <div className="flex flex-wrap gap-4 items-center">
            <span className="text-gray-800 font-medium">篩選類型：</span>
            <div className="flex flex-wrap gap-2">
              {['ALL', 'EXPENSE', 'INCOME'].map(type => (
                <button
                  key={type}
                  onClick={() => setTypeFilter(type)}
                  className={`px-4 py-2 rounded-lg transition-colors text-sm font-medium ${
                    typeFilter === type 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {type === 'ALL' ? '全部' : type === 'EXPENSE' ? '支出分類' : '收入分類'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 分類列表 */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-800">
              分類列表 ({filteredCategories.length})
            </h2>
          </div>
          
          {isLoading ? (
            <div className="flex items-center justify-center min-h-96">
              <div className="text-center">
                <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-600">載入分類中...</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCategories.length > 0 ? (
                filteredCategories.map(category => (
                  <div
                    key={category.id}
                    className="bg-white rounded-xl p-6 shadow-papa-soft hover:shadow-papa-medium transition-all duration-200"
                  >
                    {/* 分類頭部 */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-xl flex-shrink-0">
                          {getCategoryIcon(category.name)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-base font-semibold text-gray-800 truncate">
                            {category.name}
                          </h3>
                          <div className="flex flex-wrap gap-1 mt-1">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getTypeColor(category.type)}`}>
                              {getTypeDisplay(category.type)}
                            </span>
                            {category.is_default && (
                              <span className="bg-yellow-100 text-yellow-600 px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1">
                                <span>🔹</span> 預設
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {/* 操作按鈕 */}
                      {canManageCategories() && (
                        <div className="flex gap-1 flex-shrink-0">
                          <button
                            onClick={() => handleEdit(category)}
                            className="w-8 h-8 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 transition-colors flex items-center justify-center text-sm"
                            title="編輯分類"
                          >
                            ✏️
                          </button>
                          {!category.is_default && (
                            <button
                              onClick={() => handleDelete(category)}
                              className="w-8 h-8 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors flex items-center justify-center text-sm"
                              title="刪除分類"
                            >
                              🗑️
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    {/* 分類資訊 */}
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between text-gray-600">
                        <span className="flex items-center gap-1">
                          📅 創建時間
                        </span>
                        <span>{new Date(category.created_at).toLocaleDateString('zh-TW')}</span>
                      </div>
                      <div className="flex items-center justify-between text-gray-600">
                        <span className="flex items-center gap-1">
                          🔄 最後更新
                        </span>
                        <span>{new Date(category.updated_at).toLocaleDateString('zh-TW')}</span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-full">
                  <div className="bg-white rounded-xl p-12 shadow-papa-soft text-center">
                    <div className="text-6xl mb-4 opacity-50">🏷️</div>
                    <h3 className="text-xl font-bold text-gray-800 mb-2">
                      暫無分類資料
                    </h3>
                    <p className="text-gray-600 mb-6">
                      尚無分類資料，點擊上方按鈕新增分類
                    </p>
                    {canManageCategories() && (
                      <button
                        onClick={() => setShowCreateForm(true)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors font-medium"
                      >
                        ➕ 開始建立分類
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 創建/編輯表單 Modal */}
        {showCreateForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800">
                  {editingCategory ? '編輯分類' : '新增分類'}
                </h2>
                <button
                  onClick={() => {
                    setShowCreateForm(false)
                    setEditingCategory(null)
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
                    分類名稱 *
                  </label>
                  <input
                    type="text"
                    value={categoryForm.name}
                    onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="如：食物、交通、住宿、娛樂..."
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    分類類型
                  </label>
                  <select
                    value={categoryForm.type}
                    onChange={(e) => setCategoryForm({ ...categoryForm, type: e.target.value as 'EXPENSE' | 'INCOME' })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all appearance-none bg-white"
                  >
                    <option value="EXPENSE">💸 支出分類</option>
                    <option value="INCOME">🌾 收入分類</option>
                  </select>
                </div>

                <div>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={categoryForm.is_default}
                      onChange={(e) => setCategoryForm({ ...categoryForm, is_default: e.target.checked })}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <div>
                      <span className="text-sm font-medium text-gray-700">設為預設分類</span>
                      <p className="text-xs text-gray-500">
                        預設分類不能被刪除，適合用於常用的分類項目
                      </p>
                    </div>
                  </label>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateForm(false)
                      setEditingCategory(null)
                      resetForm()
                    }}
                    className="flex-1 sm:flex-none sm:px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                  >
                    取消
                  </button>
                  <button
                    type="submit"
                    disabled={createCategoryMutation.isPending || updateCategoryMutation.isPending}
                    className="flex-1 px-8 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors font-medium flex items-center justify-center gap-2"
                  >
                    {(createCategoryMutation.isPending || updateCategoryMutation.isPending) ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        <span>處理中...</span>
                      </>
                    ) : (
                      <>
                        <span>✓</span>
                        <span>{editingCategory ? '更新分類' : '建立分類'}</span>
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

export default Categories