"use client";

import { useEffect, useState } from "react";
import { Users, FileText, AlertCircle, TrendingUp, Activity, ArrowUpRight, Loader2, CheckCircle } from "lucide-react";
import { fetchGraphQL } from "@/lib/graphqlClient";

const GET_DASHBOARD = `
  query {
    dashboardStats {
      total
      inProgress
      completed
      pendingDocs
    }
    employeeOnboardings {
      id
      employeeFirstName
      employeeLastName
      positionTitle
      departmentName
      status
      progress
      startDate
    }
  }
`;

interface Stats { total: number; inProgress: number; completed: number; pendingDocs: number; }
interface Onboarding {
  id: string; employeeFirstName: string; employeeLastName: string;
  positionTitle: string; departmentName: string; status: string;
  progress: number; startDate: string;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [onboardings, setOnboardings] = useState<Onboarding[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGraphQL<{ dashboardStats: Stats; employeeOnboardings: Onboarding[] }>(GET_DASHBOARD)
      .then((data) => {
        setStats(data.dashboardStats);
        setOnboardings(data.employeeOnboardings.slice(0, 5));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const statusColor: Record<string, string> = {
    IN_PROGRESS: "bg-blue-100 text-blue-800",
    COMPLETED: "bg-green-100 text-green-800",
    NOT_STARTED: "bg-gray-100 text-gray-700",
    DELAYED: "bg-rose-100 text-rose-800",
  };
  const statusLabel: Record<string, string> = {
    IN_PROGRESS: "En cours", COMPLETED: "Terminé", NOT_STARTED: "Non démarré", DELAYED: "Retard",
  };

  return (
    <div className="space-y-8 pb-8">
      <div>
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Tableau de Bord RH</h1>
        <p className="text-gray-500 mt-2">Aperçu en temps réel des intégrations et statistiques globales.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: "Employés en cours", value: loading ? "…" : stats?.inProgress ?? 0, icon: Users, color: "indigo", badge: "+actifs" },
          { label: "Documents à valider", value: loading ? "…" : stats?.pendingDocs ?? 0, icon: FileText, color: "blue", badge: "À revoir" },
          { label: "Intégrations totales", value: loading ? "…" : stats?.total ?? 0, icon: TrendingUp, color: "emerald", badge: "Total" },
          { label: "Terminées", value: loading ? "…" : stats?.completed ?? 0, icon: CheckCircle, color: "green", badge: "Succès" },
        ].map((card) => (
          <div key={card.label} className="bg-white p-6 rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-100 hover:shadow-[0_4px_20px_rgb(0,0,0,0.06)] transition-shadow relative overflow-hidden group">
            <div className={`w-12 h-12 bg-${card.color}-50 rounded-xl flex items-center justify-center text-${card.color}-600 mb-4`}>
              <card.icon className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-semibold text-gray-500 mb-1">{card.label}</h3>
            <div className="flex items-baseline space-x-2">
              <p className="text-3xl font-bold text-gray-900">{card.value}</p>
              <span className={`text-xs font-medium text-${card.color}-600 bg-${card.color}-50 px-2 py-0.5 rounded-full`}>{card.badge}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-100 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
            <h2 className="text-lg font-bold text-gray-800 flex items-center">
              <Users className="w-5 h-5 mr-2 text-indigo-500" /> Intégrations Récentes
            </h2>
          </div>
          {loading ? (
            <div className="flex justify-center items-center py-20"><Loader2 className="w-8 h-8 text-indigo-400 animate-spin" /></div>
          ) : onboardings.length === 0 ? (
            <div className="p-8 text-center text-gray-400">Aucune intégration pour l'instant.</div>
          ) : (
            <div className="divide-y divide-gray-50">
              {onboardings.map((ob) => (
                <div key={ob.id} className="px-6 py-4 flex items-center justify-between hover:bg-indigo-50/30 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-blue-400 flex items-center justify-center text-white font-bold text-sm shadow">
                      {ob.employeeFirstName?.[0]}{ob.employeeLastName?.[0]}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">{ob.employeeFirstName} {ob.employeeLastName}</p>
                      <p className="text-xs text-gray-500">{ob.positionTitle} · {ob.departmentName}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-xs font-bold text-indigo-600">{Math.round(ob.progress)}%</p>
                      <div className="w-20 bg-gray-200 rounded-full h-1.5 mt-1">
                        <div className="h-1.5 rounded-full bg-indigo-500" style={{ width: `${ob.progress}%` }} />
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1.5">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${statusColor[ob.status] || "bg-gray-100 text-gray-700"}`}>
                        {statusLabel[ob.status] || ob.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-gradient-to-br from-indigo-500 to-blue-600 rounded-2xl shadow-lg p-8 text-white relative overflow-hidden flex flex-col justify-between min-h-[300px]">
          <div className="absolute top-0 right-0 p-6 opacity-20"><Activity className="w-32 h-32" /></div>
          <div className="relative z-10">
            <h3 className="text-xl font-bold mb-2">Performances RH</h3>
            <p className="text-indigo-100 text-sm line-clamp-3">
              {stats ? `${stats.completed} parcours complétés sur ${stats.total} au total. Taux : ${stats.total ? Math.round((stats.completed / stats.total) * 100) : 0}%.` : "Chargement…"}
            </p>
          </div>
          <div className="relative z-10 mt-6">
            <a href="/admin/analytics" className="bg-white text-indigo-600 font-semibold px-5 py-2.5 rounded-xl text-sm shadow-sm hover:bg-indigo-50 transition-colors inline-block">
              Voir les analytics
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
