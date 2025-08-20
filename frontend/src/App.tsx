import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { SnackbarProvider } from './contexts/SnackbarContext'
import './utils/axiosConfig' // 引入 axios 設定

// PAPA 主題頁面
import LoginPage from './pages/LoginPage'

// 傳統頁面（暫時保留作為備份）
import Dashboard from './pages/Dashboard'
import Groups from './pages/Groups'
import Activities from './pages/Activities'
import Users from './pages/Users'
import Transactions from './pages/Transactions'
import TransactionNew from './pages/TransactionNew'
import TransactionDetail from './pages/TransactionDetail'
import TransactionEdit from './pages/TransactionEdit'
import ActivityNew from './pages/ActivityNew'
import ActivityEdit from './pages/ActivityEdit'
import ActivityManager from './pages/ActivityManager'
import Categories from './pages/Categories'
import Settings from './pages/Settings'
import Analytics from './pages/Analytics'
import DashboardSettings from './pages/DashboardSettings'
import { RealtimeDashboard } from './components/Realtime'
import ReportsPage from './pages/ReportsPage'
import InteractiveVisualization from './pages/InteractiveVisualization'

// 樣式
import './App.css'

const queryClient = new QueryClient()

// 私有路由組件
const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const token = localStorage.getItem('access_token')
  const user = localStorage.getItem('user')
  
  if (!token || !user) {
    return <Navigate to="/login" replace />
  }
  
  return <>{children}</>
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <SnackbarProvider>
        <Router>
          <Routes>
            {/* 公開路由 */}
            <Route path="/login" element={<LoginPage />} />
            
            {/* PAPA 主題私有路由 */}
            <Route path="/dashboard" element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            } />
            
            <Route path="/groups" element={
              <PrivateRoute>
                <Groups />
              </PrivateRoute>
            } />
            
            <Route path="/activities" element={
              <PrivateRoute>
                <Activities />
              </PrivateRoute>
            } />
            
            {/* 暫時使用傳統頁面的路由 - 待 PAPA 化 */}
            <Route path="/users" element={
              <PrivateRoute>
                <Users />
              </PrivateRoute>
            } />
            
            <Route path="/transactions" element={
              <PrivateRoute>
                <Transactions />
              </PrivateRoute>
            } />
            
            <Route path="/transactions/new" element={
              <PrivateRoute>
                <TransactionNew />
              </PrivateRoute>
            } />
            
            <Route path="/transactions/:id" element={
              <PrivateRoute>
                <TransactionDetail />
              </PrivateRoute>
            } />
            
            <Route path="/transactions/:id/edit" element={
              <PrivateRoute>
                <TransactionEdit />
              </PrivateRoute>
            } />
            
            <Route path="/activities/new" element={
              <PrivateRoute>
                <ActivityNew />
              </PrivateRoute>
            } />
            
            <Route path="/activities/:id" element={
              <PrivateRoute>
                <ActivityManager />
              </PrivateRoute>
            } />
            
            <Route path="/activities/:id/edit" element={
              <PrivateRoute>
                <ActivityEdit />
              </PrivateRoute>
            } />
            
            <Route path="/activities/:id/manage" element={
              <PrivateRoute>
                <ActivityManager />
              </PrivateRoute>
            } />
            
            <Route path="/categories" element={
              <PrivateRoute>
                <Categories />
              </PrivateRoute>
            } />
            
            <Route path="/settings" element={
              <PrivateRoute>
                <Settings />
              </PrivateRoute>
            } />
            
            <Route path="/analytics" element={
              <PrivateRoute>
                <Analytics />
              </PrivateRoute>
            } />
            
            <Route path="/dashboard/settings" element={
              <PrivateRoute>
                <DashboardSettings />
              </PrivateRoute>
            } />
            
            <Route path="/dashboard/realtime" element={
              <PrivateRoute>
                <RealtimeDashboard />
              </PrivateRoute>
            } />
            
            <Route path="/reports" element={
              <PrivateRoute>
                <ReportsPage />
              </PrivateRoute>
            } />
            
            <Route path="/visualization" element={
              <PrivateRoute>
                <InteractiveVisualization />
              </PrivateRoute>
            } />
            
            {/* 傳統版本備份路由 */}
            <Route path="/classic/dashboard" element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            } />
            
            <Route path="/classic/groups" element={
              <PrivateRoute>
                <Groups />
              </PrivateRoute>
            } />
            
            <Route path="/classic/activities" element={
              <PrivateRoute>
                <Activities />
              </PrivateRoute>
            } />
            
            {/* 根路由重定向 */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            
            {/* 404 頁面 */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Router>
      </SnackbarProvider>
    </QueryClientProvider>
  )
}

export default App