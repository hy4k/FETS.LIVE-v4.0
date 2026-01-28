import { motion } from 'framer-motion'
import { X, Bell, Check, AlertTriangle, Heart, MessageSquare, Calendar, ClipboardList, CheckCircle, XCircle, Clock } from 'lucide-react'
import { GlassCard } from './GlassCard'
import { useNotifications } from '../../hooks/useNotifications'
import { formatDistanceToNow } from 'date-fns'

interface NotificationPanelProps {
  onClose: () => void
}

export default function NotificationPanel({ onClose }: NotificationPanelProps) {
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    dismissNotification,
    isLoading
  } = useNotifications({ limit: 50 })

  const getNotificationIcon = (type: string) => {
    const iconMap: Record<string, any> = {
      critical_incident: AlertTriangle,
      incident_assigned: AlertTriangle,
      incident_resolved: CheckCircle,
      post_comment: MessageSquare,
      post_like: Heart,
      post_mention: Bell,
      leave_approved: CheckCircle,
      leave_rejected: XCircle,
      shift_changed: Calendar,
      shift_swap_request: Calendar,
      task_assigned: ClipboardList,
      task_deadline: Clock,
      checklist_incomplete: ClipboardList,
      exam_today: Bell,
      candidate_new: Bell,
      system_news: Bell
    }

    const IconComponent = iconMap[type] || Bell
    return <IconComponent size={16} />
  }

  const getNotificationColor = (priority: string, isRead: boolean) => {
    if (isRead) return 'bg-gray-50 text-gray-600'

    switch (priority) {
      case 'critical': return 'bg-red-50 text-red-700'
      case 'high': return 'bg-orange-50 text-orange-700'
      case 'medium': return 'bg-blue-50 text-blue-700'
      case 'low': return 'bg-green-50 text-green-700'
      default: return 'bg-gray-50 text-gray-700'
    }
  }

  const handleNotificationClick = (notificationId: string, link?: string | null) => {
    markAsRead(notificationId)
    if (link) {
      // You can navigate here if needed
      // For now, just close the panel
      onClose()
    }
  }

  return (
    <>
      {/* Backdrop - subtle, not too dark */}
      <motion.div
        className="notification-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.15)',
          backdropFilter: 'blur(2px)',
          zIndex: 9998
        }}
      />

      {/* Panel - Fast, snappy animation */}
      <motion.div
        className="notification-panel"
        initial={{ opacity: 0, y: -10, x: 0 }}
        animate={{ opacity: 1, y: 0, x: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ type: "tween", duration: 0.2, ease: "easeOut" }}
        style={{
          position: 'fixed',
          top: 80,
          right: 16,
          width: 380,
          maxHeight: '75vh',
          zIndex: 9999,
          borderRadius: '16px',
          overflow: 'hidden',
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.12)'
        }}
      >
        <GlassCard className="notification-container" style={{ padding: 0, background: 'rgba(255, 255, 255, 0.98)' }}>
          {/* Header - Clean, elegant */}
          <div style={{
            padding: '14px 18px',
            borderBottom: '1px solid rgba(0, 0, 0, 0.06)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(135deg, #FAFAF9 0%, #F5F5F4 100%)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Bell size={18} style={{ color: '#78716C' }} />
              <span style={{ fontWeight: 600, fontSize: '15px', color: '#44403C', letterSpacing: '0.02em' }}>Pulse</span>
              {unreadCount > 0 && (
                <div style={{
                  background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
                  color: 'white',
                  borderRadius: '10px',
                  padding: '2px 8px',
                  fontSize: '11px',
                  fontWeight: 600,
                  boxShadow: '0 2px 4px rgba(217, 119, 6, 0.2)'
                }}>
                  {unreadCount}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              {unreadCount > 0 && (
                <button
                  onClick={() => markAllAsRead()}
                  style={{
                    padding: '5px 10px',
                    fontSize: '11px',
                    backgroundColor: 'rgba(120, 113, 108, 0.08)',
                    color: '#57534E',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: 500,
                    transition: 'all 0.15s ease'
                  }}
                >
                  Mark all read
                </button>
              )}
              <button
                onClick={onClose}
                style={{
                  padding: '5px',
                  backgroundColor: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  borderRadius: '6px',
                  color: '#A8A29E',
                  transition: 'color 0.15s ease'
                }}
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Notifications List - Smooth scrolling, refined spacing */}
          <div style={{
            maxHeight: 'calc(70vh - 70px)',
            overflowY: 'auto',
            scrollBehavior: 'smooth'
          }}>
            {isLoading ? (
              <div style={{ padding: '50px 20px', textAlign: 'center', color: '#A8A29E' }}>
                <div style={{ fontSize: '13px', fontWeight: 500 }}>Loading...</div>
              </div>
            ) : notifications.length === 0 ? (
              <div style={{ padding: '50px 20px', textAlign: 'center', color: '#A8A29E' }}>
                <Bell size={36} style={{ margin: '0 auto 12px', opacity: 0.25 }} />
                <p style={{ fontWeight: 500, fontSize: '14px', color: '#78716C' }}>All clear</p>
                <p style={{ fontSize: '12px', marginTop: '4px', color: '#A8A29E' }}>No new updates</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification.id, notification.link)}
                  style={{
                    padding: '14px 18px',
                    borderBottom: '1px solid rgba(0, 0, 0, 0.04)',
                    cursor: notification.link ? 'pointer' : 'default',
                    transition: 'background-color 0.12s ease',
                    backgroundColor: notification.is_read ? 'transparent' : 'rgba(245, 158, 11, 0.04)',
                    position: 'relative'
                  }}
                  onMouseEnter={(e) => {
                    if (notification.link) {
                      e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.02)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = notification.is_read ? 'transparent' : 'rgba(245, 158, 11, 0.04)'
                  }}
                >
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'start' }}>
                    <div
                      style={{
                        padding: '7px',
                        borderRadius: '8px',
                      }}
                      className={getNotificationColor(notification.priority, notification.is_read)}
                    >
                      {getNotificationIcon(notification.type)}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'start',
                        justifyContent: 'space-between',
                        gap: '8px'
                      }}>
                        <h4 style={{
                          margin: 0,
                          fontWeight: notification.is_read ? 400 : 500,
                          fontSize: '13px',
                          color: notification.is_read ? '#78716C' : '#44403C',
                          lineHeight: '1.4'
                        }}>
                          {notification.title}
                        </h4>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            dismissNotification(notification.id)
                          }}
                          style={{
                            padding: '2px',
                            backgroundColor: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            opacity: 0.5,
                            borderRadius: '4px'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                          onMouseLeave={(e) => e.currentTarget.style.opacity = '0.5'}
                        >
                          <X size={14} />
                        </button>
                      </div>

                      <p style={{
                        margin: '4px 0 0 0',
                        fontSize: '13px',
                        color: '#6b7280',
                        lineHeight: '1.4'
                      }}>
                        {notification.message}
                      </p>

                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        marginTop: '8px'
                      }}>
                        <span style={{
                          fontSize: '12px',
                          color: '#9ca3af',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}>
                          <Clock size={12} />
                          {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                        </span>

                        {!notification.is_read && (
                          <div style={{
                            width: '6px',
                            height: '6px',
                            borderRadius: '9999px',
                            backgroundColor: '#3b82f6'
                          }} />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </GlassCard>
      </motion.div>
    </>
  )
}
