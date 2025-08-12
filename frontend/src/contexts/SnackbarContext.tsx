import React, { createContext, useContext, useState, ReactNode } from 'react'
import Snackbar from '../components/Snackbar'

interface SnackbarState {
  message: string
  type: 'success' | 'error' | 'warning' | 'info'
  isOpen: boolean
}

interface SnackbarContextType {
  showSnackbar: (message: string, type?: 'success' | 'error' | 'warning' | 'info') => void
}

const SnackbarContext = createContext<SnackbarContextType | undefined>(undefined)

export const useSnackbar = () => {
  const context = useContext(SnackbarContext)
  if (!context) {
    throw new Error('useSnackbar must be used within a SnackbarProvider')
  }
  return context
}

interface SnackbarProviderProps {
  children: ReactNode
}

export const SnackbarProvider: React.FC<SnackbarProviderProps> = ({ children }) => {
  const [snackbarState, setSnackbarState] = useState<SnackbarState>({
    message: '',
    type: 'info',
    isOpen: false
  })

  const showSnackbar = (message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') => {
    setSnackbarState({
      message,
      type,
      isOpen: true
    })
  }

  const closeSnackbar = () => {
    setSnackbarState(prev => ({
      ...prev,
      isOpen: false
    }))
  }

  // 監聽全局 snackbar 事件
  React.useEffect(() => {
    const handleShowSnackbar = (event: CustomEvent) => {
      const { message, type } = event.detail
      showSnackbar(message, type)
    }

    window.addEventListener('showSnackbar' as any, handleShowSnackbar as any)
    return () => {
      window.removeEventListener('showSnackbar' as any, handleShowSnackbar as any)
    }
  }, [])

  return (
    <SnackbarContext.Provider value={{ showSnackbar }}>
      {children}
      <Snackbar
        message={snackbarState.message}
        type={snackbarState.type}
        isOpen={snackbarState.isOpen}
        onClose={closeSnackbar}
      />
    </SnackbarContext.Provider>
  )
}