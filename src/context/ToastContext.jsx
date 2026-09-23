import { createContext, useContext, useState } from 'react'

const ToastContext = createContext(null)

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const remove = (id) => setToasts((items) => items.filter((item) => item.id !== id))
  const showToast = (message, type = 'success') => {
    const id = Date.now() + Math.random()
    setToasts((items) => [...items, { id, message, type }])
    window.setTimeout(() => remove(id), 3500)
  }
  return <ToastContext.Provider value={{ showToast }}>{children}<div className="toast-stack" aria-live="polite">{toasts.map((toast) => <button key={toast.id} className={`toast toast-${toast.type}`} onClick={() => remove(toast.id)}>{toast.message}</button>)}</div></ToastContext.Provider>
}

export const useToast = () => useContext(ToastContext)
