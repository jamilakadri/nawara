"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Target, CheckSquare, FileText, Star, Calendar, Clock, CheckCircle2, AlertTriangle, Briefcase, FileBadge } from "lucide-react";
import { fetchGraphQL } from "@/lib/graphqlClient";

const GET_ONBOARDING_DETAILS = `
  query GetOnboardingDetails($id: ID!) {
    employeeOnboarding(id: $id) {
      id status progress startDate endDate trialEndDate trialValidated trialValidatedAt trialComment
      employeeFirstName employeeLastName positionTitle departmentName employeeId
    }
    tasksByOnboarding(onboardingId: $id) {
      id title status priority category dueDate assigneeFirstName assigneeLastName
    }
    documentsByOnboarding(onboardingId: $id) {
      id name type status uploadedAt aiScore
    }
  }
`;

const GET_EVALUATIONS = `
  query GetEvaluations($employeeId: ID!) {
    evaluationsByEmployee(employeeId: $employeeId) {
      id score comments isAutoEvaluation createdAt
      evaluatorFirstName evaluatorLastName
    }
  }
`;

function DossierContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const router = useRouter();

  const [data, setData] = useState<any>(null);
  const [evaluations, setEvaluations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      setLoading(true);
      try {
        const details = await fetchGraphQL<any>(GET_ONBOARDING_DETAILS, { id });
        setData(details);
        if (details.employeeOnboarding?.employeeId) {
          const evals = await fetchGraphQL<any>(GET_EVALUATIONS, { employeeId: details.employeeOnboarding.employeeId });
          setEvaluations(evals.evaluationsByEmployee || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  if (!id) {
    return <div className="text-center py-20 text-gray-500">ID du dossier manquant.</div>;
  }

  if (loading) {
    return <div className="flex justify-center items-center py-32"><Loader2 className="w-10 h-10 text-indigo-500 animate-spin" /></div>;
  }

  if (!data || !data.employeeOnboarding) {
    return <div className="text-center py-20 text-gray-500">Dossier introuvable.</div>;
  }

  const ob = data.employeeOnboarding;
  const tasks = data.tasksByOnboarding || [];
  const docs = data.documentsByOnboarding || [];

  const taskCounts = {
    total: tasks.length,
    done: tasks.filter((t: any) => t.status === "DONE" || t.status === "VALIDATED").length
  };

  const docCounts = {
    total: docs.length,
    validated: docs.filter((d: any) => d.status === "VALIDATED").length
  };

  return (
    <div className="space-y-6 pb-8">
      <button onClick={() => router.back()} className="flex items-center text-sm font-medium text-gray-500 hover:text-indigo-600 transition-colors mb-2">
        <ArrowLeft className="w-4 h-4 mr-1.5" /> Retour
      </button>

      {/* Header Profile */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden relative">
        <div className="h-32 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600"></div>
        <div className="px-8 pb-8">
          <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6 -mt-12">
            <div className="w-24 h-24 rounded-full bg-white p-1.5 shadow-lg relative z-10">
              <div className="w-full h-full rounded-full bg-gradient-to-br from-indigo-100 to-blue-50 flex items-center justify-center text-indigo-700 text-3xl font-bold">
                {ob.employeeFirstName?.[0]}{ob.employeeLastName?.[0]}
              </div>
            </div>
            <div className="flex-1 text-center sm:text-left pt-14 sm:pt-0">
              <h1 className="text-3xl font-extrabold text-gray-900">{ob.employeeFirstName} {ob.employeeLastName}</h1>
              <p className="text-gray-500 font-medium text-lg">{ob.positionTitle} {ob.departmentName ? `• ${ob.departmentName}` : ""}</p>
            </div>
            <div className="flex gap-3">
              <div className="bg-indigo-50 text-indigo-700 px-4 py-2 rounded-xl text-center">
                <p className="text-xs font-semibold uppercase tracking-wider mb-0.5">Progression</p>
                <p className="text-xl font-bold">{Math.round(ob.progress)}%</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Trial Period info */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center"><Calendar className="w-5 h-5 mr-2 text-indigo-500" /> Informations & Essai</h3>
            <div className="space-y-4 text-sm">
              <div className="flex justify-between items-center py-2 border-b border-gray-50">
                <span className="text-gray-500">Date d'arrivée</span>
                <span className="font-semibold text-gray-900">{new Date(ob.startDate).toLocaleDateString("fr-FR")}</span>
              </div>
              {ob.trialEndDate && (
                <div className="flex justify-between items-center py-2 border-b border-gray-50">
                  <span className="text-gray-500">Fin d'essai</span>
                  <span className="font-semibold text-gray-900">{new Date(ob.trialEndDate).toLocaleDateString("fr-FR")}</span>
                </div>
              )}
              <div className="pt-2">
                <span className="text-gray-500 block mb-2">Décision</span>
                {ob.trialValidated === true ? (
                  <span className="inline-flex items-center text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg font-medium"><CheckCircle2 className="w-4 h-4 mr-1.5" /> Validée</span>
                ) : ob.trialValidated === false ? (
                  <span className="inline-flex items-center text-rose-700 bg-rose-50 px-2.5 py-1 rounded-lg font-medium"><AlertTriangle className="w-4 h-4 mr-1.5" /> Rompue</span>
                ) : (
                  <span className="inline-flex items-center text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg font-medium"><Clock className="w-4 h-4 mr-1.5" /> En cours</span>
                )}
              </div>
              {ob.trialComment && (
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 text-gray-600 italic mt-2">
                  "{ob.trialComment}"
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column (Tasks, Docs, Evals) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Tasks Summary */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-gray-900 flex items-center"><CheckSquare className="w-5 h-5 mr-2 text-blue-500" /> Tâches d'intégration</h3>
              <span className="text-sm font-medium text-gray-500 bg-gray-50 px-2.5 py-1 rounded-lg border border-gray-100">{taskCounts.done} / {taskCounts.total} terminées</span>
            </div>
            {tasks.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-4 bg-gray-50 rounded-xl">Aucune tâche assignée.</p>
            ) : (
              <div className="space-y-2">
                {tasks.slice(0, 5).map((t: any) => (
                   <div key={t.id} className="flex items-center justify-between p-3 rounded-xl border border-gray-50 hover:bg-gray-50 transition-colors">
                     <div className="flex items-center gap-3">
                       <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${t.status === 'DONE' || t.status === 'VALIDATED' ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100 text-gray-400'}`}>
                         <CheckSquare className="w-4 h-4" />
                       </div>
                       <div>
                         <p className={`text-sm font-medium ${t.status === 'DONE' || t.status === 'VALIDATED' ? 'text-gray-500 line-through' : 'text-gray-900'}`}>{t.title}</p>
                         <p className="text-xs text-gray-400">{t.category} • Échéance : {new Date(t.dueDate).toLocaleDateString("fr-FR")}</p>
                       </div>
                     </div>
                     <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${t.status === 'DONE' || t.status === 'VALIDATED' ? 'bg-emerald-50 text-emerald-700' : t.status === 'OVERDUE' ? 'bg-rose-50 text-rose-700' : 'bg-blue-50 text-blue-700'}`}>
                       {t.status === 'VALIDATED' ? 'Validée' : t.status === 'DONE' ? 'Terminée' : t.status === 'TODO' ? 'À faire' : t.status}
                     </span>
                   </div>
                ))}
                {tasks.length > 5 && (
                  <div className="text-center pt-2">
                     <a href="/manager/tasks" className="text-xs text-indigo-600 font-medium hover:underline">Voir les {tasks.length - 5} autres tâches</a>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Docs Summary */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
               <h3 className="font-bold text-gray-900 mb-4 flex items-center"><FileText className="w-5 h-5 mr-2 text-amber-500" /> Documents</h3>
               <div className="flex items-end gap-3 mb-4">
                 <span className="text-3xl font-extrabold text-gray-900">{docCounts.validated}</span>
                 <span className="text-sm font-medium text-gray-500 pb-1">/ {docCounts.total} validés</span>
               </div>
               {docs.length > 0 && (
                 <div className="space-y-2">
                   {docs.slice(0, 3).map((d: any) => (
                     <div key={d.id} className="flex justify-between items-center text-sm py-1.5 border-b border-gray-50 last:border-0">
                       <span className="text-gray-700 truncate mr-2">{d.name}</span>
                       <span className={`shrink-0 w-2 h-2 rounded-full ${d.status === 'VALIDATED' ? 'bg-emerald-500' : d.status === 'PENDING' ? 'bg-amber-500' : 'bg-rose-500'}`} title={d.status}></span>
                     </div>
                   ))}
                 </div>
               )}
            </div>

            {/* Evals Summary */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
               <h3 className="font-bold text-gray-900 mb-4 flex items-center"><Star className="w-5 h-5 mr-2 text-purple-500" /> Évaluations</h3>
               {evaluations.length === 0 ? (
                 <div className="text-center py-6 text-gray-400 bg-gray-50 rounded-xl text-sm">Aucune évaluation</div>
               ) : (
                 <div className="space-y-3">
                   {evaluations.slice(0, 3).map((e: any) => (
                     <div key={e.id} className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                       <div className="flex justify-between items-center mb-1">
                         <span className="text-xs font-medium text-gray-500">{new Date(e.createdAt).toLocaleDateString("fr-FR")}</span>
                         <span className="text-sm font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md">{e.score} / 10</span>
                       </div>
                       {e.comments && <p className="text-xs text-gray-600 italic line-clamp-1">"{e.comments}"</p>}
                     </div>
                   ))}
                 </div>
               )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

export default function DossierCompletPage() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center py-32"><Loader2 className="w-10 h-10 text-indigo-500 animate-spin" /></div>}>
      <DossierContent />
    </Suspense>
  );
}
