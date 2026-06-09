"use client";

import { useEffect, useState } from "react";
import { Users, CheckSquare, Clock, ArrowUpRight, Activity, Loader2 } from "lucide-react";
import { fetchGraphQL } from "@/lib/graphqlClient";
import { useAuth } from "@/lib/authContext";

const GET_MANAGER_DASHBOARD = `
  query GetManagerDashboard($managerId: ID!) {
    employeeOnboardings {
      id status progress
      employeeFirstName employeeLastName positionTitle
    }
    pendingTasksForManager(managerId: $managerId) {
      id
    }
  }
`;

export default function ManagerDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    fetchGraphQL<any>(GET_MANAGER_DASHBOARD, { managerId: user.id })
      .then((res) => setData(res))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user?.id]);

  const onboardings = data?.employeeOnboardings || [];
  const activeOnboardings = onboardings.filter((o: any) => o.status === "IN_PROGRESS").length;
  const pendingTasks = data?.pendingTasksForManager?.length || 0;

  return (
    <div className="space-y-8 pb-8">
      <div>
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Tableau de Bord Manager</h1>
        <p className="text-gray-500 mt-2">Suivez l'intégration de votre équipe et validez les tâches en attente.</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-100 hover:shadow-[0_4px_20px_rgb(0,0,0,0.06)] transition-shadow relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Users className="w-16 h-16 text-indigo-600" />
          </div>
          <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 mb-4">
            <Users className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-semibold text-gray-500 mb-1">Membres en onboarding</h3>
          <div className="flex items-baseline space-x-2">
            <p className="text-3xl font-bold text-gray-900">{loading ? "..." : activeOnboardings}</p>
            <span className="text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">Actifs</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-100 hover:shadow-[0_4px_20px_rgb(0,0,0,0.06)] transition-shadow relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <CheckSquare className="w-16 h-16 text-blue-600" />
          </div>
          <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 mb-4">
            <CheckSquare className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-semibold text-gray-500 mb-1">Tâches métier à valider</h3>
          <div className="flex items-baseline space-x-2">
            <p className="text-3xl font-bold text-gray-900">{loading ? "..." : pendingTasks}</p>
            <span className="text-xs font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">À traiter</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-100 hover:shadow-[0_4px_20px_rgb(0,0,0,0.06)] transition-shadow relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Clock className="w-16 h-16 text-rose-600" />
          </div>
          <div className="w-12 h-12 bg-rose-50 rounded-xl flex items-center justify-center text-rose-600 mb-4">
            <Clock className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-semibold text-gray-500 mb-1">Évaluations en attente</h3>
          <div className="flex items-baseline space-x-2">
            <p className="text-3xl font-bold text-gray-900">0</p>
            <span className="text-xs font-medium text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full">Prioritaire</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-100 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
            <h2 className="text-lg font-bold text-gray-800 flex items-center">
              <Activity className="w-5 h-5 mr-2 text-indigo-500" />
              Avancement de mon équipe
            </h2>
            <a href="/manager/team" className="text-sm font-medium text-indigo-600 hover:text-indigo-700 flex items-center">
              Voir l'équipe <ArrowUpRight className="w-4 h-4 ml-1" />
            </a>
          </div>
          {loading ? (
            <div className="flex justify-center items-center py-20"><Loader2 className="w-8 h-8 text-indigo-400 animate-spin" /></div>
          ) : onboardings.length === 0 ? (
            <div className="p-8 text-center bg-white flex flex-col items-center justify-center min-h-[300px]">
              <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mb-4">
                <Users className="w-8 h-8 text-indigo-300" />
              </div>
              <h3 className="text-gray-900 font-medium mb-1">Aucune donnée disponible</h3>
              <p className="text-gray-500 text-sm max-w-sm">Le statut des membres de l'équipe s'affichera ici une fois l'intégration commencée.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {onboardings.slice(0, 5).map((ob: any) => (
                <div key={ob.id} className="px-6 py-4 flex items-center justify-between hover:bg-indigo-50/30 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-blue-400 flex items-center justify-center text-white font-bold text-sm shadow">
                      {ob.employeeFirstName?.[0]}{ob.employeeLastName?.[0]}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">{ob.employeeFirstName} {ob.employeeLastName}</p>
                      <p className="text-xs text-gray-500">{ob.positionTitle}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right mr-2">
                      <p className="text-xs font-bold text-indigo-600">{Math.round(ob.progress)}%</p>
                      <div className="w-20 bg-gray-200 rounded-full h-1.5 mt-1">
                        <div className="h-1.5 rounded-full bg-indigo-500" style={{ width: `${ob.progress}%` }} />
                      </div>
                    </div>
                    <a href={`/manager/team/dossier?id=${ob.id}`} className="px-3 py-1.5 text-xs font-semibold bg-white border border-gray-200 text-indigo-600 rounded-lg hover:bg-indigo-50 hover:border-indigo-200 transition-colors">
                      Dossier
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="bg-gradient-to-br from-blue-500 to-sky-500 rounded-2xl shadow-lg p-8 text-white relative overflow-hidden flex flex-col justify-between min-h-[300px]">
          <div className="absolute top-0 right-0 p-6 opacity-20">
            <CheckSquare className="w-32 h-32" />
          </div>
          <div className="relative z-10">
            <h3 className="text-xl font-bold mb-2">Priorité du Jour</h3>
            <p className="text-blue-50 text-sm line-clamp-3">
              Vous avez {pendingTasks} tâche(s) en attente de validation.
            </p>
          </div>
          <div className="relative z-10 mt-6">
            <a href="/manager/tasks" className="inline-block bg-white text-blue-600 font-semibold px-5 py-2.5 rounded-xl text-sm shadow-sm hover:bg-blue-50 transition-colors w-full sm:w-auto text-center">
              Voir les tâches
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
