import { useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'
import { useToastStore } from '../components/Toast'
import { notificationService } from '../lib/notificationService'

export function useNotificationListener() {
  const { user } = useAuth()

  useEffect(() => {
    if (!user) {
      console.log('⚠️ No user logged in, skipping notification listener')
      return
    }

    console.log('🔔 Notification listener initialized for user:', user.id)

    // Request notification permission on first load
    notificationService.requestPermission().then(granted => {
      if (granted) {
        console.log('🔔 Browser notification permission: GRANTED ✅')
      } else {
        console.warn('🔔 Browser notification permission: DENIED ❌')
        console.warn('ℹ️ To enable notifications: Go to browser settings → Site permissions → Notifications → Allow')
      }
    })

    // Subscribe to real-time notifications
    console.log('📡 Setting up real-time channel...')
    const channel = supabase
      .channel(`notifications:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications'
          // No filter - we'll filter client-side for OR conditions
        },
        async (payload) => {
          console.log('📡 Real-time notification received (RAW):', payload)
          const notification = payload.new as any

          // Client-side filter: Only process if notification is for current user
          // vendor_id + no client_id = FOR vendor (new request, closure)
          // client_id = FOR client (vendor responded)
          const isForVendor = notification.vendor_id === user.id && notification.client_id === null
          const isForClient = notification.client_id === user.id

          if (!isForVendor && !isForClient) {
            console.log('⏭️ Skipping notification (not for current user)')
            return
          }

          console.log('✅ Notification is for current user, processing...', { isForVendor, isForClient })

          try {
            // Fetch full request and vendor/client info
            const { data: request } = await supabase
              .from('requests')
              .select('*')
              .eq('id', notification.request_id)
              .single()

            if (isForVendor) {
              // This is a notification FOR a vendor (new client request, vendor part request, or closure)
              
              // Determine if this is a vendor part request or client request
              const isVendorPartRequest = !request?.client_id
              
              let title = 'New Request Received'
              let message = ''
              
              if (isVendorPartRequest) {
                // Another vendor posted a part request
                title = 'Vendor Looking for Part'
                message = `Another vendor needs: ${request?.part_name}`
              } else {
                // Client posted a request
                const { data: client } = await supabase
                  .from('profiles')
                  .select('*')
                  .eq('id', request?.client_id)
                  .maybeSingle()
                message = `${client?.full_name} requested ${request?.part_name}`
              }
              
              // Check if request is closed (notification sent when client closes request)
              if (request?.status === 'closed') {
                title = 'Request Closed'
                const { data: client } = await supabase
                  .from('profiles')
                  .select('*')
                  .eq('id', request?.client_id)
                  .maybeSingle()
                message = `${client?.full_name} closed the request for ${request?.part_name}`
              }

              // Play sound
              notificationService.playSound(request?.status === 'closed' ? 'error' : 'success')

              // Show browser notification
              notificationService.sendNotification(title, {
                body: message,
                tag: 'vendor-notification',
                requireInteraction: false
              })

              // Show on-screen toast
              console.log('💬 Calling useToastStore.notify for vendor...', { title, message })
              useToastStore.notify({
                type: request?.status === 'closed' ? 'error' : 'success',
                title,
                message,
                duration: 8000
              })
              console.log('✅ Toast notification sent for vendor')
            } else if (isForClient) {
              // This is a notification FOR a client (vendor responded to their request)
              console.log('👤 Processing client notification (vendor responded)')
              const { data: vendor } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', notification.vendor_id)
                .single()

              // Fetch vendor's response status
              const { data: response } = await supabase
                .from('request_responses')
                .select('status')
                .eq('request_id', notification.request_id)
                .eq('vendor_id', notification.vendor_id)
                .maybeSingle()

              console.log('📋 Vendor response status:', response?.status)

              let title = 'Vendor Responded'
              let message = `${vendor?.business_name || vendor?.full_name || 'A vendor'} responded to your request`
              let notifType: 'success' | 'error' | 'info' = 'info'
              
              if (response?.status === 'accepted') {
                title = 'Vendor Accepted'
                message = `${vendor?.business_name || vendor?.full_name} accepted your request for ${request?.part_name}`
                notifType = 'success'
              } else if (response?.status === 'rejected') {
                title = 'Vendor Rejected'
                message = `${vendor?.business_name || vendor?.full_name} rejected your request`
                notifType = 'error'
              } else if (response?.status === 'completed') {
                title = 'Request Completed'
                message = `${vendor?.business_name || vendor?.full_name} marked your request as completed`
                notifType = 'success'
              }

              notificationService.playSound(notifType === 'success' ? 'success' : notifType === 'error' ? 'error' : 'info')
              notificationService.sendNotification(title, {
                body: message,
                tag: 'client-notification'
              })

              console.log('💬 Calling useToastStore.notify for client...', { title, message, notifType })
              useToastStore.notify({
                type: notifType,
                title,
                message,
                duration: 8000
              })
              console.log('✅ Toast notification sent for client')
            }
          } catch (err) {
            console.error('Error processing notification:', err)
          }
        }
      )
      .subscribe((status) => {
        console.log('📡 Real-time subscription status:', status)
      })

    return () => {
      console.log('🔌 Cleaning up notification listener for user:', user.id)
      supabase.removeChannel(channel)
    }
  }, [user?.id]) // Only re-run if user ID changes
}
