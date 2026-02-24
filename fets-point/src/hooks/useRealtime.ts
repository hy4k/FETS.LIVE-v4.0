import { useEffect, useState, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import { toast } from "react-hot-toast";

// Use flexible types for real-time subscriptions
type CandidateRow = any;
type IncidentRow = any;
type RosterRow = any;

// Real-time connection status
export function useRealtimeStatus() {
  const [isConnected, setIsConnected] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);

  useEffect(() => {
    const channel = supabase.channel("connection-status");

    channel
      .on("system", { event: "*" }, (payload) => {
        console.log("🔴 Realtime status:", payload);
        if (payload.type === "connected") {
          setIsConnected(true);
          setReconnectAttempts(0);
          setLastUpdate(new Date());
        } else if (payload.type === "disconnected") {
          setIsConnected(false);
        }
      })
      .subscribe((status) => {
        console.log("📡 Realtime connection status:", status);
        if (status === "SUBSCRIBED") {
          setIsConnected(true);
          setLastUpdate(new Date());
        } else if (status === "CHANNEL_ERROR") {
          setIsConnected(false);
          setReconnectAttempts((prev) => prev + 1);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { isConnected, lastUpdate, reconnectAttempts };
}

// Real-time candidates subscription
export function useRealtimeCandidates(filters?: {
  date?: string;
  status?: string;
  branch?: string;
}) {
  const queryClient = useQueryClient();
  const [liveUpdates, setLiveUpdates] = useState<CandidateRow[]>([]);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const lastUpdateRef = useRef<Date>(new Date());

  useEffect(() => {
    console.log("🔄 Setting up realtime candidates subscription...", filters);

    // Create a unique channel name for branch-specific subscriptions
    const channelName =
      filters?.branch && filters.branch !== "global"
        ? `candidates-changes-${filters.branch}`
        : "candidates-changes";

    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "candidates",
          // Apply filters
          ...(filters?.date && {
            filter: `exam_date=gte.${filters.date}T00:00:00Z,exam_date=lt.${filters.date}T23:59:59Z`,
          }),
          ...(filters?.branch &&
            filters.branch !== "global" && {
              filter: `branch_location=eq.${filters.branch}`,
            }),
        },
        (payload) => {
          console.log("📊 Candidate update:", payload);
          lastUpdateRef.current = new Date();

          // Update local state for immediate UI feedback
          if (payload.eventType === "INSERT") {
            setLiveUpdates((prev) => [payload.new as CandidateRow, ...prev]);
            toast.success("New candidate added", {
              icon: "➕",
              duration: 3000,
            });
          } else if (payload.eventType === "UPDATE") {
            setLiveUpdates((prev) =>
              prev.map((item) =>
                item.id === payload.new.id
                  ? (payload.new as CandidateRow)
                  : item
              )
            );
            toast.success("Candidate updated", {
              icon: "✏️",
              duration: 2000,
            });
          } else if (payload.eventType === "DELETE") {
            setLiveUpdates((prev) =>
              prev.filter((item) => item.id !== payload.old.id)
            );
            toast.error("Candidate removed", {
              icon: "🗑️",
              duration: 2000,
            });
          }

          // Invalidate and refetch React Query cache
          queryClient.invalidateQueries({ queryKey: ["candidates"] });
          queryClient.invalidateQueries({
            queryKey: ["candidates", "metrics"],
          });
        }
      )
      .subscribe((status) => {
        console.log("📡 Candidates subscription status:", status);
        setIsSubscribed(status === "SUBSCRIBED");

        if (status === "CHANNEL_ERROR") {
          toast.error("Lost connection to candidate updates", {
            icon: "📡",
            duration: 5000,
          });
        } else if (status === "SUBSCRIBED") {
          toast.success("Connected to live candidate updates", {
            icon: "📡",
            duration: 2000,
          });
        }
      });

    return () => {
      console.log("🔄 Cleaning up candidates subscription");
      supabase.removeChannel(channel);
      setIsSubscribed(false);
    };
  }, [queryClient, filters]);

  return {
    liveUpdates,
    isSubscribed,
    lastUpdate: lastUpdateRef.current,
  };
}

// Real-time incidents subscription
export function useRealtimeIncidents(status?: string, branch?: string) {
  const queryClient = useQueryClient();
  const [liveUpdates, setLiveUpdates] = useState<IncidentRow[]>([]);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const lastUpdateRef = useRef<Date>(new Date());

  useEffect(() => {
    console.log("🔄 Setting up realtime incidents subscription...", status);

    // Create a unique channel name for branch-specific subscriptions
    const channelName =
      branch && branch !== "global"
        ? `incidents-changes-${branch}`
        : "incidents-changes";

    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "incidents",
          // Apply filters
          ...(status && { filter: `status=eq.${status}` }),
          ...(branch &&
            branch !== "global" && {
              filter: `branch_location=eq.${branch}`,
            }),
        },
        (payload) => {
          console.log("🚨 Incident update:", payload);
          lastUpdateRef.current = new Date();

          // Update local state for immediate UI feedback
          if (payload.eventType === "INSERT") {
            setLiveUpdates((prev) => [payload.new as IncidentRow, ...prev]);
            toast.error("New incident reported", {
              icon: "🚨",
              duration: 4000,
            });
          } else if (payload.eventType === "UPDATE") {
            setLiveUpdates((prev) =>
              prev.map((item) =>
                item.id === payload.new.id ? (payload.new as IncidentRow) : item
              )
            );

            const incident = payload.new as IncidentRow;
            if (
              incident.status === "resolved" ||
              incident.status === "closed"
            ) {
              toast.success("Incident resolved", {
                icon: "✅",
                duration: 3000,
              });
            } else {
              toast.success("Incident updated", {
                icon: "✏️",
                duration: 2000,
              });
            }
          } else if (payload.eventType === "DELETE") {
            setLiveUpdates((prev) =>
              prev.filter((item) => item.id !== payload.old.id)
            );
            toast.success("Incident removed", {
              icon: "🗑️",
              duration: 2000,
            });
          }

          // Invalidate and refetch React Query cache
          queryClient.invalidateQueries({ queryKey: ["incidents"] });
        }
      )
      .subscribe((status) => {
        console.log("📡 Incidents subscription status:", status);
        setIsSubscribed(status === "SUBSCRIBED");

        if (status === "CHANNEL_ERROR") {
          toast.error("Lost connection to incident updates", {
            icon: "📡",
            duration: 5000,
          });
        } else if (status === "SUBSCRIBED") {
          toast.success("Connected to live incident updates", {
            icon: "📡",
            duration: 2000,
          });
        }
      });

    return () => {
      console.log("🔄 Cleaning up incidents subscription");
      supabase.removeChannel(channel);
      setIsSubscribed(false);
    };
  }, [queryClient, status, branch]);

  return {
    liveUpdates,
    isSubscribed,
    lastUpdate: lastUpdateRef.current,
  };
}

// Real-time roster subscription
export function useRealtimeRoster(date?: string) {
  const queryClient = useQueryClient();
  const [liveUpdates, setLiveUpdates] = useState<RosterRow[]>([]);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const lastUpdateRef = useRef<Date>(new Date());

  useEffect(() => {
    console.log("🔄 Setting up realtime roster subscription...", date);

    const channel = supabase
      .channel("roster-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "roster_schedules",
          // Apply date filter if provided
          ...(date && { filter: `date=eq.${date}` }),
        },
        (payload) => {
          console.log("👥 Roster update:", payload);
          lastUpdateRef.current = new Date();

          // Update local state
          if (payload.eventType === "INSERT") {
            setLiveUpdates((prev) => [payload.new as RosterRow, ...prev]);
            toast.success("Roster updated", {
              icon: "👥",
              duration: 2000,
            });
          } else if (payload.eventType === "UPDATE") {
            setLiveUpdates((prev) =>
              prev.map((item) =>
                item.id === payload.new.id ? (payload.new as RosterRow) : item
              )
            );
            toast.success("Schedule changed", {
              icon: "📅",
              duration: 2000,
            });
          } else if (payload.eventType === "DELETE") {
            setLiveUpdates((prev) =>
              prev.filter((item) => item.id !== payload.old.id)
            );
            toast.success("Schedule removed", {
              icon: "🗑️",
              duration: 2000,
            });
          }

          // Invalidate React Query cache
          queryClient.invalidateQueries({ queryKey: ["roster"] });
        }
      )
      .subscribe((status) => {
        console.log("📡 Roster subscription status:", status);
        setIsSubscribed(status === "SUBSCRIBED");
      });

    return () => {
      console.log("🔄 Cleaning up roster subscription");
      supabase.removeChannel(channel);
      setIsSubscribed(false);
    };
  }, [queryClient, date]);

  return {
    liveUpdates,
    isSubscribed,
    lastUpdate: lastUpdateRef.current,
  };
}

// Combined dashboard real-time hook
export function useRealtimeDashboard() {
  const candidatesRealtime = useRealtimeCandidates();
  const incidentsRealtime = useRealtimeIncidents();
  const rosterRealtime = useRealtimeRoster();
  const connectionStatus = useRealtimeStatus();

  const isFullyConnected =
    candidatesRealtime.isSubscribed &&
    incidentsRealtime.isSubscribed &&
    rosterRealtime.isSubscribed;

  const lastUpdate = new Date(
    Math.max(
      candidatesRealtime.lastUpdate.getTime(),
      incidentsRealtime.lastUpdate.getTime(),
      rosterRealtime.lastUpdate.getTime()
    )
  );

  return {
    isConnected: connectionStatus.isConnected,
    isFullySubscribed: isFullyConnected,
    lastUpdate,
    reconnectAttempts: connectionStatus.reconnectAttempts,
    subscriptions: {
      candidates: candidatesRealtime.isSubscribed,
      incidents: incidentsRealtime.isSubscribed,
      roster: rosterRealtime.isSubscribed,
    },
  };
}
