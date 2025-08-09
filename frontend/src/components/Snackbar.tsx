import React, { useEffect } from 'react'
import './Snackbar.css'

interface SnackbarProps {
  message: string
  type?: 'success' | 'error' | 'warning' | 'info'
  isOpen: boolean
  onClose: () => void
  duration?: number
}

const Snackbar: React.FC<SnackbarProps> = ({
  message,
  type = 'info',
  isOpen,
  onClose,
  duration = 4000
}) => {
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        onClose()
      }, duration)

      return () => clearTimeout(timer)
    }
  }, [isOpen, duration, onClose])

  if (!isOpen) return null

  const getIcon = () => {
    switch (type) {
      case 'success':
        return '✅'
      case 'error':
        return '❌'
      case 'warning':
        return '⚠️'
      default:
        return 'ℹ️'
    }
  }

  return (
    <div className={`snackbar ${type} ${isOpen ? 'show' : ''}`}>
      <div className="snackbar-content">
        <span className="snackbar-icon">{getIcon()}</span>
        <span className="snackbar-message">{message}</span>
        <button className="snackbar-close" onClick={onClose}>
          ×
        </button>
      </div>
    </div>
  )
}

export default Snackbar