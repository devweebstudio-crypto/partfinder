import { useState, useEffect } from 'react'
import { Bell, X, AlertCircle } from 'lucide-react'

export default function NotificationPermissionBanner() {
  const [show, setShow] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const [isBlocked, setIsBlocked] = useState(false)

  useEffect(() => {
    // Check if notifications are supported and permission status
    if ('Notification' in window) {
      const checkPermission = () => {
        if (Notification.permission === 'denied') {
          // Permission was denied - could be temporary or permanent block
          const dismissed = sessionStorage.getItem('notification-banner-dismissed')
          if (!dismissed) {
            setIsBlocked(true)
            setShow(true)
          }
        } else if (Notification.permission === 'default') {
          // Permission not yet requested
          const dismissed = sessionStorage.getItem('notification-banner-dismissed')
          if (!dismissed) {
            setIsBlocked(false)
            setShow(true)
          }
        }
      }

      // Check immediately
      checkPermission()

      // Check again after a delay (in case user just logged in)
      const timer = setTimeout(checkPermission, 2000)

      return () => clearTimeout(timer)
    }
  }, [])

  const handleEnable = async () => {
    if (isBlocked) {
      // If blocked, show instructions to manually enable
      alert(
        '⚠️ Notifications are blocked by your browser.\n\n' +
        'To enable notifications manually:\n\n' +
        '1. Click the tune/lock icon (🔒 or ⓘ) next to the URL in address bar\n' +
        '2. Find "Notifications" in the dropdown\n' +
        '3. Change from "Block" to "Allow"\n' +
        '4. Refresh this page\n\n' +
        'Chrome/Edge: Click lock icon → Site Settings → Notifications → Allow\n' +
        'Firefox: Click shield/lock icon → Permissions → Notifications → Allow\n' +
        'Safari: Safari menu → Preferences → Websites → Notifications → Allow'
      )
      return
    }

    try {
      console.log('🔔 Requesting notification permission...')
      const permission = await Notification.requestPermission()
      console.log('🔔 Permission result:', permission)
      
      if (permission === 'granted') {
        setShow(false)
        console.log('✅ Notification permission granted!')
      } else if (permission === 'denied') {
        // User denied, might be blocked now
        setIsBlocked(true)
        console.warn('❌ Notification permission denied')
      }
    } catch (err) {
      console.error('Error requesting notification permission:', err)
      setIsBlocked(true)
    }
  }

  const handleDismiss = () => {
    setShow(false)
    setDismissed(true)
    sessionStorage.setItem('notification-banner-dismissed', 'true')
  }

  if (!show || dismissed) return null

  return (
    <div className="fixed top-0 left-0 right-0 z-[10000] animate-in slide-in-from-top duration-300">
      <div className={`${isBlocked ? 'bg-orange-900/95 border-orange-700' : 'bg-blue-900/95 border-blue-700'} border-b backdrop-blur-sm`}>
        <div className="site-container py-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1">
              {isBlocked ? (
                <AlertCircle size={20} className="text-orange-300 flex-shrink-0" />
              ) : (
                <Bell size={20} className="text-blue-300 flex-shrink-0" />
              )}
              <div className="flex-1">
                {isBlocked ? (
                  <>
                    <p className="text-sm text-orange-100 font-medium">
                      Notifications are blocked - Manual action required
                    </p>
                    <p className="text-xs text-orange-300 mt-0.5">
                      Click the lock/tune icon (🔒) next to the URL → Notifications → Allow, then refresh page
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-sm text-blue-100 font-medium">
                      Enable notifications to get instant alerts when vendors respond
                    </p>
                    <p className="text-xs text-blue-300 mt-0.5">
                      You'll receive sound alerts and popup notifications for new requests and responses
                    </p>
                  </>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={handleEnable}
                className={`px-4 py-2 ${isBlocked ? 'bg-orange-500 hover:bg-orange-600' : 'bg-blue-500 hover:bg-blue-600'} text-white text-sm font-semibold rounded-lg transition-colors`}
              >
                {isBlocked ? 'Show Instructions' : 'Enable'}
              </button>
              <button
                onClick={handleDismiss}
                className={`p-2 ${isBlocked ? 'hover:bg-orange-800/50 text-orange-300 hover:text-orange-100' : 'hover:bg-blue-800/50 text-blue-300 hover:text-blue-100'} rounded-lg transition-colors`}
                aria-label="Dismiss"
              >
                <X size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
