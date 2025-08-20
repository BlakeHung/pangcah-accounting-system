import React, { useState, useEffect } from 'react'
import { ReportConfig } from '../../types/reports'

interface ReportPreviewProps {
  config: ReportConfig
  onBack: () => void
  onSave?: () => void
  onGenerate?: () => void
}

const ReportPreview: React.FC<ReportPreviewProps> = ({
  config,
  onBack,
  onSave,
  onGenerate
}) => {
  const [mockData, setMockData] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // 生成模擬資料
  useEffect(() => {
    const generateMockData = () => {
      const categories = ['食物', '交通', '娛樂', '購物', '醫療', '教育']
      const users = ['小美', '阿明', '小華', '雅婷', '志豪']
      
      const data = Array.from({ length: 50 }, (_, i) => ({
        id: i + 1,
        date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        amount: Math.floor(Math.random() * 5000) + 100,
        type: Math.random() > 0.7 ? 'income' : 'expense',
        category: categories[Math.floor(Math.random() * categories.length)],
        description: `交易項目 ${i + 1}`,
        userName: users[Math.floor(Math.random() * users.length)],
        location: '台北市'
      }))
      
      return data
    }

    setTimeout(() => {
      setMockData(generateMockData())
      setIsLoading(false)
    }, 1000)
  }, [])

  const formatCurrency = (amount: number) => {
    return `NT$ ${amount.toLocaleString()}`
  }

  const processData = () => {
    if (!mockData.length) return []

    // 根據配置處理資料
    let processedData = [...mockData]

    // 套用分組
    if (config.groupBy.length > 0) {
      const grouped = processedData.reduce((acc, item) => {
        const key = config.groupBy.map(field => item[field]).join('|')
        if (!acc[key]) {
          acc[key] = []
        }
        acc[key].push(item)
        return acc
      }, {} as Record<string, any[]>)

      // 計算聚合指標
      processedData = Object.entries(grouped).map(([key, items]) => {
        const result: any = {}
        
        // 設定分組欄位值
        config.groupBy.forEach((field, index) => {
          result[field] = key.split('|')[index]
        })

        // 計算指標
        config.metrics.forEach(metric => {
          switch (metric.aggregation) {
            case 'sum':
              result[metric.label] = (items as any[]).reduce((sum, item) => sum + (item[metric.field] || 0), 0)
              break
            case 'count':
              result[metric.label] = (items as any[]).length
              break
            case 'avg':
              result[metric.label] = (items as any[]).reduce((sum, item) => sum + (item[metric.field] || 0), 0) / (items as any[]).length
              break
            case 'min':
              result[metric.label] = Math.min(...(items as any[]).map(item => item[metric.field] || 0))
              break
            case 'max':
              result[metric.label] = Math.max(...(items as any[]).map(item => item[metric.field] || 0))
              break
          }
        })

        return result
      })
    }

    return processedData.slice(0, 10) // 只顯示前10條
  }

  const previewData = processData()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="text-gray-600">正在生成預覽資料...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 報表資訊摘要 */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-xl font-semibold text-blue-800 mb-2">{config.name}</h3>
            <p className="text-blue-700 mb-4">{config.description}</p>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-4">
                <span className="text-blue-600">類型: </span>
                <span className="bg-blue-100 px-2 py-1 rounded text-blue-800">
                  {config.type === 'table' ? '表格' : config.type === 'chart' ? '圖表' : '摘要'}
                </span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-blue-600">時間範圍: </span>
                <span className="bg-blue-100 px-2 py-1 rounded text-blue-800">
                  {config.dateRange.preset === 'month' ? '本月' : 
                   config.dateRange.preset === 'week' ? '本週' :
                   config.dateRange.preset === 'today' ? '今天' : '自定義'}
                </span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-blue-600">指標數量: </span>
                <span className="bg-blue-100 px-2 py-1 rounded text-blue-800">
                  {config.metrics.length} 個
                </span>
              </div>
            </div>
          </div>
          <div className="text-4xl">📊</div>
        </div>
      </div>

      {/* 資料預覽 */}
      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h4 className="text-lg font-semibold text-gray-800">資料預覽</h4>
          <p className="text-gray-600 text-sm">顯示前 10 筆資料（實際報表將包含所有符合條件的資料）</p>
        </div>
        
        <div className="overflow-x-auto">
          {previewData.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <div className="text-4xl mb-3">📄</div>
              <p>沒有符合條件的資料</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  {/* 分組欄位作為表頭 */}
                  {config.groupBy.map(field => (
                    <th key={field} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {field === 'category' ? '分類' :
                       field === 'userName' ? '用戶' :
                       field === 'date' ? '日期' : field}
                    </th>
                  ))}
                  {/* 指標欄位作為表頭 */}
                  {config.metrics.map(metric => (
                    <th key={metric.label} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {metric.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {previewData.map((row, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    {config.groupBy.map(field => (
                      <td key={field} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {row[field]}
                      </td>
                    ))}
                    {config.metrics.map(metric => (
                      <td key={metric.label} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {metric.format === 'currency' && typeof row[metric.label] === 'number' 
                          ? formatCurrency(row[metric.label])
                          : row[metric.label]
                        }
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* 匯出選項 */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h4 className="text-lg font-semibold text-gray-800 mb-4">匯出選項</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {['PDF', 'Excel', 'CSV', 'PNG'].map(format => (
            <div key={format} className="flex items-center gap-2">
              <input
                type="checkbox"
                id={format}
                checked={config.exportFormats.includes(format as any)}
                onChange={(e) => {
                  const newFormats = e.target.checked
                    ? [...config.exportFormats, format as any]
                    : config.exportFormats.filter(f => f !== format)
                  // onChange({ exportFormats: newFormats })
                }}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor={format} className="text-sm text-gray-700">
                {format}
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* 操作按鈕 */}
      <div className="flex items-center justify-between pt-6 border-t border-gray-200">
        <button
          onClick={onBack}
          className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-6 py-3 rounded-lg font-medium"
        >
          ← 返回編輯
        </button>
        
        <div className="space-x-4">
          {onSave && (
            <button
              onClick={onSave}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium"
            >
              💾 儲存配置
            </button>
          )}
          {onGenerate && (
            <button
              onClick={onGenerate}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium"
            >
              🚀 生成報表
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default ReportPreview