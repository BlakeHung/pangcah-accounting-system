import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import Layout from '../components/Layout'
import './Transactions.css'

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

const Transactions: React.FC = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null)
  const [typeFilter, setTypeFilter] = useState<string>('ALL')

  // 檢查當前用戶
  React.useEffect(() => {
    const token = localStorage.getItem('access_token')
    const userData = localStorage.getItem('user')
    
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
    }
    
    if (userData) {
      setCurrentUser(JSON.parse(userData))
    }
  }, [])

  // 獲取支出記錄
  const { data: transactions, isLoading, error } = useQuery({
    queryKey: ['transactions'],
    queryFn: async (): Promise<Transaction[]> => {
      try {
        const response = await axios.get('/api/v1/expenses/')
        return Array.isArray(response.data.results) ? response.data.results : response.data
      } catch (error) {
        console.error('獲取支出記錄失敗:', error)
        return []
      }
    },
    enabled: !!currentUser
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
        <div className="loading">載入支出記錄失敗</div>
      </Layout>
    )
  }

  return (
    <Layout user={currentUser}>
      <div className="transactions-container">
        <div className="transactions-header">
          <h1>💰 支出記錄</h1>
          <button 
            className="create-button"
            onClick={() => navigate('/transactions/new')}
          >
            + 新增記錄
          </button>
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
              <option value="EXPENSE">支出</option>
              <option value="INCOME">收入</option>
            </select>
          </div>
        </div>

        {/* 統計摘要 */}
        <div className="summary-cards">
          <div className="summary-card expense">
            <div className="summary-icon">💸</div>
            <div className="summary-content">
              <h3>總支出</h3>
              <p className="summary-amount">
                NT$ {filteredTransactions
                  .filter(t => t.type === 'EXPENSE')
                  .reduce((sum, t) => sum + parseFloat(t.amount), 0)
                  .toLocaleString()}
              </p>
            </div>
          </div>
          <div className="summary-card income">
            <div className="summary-icon">💰</div>
            <div className="summary-content">
              <h3>總收入</h3>
              <p className="summary-amount">
                NT$ {filteredTransactions
                  .filter(t => t.type === 'INCOME')
                  .reduce((sum, t) => sum + parseFloat(t.amount), 0)
                  .toLocaleString()}
              </p>
            </div>
          </div>
          <div className="summary-card balance">
            <div className="summary-icon">📊</div>
            <div className="summary-content">
              <h3>淨額</h3>
              <p className="summary-amount">
                NT$ {(
                  filteredTransactions
                    .filter(t => t.type === 'INCOME')
                    .reduce((sum, t) => sum + parseFloat(t.amount), 0) -
                  filteredTransactions
                    .filter(t => t.type === 'EXPENSE')
                    .reduce((sum, t) => sum + parseFloat(t.amount), 0)
                ).toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {/* 支出記錄列表 */}
        <div className="transactions-list">
          {filteredTransactions.length > 0 ? (
            filteredTransactions.map(transaction => (
              <div key={transaction.id} className={`transaction-card ${transaction.type.toLowerCase()}`}>
                <div className="transaction-main">
                  <div className="transaction-icon">
                    {transaction.type === 'EXPENSE' ? '💸' : '💰'}
                  </div>
                  <div className="transaction-info">
                    <div className="transaction-header">
                      <h3>{transaction.description || '無描述'}</h3>
                      <span className={`amount ${transaction.type.toLowerCase()}`}>
                        {transaction.type === 'EXPENSE' ? '-' : '+'}NT$ {parseFloat(transaction.amount).toLocaleString()}
                      </span>
                    </div>
                    <div className="transaction-details">
                      <span className="category">📂 {transaction.category.name}</span>
                      <span className="user">👤 {transaction.user.name}</span>
                      <span className="date">📅 {new Date(transaction.date).toLocaleDateString()}</span>
                      {transaction.group && (
                        <span className="group">👥 {transaction.group.name}</span>
                      )}
                      {transaction.event && (
                        <span className="event">🎉 {transaction.event.name}</span>
                      )}
                    </div>
                  </div>
                  <div className="transaction-actions">
                    <button 
                      className="view-btn"
                      onClick={() => navigate(`/transactions/${transaction.id}`)}
                    >
                      查看
                    </button>
                    {canManageTransaction(transaction) && (
                      <>
                        <button 
                          className="edit-btn"
                          onClick={() => navigate(`/transactions/${transaction.id}/edit`)}
                        >
                          編輯
                        </button>
                        <button 
                          className="delete-btn"
                          onClick={() => handleDelete(transaction)}
                        >
                          刪除
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="no-transactions">
              <div className="empty-state">
                <div className="empty-icon">📝</div>
                <h3>沒有找到支出記錄</h3>
                <p>還沒有任何記錄，點擊上方按鈕新增第一筆記錄吧！</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}

export default Transactions