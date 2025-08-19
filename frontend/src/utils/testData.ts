// 測試數據用於驗證圖表功能
export const mockExpenses = [
  {
    id: 1,
    amount: "-1500",
    description: "購買辦公用品",
    date: "2024-01-15",
    category: 1,
    category_name: "辦公用品",
    group: 1,
    group_name: "部落辦公室",
    user_name: "張小明",
    splits: []
  },
  {
    id: 2,
    amount: "5000",
    description: "部落補助款",
    date: "2024-01-20",
    category: 2,
    category_name: "補助收入",
    group: 1,
    group_name: "部落辦公室",
    user_name: "李管理",
    splits: []
  },
  {
    id: 3,
    amount: "-800",
    description: "活動茶點",
    date: "2024-02-05",
    category: 3,
    category_name: "活動支出",
    group: 1,
    group_name: "部落辦公室",
    user_name: "王志明",
    splits: []
  },
  {
    id: 4,
    amount: "3000",
    description: "文化活動收費",
    date: "2024-02-10",
    category: 4,
    category_name: "活動收入",
    group: 1,
    group_name: "部落辦公室",
    user_name: "陳美華",
    splits: []
  },
  {
    id: 5,
    amount: "-2200",
    description: "電費",
    date: "2024-03-01",
    category: 5,
    category_name: "水電費",
    group: 1,
    group_name: "部落辦公室",
    user_name: "張小明",
    splits: []
  }
];

export const mockCategories = [
  { id: 1, name: "辦公用品", description: "辦公室用品支出", is_income: false },
  { id: 2, name: "補助收入", description: "政府補助", is_income: true },
  { id: 3, name: "活動支出", description: "部落活動支出", is_income: false },
  { id: 4, name: "活動收入", description: "活動相關收入", is_income: true },
  { id: 5, name: "水電費", description: "基本開銷", is_income: false }
];