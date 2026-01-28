/**
 * Real-time Notifications Hook
 * Subscribes to new notifications for the current user using Supabase Realtime
 */

import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'
import { toast } from 'react-hot-toast'
import type { Notification } from '../services/notification.service'

/**
 * Hook to subscribe to real-time notification updates for the current user
 * Automatically invalidates React Query cache and shows toast notifications
 */
export function useRealtimeNotifications() {
  const queryClient = useQueryClient()
  const { profile } = useAuth()

  useEffect(() => {
    if (!profile?.id) {
      console.log('⏸️  Real-time notifications paused - no user profile')
      return
    }

    console.log('🔔 Setting up real-time notification subscription for user:', profile.id)

    // Create a unique channel for this user's notifications
    const channel = supabase
      .channel(`notifications-${profile.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `recipient_id=eq.${profile.id}`
        },
        (payload) => {
          console.log('🔔 New notification received:', payload.new)

          const notification = payload.new as Notification

          // Show toast notification based on priority
          showToastNotification(notification)

          // Invalidate queries to refresh UI
          queryClient.invalidateQueries({ queryKey: ['notifications', profile.id] })
          queryClient.invalidateQueries({ queryKey: ['notifications-unread-count', profile.id] })
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `recipient_id=eq.${profile.id}`
        },
        (payload) => {
          console.log('🔄 Notification updated:', payload.new)

          // Invalidate queries to refresh UI
          queryClient.invalidateQueries({ queryKey: ['notifications', profile.id] })
          queryClient.invalidateQueries({ queryKey: ['notifications-unread-count', profile.id] })
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'notifications',
          filter: `recipient_id=eq.${profile.id}`
        },
        (payload) => {
          console.log('🗑️  Notification deleted:', payload.old)

          // Invalidate queries to refresh UI
          queryClient.invalidateQueries({ queryKey: ['notifications', profile.id] })
          queryClient.invalidateQueries({ queryKey: ['notifications-unread-count', profile.id] })
        }
      )
      .subscribe((status) => {
        console.log('📡 Notification channel status:', status)
      })

    // Cleanup function
    return () => {
      console.log('🔕 Unsubscribing from notification channel')
      supabase.removeChannel(channel)
    }
  }, [profile?.id, queryClient])
}

/**
 * Show toast notification based on priority and type
 * Design: Elegant, subtle visual treat - not loud or intrusive
 */
function showToastNotification(notification: Notification) {
  const { priority, title, message, type } = notification

  // Get icon based on type
  const icon = getNotificationIcon(type)

  // Common elegant styling - glassmorphism inspired
  const elegantBase = {
    borderRadius: '12px',
    padding: '12px 16px',
    fontSize: '13px',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    maxWidth: '360px'
  }

  // Show toast based on priority - only critical and high show toasts
  switch (priority) {
    case 'critical':
      // Critical: Visible but still elegant
      toast(`${title}`, {
        icon: icon,
        duration: 8000,
        style: {
          ...elegantBase,
          background: 'linear-gradient(135deg, #FEE2E2 0%, #FECACA 100%)',
          color: '#991B1B',
          fontWeight: '600'
        }
      })
      break

    case 'high':
      // High: Subtle amber glow
      toast(`${title}`, {
        icon: icon,
        duration: 5000,
        style: {
          ...elegantBase,
          background: 'linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%)',
          color: '#92400E',
          fontWeight: '500'
        }
      })
      break

    case 'medium':
      // Medium: Soft blue, short duration
      toast(title, {
        icon: icon,
        duration: 3000,
        style: {
          ...elegantBase,
          background: 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)',
          color: '#1E40AF',
          fontWeight: '400'
        }
      })
      break

    case 'low':
      // Low priority: No toast - only update UI silently
      console.log('ℹ️  Pulse update (silent):', title)
      break

    default:
      // Default: Minimal, disappears quickly
      toast(title, {
        icon: icon,
        duration: 2500,
        style: {
          ...elegantBase,
          background: 'linear-gradient(135deg, #F9FAFB 0%, #F3F4F6 100%)',
          color: '#374151'
        }
      })
  }
}

/**
 * Get emoji icon for notification type
 */
function getNotificationIcon(type: string): string {
  const iconMap: Record<string, string> = {
    critical_incident: '🚨',
    incident_assigned: '⚠️',
    incident_resolved: '✅',
    post_comment: '💬',
    post_like: '❤️',
    post_mention: '@',
    leave_approved: '✅',
    leave_rejected: '❌',
    shift_changed: '📅',
    shift_swap_request: '🔄',
    task_assigned: '📋',
    task_deadline: '⏰',
    checklist_incomplete: '☑️',
    exam_today: '📚',
    candidate_new: '👤',
    system_news: '📢'
  }

  return iconMap[type] || '🔔'
}

export default useRealtimeNotifications
