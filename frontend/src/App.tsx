import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import axios from 'axios'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { SnackbarProvider } from './contexts/SnackbarContext'
import LoginPage from './pages/LoginPage'
import Dashboard from './pages/Dashboard'
import Groups from './pages/Groups'
import Users from './pages/Users'
import Transactions from './pages/Transactions'
import TransactionNew from './pages/TransactionNew'
import TransactionDetail from './pages/TransactionDetail'
import Activities from './pages/Activities'
import ActivityNew from './pages/ActivityNew'
import ActivityDetail from './pages/ActivityDetail'
import ActivityEdit from './pages/ActivityEdit'
import ActivityManager from './pages/ActivityManager'
import Categories from './pages/Categories'
import Settings from './pages/Settings'
import './App.css'

const queryClient = new QueryClient()

// 設置 axios 基礎 URL
axios.defaults.baseURL = 'http://localhost:8000'

// 私有路由組件
const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const token = localStorage.getItem('access_token')
  const user = localStorage.getItem('user')
  
  // 調試信息
  console.log('PrivateRoute check:', { 
    hasToken: !!token, 
    hasUser: !!user,
    tokenLength: token?.length || 0
  })
  
  if (!token || !user) {
    console.log('Redirecting to login - missing token or user data')
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
            
            {/* 私有路由 */}
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
            
            <Route path="/activities" element={
              <PrivateRoute>
                <Activities />
              </PrivateRoute>
            } />
            
            <Route path="/activities/new" element={
              <PrivateRoute>
                <ActivityNew />
              </PrivateRoute>
            } />
            
            <Route path="/activities/:id" element={
              <PrivateRoute>
                <ActivityDetail />
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