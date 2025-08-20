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

  return (
    <Layout>
      <div className="p-6">
        <CustomReportBuilder
          onSave={handleSaveReport}
          onGenerate={handleGenerateReport}
        />
      </div>
    </Layout>
  )
}

export default ReportsPage