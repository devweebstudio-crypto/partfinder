import { useState, useEffect } from 'react'
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react'

export interface Toast {
  id: string
  title: string
  message?: string
  type: 'success' | 'error' | 'info'
  duration?: number
}

export const useToastStore = (() => {
  let listeners: ((toasts: Toast[]) => void)[] = []
  let toasts: Toast[] = []
  let toastIdCounter = 0

  const notify = (toast: Omit<Toast, 'id'>) => {
    const id = String(toastIdCounter++)
    const newToast: Toast = { ...toast, id, duration: toast.duration ?? 5000 }
    toasts = [...toasts, newToast]
    notifyListeners()

    if ((newToast.duration ?? 5000) > 0) {
      setTimeout(() => {
        removeToast(id)
      }, (newToast.duration ?? 5000))
    }

    return id
  }

  const removeToast = (id: string) => {
    toasts = toasts.filter(t => t.id !== id)
    notifyListeners()
  }

  const notifyListeners = () => {
    listeners.forEach(listener => listener([...toasts]))
  }

  const subscribe = (listener: (toasts: Toast[]) => void) => {
    listeners.push(listener)
    return () => {
      listeners = listeners.filter(l => l !== listener)
    }
  }

  return { notify, removeToast, subscribe }
})()

export default function Toast({ toast, onRemove }: { toast: Toast; onRemove: () => void }) {
  const bgColor = toast.type === 'success' ? 'bg-green-900/90' : toast.type === 'error' ? 'bg-red-900/90' : 'bg-blue-900/90'
  const borderColor = toast.type === 'success' ? 'border-green-700' : toast.type === 'error' ? 'border-red-700' : 'border-blue-700'
  const textColor = toast.type === 'success' ? 'text-green-100' : toast.type === 'error' ? 'text-red-100' : 'text-blue-100'
  const Icon = toast.type === 'success' ? CheckCircle : toast.type === 'error' ? AlertCircle : Info

  return (
    <div className={`${bgColor} border ${borderColor} rounded-lg p-4 shadow-lg flex items-start gap-3 max-w-sm animate-in fade-in slide-in-from-top-2 duration-300`}>
      <Icon size={20} className={textColor} />
      <div className="flex-1">
        <p className={`font-semibold ${textColor}`}>{toast.title}</p>
        {toast.message && <p className="text-sm opacity-90">{toast.message}</p>}
      </div>
      <button onClick={onRemove} className={`p-1 hover:opacity-70 transition-opacity ${textColor}`}>
        <X size={18} />
      </button>
    </div>
  )
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<Toast[]>([])

  useEffect(() => {
    const unsubscribe = useToastStore.subscribe(setToasts)
    return unsubscribe
  }, [])

  return (
    <div className="fixed top-4 right-4 z-[9999] space-y-3 pointer-events-auto">
      {toasts.map(toast => (
        <Toast
          key={toast.id}
          toast={toast}
          onRemove={() => useToastStore.removeToast(toast.id)}
        />
      ))}
    </div>
  )
}
