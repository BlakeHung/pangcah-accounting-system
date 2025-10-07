import React from 'react'
import Layout from '../components/Layout'
import RealtimeDashboard from '../components/Realtime/RealtimeDashboard'

const RealtimePage: React.FC = () => {
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}')

  return (
    <Layout user={currentUser}>
      <div className="p-6 space-y-6">
        {/* 測試中標籤 */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-2 mb-6">
          <div className="flex items-center gap-2">
            <span className="text-yellow-600">🧪</span>
            <div>
              <p className="text-sm font-medium text-yellow-800">測試中功能</p>
              <p className="text-xs text-yellow-600">此功能正在開發測試階段</p>
            </div>
          </div>
        </div>

        <RealtimeDashboard />
      </div>
    </Layout>
  )
}

export default RealtimePage