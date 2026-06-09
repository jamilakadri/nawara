"use client";

import React from "react";
import { Sidebar } from "./Sidebar";
import { Search, ChevronRight } from "lucide-react";
import { useAuth } from "@/lib/authContext";
import { NotificationPanel } from "@/components/ui/NotificationPanel";
import { AiChatbot } from "@/components/ui/AiChatbot";
import { usePathname } from "next/navigation";

interface DashboardLayoutProps {
  children: React.ReactNode;
  role: "admin" | "manager" | "employee";
}

const ROLE_LABEL: Record<string, string> = {
  admin: "Administrateur RH",
  manager: "Manager",
  employee: "Collaborateur",
};

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children, role }) => {
  const { user } = useAuth();
  const pathname = usePathname();

  const displayName = user
    ? `${user.firstName} ${user.lastName}`
    : ROLE_LABEL[role];

  const initials = user
    ? `${user.firstName?.[0] ?? ""}${user.lastName?.[0] ?? ""}`.toUpperCase()
    : role[0].toUpperCase();

  return (
    <div className="flex h-screen bg-[#f8fafc] text-gray-900 font-sans overflow-hidden selection:bg-indigo-100 selection:text-indigo-900">
      <Sidebar role={role} />
      <div className="flex-1 flex flex-col relative overflow-hidden">
        {/* Decorative background blur */}
        <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-br from-indigo-100/40 via-white/0 to-blue-50/40 pointer-events-none" />

        <header className="h-20 bg-white/60 backdrop-blur-xl border-b border-gray-200/50 flex items-center justify-between px-8 shadow-[0_2px_10px_rgb(0,0,0,0.02)] z-10">
          <div className="flex items-center text-sm font-medium text-gray-500">
            Bienvenue,{" "}
            <span className="ml-1 text-indigo-600 font-semibold">
              {displayName}
            </span>
            {pathname !== `/${role}` && (
              <>
                <ChevronRight className="w-4 h-4 mx-2 text-gray-300" />
                <span className="text-gray-900 capitalize font-semibold">
                  {pathname.split("/").pop()?.replace(/-/g, " ") || ""}
                </span>
              </>
            )}
          </div>

          <div className="flex items-center space-x-4">
            {/* Search */}
            <div className="hidden md:flex items-center bg-white border border-gray-200/80 rounded-full px-4 py-2 shadow-sm focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500 transition-all">
              <Search className="w-4 h-4 text-gray-400 mr-2" />
              <input
                type="text"
                placeholder="Rechercher..."
                className="bg-transparent text-sm focus:outline-none w-48"
              />
            </div>

            {/* Notification Bell with Panel */}
            <NotificationPanel />

            {/* Avatar */}
            <div className="flex items-center space-x-3 pl-4 border-l border-gray-200">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold shadow-md shadow-indigo-200 text-sm">
                {initials}
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-semibold text-gray-700 leading-tight">
                  {displayName}
                </p>
                <p className="text-xs text-gray-500">{ROLE_LABEL[role]}</p>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 p-8 overflow-y-auto relative z-0 scroll-smooth">
          <div className="max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
            {children}
          </div>
        </main>

        {/* AI Chatbot — floating widget */}
        <AiChatbot />
      </div>
    </div>
  );
};
