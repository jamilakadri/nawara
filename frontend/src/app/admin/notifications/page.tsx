"use client";

import { useEffect, useState, useMemo } from "react";
import {
  Bell, CheckCheck, Trash2, Search, Filter, Loader2, X,
  CheckCircle, FileText, Briefcase, Clock, Star,
  AlertTriangle, Eye, MailOpen, Mail,
} from "lucide-react";
import { fetchGraphQL } from "@/lib/graphqlClient";
import { useAuth } from "@/lib/authContext";
import { useNotifications } from "@/lib/notificationContext";
import { useRouter } from "next/navigation";

/* ─── GraphQL ─────────────────────────────────────────── */
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

/* ─── Types ────────────────────────────────────────────── */
interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type?: string;
  link?: string;
  isRead: boolean;
  createdAt: string;
}

/* ─── Helpers ──────────────────────────────────────────── */
function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "À l'instant";
  if (mins < 60) return `il y a ${mins} min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `il y a ${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `il y a ${days}j`;
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    day: "numeric", month: "short", year: "numeric",
  });
}

function formatFullDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    day: "numeric", month: "long", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

const TYPE_CONFIG: Record<string, {
  icon: typeof CheckCircle; iconClass: string;
  accentBg: string; accentBorder: string; label: string;
}> = {
  TASK: { icon: CheckCircle, iconClass: "text-indigo-600", accentBg: "bg-indigo-50", accentBorder: "border-indigo-200", label: "Tâche" },
  DOCUMENT: { icon: FileText, iconClass: "text-blue-600", accentBg: "bg-blue-50", accentBorder: "border-blue-200", label: "Document" },
  ONBOARDING: { icon: Briefcase, iconClass: "text-purple-600", accentBg: "bg-purple-50", accentBorder: "border-purple-200", label: "Onboarding" },
  EVALUATION: { icon: Star, iconClass: "text-amber-600", accentBg: "bg-amber-50", accentBorder: "border-amber-200", label: "Évaluation" },
};
const DEFAULT_CONFIG = {
  icon: Clock, iconClass: "text-gray-500", accentBg: "bg-gray-50",
  accentBorder: "border-gray-200", label: "Autre",
};

function getConfig(type?: string) {
  return type && TYPE_CONFIG[type] ? TYPE_CONFIG[type] : DEFAULT_CONFIG;
}

const TYPE_FILTERS = [
  { value: "", label: "Toutes" },
  { value: "TASK", label: "Tâches" },
  { value: "DOCUMENT", label: "Documents" },
  { value: "ONBOARDING", label: "Onboarding" },
  { value: "EVALUATION", label: "Évaluations" },
];

const STATUS_FILTERS = [
  { value: "", label: "Tous" },
  { value: "unread", label: "Non lues" },
  { value: "read", label: "Lues" },
];

/* ─── Page ─────────────────────────────────────────────── */
export default function NotificationsPage() {
  const { user } = useAuth();
  const { refetch: refetchContext } = useNotifications();
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedNotif, setSelectedNotif] = useState<Notification | null>(null);

  const loadNotifications = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const data = await fetchGraphQL<{ myNotifications: Notification[] }>(
        GET_NOTIFICATIONS,
        { userId: user.id }
      );
      setNotifications(data.myNotifications || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, [user?.id]);

  const handleMarkRead = async (id: string) => {
    await fetchGraphQL(MARK_READ, { id });
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
    if (selectedNotif?.id === id) {
      setSelectedNotif((prev) => prev ? { ...prev, isRead: true } : null);
    }
    refetchContext();
  };

  const handleMarkAllRead = async () => {
    if (!user?.id) return;
    await fetchGraphQL(MARK_ALL_READ, { userId: user.id });
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    if (selectedNotif) setSelectedNotif({ ...selectedNotif, isRead: true });
    refetchContext();
  };

  const handleNavigate = (link: string) => {
    router.push(link);
  };

  // Filter
  const filtered = useMemo(() => {
    let list = notifications;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((n) =>
        `${n.title} ${n.message}`.toLowerCase().includes(q)
      );
    }
    if (typeFilter) list = list.filter((n) => n.type === typeFilter);
    if (statusFilter === "unread") list = list.filter((n) => !n.isRead);
    if (statusFilter === "read") list = list.filter((n) => n.isRead);
    return list;
  }, [notifications, search, typeFilter, statusFilter]);

  // Stats
  const totalCount = notifications.length;
  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const typeBreakdown = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const n of notifications) {
      const key = n.type || "OTHER";
      counts[key] = (counts[key] || 0) + 1;
    }
    return counts;
  }, [notifications]);

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-3">
            <span className="p-2.5 bg-indigo-50 rounded-xl">
              <Bell className="w-7 h-7 text-indigo-600" />
            </span>
            Notifications
          </h1>
          <p className="text-gray-500 mt-1">
            Consultez et gérez toutes vos notifications en un seul endroit.
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-semibold shadow-md shadow-indigo-200 transition-all text-sm"
          >
            <CheckCheck className="w-4 h-4" />
            Tout marquer comme lu
          </button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
              <Bell className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <p className="text-2xl font-extrabold text-gray-900">{totalCount}</p>
              <p className="text-xs text-gray-500 font-medium">Total</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center">
              <Mail className="w-5 h-5 text-rose-600" />
            </div>
            <div>
              <p className="text-2xl font-extrabold text-rose-600">{unreadCount}</p>
              <p className="text-xs text-gray-500 font-medium">Non lues</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
              <MailOpen className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-extrabold text-emerald-600">{totalCount - unreadCount}</p>
              <p className="text-xs text-gray-500 font-medium">Lues</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
              <Star className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-extrabold text-gray-900">
                {Object.keys(typeBreakdown).length}
              </p>
              <p className="text-xs text-gray-500 font-medium">Catégories</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Notification List */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Filters */}
            <div className="p-5 border-b border-gray-100 bg-gray-50/50 space-y-3">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <input
                    type="text"
                    placeholder="Rechercher dans les notifications..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm bg-white shadow-sm"
                  />
                  <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                  {search && (
                    <button onClick={() => setSearch("")} className="absolute right-3 top-3 text-gray-400 hover:text-gray-600">
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider self-center mr-1">Type :</span>
                {TYPE_FILTERS.map((f) => (
                  <button
                    key={f.value}
                    onClick={() => setTypeFilter(f.value)}
                    className={`px-3 py-1 rounded-full text-xs font-semibold transition-all border ${
                      typeFilter === f.value
                        ? "bg-indigo-600 text-white border-indigo-600"
                        : "bg-white text-gray-600 border-gray-200 hover:border-indigo-300"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider self-center ml-3 mr-1">Statut :</span>
                {STATUS_FILTERS.map((f) => (
                  <button
                    key={f.value}
                    onClick={() => setStatusFilter(f.value)}
                    className={`px-3 py-1 rounded-full text-xs font-semibold transition-all border ${
                      statusFilter === f.value
                        ? "bg-indigo-600 text-white border-indigo-600"
                        : "bg-white text-gray-600 border-gray-200 hover:border-indigo-300"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* List */}
            {loading ? (
              <div className="flex justify-center items-center py-24">
                <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="py-20 text-center text-gray-400 flex flex-col items-center">
                <Bell className="w-12 h-12 text-gray-200 mb-3" />
                <p className="font-medium text-gray-500">Aucune notification trouvée</p>
                {(search || typeFilter || statusFilter) && (
                  <p className="text-xs text-gray-400 mt-1">Essayez de modifier vos filtres.</p>
                )}
              </div>
            ) : (
              <div className="divide-y divide-gray-50 max-h-[600px] overflow-y-auto">
                {filtered.map((n) => {
                  const config = getConfig(n.type);
                  const Icon = config.icon;
                  const isSelected = selectedNotif?.id === n.id;

                  return (
                    <div
                      key={n.id}
                      onClick={() => {
                        setSelectedNotif(n);
                        if (!n.isRead) handleMarkRead(n.id);
                      }}
                      className={`relative px-5 py-4 flex gap-3.5 cursor-pointer transition-all duration-200 group ${
                        isSelected
                          ? "bg-indigo-50/60 border-l-4 border-indigo-500"
                          : !n.isRead
                            ? "bg-indigo-50/20 hover:bg-indigo-50/40 border-l-4 border-transparent"
                            : "hover:bg-gray-50 border-l-4 border-transparent"
                      }`}
                    >
                      {!n.isRead && (
                        <span className="absolute left-1 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                      )}
                      <div className={`w-10 h-10 rounded-xl border ${config.accentBorder} ${config.accentBg} flex items-center justify-center shrink-0`}>
                        <Icon className={`w-5 h-5 ${config.iconClass}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className={`text-sm flex-1 truncate ${!n.isRead ? "font-bold text-gray-900" : "font-medium text-gray-700"}`}>
                            {n.title}
                          </p>
                          <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md shrink-0 ${config.accentBg} ${config.iconClass}`}>
                            {config.label}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 line-clamp-1 leading-relaxed">{n.message}</p>
                        <p className="text-[11px] text-gray-400 mt-1">{timeAgo(n.createdAt)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Footer */}
            <div className="px-5 py-3 border-t border-gray-100 bg-gray-50/50 text-center">
              <p className="text-xs text-gray-400">
                {filtered.length} notification{filtered.length !== 1 ? "s" : ""} affichée{filtered.length !== 1 ? "s" : ""}
                {filtered.length !== totalCount ? ` sur ${totalCount}` : ""}
              </p>
            </div>
          </div>
        </div>

        {/* Right: Detail Panel */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden sticky top-8">
            {selectedNotif ? (
              <>
                {/* Detail Header */}
                <div className={`p-5 border-b ${getConfig(selectedNotif.type).accentBorder} ${getConfig(selectedNotif.type).accentBg}`}>
                  <div className="flex items-center gap-3 mb-3">
                    {(() => {
                      const cfg = getConfig(selectedNotif.type);
                      const DetailIcon = cfg.icon;
                      return (
                        <div className={`w-12 h-12 rounded-xl border ${cfg.accentBorder} bg-white flex items-center justify-center`}>
                          <DetailIcon className={`w-6 h-6 ${cfg.iconClass}`} />
                        </div>
                      );
                    })()}
                    <div>
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${getConfig(selectedNotif.type).accentBg} ${getConfig(selectedNotif.type).iconClass} border ${getConfig(selectedNotif.type).accentBorder}`}>
                        {getConfig(selectedNotif.type).label}
                      </span>
                      <div className="flex items-center gap-2 mt-1">
                        {selectedNotif.isRead ? (
                          <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-0.5">
                            <MailOpen className="w-3 h-3" /> Lu
                          </span>
                        ) : (
                          <span className="text-[10px] text-rose-600 font-semibold flex items-center gap-0.5">
                            <Mail className="w-3 h-3" /> Non lu
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 leading-tight">
                    {selectedNotif.title}
                  </h3>
                </div>

                {/* Detail Body */}
                <div className="p-5 space-y-4">
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Message</p>
                    <p className="text-sm text-gray-700 leading-relaxed bg-gray-50 rounded-xl p-4 border border-gray-100">
                      {selectedNotif.message}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Date</p>
                    <p className="text-sm text-gray-700">{formatFullDate(selectedNotif.createdAt)}</p>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2 pt-2">
                    {selectedNotif.link && (
                      <button
                        onClick={() => handleNavigate(selectedNotif.link!)}
                        className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors shadow-sm"
                      >
                        <Eye className="w-4 h-4" />
                        Voir le détail
                      </button>
                    )}
                    {!selectedNotif.isRead && (
                      <button
                        onClick={() => handleMarkRead(selectedNotif.id)}
                        className="w-full flex items-center justify-center gap-2 border border-gray-200 text-gray-700 px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors"
                      >
                        <CheckCheck className="w-4 h-4" />
                        Marquer comme lu
                      </button>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="py-16 text-center text-gray-400 flex flex-col items-center px-6">
                <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mb-4">
                  <Bell className="w-8 h-8 text-gray-200" />
                </div>
                <p className="font-medium text-gray-500 mb-1">Sélectionnez une notification</p>
                <p className="text-xs text-gray-400">
                  Cliquez sur une notification dans la liste pour voir son détail complet.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
