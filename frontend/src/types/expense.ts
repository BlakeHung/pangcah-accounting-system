// 共用的支出/收入類型定義

export type ExpenseType = 'EXPENSE' | 'INCOME';

export interface BaseExpense {
  id: number;
  amount: string | number;
  type: ExpenseType;
  date: string;
  description: string;
}

export interface User {
  id: number;
  username: string;
  name: string;
}

export interface Category {
  id: number;
  name: string;
  description?: string;
  is_income?: boolean;
}

export interface Group {
  id: number;
  name: string;
  description?: string;
}

export interface Event {
  id: number;
  name: string;
  description?: string;
  start_date: string;
  end_date: string;
  location?: string;
  group?: number;
}

export interface ExpenseSplit {
  id: number;
  user: number;
  user_name: string;
  amount: string;
}

// Dashboard 用的完整 Expense 介面
export interface DashboardExpense extends BaseExpense {
  category: number;
  category_name: string;
  group: number;
  group_name: string;
  event?: number;
  event_name?: string;
  user_name: string;
  splits: ExpenseSplit[];
}

// 詳細頁面用的 Expense 介面
export interface DetailExpense extends BaseExpense {
  user: User;
  category: Category;
  group?: Group;
  event?: Event;
  splits?: ExpenseSplit[];
  can_user_edit?: boolean;
  split_total?: number;
}