import React from 'react'
import { ReportTemplate } from '../../types/reports'

interface ReportTemplateSelectorProps {
  templates: ReportTemplate[]
  onSelect: (template: ReportTemplate) => void
  onSkip: () => void
}

const ReportTemplateSelector: React.FC<ReportTemplateSelectorProps> = ({
  templates,
  onSelect,
  onSkip
}) => {
  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'financial': return '財務分析'
      case 'user_activity': return '用戶活動'
      case 'budget': return '預算管理'
      case 'custom': return '自定義'
      default: return category
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'financial': return 'bg-green-100 text-green-800'
      case 'user_activity': return 'bg-blue-100 text-blue-800'
      case 'budget': return 'bg-purple-100 text-purple-800'
      case 'custom': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const groupedTemplates = templates.reduce((acc, template) => {
    if (!acc[template.category]) {
      acc[template.category] = []
    }
    acc[template.category].push(template)
    return acc
  }, {} as Record<string, ReportTemplate[]>)

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-gray-800 mb-2">選擇報表模板</h2>
        <p className="text-gray-600">從預設模板開始，或者建立全新的自定義報表</p>
      </div>

      {Object.entries(groupedTemplates).map(([category, categoryTemplates]) => (
        <div key={category} className="space-y-4">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-medium text-gray-800">
              {getCategoryLabel(category)}
            </h3>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(category)}`}>
              {categoryTemplates.length} 個模板
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categoryTemplates.map(template => (
              <div
                key={template.id}
                className="border border-gray-200 rounded-lg p-6 cursor-pointer transition-all hover:border-blue-300 hover:shadow-md group"
                onClick={() => onSelect(template)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="text-3xl">{template.icon}</div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(template.category)}`}>
                    {getCategoryLabel(template.category)}
                  </span>
                </div>

                <h4 className="font-semibold text-gray-800 mb-2 group-hover:text-blue-600 transition-colors">
                  {template.name}
                </h4>
                
                <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                  {template.description}
                </p>

                <div className="space-y-2">
                  {template.defaultConfig.groupBy && template.defaultConfig.groupBy.length > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">分組：</span>
                      <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                        {template.defaultConfig.groupBy.join(', ')}
                      </span>
                    </div>
                  )}
                  
                  {template.defaultConfig.chartConfig && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">圖表：</span>
                      <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                        {template.defaultConfig.chartConfig.type === 'pie' ? '圓餅圖' :
                         template.defaultConfig.chartConfig.type === 'bar' ? '柱狀圖' :
                         template.defaultConfig.chartConfig.type === 'line' ? '折線圖' : '表格'}
                      </span>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">指標：</span>
                    <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                      {template.defaultConfig.metrics?.length || 0} 個
                    </span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200">
                  <button className="text-blue-600 text-sm font-medium group-hover:text-blue-700 transition-colors">
                    使用此模板 →
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* 自定義選項 */}
      <div className="border-t border-gray-200 pt-8">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
            <span className="text-2xl">⚡</span>
          </div>
          <h3 className="text-lg font-medium text-gray-800 mb-2">建立自定義報表</h3>
          <p className="text-gray-600 mb-6">從空白開始建立完全客製化的報表</p>
          <button
            onClick={onSkip}
            className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            開始自定義設計
          </button>
        </div>
      </div>
    </div>
  )
}

export default ReportTemplateSelector