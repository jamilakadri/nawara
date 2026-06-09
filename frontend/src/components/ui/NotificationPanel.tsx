"use client";

import { useEffect, useRef, useState } from "react";
import { Bell, CheckCheck, X, CheckCircle, FileText, Briefcase, Clock, Star, ArrowRight } from "lucide-react";
import { useNotifications, Notification } from "@/lib/notificationContext";
import { useRouter } from "next/navigation";

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "À l'instant";
  if (mins < 60) return `il y a ${mins} min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `il y a ${hrs}h`;
  const days = Math.floor(hrs / 24);
  return `il y a ${days}j`;
}

/* ─── Type-based styling ─── */
const TYPE_CONFIG: Record<string, { icon: typeof CheckCircle; iconClass: string; accentBg: string }> = {
  TASK: { icon: CheckCircle, iconClass: "text-indigo-500", accentBg: "bg-indigo-50" },
  DOCUMENT: { icon: FileText, iconClass: "text-blue-500", accentBg: "bg-blue-50" },
  ONBOARDING: { icon: Briefcase, iconClass: "text-purple-500", accentBg: "bg-purple-50" },
  EVALUATION: { icon: Star, iconClass: "text-amber-500", accentBg: "bg-amber-50" },
};
const DEFAULT_CONFIG = { icon: Clock, iconClass: "text-gray-400", accentBg: "bg-gray-50" };

function getTypeConfig(type?: string) {
  if (type && TYPE_CONFIG[type]) return TYPE_CONFIG[type];
  return DEFAULT_CONFIG;
}

function NotificationIcon({ type, title }: { type?: string; title: string }) {
  // Try type-based icon first, fallback to title-based detection
  const config = getTypeConfig(type);
  if (type && TYPE_CONFIG[type]) {
    const Icon = config.icon;
    return <Icon className={`w-4 h-4 ${config.iconClass}`} />;
  }
  // Legacy fallback for older notifications without type
  const t = title.toLowerCase();
  if (t.includes("document")) return <FileText className="w-4 h-4 text-blue-500" />;
  if (t.includes("tâche") || t.includes("task") || t.includes("soumis")) return <CheckCircle className="w-4 h-4 text-indigo-500" />;
  if (t.includes("période") || t.includes("essai")) return <Briefcase className="w-4 h-4 text-purple-500" />;
  if (t.includes("évaluation")) return <Star className="w-4 h-4 text-amber-500" />;
  return <Clock className="w-4 h-4 text-gray-400" />;
}

function getTypeBadge(type?: string) {
  const labels: Record<string, string> = {
    TASK: "Tâche",
    DOCUMENT: "Document",
    ONBOARDING: "Onboarding",
    EVALUATION: "Évaluation",
  };
  if (!type || !labels[type]) return null;
  const config = getTypeConfig(type);
  return (
    <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md ${config.accentBg} ${config.iconClass}`}>
      {labels[type]}
    </span>
  );
}

function NotifItem({ n, onRead, onNavigate }: { n: Notification; onRead: () => void; onNavigate: () => void }) {
  const config = getTypeConfig(n.type);

  const handleClick = () => {
    onRead();
    if (n.link) {
      onNavigate();
    }
  };

  return (
    <div
      onClick={handleClick}
      className={`relative px-5 py-4 flex gap-3 cursor-pointer transition-all duration-200 hover:bg-gray-50 group ${
        !n.isRead ? "bg-indigo-50/40" : ""
      }`}
    >
      {!n.isRead && (
        <span className="absolute left-2 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
      )}
      <div className={`w-9 h-9 rounded-full border border-gray-100 shadow-sm flex items-center justify-center shrink-0 ${config.accentBg}`}>
        <NotificationIcon type={n.type} title={n.title} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <p className={`text-sm leading-snug flex-1 ${!n.isRead ? "font-semibold text-gray-900" : "text-gray-700"}`}>
            {n.title}
          </p>
          {getTypeBadge(n.type)}
        </div>
        <p className="text-xs text-gray-500 mt-0.5 line-clamp-2 leading-relaxed">{n.message}</p>
        <div className="flex items-center justify-between mt-1.5">
          <p className="text-[11px] text-gray-400">{timeAgo(n.createdAt)}</p>
          {n.link && (
            <span className="text-[10px] font-semibold text-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5">
              Voir <ArrowRight className="w-3 h-3" />
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export function NotificationPanel() {
  const { notifications, unreadCount, markRead, markAllRead, loading } = useNotifications();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const handleMarkRead = async (id: string) => {
    await markRead(id);
  };

  const handleNavigate = (link: string) => {
    setOpen(false);
    router.push(link);
  };

  return (
    <div className="relative" ref={ref}>
      {/* Bell button */}
      <button
        id="notification-bell"
        onClick={() => setOpen((v) => !v)}
        className="relative p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-all duration-200 focus:outline-none"
        aria-label="Notifications"
      >
        <Bell className={`w-5 h-5 transition-transform duration-200 ${open ? "scale-90" : ""}`} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 min-w-[16px] h-4 px-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white leading-none animate-pulse">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Panel */}
      {open && (
        <div
          className="absolute right-0 top-full mt-3 w-[420px] bg-white rounded-2xl shadow-2xl shadow-black/10 border border-gray-100 z-50 overflow-hidden"
          style={{ animation: "slideDown 0.18s ease-out" }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-indigo-50 to-white">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-indigo-600" />
              <h3 className="text-sm font-bold text-gray-900">Notifications</h3>
              {unreadCount > 0 && (
                <span className="bg-indigo-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                  {unreadCount}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  Tout lire
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="p-1 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="max-h-[460px] overflow-y-auto divide-y divide-gray-50">
            {loading && notifications.length === 0 ? (
              <div className="py-12 text-center text-gray-400">
                <div className="w-6 h-6 border-2 border-indigo-300 border-t-indigo-600 rounded-full animate-spin mx-auto mb-2" />
                <p className="text-xs">Chargement…</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-12 text-center text-gray-400">
                <Bell className="w-10 h-10 mx-auto mb-3 text-gray-200" />
                <p className="text-sm font-medium text-gray-500">Aucune notification</p>
                <p className="text-xs text-gray-400 mt-1">Vous êtes à jour !</p>
              </div>
            ) : (
              notifications.map((n) => (
                <NotifItem
                  key={n.id}
                  n={n}
                  onRead={() => handleMarkRead(n.id)}
                  onNavigate={() => n.link && handleNavigate(n.link)}
                />
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="px-5 py-3 border-t border-gray-100 bg-gray-50/50 text-center">
              <p className="text-xs text-gray-400">{notifications.length} notification(s) au total</p>
            </div>
          )}
        </div>
      )}

      <style>{`
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-8px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
}
