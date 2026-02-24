/**
 * Notification Service
 * Handles all notification-related database operations
 */

import { supabase } from "../lib/supabase";

export interface Notification {
  id: string;
  recipient_id: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string | null;
  priority: NotificationPriority;
  is_read: boolean;
  read_at?: string | null;
  created_at: string;
  metadata?: Record<string, any> | null;
  branch_location?: string | null;
}

export type NotificationType =
  | "critical_incident"
  | "incident_assigned"
  | "incident_resolved"
  | "post_comment"
  | "post_like"
  | "post_mention"
  | "leave_approved"
  | "leave_rejected"
  | "shift_changed"
  | "shift_swap_request"
  | "task_assigned"
  | "task_deadline"
  | "checklist_incomplete"
  | "exam_today"
  | "candidate_new"
  | "system_news";

export type NotificationPriority = "critical" | "high" | "medium" | "low";

export interface NotificationFilters {
  is_read?: boolean;
  type?: NotificationType;
  priority?: NotificationPriority;
  branch_location?: string;
  limit?: number;
  offset?: number;
}

export interface CreateNotificationInput {
  recipient_id: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  priority?: NotificationPriority;
  metadata?: Record<string, any>;
  branch_location?: string;
}

/**
 * Get notifications for a specific user
 */
export async function getUserNotifications(
  userId: string,
  filters?: NotificationFilters
): Promise<{ data: Notification[] | null; error: any }> {
  try {
    let query = (supabase as any)
      .from("notifications")
      .select("*")
      .eq("recipient_id", userId)
      .order("created_at", { ascending: false });

    // Apply filters
    if (filters?.is_read !== undefined) {
      query = query.eq("is_read", filters.is_read);
    }

    if (filters?.type) {
      query = query.eq("type", filters.type);
    }

    if (filters?.priority) {
      query = query.eq("priority", filters.priority);
    }

    if (filters?.branch_location) {
      query = query.eq("branch_location", filters.branch_location);
    }

    // Pagination
    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    if (filters?.offset) {
      query = query.range(
        filters.offset,
        filters.offset + (filters.limit || 10) - 1
      );
    }

    const { data, error } = await query;

    if (error) {
      console.error("❌ Error fetching notifications:", error.message);
      return { data: null, error };
    }

    return { data, error: null };
  } catch (error: any) {
    console.error("❌ Exception fetching notifications:", error.message);
    return { data: null, error };
  }
}

/**
 * Get unread notification count for a user
 */
export async function getUnreadCount(
  userId: string
): Promise<{ count: number; error: any }> {
  try {
    const { count, error } = await (supabase as any)
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("recipient_id", userId)
      .eq("is_read", false);

    if (error) {
      console.error("❌ Error fetching unread count:", error.message);
      return { count: 0, error };
    }

    return { count: count || 0, error: null };
  } catch (error: any) {
    console.error("❌ Exception fetching unread count:", error.message);
    return { count: 0, error };
  }
}

/**
 * Mark a single notification as read
 */
export async function markAsRead(
  notificationId: string,
  userId: string
): Promise<{ data: Notification | null; error: any }> {
  try {
    const { data, error } = await (supabase as any)
      .from("notifications")
      .update({
        is_read: true,
        read_at: new Date().toISOString(),
      })
      .eq("id", notificationId)
      .eq("recipient_id", userId) // Security: ensure user owns notification
      .select()
      .single();

    if (error) {
      console.error("❌ Error marking notification as read:", error.message);
      return { data: null, error };
    }

    console.log("✅ Notification marked as read:", notificationId);
    return { data, error: null };
  } catch (error: any) {
    console.error("❌ Exception marking notification as read:", error.message);
    return { data: null, error };
  }
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllAsRead(
  userId: string
): Promise<{ count: number; error: any }> {
  try {
    const { data, error } = await (supabase as any)
      .from("notifications")
      .update({
        is_read: true,
        read_at: new Date().toISOString(),
      })
      .eq("recipient_id", userId)
      .eq("is_read", false)
      .select();

    if (error) {
      console.error("❌ Error marking all as read:", error.message);
      return { count: 0, error };
    }

    const count = data?.length || 0;
    console.log(`✅ Marked ${count} notifications as read`);
    return { count, error: null };
  } catch (error: any) {
    console.error("❌ Exception marking all as read:", error.message);
    return { count: 0, error };
  }
}

/**
 * Dismiss (delete) a notification
 */
export async function dismissNotification(
  notificationId: string,
  userId: string
): Promise<{ success: boolean; error: any }> {
  try {
    const { error } = await (supabase as any)
      .from("notifications")
      .delete()
      .eq("id", notificationId)
      .eq("recipient_id", userId); // Security: ensure user owns notification

    if (error) {
      console.error("❌ Error dismissing notification:", error.message);
      return { success: false, error };
    }

    console.log("✅ Notification dismissed:", notificationId);
    return { success: true, error: null };
  } catch (error: any) {
    console.error("❌ Exception dismissing notification:", error.message);
    return { success: false, error };
  }
}

/**
 * Dismiss all read notifications for a user
 */
export async function dismissAllRead(
  userId: string
): Promise<{ count: number; error: any }> {
  try {
    const { data, error } = await (supabase as any)
      .from("notifications")
      .delete()
      .eq("recipient_id", userId)
      .eq("is_read", true)
      .select();

    if (error) {
      console.error("❌ Error dismissing read notifications:", error.message);
      return { count: 0, error };
    }

    const count = data?.length || 0;
    console.log(`✅ Dismissed ${count} read notifications`);
    return { count, error: null };
  } catch (error: any) {
    console.error("❌ Exception dismissing read notifications:", error.message);
    return { count: 0, error };
  }
}

/**
 * Create a new notification (for admin/system use)
 */
export async function createNotification(
  notification: CreateNotificationInput
): Promise<{ data: Notification | null; error: any }> {
  try {
    const { data, error } = await (supabase as any)
      .from("notifications")
      .insert({
        ...notification,
        priority: notification.priority || "medium",
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error("❌ Error creating notification:", error.message);
      return { data: null, error };
    }

    console.log("✅ Notification created:", data.id);
    return { data, error: null };
  } catch (error: any) {
    console.error("❌ Exception creating notification:", error.message);
    return { data: null, error };
  }
}

/**
 * Broadcast notification to multiple users
 */
export async function broadcastNotification(
  notification: Omit<CreateNotificationInput, "recipient_id">,
  recipientIds: string[]
): Promise<{ count: number; error: any }> {
  try {
    const notifications = recipientIds.map((recipientId) => ({
      ...notification,
      recipient_id: recipientId,
      priority: notification.priority || "medium",
      created_at: new Date().toISOString(),
    }));

    const { data, error } = await (supabase as any)
      .from("notifications")
      .insert(notifications)
      .select();

    if (error) {
      console.error("❌ Error broadcasting notification:", error.message);
      return { count: 0, error };
    }

    const count = data?.length || 0;
    console.log(`✅ Broadcasted notification to ${count} users`);
    return { count, error: null };
  } catch (error: any) {
    console.error("❌ Exception broadcasting notification:", error.message);
    return { count: 0, error };
  }
}

/**
 * Delete old read notifications (cleanup)
 */
export async function cleanupOldNotifications(
  userId: string,
  daysOld: number = 90
): Promise<{ count: number; error: any }> {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const { data, error } = await (supabase as any)
      .from("notifications")
      .delete()
      .eq("recipient_id", userId)
      .eq("is_read", true)
      .lt("read_at", cutoffDate.toISOString())
      .select();

    if (error) {
      console.error("❌ Error cleaning up notifications:", error.message);
      return { count: 0, error };
    }

    const count = data?.length || 0;
    console.log(`✅ Cleaned up ${count} old notifications`);
    return { count, error: null };
  } catch (error: any) {
    console.error("❌ Exception cleaning up notifications:", error.message);
    return { count: 0, error };
  }
}

// Export all functions as default service object
export const notificationService = {
  getUserNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  dismissNotification,
  dismissAllRead,
  createNotification,
  broadcastNotification,
  cleanupOldNotifications,
};

export default notificationService;
