"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import { fetchGraphQL } from "./graphqlClient";
import { useAuth } from "./authContext";

/* ─── Types ─────────────────────────────────────────── */
export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type?: string;
  link?: string;
  isRead: boolean;
  createdAt: string;
}

export interface ToastMessage {
  id: string;
  type: "success" | "error" | "warning" | "info";
  title: string;
  message?: string;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  refetch: () => void;
  toasts: ToastMessage[];
  addToast: (toast: Omit<ToastMessage, "id">) => void;
  removeToast: (id: string) => void;
}

/* ─── GraphQL ────────────────────────────────────────── */
const GET_NOTIFICATIONS = `
  query MyNotifications($userId: ID!) {
    myNotifications(userId: $userId) {
      id userId title message type link isRead createdAt
    }
  }
`;

const MARK_READ = `
  mutation MarkRead($id: ID!) {
    markNotificationRead(id: $id) { id isRead }
  }
`;

const MARK_ALL_READ = `
  mutation MarkAllRead($userId: ID!) {
    markAllNotificationsRead(userId: $userId)
  }
`;

/* ─── Context ────────────────────────────────────────── */
const NotificationContext = createContext<NotificationContextType>({
  notifications: [],
  unreadCount: 0,
  loading: false,
  markRead: async () => {},
  markAllRead: async () => {},
  refetch: () => {},
  toasts: [],
  addToast: () => {},
  removeToast: () => {},
});

export const useNotifications = () => useContext(NotificationContext);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const prevUnreadRef = useRef<number>(0);

  const fetchNotifications = useCallback(async () => {
    if (!user?.id) return;
    try {
      const data = await fetchGraphQL<{ myNotifications: Notification[] }>(
        GET_NOTIFICATIONS,
        { userId: user.id }
      );
      const notifs = data?.myNotifications ?? [];
      const newUnread = notifs.filter((n) => !n.isRead).length;

      // If unread count increased since last poll → show a toast
      if (newUnread > prevUnreadRef.current && prevUnreadRef.current !== -1) {
        const newest = notifs.find((n) => !n.isRead);
        if (newest) {
          addToast({ type: "info", title: newest.title, message: newest.message });
        }
      }
      prevUnreadRef.current = newUnread;
      setNotifications(notifs);
    } catch {
      // Silent fail — don't break the app
    }
  }, [user?.id]);

  const refetch = useCallback(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Initial load + polling every 30s
  useEffect(() => {
    if (!user?.id) return;
    prevUnreadRef.current = -1; // suppress toast on first load
    setLoading(true);
    fetchNotifications().finally(() => setLoading(false));

    intervalRef.current = setInterval(fetchNotifications, 30_000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [user?.id, fetchNotifications]);

  const markRead = useCallback(
    async (id: string) => {
      if (!user?.id) return;
      await fetchGraphQL(MARK_READ, { id });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      prevUnreadRef.current = Math.max(0, prevUnreadRef.current - 1);
    },
    [user?.id]
  );

  const markAllRead = useCallback(async () => {
    if (!user?.id) return;
    await fetchGraphQL(MARK_ALL_READ, { userId: user.id });
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    prevUnreadRef.current = 0;
  }, [user?.id]);

  const addToast = useCallback((toast: Omit<ToastMessage, "id">) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { ...toast, id }]);
    // Auto-dismiss after 4s
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        markRead,
        markAllRead,
        refetch,
        toasts,
        addToast,
        removeToast,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}
