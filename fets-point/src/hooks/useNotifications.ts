/**
 * Notifications Hook
 * Fetches and manages user-specific notifications from the database
 * Uses React Query for caching and real-time updates
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "./useAuth";
import { useRealtimeNotifications } from "./useRealtimeNotifications";
import notificationService, {
  type Notification,
  type NotificationFilters,
} from "../services/notification.service";

export type {
  Notification,
  NotificationFilters,
} from "../services/notification.service";

/**
 * Hook to fetch and manage notifications for the current user
 */
export function useNotifications(filters?: NotificationFilters) {
  const { profile } = useAuth();
  const queryClient = useQueryClient();

  // Enable real-time subscription
  useRealtimeNotifications();

  // Fetch notifications using React Query
  const {
    data: notifications = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["notifications", profile?.id, filters],
    queryFn: async () => {
      if (!profile?.id) return [];

      const { data, error } = await notificationService.getUserNotifications(
        profile.id,
        filters
      );

      if (error) {
        console.error("❌ Error fetching notifications:", error);
        throw error;
      }

      return data || [];
    },
    enabled: !!profile?.id,
    staleTime: 30000, // 30 seconds
    refetchInterval: 60000, // Refetch every 60 seconds as fallback
  });

  // Fetch unread count
  const { data: unreadCount = 0 } = useQuery({
    queryKey: ["notifications-unread-count", profile?.id],
    queryFn: async () => {
      if (!profile?.id) return 0;

      const { count, error } = await notificationService.getUnreadCount(
        profile.id
      );

      if (error) {
        console.error("❌ Error fetching unread count:", error);
        return 0;
      }

      return count;
    },
    enabled: !!profile?.id,
    staleTime: 10000, // 10 seconds
  });

  // Mark as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      if (!profile?.id) throw new Error("No user profile");

      const { error } = await notificationService.markAsRead(
        notificationId,
        profile.id
      );

      if (error) throw error;
    },
    onSuccess: () => {
      // Invalidate queries to refresh UI
      queryClient.invalidateQueries({
        queryKey: ["notifications", profile?.id],
      });
      queryClient.invalidateQueries({
        queryKey: ["notifications-unread-count", profile?.id],
      });
    },
  });

  // Mark all as read mutation
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      if (!profile?.id) throw new Error("No user profile");

      const { error } = await notificationService.markAllAsRead(profile.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["notifications", profile?.id],
      });
      queryClient.invalidateQueries({
        queryKey: ["notifications-unread-count", profile?.id],
      });
    },
  });

  // Dismiss notification mutation
  const dismissMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      if (!profile?.id) throw new Error("No user profile");

      const { error } = await notificationService.dismissNotification(
        notificationId,
        profile.id
      );

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["notifications", profile?.id],
      });
      queryClient.invalidateQueries({
        queryKey: ["notifications-unread-count", profile?.id],
      });
    },
  });

  // Dismiss all read notifications mutation
  const dismissAllReadMutation = useMutation({
    mutationFn: async () => {
      if (!profile?.id) throw new Error("No user profile");

      const { error } = await notificationService.dismissAllRead(profile.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["notifications", profile?.id],
      });
      queryClient.invalidateQueries({
        queryKey: ["notifications-unread-count", profile?.id],
      });
    },
  });

  // Get notifications by priority
  const criticalNotifications = notifications.filter(
    (n) => n.priority === "critical" && !n.is_read
  );
  const highNotifications = notifications.filter(
    (n) => n.priority === "high" && !n.is_read
  );
  const unreadNotifications = notifications.filter((n) => !n.is_read);

  return {
    // Data
    notifications,
    unreadCount,
    criticalNotifications,
    highNotifications,
    unreadNotifications,

    // State
    isLoading,
    error,

    // Actions
    markAsRead: markAsReadMutation.mutate,
    markAllAsRead: markAllAsReadMutation.mutate,
    dismissNotification: dismissMutation.mutate,
    dismissAllRead: dismissAllReadMutation.mutate,
    refetch,

    // Mutation states
    isMarkingAsRead: markAsReadMutation.isPending,
    isMarkingAllAsRead: markAllAsReadMutation.isPending,
    isDismissing: dismissMutation.isPending,
  };
}

/**
 * Hook to fetch only unread notifications
 */
export function useUnreadNotifications() {
  return useNotifications({ is_read: false, limit: 50 });
}

/**
 * Hook to fetch notifications by priority
 */
export function useNotificationsByPriority(
  priority: "critical" | "high" | "medium" | "low"
) {
  return useNotifications({ priority, is_read: false, limit: 20 });
}

/**
 * Hook to get just the unread count (lightweight)
 */
export function useUnreadCount() {
  const { profile } = useAuth();

  const { data: unreadCount = 0 } = useQuery({
    queryKey: ["notifications-unread-count", profile?.id],
    queryFn: async () => {
      if (!profile?.id) return 0;

      const { count, error } = await notificationService.getUnreadCount(
        profile.id
      );

      if (error) {
        console.error("❌ Error fetching unread count:", error);
        return 0;
      }

      return count;
    },
    enabled: !!profile?.id,
    staleTime: 10000, // 10 seconds
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  return unreadCount;
}

export default useNotifications;
