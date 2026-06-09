"use client";

import React from "react";
import Link from "next/link";
import {
  Home,
  Users,
  FileText,
  CheckSquare,
  Settings,
  LogOut,
  Hexagon,
  Building2,
  LayoutTemplate,
  BarChart3,
  UserCog,
  Star,
  Folder,
  ClipboardList,
  BookOpen,
  Bot,
} from "lucide-react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/authContext";
import { useNotifications } from "@/lib/notificationContext";

interface SidebarProps {
  role: "admin" | "manager" | "employee";
}

export const Sidebar: React.FC<SidebarProps> = ({ role }) => {
  const pathname = usePathname();
  const { logout } = useAuth();
  const { unreadCount } = useNotifications();

  const adminLinks = [
    { name: "Dashboard", href: "/admin", icon: Home },
    { name: "Utilisateurs", href: "/admin/users", icon: UserCog },
    { name: "Départements & Postes", href: "/admin/organization", icon: Building2 },
    { name: "Employés", href: "/admin/employees", icon: Users },
    { name: "Modèles Onboarding", href: "/admin/templates", icon: LayoutTemplate },
    { name: "Documents", href: "/admin/documents", icon: Folder },
    { name: "Analytics & Rapports", href: "/admin/analytics", icon: BarChart3 },
    { name: "Assistant IA", href: "/admin/ai-assistant", icon: Bot },
    { name: "Paramètres", href: "/admin/settings", icon: Settings },
  ];

  const managerLinks = [
    { name: "Dashboard", href: "/manager", icon: Home },
    { name: "Équipe & Essais", href: "/manager/team", icon: Users },
    { name: "Tâches Métier", href: "/manager/tasks", icon: CheckSquare },
    { name: "Évaluations", href: "/manager/evaluations", icon: Star },
  ];

  const employeeLinks = [
    { name: "Mon Parcours", href: "/employee", icon: Home },
    { name: "Mes Tâches", href: "/employee/tasks", icon: ClipboardList },
    { name: "Mes Documents", href: "/employee/documents", icon: FileText },
    { name: "Auto-évaluation", href: "/employee/evaluation", icon: BookOpen },
  ];

  let links = employeeLinks;
  if (role === "admin") links = adminLinks;
  if (role === "manager") links = managerLinks;

  const ROLE_LABEL: Record<string, string> = {
    admin: "Admin RH",
    manager: "Manager",
    employee: "Collaborateur",
  };

  const ROLE_COLOR: Record<string, string> = {
    admin: "from-violet-500 to-indigo-600",
    manager: "from-blue-500 to-cyan-500",
    employee: "from-emerald-500 to-teal-500",
  };

  return (
    <aside className="w-72 bg-white/80 backdrop-blur-xl border-r border-gray-200/50 min-h-screen flex flex-col shadow-[4px_0_24px_rgb(0,0,0,0.02)] z-20">
      {/* Logo */}
      <div className="h-20 flex items-center px-8 border-b border-gray-100">
        <div className="flex items-center space-x-2.5">
          <div className="p-1.5 bg-gradient-to-br from-indigo-500 to-blue-500 rounded-lg shadow-sm">
            <Hexagon className="w-6 h-6 text-white fill-white/20" />
          </div>
          <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 tracking-tight">
            SmartHR
          </span>
        </div>
      </div>

      {/* Role Pill */}
      <div className="px-6 pt-5 pb-2">
        <span
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold text-white bg-gradient-to-r ${ROLE_COLOR[role]} shadow-sm`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-white/60 animate-pulse" />
          {ROLE_LABEL[role]}
        </span>
      </div>

      {/* Nav */}
      <div className="flex-1 px-4 py-3 overflow-y-auto custom-scrollbar">
        <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-4">
          Menu Principal
        </div>
        <nav className="space-y-1">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive =
              pathname === link.href ||
              (pathname?.startsWith(link.href) && link.href !== `/${role}`);

            return (
              <Link key={link.name} href={link.href}>
                <div
                  className={`flex items-center space-x-3 px-4 py-2.5 rounded-xl transition-all duration-200 group cursor-pointer ${
                    isActive
                      ? "bg-indigo-50 text-indigo-700 shadow-sm shadow-indigo-100/50"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                >
                  <Icon
                    className={`w-5 h-5 shrink-0 transition-colors ${
                      isActive
                        ? "text-indigo-600"
                        : "text-gray-400 group-hover:text-indigo-500"
                    }`}
                  />
                  <span
                    className={`font-medium text-sm flex-1 ${
                      isActive ? "font-semibold" : ""
                    }`}
                  >
                    {link.name}
                  </span>
                  {isActive && (
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
                  )}
                </div>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Logout */}
      <div className="p-6 border-t border-gray-100 bg-gray-50/50">
        <button
          onClick={logout}
          className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors cursor-pointer group border border-transparent hover:border-red-100"
        >
          <LogOut className="w-5 h-5 text-gray-400 group-hover:text-red-500 transition-colors" />
          <span className="font-medium text-sm">Déconnexion</span>
        </button>
      </div>
    </aside>
  );
};
