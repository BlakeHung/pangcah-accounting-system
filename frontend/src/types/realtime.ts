// 即時資料事件類型
export interface RealtimeEvent {
  id: string
  type: 'transaction_created' | 'transaction_updated' | 'transaction_deleted' | 
       'budget_alert' | 'user_activity' | 'system_status'
  data: any
  userId?: string
  timestamp: string
}

// 即時交易資料
export interface RealtimeTransaction {
  id: string
  amount: number
  category: string
  description: string
  type: 'expense' | 'income'
  userId: string
  userName: string
  timestamp: string
  groupId?: string
}

// 即時用戶活動
export interface RealtimeUserActivity {
  userId: string
  userName: string
  action: 'login' | 'logout' | 'create_transaction' | 'update_profile'
  timestamp: string
  metadata?: Record<string, any>
}

// 系統狀態監控
export interface SystemStatus {
  activeUsers: number
  totalTransactions: number
  systemHealth: 'healthy' | 'warning' | 'critical'
  serverLoad: number
  databaseStatus: 'connected' | 'disconnected' | 'slow'
  lastUpdated: string
}

// 預算警報
export interface BudgetAlert {
  id: string
  userId: string
  type: 'approaching' | 'exceeded' | 'reset'
  category: string
  currentAmount: number
  budgetLimit: number
  percentage: number
  timestamp: string
}

// 即時統計資料
export interface RealtimeStats {
  todayExpenses: number
  todayIncome: number
  monthlyExpenses: number
  monthlyIncome: number
  activeUsers: number
  transactionCount: number
  lastUpdated: string
}

// LiveFeed 項目
export interface LiveFeedItem {
  id: string
  type: 'transaction' | 'user_join' | 'budget_alert' | 'system'
  icon: string
  title: string
  description: string
  timestamp: string
  severity?: 'info' | 'warning' | 'error' | 'success'
  data?: any
}