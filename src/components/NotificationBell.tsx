import { useState, useEffect, useCallback, useRef } from "react";
import { Bell, MessageSquare, UserPlus, UserCheck, Briefcase, Check, Trash2 } from "lucide-react";
import { useApi } from "@/hooks/useApi";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

interface NotificationData {
  fromUserId?: string;
  fromUserName?: string;
  fromUserAvatar?: string;
  friendshipId?: string;
}

interface Notification {
  _id: string;
  type: "message" | "friend_request" | "friend_accepted" | "employee_request";
  title: string;
  body: string;
  read: boolean;
  data?: NotificationData;
  createdAt: string;
}

const NOTIFICATION_ICONS = {
  message: MessageSquare,
  friend_request: UserPlus,
  friend_accepted: UserCheck,
  employee_request: Briefcase,
};

const NOTIFICATION_COLORS = {
  message: "text-blue-500 bg-blue-500/10",
  friend_request: "text-violet-500 bg-violet-500/10",
  friend_accepted: "text-emerald-500 bg-emerald-500/10",
  employee_request: "text-amber-500 bg-amber-500/10",
};

function timeAgo(date: string) {
  const now = new Date();
  const d = new Date(date);
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "agora";
  if (diffMin < 60) return `${diffMin}m`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH}h`;
  const diffD = Math.floor(diffH / 24);
  if (diffD < 7) return `${diffD}d`;
  return d.toLocaleDateString("pt-PT", { day: "numeric", month: "short" });
}

export function NotificationBell() {
  const { makeRequest } = useApi();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const data = await makeRequest("/notifications/unread-count");
      setUnreadCount(data.count);
    } catch {
      // silently fail
    }
  }, [makeRequest]);

  const fetchNotifications = useCallback(async () => {
    try {
      const data = await makeRequest("/notifications");
      setNotifications(data);
    } catch {
      // silently fail
    }
  }, [makeRequest]);

  // Poll unread count every 15 seconds
  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 15000);
    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  // Fetch full list when panel opens
  useEffect(() => {
    if (open) {
      fetchNotifications();
    }
  }, [open, fetchNotifications]);

  // Close panel when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        open &&
        panelRef.current &&
        !panelRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const handleMarkRead = async (id: string) => {
    try {
      await makeRequest(`/notifications/${id}/read`, { method: "PATCH" });
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {
      // silently fail
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await makeRequest("/notifications/read-all", { method: "PATCH" });
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch {
      // silently fail
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await makeRequest(`/notifications/${id}`, { method: "DELETE" });
      const removed = notifications.find((n) => n._id === id);
      setNotifications((prev) => prev.filter((n) => n._id !== id));
      if (removed && !removed.read) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch {
      // silently fail
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      handleMarkRead(notification._id);
    }

    // Navigate based on type
    switch (notification.type) {
      case "message":
        navigate(
          window.location.pathname.includes("/employee")
            ? "/employee/chat"
            : window.location.pathname.includes("/manager")
            ? "/manager/chat"
            : "/customer/chat"
        );
        break;
      case "friend_request":
      case "friend_accepted":
        navigate("/profiles");
        break;
      case "employee_request":
        // Employee sees this - go to dashboard where requests appear
        navigate("/employee");
        break;
    }
    setOpen(false);
  };

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={() => setOpen((v) => !v)}
        className="relative p-2 rounded-full hover:bg-muted transition-colors"
        title="Notificações"
      >
        <Bell className="h-5 w-5 text-muted-foreground" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-red-500 rounded-full ring-2 ring-background">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div
          ref={panelRef}
          className="absolute right-0 top-full mt-2 w-[340px] sm:w-[380px] max-h-[70vh] bg-popover border border-border rounded-xl shadow-xl z-[100] flex flex-col overflow-hidden animate-in fade-in-0 zoom-in-95 slide-in-from-top-2"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <h3 className="text-sm font-semibold">Notificações</h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-xs text-primary hover:underline font-medium"
              >
                Marcar todas como lidas
              </button>
            )}
          </div>

          {/* List */}
          <div className="overflow-y-auto flex-1">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 px-4 text-muted-foreground">
                <Bell className="h-10 w-10 mb-2 opacity-30" />
                <p className="text-sm">Sem notificações</p>
              </div>
            ) : (
              notifications.map((notif) => {
                const Icon = NOTIFICATION_ICONS[notif.type] || Bell;
                const colorClass = NOTIFICATION_COLORS[notif.type] || "text-muted-foreground bg-muted";

                return (
                  <div
                    key={notif._id}
                    role="button"
                    tabIndex={0}
                    onClick={() => handleNotificationClick(notif)}
                    onKeyDown={(e) => e.key === "Enter" && handleNotificationClick(notif)}
                    className={cn(
                      "w-full flex items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/60 group cursor-pointer",
                      !notif.read && "bg-primary/[0.03]"
                    )}
                  >
                    <div className={cn("flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center mt-0.5", colorClass)}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className={cn("text-sm truncate", !notif.read && "font-semibold")}>
                          {notif.title}
                        </p>
                        {!notif.read && (
                          <span className="flex-shrink-0 w-2 h-2 rounded-full bg-primary" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{notif.body}</p>
                      <p className="text-[10px] text-muted-foreground/70 mt-1">{timeAgo(notif.createdAt)}</p>
                    </div>
                    <button
                      onClick={(e) => handleDelete(notif._id, e)}
                      className="flex-shrink-0 p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-destructive/10 transition-all"
                      title="Apagar"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-muted-foreground hover:text-destructive" />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
