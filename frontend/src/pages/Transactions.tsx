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
  type: string
}

interface Group {
  id: number
  name: string
  description: string
}

interface Event {
  id: number
  name: string
  description: string
}

interface Transaction {
  id: number
  amount: string
  type: 'EXPENSE' | 'INCOME'
  date: string
  description: string
  images: string[]
  category: Category
  user: User
  event?: Event
  group?: Group
  created_at: string
  updated_at: string
}

// PAPA 文化圖標
const PAPAIcons = {
  Money: () => <span className="text-2xl">💰</span>,
  Expense: () => <span className="text-2xl">💸</span>,
  Income: () => <span className="text-2xl">🌾</span>,
  Balance: () => <span className="text-2xl">⚖️</span>,
  Add: () => <span>➕</span>,
  Edit: () => <span>✏️</span>,
  Delete: () => <span>🗑️</span>,
  View: () => <span>👁️</span>,
  Category: () => <span>🏷️</span>,
  User: () => <span>👤</span>,
  Date: () => <span>📅</span>,
  Group: () => <span>👥</span>,
  Event: () => <span>🎉</span>,
  Empty: () => <span className="text-6xl">📝</span>,
}

const Transactions: React.FC = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null)
  const [typeFilter, setTypeFilter] = useState<string>('ALL')

  // 獲取當前用戶
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}')

  // 獲取支出記錄
  const { data: transactions, isLoading } = useQuery({
    queryKey: ['transactions'],
    queryFn: async (): Promise<Transaction[]> => {
      const response = await axios.get('/api/v1/expenses/')
      return Array.isArray(response.data.results) ? response.data.results : response.data
    }
  })

  // 刪除支出記錄
  const deleteTransactionMutation = useMutation({
    mutationFn: async (id: number) => {
      await axios.delete(`/api/v1/expenses/${id}/`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      setSelectedTransaction(null)
    }
  })

  // 過濾交易記錄
  const filteredTransactions = transactions?.filter(transaction => {
    const typeMatch = typeFilter === 'ALL' || transaction.type === typeFilter
    return typeMatch
  }) || []

  const handleDelete = (transaction: Transaction) => {
    if (window.confirm(`確定要刪除這筆${transaction.type === 'EXPENSE' ? '支出' : '收入'}記錄嗎？`)) {
      deleteTransactionMutation.mutate(transaction.id)
    }
  }


  const getTypeDisplay = (type: string) => {
    return type === 'EXPENSE' ? '支出' : '收入'
  }

  const canManageTransaction = (transaction: Transaction): boolean => {
    if (!currentUser) return false
    if (currentUser.role === 'ADMIN') return true
    return transaction.user.id === currentUser.id
  }

  // 根據阿美族傳統分類獲取圖標
  const getCategoryIcon = (categoryName: string) => {
    if (categoryName.includes('食物') || categoryName.includes('餐飲')) return '🍽️'
    if (categoryName.includes('交通')) return '🚌'
    if (categoryName.includes('住宿')) return '🏠'
    if (categoryName.includes('祭典') || categoryName.includes('文化')) return '🎊'
    if (categoryName.includes('醫療')) return '🏥'
    if (categoryName.includes('教育')) return '📚'
    return '🏷️'
  }

  if (isLoading) {
    return (
      <Layout user={currentUser}>
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-[#2E8B57] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">載入交易記錄中...</p>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout user={currentUser}>
      <div className="space-y-6">
        {/* 頁面標題 */}
        <div className="bg-white rounded-2xl p-6 shadow-lg">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2 flex items-center gap-2">
                <span className="text-2xl">📊</span>
                交易記錄
              </h1>
              <p className="text-gray-600 text-sm md:text-base">
                管理所有收入和支出記錄
              </p>
            </div>
            <button
              onClick={() => navigate('/transactions/new')}
              className="bg-[#2E8B57] hover:bg-[#1F5F3F] text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2 text-sm font-medium shadow-sm"
            >
              <span>➕</span>
              <span className="hidden sm:inline">新增記錄</span>
              <span className="sm:hidden">新增</span>
            </button>
          </div>
        </div>

        {/* 統計摘要 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl p-6 shadow-lg border-l-4 border-red-400">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-600 mb-1">總支出</h3>
                <p className="text-2xl font-bold text-red-600">
                  NT$ {filteredTransactions
                    .filter(t => t.type === 'EXPENSE')
                    .reduce((sum, t) => sum + Math.abs(parseFloat(t.amount)), 0)
                    .toLocaleString()}
                </p>
              </div>
              <div className="text-3xl opacity-80">💸</div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-6 shadow-lg border-l-4 border-green-400">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-600 mb-1">總收入</h3>
                <p className="text-2xl font-bold text-green-600">
                  NT$ {filteredTransactions
                    .filter(t => t.type === 'INCOME')
                    .reduce((sum, t) => sum + parseFloat(t.amount), 0)
                    .toLocaleString()}
                </p>
              </div>
              <div className="text-3xl opacity-80">🌾</div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-6 shadow-lg border-l-4 border-blue-400">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-600 mb-1">淨額</h3>
                <p className={`text-2xl font-bold ${
                  (filteredTransactions.filter(t => t.type === 'INCOME').reduce((sum, t) => sum + parseFloat(String(t.amount)), 0) -
                   filteredTransactions.filter(t => t.type === 'EXPENSE').reduce((sum, t) => sum + Math.abs(parseFloat(String(t.amount))), 0)) >= 0
                    ? 'text-green-600' : 'text-red-600'
                }`}>
                  NT$ {(
                    filteredTransactions.filter(t => t.type === 'INCOME').reduce((sum, t) => sum + parseFloat(String(t.amount)), 0) -
                    filteredTransactions.filter(t => t.type === 'EXPENSE').reduce((sum, t) => sum + Math.abs(parseFloat(String(t.amount))), 0)
                  ).toLocaleString()}
                </p>
              </div>
              <div className="text-3xl opacity-80">⚖️</div>
            </div>
          </div>
        </div>

        {/* 篩選器 */}
        <div className="bg-white rounded-xl p-4 shadow-lg">
          <div className="flex flex-wrap gap-4 items-center">
            <span className="text-gray-700 font-medium text-sm">篩選類型：</span>
            <div className="flex gap-2 flex-wrap">
              {[
                { key: 'ALL', label: '全部', icon: '📊', count: transactions?.length || 0 },
                { key: 'EXPENSE', label: '支出', icon: '💸', count: transactions?.filter(t => t.type === 'EXPENSE').length || 0 },
                { key: 'INCOME', label: '收入', icon: '🌾', count: transactions?.filter(t => t.type === 'INCOME').length || 0 }
              ].map(type => (
                <button
                  key={type.key}
                  onClick={() => setTypeFilter(type.key)}
                  className={`px-3 py-2 rounded-lg transition-colors text-sm font-medium flex items-center gap-2 ${
                    typeFilter === type.key 
                      ? 'bg-blue-600 text-white shadow-md' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <span>{type.icon}</span>
                  <span>{type.label}</span>
                  <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                    typeFilter === type.key ? 'bg-white/20' : 'bg-white'
                  }`}>
                    {type.count}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 交易記錄列表 */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-800">
              交易記錄 ({filteredTransactions.length})
            </h2>
            <div className="text-sm text-gray-500">
              顯示 {typeFilter === 'ALL' ? '全部' : typeFilter === 'EXPENSE' ? '支出' : '收入'} 記錄
            </div>
          </div>
          
          <div className="space-y-3">
            {filteredTransactions.length > 0 ? (
              filteredTransactions
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .map(transaction => (
                <div
                  key={transaction.id}
                  className="bg-white rounded-xl p-4 shadow-lg hover:shadow-xl transition-all duration-200 cursor-pointer"
                  onClick={() => navigate(`/transactions/${transaction.id}`)}
                >
                  <div className="flex items-start gap-4">
                    {/* 類型圖示 */}
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl ${
                      transaction.type === 'EXPENSE' ? 'bg-red-50' : 'bg-green-50'
                    }`}>
                      {transaction.type === 'EXPENSE' ? '💸' : '🌾'}
                    </div>
                    
                    {/* 交易資訊 */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <h3 className="text-base font-semibold text-gray-800 truncate">
                          {transaction.description || '無描述'}
                        </h3>
                        <div className="text-right flex-shrink-0">
                          <span className={`text-lg font-bold ${
                            transaction.type === 'EXPENSE' ? 'text-red-600' : 'text-green-600'
                          }`}>
                            {transaction.type === 'EXPENSE' ? '-' : '+'}NT$ {Math.abs(parseFloat(String(transaction.amount))).toLocaleString()}
                          </span>
                        </div>
                      </div>
                      
                      {/* 詳情標籤 */}
                      <div className="flex flex-wrap gap-2 text-xs text-gray-600 mb-2">
                        <span className="bg-gray-100 px-2 py-1 rounded-full flex items-center gap-1">
                          {getCategoryIcon(transaction.category.name)}
                          {transaction.category.name}
                        </span>
                        <span className="bg-gray-100 px-2 py-1 rounded-full flex items-center gap-1">
                          👤 {transaction.user.name || transaction.user.username}
                        </span>
                        <span className="bg-gray-100 px-2 py-1 rounded-full flex items-center gap-1">
                          📅 {new Date(transaction.date).toLocaleDateString('zh-TW')}
                        </span>
                        {transaction.group && (
                          <span className="bg-blue-100 px-2 py-1 rounded-full flex items-center gap-1 text-blue-700">
                            👥 {transaction.group.name}
                          </span>
                        )}
                        {transaction.event && (
                          <span className="bg-purple-100 px-2 py-1 rounded-full flex items-center gap-1 text-purple-700">
                            🎉 {transaction.event.name}
                          </span>
                        )}
                      </div>
                      
                      {/* 操作按鈕 */}
                      <div className="flex gap-2 pt-2" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => navigate(`/transactions/${transaction.id}`)}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-md transition-colors text-xs font-medium"
                        >
                          👁️ 查看
                        </button>
                        {canManageTransaction(transaction) && (
                          <>
                            <button
                              onClick={() => navigate(`/transactions/${transaction.id}/edit`)}
                              className="bg-[#2E8B57] hover:bg-[#1F5F3F] text-white px-3 py-1 rounded-md transition-colors text-xs font-medium"
                            >
                              ✏️ 編輯
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDelete(transaction)
                              }}
                              className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-md transition-colors text-xs font-medium"
                            >
                              🗑️ 刪除
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-white rounded-xl p-12 shadow-lg text-center">
                <div className="text-6xl mb-4 opacity-50">📊</div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">
                  {typeFilter === 'ALL' ? '暫無交易記錄' : 
                   typeFilter === 'EXPENSE' ? '暫無支出記錄' : '暫無收入記錄'}
                </h3>
                <p className="text-gray-600 mb-6">
                  {typeFilter === 'ALL' ? '尚無交易記錄，開始記錄您的第一筆交易吧！' :
                   typeFilter === 'EXPENSE' ? '尚無支出記錄，點擊下方按鈕新增支出。' :
                   '尚無收入記錄，點擊下方按鈕新增收入。'}
                </p>
                <button
                  onClick={() => navigate('/transactions/new')}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors font-medium"
                >
                  ➕ 開始記錄
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  )
}

export default Transactions