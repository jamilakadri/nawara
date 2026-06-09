"use client";

import { useEffect, useRef, useState } from "react";
import {
  BarChart3, TrendingUp, Users, Download, PieChart,
  AlertTriangle, FileSpreadsheet, Loader2, CheckCircle, Sparkles, Bot,
} from "lucide-react";
import { fetchGraphQL } from "@/lib/graphqlClient";

/* ─── GraphQL ─────────────────────────────────────────── */
const GET_STATS = `
  query {
    dashboardStats { total inProgress completed pendingDocs }
    employeeOnboardings {
      id employeeFirstName employeeLastName positionTitle
      departmentName status progress startDate
    }
  }
`;

interface Stats { total: number; inProgress: number; completed: number; pendingDocs: number; }
interface Onboarding {
  id: string; employeeFirstName: string; employeeLastName: string;
  positionTitle: string; departmentName: string; status: string;
  progress: number; startDate: string;
}

interface AiInsight {
  type: string;
  title: string;
  message: string;
  priority: string;
}

const AI_INSIGHTS = `query { aiInsights { type title message priority } }`;

/* ─── Status helpers ───────────────────────────────────── */
const statusLabel: Record<string, string> = {
  IN_PROGRESS: "En cours", COMPLETED: "Terminé",
  NOT_STARTED: "Non démarré", DELAYED: "Retard",
};
const MONTHS = ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Août", "Sep", "Oct", "Nov", "Déc"];

/* ─── Export helpers ───────────────────────────────────── */
function exportCSV(onboardings: Onboarding[], stats: Stats | null) {
  const rows: string[][] = [
    ["Rapport Analytics RH", "", "", "", "", ""],
    ["Généré le", new Date().toLocaleDateString("fr-FR"), "", "", "", ""],
    ["", "", "", "", "", ""],
    ["STATISTIQUES GLOBALES", "", "", "", "", ""],
    ["Total intégrations", String(stats?.total ?? 0), "", "", "", ""],
    ["En cours", String(stats?.inProgress ?? 0), "", "", "", ""],
    ["Terminées", String(stats?.completed ?? 0), "", "", "", ""],
    ["Documents en attente", String(stats?.pendingDocs ?? 0), "", "", "", ""],
    ["Taux de complétion", stats?.total ? `${Math.round((stats.completed / stats.total) * 100)}%` : "0%", "", "", "", ""],
    ["", "", "", "", "", ""],
    ["DÉTAIL DES INTÉGRATIONS", "", "", "", "", ""],
    ["Prénom", "Nom", "Poste", "Département", "Statut", "Progression (%)"],
    ...onboardings.map((o) => [
      o.employeeFirstName, o.employeeLastName, o.positionTitle,
      o.departmentName, statusLabel[o.status] ?? o.status,
      String(Math.round(o.progress)),
    ]),
  ];

  const csvContent = rows.map((r) =>
    r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
  ).join("\n");

  const bom = "\uFEFF"; // UTF-8 BOM for Excel
  const blob = new Blob([bom + csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `rapport_rh_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function exportPDF(printRef: React.RefObject<HTMLDivElement | null>) {
  const style = document.createElement("style");
  style.id = "print-override";
  style.innerHTML = `
    @media print {
      body > *:not(#print-root) { display: none !important; }
      #print-root { display: block !important; }
      .no-print { display: none !important; }
      @page { margin: 15mm; size: A4; }
    }
  `;
  document.head.appendChild(style);

  const wrapper = document.createElement("div");
  wrapper.id = "print-root";
  wrapper.style.cssText = "position:fixed;top:0;left:0;width:100%;z-index:99999;background:white;padding:20px;";
  wrapper.innerHTML = printRef.current?.innerHTML ?? "";
  document.body.appendChild(wrapper);

  window.print();

  document.head.removeChild(style);
  document.body.removeChild(wrapper);
}

/* ─── Stat Card ────────────────────────────────────────── */
function StatCard({
  label, value, icon: Icon, color, sub,
}: { label: string; value: string | number; icon: React.ElementType; color: string; sub?: string }) {
  const colorMap: Record<string, { bg: string; icon: string; ring: string }> = {
    blue:   { bg: "bg-blue-50",   icon: "text-blue-600",   ring: "ring-blue-100" },
    green:  { bg: "bg-green-50",  icon: "text-green-600",  ring: "ring-green-100" },
    orange: { bg: "bg-orange-50", icon: "text-orange-600", ring: "ring-orange-100" },
    purple: { bg: "bg-purple-50", icon: "text-purple-600", ring: "ring-purple-100" },
  };
  const c = colorMap[color] ?? colorMap.blue;
  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 rounded-xl ${c.bg} ring-1 ${c.ring}`}>
          <Icon className={`w-5 h-5 ${c.icon}`} />
        </div>
      </div>
      <p className="text-2xl font-black text-gray-900">{value}</p>
      <p className="text-sm font-medium text-gray-500 mt-0.5">{label}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

/* ─── Bar chart bar heights for mock monthly trend ─────── */
const MONTHLY_DATA = [58, 65, 72, 79, 85, 71, 68, 74, 80, 76, 83, 90];

/* ─── Page ─────────────────────────────────────────────── */
export default function AdminAnalyticsPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [onboardings, setOnboardings] = useState<Onboarding[]>([]);
  const [loading, setLoading] = useState(true);
  const [exportingPDF, setExportingPDF] = useState(false);
  const [exportingXLS, setExportingXLS] = useState(false);
  const [yearFilter, setYearFilter] = useState("2026");
  const printRef = useRef<HTMLDivElement>(null);
  const [insights, setInsights] = useState<AiInsight[]>([]);
  const [insightsLoading, setInsightsLoading] = useState(true);

  useEffect(() => {
    fetchGraphQL<{ dashboardStats: Stats; employeeOnboardings: Onboarding[] }>(GET_STATS)
      .then((d) => { setStats(d.dashboardStats); setOnboardings(d.employeeOnboardings); })
      .catch(console.error)
      .finally(() => setLoading(false));

    // Fetch AI insights
    fetchGraphQL<{ aiInsights: AiInsight[] }>(AI_INSIGHTS)
      .then((d) => setInsights(d.aiInsights || []))
      .catch(console.error)
      .finally(() => setInsightsLoading(false));
  }, []);

  const completionRate = stats?.total ? Math.round((stats.completed / stats.total) * 100) : 0;

  /* Department grouping */
  const deptGroups = onboardings.reduce((acc, o) => {
    const key = o.departmentName || "Non défini";
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const deptEntries = Object.entries(deptGroups).sort((a, b) => b[1] - a[1]);
  const deptTotal = deptEntries.reduce((s, [, v]) => s + v, 0);

  const DEPT_COLORS = ["bg-indigo-500", "bg-purple-500", "bg-blue-500", "bg-emerald-500", "bg-orange-400"];

  const handleExportPDF = () => {
    setExportingPDF(true);
    setTimeout(() => {
      exportPDF(printRef);
      setExportingPDF(false);
    }, 300);
  };

  const handleExportExcel = () => {
    setExportingXLS(true);
    setTimeout(() => {
      exportCSV(onboardings, stats);
      setExportingXLS(false);
    }, 200);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Analytics & Rapports</h1>
          <p className="text-gray-500 mt-1">Analyse des performances du processus d'intégration.</p>
        </div>
        <div className="flex gap-3 no-print">
          <button
            onClick={handleExportPDF}
            disabled={exportingPDF || loading}
            className="bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 px-4 py-2.5 rounded-xl font-semibold transition-colors flex items-center gap-2 text-sm shadow-sm disabled:opacity-60"
          >
            {exportingPDF
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : <Download className="w-4 h-4 text-red-500" />}
            Exporter PDF
          </button>
          <button
            onClick={handleExportExcel}
            disabled={exportingXLS || loading}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl font-semibold transition-colors flex items-center gap-2 text-sm shadow-md shadow-emerald-200 disabled:opacity-60"
          >
            {exportingXLS
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : <FileSpreadsheet className="w-4 h-4" />}
            Exporter Excel
          </button>
        </div>
      </div>

      {/* Printable content */}
      <div ref={printRef}>
        {/* Print header (hidden on screen) */}
        <div className="hidden print:block mb-6">
          <h1 className="text-2xl font-bold">Rapport Analytics RH</h1>
          <p className="text-sm text-gray-500">Généré le {new Date().toLocaleDateString("fr-FR")}</p>
        </div>

        {/* KPI Cards */}
        {loading ? (
          <div className="flex justify-center items-center py-24">
            <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <StatCard label="Intégrations en cours" value={stats?.inProgress ?? 0} icon={Users} color="blue" sub="Actifs" />
              <StatCard label="Taux de complétion" value={`${completionRate}%`} icon={TrendingUp} color="green" sub={`${stats?.completed ?? 0} / ${stats?.total ?? 0}`} />
              <StatCard label="Documents en attente" value={stats?.pendingDocs ?? 0} icon={AlertTriangle} color="orange" sub="À valider" />
              <StatCard label="Total intégrations" value={stats?.total ?? 0} icon={CheckCircle} color="purple" sub="Toutes périodes" />
            </div>

            {/* Charts row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Bar chart */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="text-base font-bold text-gray-800">Taux de complétion par mois</h3>
                    <p className="text-xs text-gray-400 mt-0.5">Évolution annuelle en %</p>
                  </div>
                  <select
                    className="border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-gray-50 no-print"
                    value={yearFilter}
                    onChange={(e) => setYearFilter(e.target.value)}
                  >
                    <option>2026</option>
                    <option>2025</option>
                  </select>
                </div>
                <div className="h-52 flex items-end gap-1.5">
                  {MONTHLY_DATA.map((h, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
                      <span className="text-xs text-indigo-600 font-semibold opacity-0 group-hover:opacity-100 transition-opacity">{h}%</span>
                      <div className="w-full bg-indigo-50 rounded-t-lg relative overflow-hidden" style={{ height: "180px" }}>
                        <div
                          className="absolute bottom-0 w-full bg-gradient-to-t from-indigo-600 to-indigo-400 rounded-t-lg transition-all duration-500 group-hover:from-indigo-700 group-hover:to-indigo-500"
                          style={{ height: `${h}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-gray-400 font-medium">{MONTHS[i]}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Dept distribution */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex items-center gap-2 mb-6">
                  <PieChart className="w-5 h-5 text-gray-400" />
                  <div>
                    <h3 className="text-base font-bold text-gray-800">Répartition par département</h3>
                    <p className="text-xs text-gray-400 mt-0.5">Basé sur les données en cours</p>
                  </div>
                </div>
                {deptEntries.length === 0 ? (
                  <div className="flex items-center justify-center h-40 text-gray-300 text-sm">Aucune donnée</div>
                ) : (
                  <div className="space-y-4">
                    {deptEntries.slice(0, 5).map(([dept, count], i) => {
                      const pct = deptTotal > 0 ? Math.round((count / deptTotal) * 100) : 0;
                      return (
                        <div key={dept}>
                          <div className="flex justify-between text-sm mb-1.5">
                            <span className="text-gray-700 font-semibold">{dept}</span>
                            <span className="text-gray-500 font-medium">{pct}% <span className="text-gray-300">({count})</span></span>
                          </div>
                          <div className="w-full bg-gray-100 rounded-full h-2.5">
                            <div
                              className={`h-2.5 rounded-full ${DEPT_COLORS[i % DEPT_COLORS.length]} transition-all duration-700`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Onboardings table */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                <h3 className="font-bold text-gray-800 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-indigo-500" />
                  Détail des intégrations
                  <span className="bg-indigo-100 text-indigo-700 text-xs font-semibold px-2 py-0.5 rounded-full">{onboardings.length}</span>
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50/30">
                      <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Employé</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Poste</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Département</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Statut</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Progression</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {onboardings.length === 0 ? (
                      <tr><td colSpan={5} className="text-center py-10 text-gray-400">Aucune donnée</td></tr>
                    ) : onboardings.map((ob) => {
                      const statusColors: Record<string, string> = {
                        IN_PROGRESS: "bg-blue-100 text-blue-800",
                        COMPLETED: "bg-green-100 text-green-800",
                        NOT_STARTED: "bg-gray-100 text-gray-600",
                        DELAYED: "bg-rose-100 text-rose-700",
                      };
                      return (
                        <tr key={ob.id} className="hover:bg-indigo-50/20 transition-colors">
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-blue-400 flex items-center justify-center text-white text-xs font-bold shrink-0">
                                {ob.employeeFirstName?.[0]}{ob.employeeLastName?.[0]}
                              </div>
                              <span className="font-semibold text-gray-900">{ob.employeeFirstName} {ob.employeeLastName}</span>
                            </div>
                          </td>
                          <td className="px-5 py-3.5 text-gray-600">{ob.positionTitle || "—"}</td>
                          <td className="px-5 py-3.5 text-gray-600">{ob.departmentName || "—"}</td>
                          <td className="px-5 py-3.5">
                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusColors[ob.status] ?? "bg-gray-100 text-gray-600"}`}>
                              {statusLabel[ob.status] ?? ob.status}
                            </span>
                          </td>
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-2">
                              <div className="w-24 bg-gray-100 rounded-full h-2">
                                <div
                                  className="h-2 rounded-full bg-indigo-500 transition-all"
                                  style={{ width: `${ob.progress}%` }}
                                />
                              </div>
                              <span className="text-xs font-bold text-indigo-600">{Math.round(ob.progress)}%</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* AI Insights Section */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-violet-50 to-purple-50">
                <h3 className="font-bold text-gray-800 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                  Recommandations IA
                  <span className="bg-violet-100 text-violet-700 text-xs font-semibold px-2 py-0.5 rounded-full">Smart</span>
                </h3>
                <div className="flex items-center gap-1.5 text-xs text-gray-400">
                  <Bot className="w-3.5 h-3.5" />
                  Analyse automatique
                </div>
              </div>
              <div className="p-6">
                {insightsLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-6 h-6 text-violet-400 animate-spin" />
                  </div>
                ) : insights.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <Sparkles className="w-8 h-8 mx-auto mb-2 text-gray-200" />
                    <p className="text-sm">Aucune recommandation pour le moment</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {insights.map((insight, i) => {
                      const typeConfig: Record<string, { bg: string; border: string; icon: React.ReactNode; badge: string }> = {
                        WARNING: {
                          bg: "bg-amber-50",
                          border: "border-amber-200",
                          icon: <AlertTriangle className="w-5 h-5 text-amber-500" />,
                          badge: "bg-amber-100 text-amber-700",
                        },
                        SUCCESS: {
                          bg: "bg-emerald-50",
                          border: "border-emerald-200",
                          icon: <CheckCircle className="w-5 h-5 text-emerald-500" />,
                          badge: "bg-emerald-100 text-emerald-700",
                        },
                        INFO: {
                          bg: "bg-blue-50",
                          border: "border-blue-200",
                          icon: <TrendingUp className="w-5 h-5 text-blue-500" />,
                          badge: "bg-blue-100 text-blue-700",
                        },
                      };
                      const priorityConfig: Record<string, { label: string; class: string }> = {
                        HIGH: { label: "Haute", class: "bg-red-100 text-red-700" },
                        MEDIUM: { label: "Moyenne", class: "bg-yellow-100 text-yellow-700" },
                        LOW: { label: "Basse", class: "bg-gray-100 text-gray-600" },
                      };
                      const tc = typeConfig[insight.type] || typeConfig.INFO;
                      const pc = priorityConfig[insight.priority] || priorityConfig.LOW;

                      return (
                        <div
                          key={i}
                          className={`${tc.bg} border ${tc.border} rounded-xl p-4 transition-all hover:shadow-sm`}
                          style={{ animation: `fadeInUp 0.4s ease-out ${i * 0.1}s both` }}
                        >
                          <div className="flex items-start gap-3">
                            <div className="mt-0.5 shrink-0">{tc.icon}</div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="text-sm font-bold text-gray-900">{insight.title}</h4>
                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${pc.class}`}>
                                  {pc.label}
                                </span>
                              </div>
                              <p className="text-sm text-gray-600 leading-relaxed">{insight.message}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <style>{`
              @keyframes fadeInUp {
                from { opacity: 0; transform: translateY(8px); }
                to   { opacity: 1; transform: translateY(0); }
              }
            `}</style>
          </>
        )}
      </div>
    </div>
  );
}
