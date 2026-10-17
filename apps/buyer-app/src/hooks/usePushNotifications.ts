import { useState, useCallback } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { api } from "../services/http";

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  type: string;
  reference_id: string;
  is_read: boolean;
  created_at: string;
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    try {
      const data = await api.get<{ notifications: AppNotification[] }>(
        "/notifications",
      );
      setNotifications(data.notifications || []);
    } catch (e) {
      console.error("Failed to fetch notifications", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchNotifications();
    }, [fetchNotifications]),
  );

  const markRead = useCallback(async () => {
    try {
      await api.post("/notifications/read");
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch (e) {
      console.error("Failed to mark as read", e);
    }
  }, []);

  return { notifications, loading, markRead, refresh: fetchNotifications };
}
