// Notification service for handling sounds and browser notifications
export const notificationService = {
  // Play a notification sound with better error handling and fallbacks
  playSound: (type: 'success' | 'error' | 'info' = 'info') => {
    try {
      // Define tone frequencies and durations for different notification types
      const config: Record<string, { frequency: number; duration: number }> = {
        'success': { frequency: 800, duration: 0.3 },
        'error': { frequency: 300, duration: 0.5 },
        'info': { frequency: 600, duration: 0.2 }
      }
      
      const { frequency, duration } = config[type]
      
      // Try Web Audio API first
      if (window.AudioContext || (window as any).webkitAudioContext) {
        try {
          const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext
          const audioContext = new AudioContextClass()
          
          // Resume context if suspended (required after user interaction on some browsers)
          if (audioContext.state === 'suspended') {
            audioContext.resume().catch(e => console.warn('Could not resume AudioContext:', e))
          }
          
          // Create oscillator for tone
          const oscillator = audioContext.createOscillator()
          const gainNode = audioContext.createGain()
          
          oscillator.connect(gainNode)
          gainNode.connect(audioContext.destination)
          
          // Set tone parameters
          oscillator.frequency.value = frequency
          oscillator.type = 'sine'
          
          // Create envelope (fade in/out)
          const now = audioContext.currentTime
          gainNode.gain.setValueAtTime(0, now)
          gainNode.gain.linearRampToValueAtTime(0.3, now + 0.05)
          gainNode.gain.exponentialRampToValueAtTime(0.01, now + duration)
          
          // Play tone
          oscillator.start(now)
          oscillator.stop(now + duration)
          
          console.log(`🔊 Notification sound played: ${type}`)
        } catch (audioErr) {
          console.warn('Web Audio API failed, trying system sounds:', audioErr)
          // Don't create second audio context, just log and continue
        }
      }
    } catch (err) {
      console.warn('Sound notification failed:', err instanceof Error ? err.message : err)
    }
  },

  // Request browser notification permission
  requestPermission: async () => {
    if (!('Notification' in window)) {
      console.warn('Browser does not support notifications')
      return false
    }

    if (Notification.permission === 'granted') {
      return true
    }

    if (Notification.permission === 'denied') {
      console.warn('⚠️ Notifications are BLOCKED by browser')
      console.warn('📍 To unblock: Click lock icon (🔒) next to URL → Notifications → Allow → Refresh page')
      return false
    }

    if (Notification.permission === 'default') {
      try {
        console.log('🔔 Requesting notification permission from user...')
        const permission = await Notification.requestPermission()
        console.log(`Notification permission result: ${permission}`)
        
        if (permission === 'denied') {
          console.warn('⚠️ User denied notification permission')
          console.warn('📍 To enable later: Click lock icon (🔒) next to URL → Notifications → Allow → Refresh page')
        }
        
        return permission === 'granted'
      } catch (err) {
        console.warn('Failed to request notification permission:', err)
        console.warn('📍 Try enabling manually: Click lock icon (🔒) next to URL → Notifications → Allow')
        return false
      }
    }

    return false
  },

  // Send a browser notification
  sendNotification: (title: string, options?: NotificationOptions) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        const notification = new Notification(title, {
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          ...options
        })
        console.log(`🔔 Browser notification sent: ${title}`)
        return notification
      } catch (err) {
        console.warn('Failed to send notification:', err)
      }
    } else {
      console.warn(`Cannot send notification. Permission: ${Notification.permission}`)
    }
  }
}
