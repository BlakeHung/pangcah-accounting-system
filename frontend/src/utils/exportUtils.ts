import { DashboardExpense } from '../types/expense'

// CSV 導出功能
export const exportToCSV = (
  data: DashboardExpense[], 
  filename: string = '財務資料'
): void => {
  // CSV 標題行（繁體中文）
  const headers = [
    'ID',
    '金額',
    '類型',
    '日期',
    '描述',
    '分類',
    '群組',
    '使用者'
  ]

  // 轉換數據為 CSV 格式
  const csvContent = [
    headers.join(','),
    ...data.map(expense => [
      expense.id,
      `"${Math.abs(parseFloat(String(expense.amount))).toLocaleString()}"`,
      expense.type === 'EXPENSE' ? '支出' : '收入',
      `"${new Date(expense.date).toLocaleDateString('zh-TW')}"`,
      `"${expense.description || '無描述'}"`,
      `"${expense.category_name || '未分類'}"`,
      `"${expense.group_name || '個人'}"`,
      `"${expense.user_name || '未知'}"`,
    ].join(','))
  ].join('\n')

  // 添加 BOM 以支援中文字符
  const BOM = '\uFEFF'
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' })
  
  // 創建下載連結
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.setAttribute('href', url)
  link.setAttribute('download', `${filename}.csv`)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

// 統計報表 CSV 導出
export const exportStatsToCSV = (
  summary: {
    totalIncome: number
    totalExpense: number
    netAmount: number
    transactionCount: number
    averageExpense: number
    averageIncome: number
  },
  categories: Array<{
    name: string
    value: number
    type: 'INCOME' | 'EXPENSE'
    percentage: number
  }>,
  filename: string = '財務統計報表'
): void => {
  const content = [
    '=== 財務統計報表 ===',
    '',
    '整體統計,',
    `總收入,NT$ ${summary.totalIncome.toLocaleString()}`,
    `總支出,NT$ ${summary.totalExpense.toLocaleString()}`,
    `淨額,NT$ ${summary.netAmount.toLocaleString()}`,
    `交易筆數,${summary.transactionCount}`,
    `平均支出,NT$ ${summary.averageExpense.toLocaleString()}`,
    `平均收入,NT$ ${summary.averageIncome.toLocaleString()}`,
    '',
    '分類統計,',
    '分類名稱,類型,金額,佔比',
    ...categories.map(cat => 
      `"${cat.name}",${cat.type === 'EXPENSE' ? '支出' : '收入'},"NT$ ${cat.value.toLocaleString()}",${cat.percentage.toFixed(1)}%`
    )
  ].join('\n')

  const BOM = '\uFEFF'
  const blob = new Blob([BOM + content], { type: 'text/csv;charset=utf-8;' })
  
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.setAttribute('href', url)
  link.setAttribute('download', `${filename}.csv`)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

// PDF 導出功能（使用 window.print）
export const exportToPDF = (
  containerId: string,
  title: string = '財務報表'
): void => {
  const element = document.getElementById(containerId)
  if (!element) {
    alert('找不到要導出的內容')
    return
  }

  // 創建新視窗進行列印
  const printWindow = window.open('', '_blank')
  if (!printWindow) {
    alert('無法開啟列印視窗，請檢查瀏覽器設定')
    return
  }

  // 複製樣式
  const styles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
    .map(style => style.outerHTML)
    .join('')

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>${title}</title>
        ${styles}
        <style>
          @media print {
            body { 
              margin: 0; 
              padding: 20px; 
              font-family: 'Arial', sans-serif;
            }
            .no-print { display: none !important; }
            .print-title {
              text-align: center;
              font-size: 24px;
              font-weight: bold;
              margin-bottom: 20px;
              color: #2E8B57;
            }
            .print-date {
              text-align: right;
              font-size: 12px;
              color: #666;
              margin-bottom: 20px;
            }
          }
        </style>
      </head>
      <body>
        <div class="print-title">${title}</div>
        <div class="print-date">導出時間: ${new Date().toLocaleString('zh-TW')}</div>
        ${element.innerHTML}
      </body>
    </html>
  `)

  printWindow.document.close()
  
  // 等待內容載入完成後列印
  printWindow.onload = () => {
    setTimeout(() => {
      printWindow.print()
      printWindow.close()
    }, 250)
  }
}

// 數據格式化輔助函數
export const formatCurrency = (amount: number): string => {
  return `NT$ ${amount.toLocaleString()}`
}

export const formatDate = (date: string): string => {
  return new Date(date).toLocaleDateString('zh-TW')
}

export const formatPercentage = (value: number): string => {
  return `${value.toFixed(1)}%`
}

// 檢查瀏覽器是否支援下載功能
export const isBrowserSupportsDownload = (): boolean => {
  const link = document.createElement('a')
  return typeof link.download !== 'undefined'
}