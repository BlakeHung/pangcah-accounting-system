import React from 'react'
import Layout from '../components/Layout'
import { CustomReportBuilder } from '../components/Reports'
import { ReportConfig } from '../types/reports'
import { useSnackbar } from '../contexts/SnackbarContext'

const ReportsPage: React.FC = () => {
  const { showSnackbar } = useSnackbar()

  const handleSaveReport = (config: ReportConfig) => {
    // 這裡會調用 API 保存報表配置
    console.log('保存報表配置:', config)
    showSnackbar('報表配置已保存', 'success')
  }

  const handleGenerateReport = (config: ReportConfig) => {
    // 這裡會調用 API 生成報表
    console.log('生成報表:', config)
    showSnackbar('報表生成中，請稍候...', 'info')
    
    // 模擬報表生成過程
    setTimeout(() => {
      showSnackbar('報表生成完成！', 'success')
    }, 3000)
  }
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}')

  return (
    <Layout user={currentUser}>
      <div className="p-6 space-y-6">
        {/* 測試中標籤 */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-2">
          <div className="flex items-center gap-2">
            <span className="text-yellow-600">🧪</span>
            <div>
              <p className="text-sm font-medium text-yellow-800">測試中功能</p>
              <p className="text-xs text-yellow-600">此功能正在開發測試階段</p>
            </div>
          </div>
        </div>

        <CustomReportBuilder
          onSave={handleSaveReport}
          onGenerate={handleGenerateReport}
        />
      </div>
    </Layout>
  )
}

export default ReportsPage