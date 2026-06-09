"use client";

import { useEffect, useState } from "react";
import { Target, CheckSquare, FileText, ArrowRight, Sparkles, MapPin, Loader2, CheckCircle2 } from "lucide-react";
import { fetchGraphQL } from "@/lib/graphqlClient";
import { useAuth } from "@/lib/authContext";

// In a real app this comes from the auth context / JWT
// const EMPLOYEE_USER_ID = "00000000-0000-0000-0000-000000000003";

const GET_EMPLOYEE_DASHBOARD = `
  query GetEmployeeDashboard($userId: ID!) {
    employeeByUserId(userId: $userId) {
      id
      onboardingProgress
      onboardingStatus
      onboardingId
    }
  }
`;

const GET_TASKS_BY_ONBOARDING = `
  query TasksByOnboarding($onboardingId: ID!) {
    tasksByOnboarding(onboardingId: $onboardingId) {
      id status title description priority category dueDate
    }
  }
`;

const GET_PENDING_DOCS = `
  query DocsByOnboarding($onboardingId: ID!) {
    documentsByOnboarding(onboardingId: $onboardingId) {
      id status
    }
  }
`;

export default function EmployeeDashboard() { console.log("Rendering EmployeeDashboard");
  const { user } = useAuth();
  const [employee, setEmployee] = useState<any>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [docs, setDocs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [noProfile, setNoProfile] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!user?.id) return;
      setLoading(true);
      setNoProfile(false);
      try {
        const empRes = await fetchGraphQL<any>(GET_EMPLOYEE_DASHBOARD, { userId: user.id });
        const emp = empRes?.employeeByUserId;

        if (!emp) {
          // User has EMPLOYEE role but no Employee record yet (being configured by admin)
          setNoProfile(true);
          return;
        }

        setEmployee(emp);

        if (emp?.onboardingId) {
          const [tasksRes, docsRes] = await Promise.all([
            fetchGraphQL<any>(GET_TASKS_BY_ONBOARDING, { onboardingId: emp.onboardingId }),
            fetchGraphQL<any>(GET_PENDING_DOCS, { onboardingId: emp.onboardingId }),
          ]);
          setTasks(tasksRes?.tasksByOnboarding || []);
          setDocs(docsRes?.documentsByOnboarding || []);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user?.id]);

  const progress = employee?.onboardingProgress ?? 0;
  const pendingTasks = tasks.filter((t: any) => t.status === "TODO" || t.status === "IN_PROGRESS");
  const pendingDocs = docs.filter((d: any) => d.status === "PENDING").length;

  return (
    <div className="space-y-8 pb-8">
      <div>
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Mon Parcours d'Intégration</h1>
        <p className="text-gray-500 mt-2">Bienvenue ! Suivez vos prochaines étapes pour une intégration réussie.</p>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
        </div>
      ) : noProfile ? (
        <div className="flex flex-col items-center justify-center py-24 text-center bg-white rounded-2xl border border-dashed border-indigo-200 shadow-sm">
          <div className="w-20 h-20 bg-indigo-50 rounded-2xl flex items-center justify-center mb-6">
            <Sparkles className="w-10 h-10 text-indigo-400" />
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Votre profil est en cours de configuration</h2>
          <p className="text-gray-500 text-sm max-w-md">
            L'équipe RH est en train de préparer votre parcours d'intégration. Vous recevrez une notification dès que tout sera prêt.
          </p>
          <p className="mt-4 text-xs text-indigo-400 font-medium">Contactez votre responsable RH si ce message persiste.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Progress card */}
            <div className="bg-white p-6 rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-100 relative overflow-hidden">
              <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                  <Target className="w-6 h-6" />
                </div>
                <span className="text-3xl font-bold text-blue-600">{Math.round(progress)}%</span>
              </div>
              <h3 className="text-sm font-semibold text-gray-600 mb-3">Progression Globale</h3>
              <div className="w-full bg-blue-50 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-blue-500 to-indigo-600 h-2.5 rounded-full relative"
                  style={{ width: `${progress}%` }}
                >
                  <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                </div>
              </div>
            </div>

            {/* Pending tasks */}
            <div className="bg-white p-6 rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-100 hover:shadow-[0_4px_20px_rgb(0,0,0,0.06)] transition-shadow relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <CheckSquare className="w-16 h-16 text-indigo-600" />
              </div>
              <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 mb-4">
                <CheckSquare className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-semibold text-gray-500 mb-1">Tâches Restantes</h3>
              <p className="text-3xl font-bold text-gray-900">{pendingTasks.length}</p>
            </div>

            {/* Pending documents */}
            <div className="bg-white p-6 rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-100 hover:shadow-[0_4px_20px_rgb(0,0,0,0.06)] transition-shadow relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <FileText className="w-16 h-16 text-amber-600" />
              </div>
              <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600 mb-4">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-semibold text-gray-500 mb-1">Documents en Attente</h3>
              <div className="flex items-baseline space-x-2">
                <p className="text-3xl font-bold text-gray-900">{pendingDocs}</p>
                <span className="text-xs font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">À valider</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Upcoming tasks */}
            <div className="lg:col-span-2 bg-white rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-100 overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <div className="flex items-center">
                  <MapPin className="w-5 h-5 mr-2 text-indigo-500" />
                  <h2 className="text-lg font-bold text-gray-800">Prochaines Étapes</h2>
                </div>
                <a href="/employee/tasks" className="text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center">
                  Toutes les tâches <ArrowRight className="w-4 h-4 ml-1" />
                </a>
              </div>
              <div className="p-6 sm:p-8">
                {pendingTasks.length === 0 ? (
                  <div className="text-center py-10 flex flex-col items-center text-gray-500">
                    <CheckCircle2 className="w-10 h-10 text-emerald-400 mb-3" />
                    <p className="font-medium">Toutes vos tâches sont complètes !</p>
                  </div>
                ) : (
                  <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-indigo-500 before:via-indigo-100 before:to-transparent">
                    {pendingTasks.slice(0, 3).map((task: any, idx: number) => (
                      <div key={task.id} className={`relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group ${idx === 0 ? "is-active" : ""}`}>
                        <div className={`flex items-center justify-center w-10 h-10 rounded-full border-4 border-white ${idx === 0 ? "bg-indigo-600 text-white" : "bg-gray-200 text-gray-500"} font-bold text-sm shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10`}>
                          {idx + 1}
                        </div>
                        <div className={`w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border ${idx === 0 ? "bg-indigo-50/50 border-indigo-100" : "border-gray-100 bg-white"} shadow-sm ml-4 md:ml-0`}>
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <h4 className={`font-semibold ${idx === 0 ? "text-indigo-900" : "text-gray-900"} text-sm`}>{task.title}</h4>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${task.category === "METIER" ? "bg-purple-50 text-purple-700 border-purple-100" : task.category === "ADMINISTRATIF" ? "bg-cyan-50 text-cyan-700 border-cyan-100" : "bg-indigo-50 text-indigo-700 border-indigo-100"}`}>
                              {task.category === "METIER" ? "Métier" : task.category === "ADMINISTRATIF" ? "Admin" : "Onboarding"}
                            </span>
                          </div>
                          {task.description && <p className="text-sm text-gray-600 line-clamp-2">{task.description}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Contacts & Support */}
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <h3 className="font-bold text-gray-900 mb-4">Contacts Privilégiés</h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm shrink-0">M</div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">Votre Manager</p>
                      <p className="text-xs text-gray-500">Pour toute question métier ou validation d'essai</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                    <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-sm shrink-0">RH</div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">Support RH</p>
                      <p className="text-xs text-gray-500">Pour les documents et l'administratif</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tip card */}
              <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-lg p-6 text-white relative overflow-hidden flex flex-col justify-between">
                <div className="absolute top-0 right-0 p-4 opacity-20">
                  <Sparkles className="w-24 h-24" />
                </div>
                <div className="relative z-10">
                  <h3 className="text-lg font-bold mb-2">Conseil du Jour</h3>
                  <p className="text-indigo-50 text-sm leading-relaxed">
                    {pendingDocs > 0
                      ? `Vous avez ${pendingDocs} document(s) en attente. Vérifiez "Mes Documents".`
                      : "Prenez le temps de lire le manuel de l'employé."
                    }
                  </p>
                </div>
                <div className="relative z-10 mt-4">
                  <a href="/employee/documents" className="inline-flex bg-white text-indigo-600 font-semibold px-4 py-2 rounded-xl text-xs shadow-sm hover:bg-indigo-50 transition-colors w-full justify-center">
                    Mes documents <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
