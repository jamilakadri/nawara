"use client";

import React, { useEffect, useState } from 'react';
import {
  CheckCircle2, Clock, Calendar, UserCheck, AlertTriangle, Loader2, RefreshCw,
  SlidersHorizontal, Tag, Briefcase, FileText
} from 'lucide-react';
import { fetchGraphQL } from '@/lib/graphqlClient';
import { useAuth } from "@/lib/authContext";

interface Task {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  category: string;
  dueDate: string;
}

const GET_EMPLOYEE_ONBOARDING = `
  query GetEmployeeByUserId($userId: ID!) {
    employeeByUserId(userId: $userId) {
      onboardingId
    }
  }
`;

const GET_TASKS_BY_ONBOARDING = `
  query TasksByOnboarding($onboardingId: ID!) {
    tasksByOnboarding(onboardingId: $onboardingId) {
      id title description status priority category dueDate
    }
  }
`;

const MARK_DONE = `
  mutation MarkTaskDone($id: ID!) {
    markTaskDone(id: $id) { id status }
  }
`;

const STATUS_LABEL: Record<string, string> = {
  TODO: "À faire", IN_PROGRESS: "En cours", DONE: "Soumise",
  VALIDATED: "Validée", OVERDUE: "En retard",
};

const CAT_CLS: Record<string, string> = {
  METIER: "bg-violet-100 text-violet-700 border-violet-200",
  ADMINISTRATIF: "bg-cyan-100 text-cyan-700 border-cyan-200",
  ONBOARDING: "bg-indigo-100 text-indigo-700 border-indigo-200",
};

const CAT_LABEL: Record<string, string> = {
  METIER: "Métier (Manager)",
  ADMINISTRATIF: "Administratif (RH)",
  ONBOARDING: "Onboarding",
};

const PRIO_CLS: Record<string, string> = {
  CRITICAL: "bg-red-100 text-red-700 border-red-200",
  HIGH: "bg-orange-100 text-orange-700 border-orange-200",
  MEDIUM: "bg-yellow-100 text-yellow-700 border-yellow-200",
  LOW: "bg-gray-100 text-gray-500 border-gray-200",
};

export default function EmployeeTasksPage() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'ALL' | 'TODO' | 'DONE'>('ALL');
  const [catFilter, setCatFilter] = useState<string>('ALL');
  const [marking, setMarking] = useState<string | null>(null);

  const load = async () => {
    if (!user?.id) return;
    setLoading(true);
    setError(null);
    try {
      const empRes = await fetchGraphQL<any>(GET_EMPLOYEE_ONBOARDING, { userId: user.id });
      const onboardingId = empRes?.employeeByUserId?.onboardingId;
      if (onboardingId) {
        const tasksRes = await fetchGraphQL<{ tasksByOnboarding: Task[] }>(GET_TASKS_BY_ONBOARDING, { onboardingId });
        setTasks(tasksRes.tasksByOnboarding || []);
      } else {
        setTasks([]);
      }
    } catch (err) {
      console.error(err);
      setError("Impossible de charger les tâches.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [user?.id]);

  const handleMarkDone = async (id: string, currentStatus: string) => {
    if (currentStatus === 'DONE' || currentStatus === 'VALIDATED') return;
    setMarking(id);
    try {
      await fetchGraphQL(MARK_DONE, { id });
      setTasks(prev => prev.map(t => t.id === id ? { ...t, status: 'DONE' } : t));
    } catch (e) {
      console.error("Failed to mark as done", e);
    } finally {
      setMarking(null);
    }
  };

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });

  const filteredTasks = tasks.filter((t) => {
    if (filter === 'TODO' && (t.status === 'DONE' || t.status === 'VALIDATED')) return false;
    if (filter === 'DONE' && t.status !== 'DONE' && t.status !== 'VALIDATED') return false;
    if (catFilter !== 'ALL' && t.category !== catFilter) return false;
    return true;
  });

  const counts = {
    all: tasks.length,
    todo: tasks.filter(t => t.status === 'TODO' || t.status === 'IN_PROGRESS').length,
    done: tasks.filter(t => t.status === 'DONE' || t.status === 'VALIDATED').length,
  };

  return (
    <div className="space-y-6 pb-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Mon Onboarding — Mes Tâches</h1>
          <p className="text-gray-500 mt-1">Gérez et suivez les actions requises (RH administratives & Métier manager) pour votre intégration de 6 mois.</p>
        </div>
        <button onClick={load} className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors">
          <RefreshCw className="w-4 h-4" /> Actualiser
        </button>
      </div>

      {/* Tabs and Categories */}
      <div className="bg-white rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-100 overflow-hidden">
        <div className="p-5 border-b border-gray-100 bg-gray-50/50 space-y-4">
          {/* Status Tabs */}
          <div className="flex flex-wrap gap-2">
            {[
              { key: 'ALL', label: `Toutes (${counts.all})` },
              { key: 'TODO', label: `À Faire (${counts.todo})` },
              { key: 'DONE', label: `Terminées (${counts.done})` },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key as any)}
                className={`px-5 py-2.5 rounded-xl font-semibold text-sm border transition-all ${filter === tab.key
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-150'
                    : 'bg-white text-gray-600 hover:bg-gray-50 hover:text-gray-900 border-gray-200'
                  }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Category Filters */}
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-gray-200/50">
            <SlidersHorizontal className="w-4 h-4 text-gray-400 mr-1" />
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Catégorie :</span>
            {['ALL', 'METIER', 'ADMINISTRATIF', 'ONBOARDING'].map((cat) => (
              <button
                key={cat}
                onClick={() => setCatFilter(cat)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all border ${catFilter === cat
                    ? 'bg-indigo-50 text-indigo-700 border-indigo-100'
                    : 'bg-white text-gray-500 hover:text-gray-800 border-gray-200'
                  }`}
              >
                {cat === 'ALL' ? 'Toutes' : CAT_LABEL[cat]}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-24 text-indigo-600">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        ) : error ? (
          <div className="text-center py-10 text-rose-500 font-medium bg-rose-50/50 m-4 rounded-xl border border-rose-100">{error}</div>
        ) : filteredTasks.length === 0 ? (
          <div className="text-center py-24 text-gray-500 flex flex-col items-center">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mb-3" />
            <p className="font-semibold text-base">Aucune tâche trouvée</p>
            <p className="text-xs text-gray-400 mt-1">Vous êtes complètement à jour pour ces filtres !</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {filteredTasks.map((task) => {
              const isDone = task.status === 'DONE' || task.status === 'VALIDATED';
              const isUrgent = task.priority === 'HIGH' || task.priority === 'CRITICAL';
              const isMarking = marking === task.id;

              return (
                <div
                  key={task.id}
                  className={`p-6 flex flex-col sm:flex-row items-start gap-5 transition-colors group relative ${isDone ? 'bg-gray-50/30' : 'hover:bg-indigo-50/20'}`}
                >
                  {!isDone && (
                    <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-r-full opacity-0 group-hover:opacity-100 transition-opacity ${isUrgent ? 'bg-rose-500' : 'bg-indigo-500'}`} />
                  )}
                  <div className="mt-1.5 relative shrink-0">
                    {isMarking ? (
                      <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
                    ) : (
                      <>
                        <input
                          type="checkbox"
                          checked={isDone}
                          disabled={isDone}
                          onChange={() => handleMarkDone(task.id, task.status)}
                          className={`w-6 h-6 rounded-md border-2 ${isDone ? 'border-emerald-500 bg-emerald-500 text-emerald-600 focus:ring-emerald-500/30 cursor-default' : 'border-gray-300 text-indigo-600 focus:ring-indigo-500/30 cursor-pointer'} transition-all`}
                        />
                        {isDone && <CheckCircle2 className="w-4 h-4 text-white absolute top-1 left-1 pointer-events-none" />}
                      </>
                    )}
                  </div>
                  <div className={`flex-1 w-full ${isDone ? 'opacity-60' : ''}`}>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-2.5 gap-2.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className={`text-lg font-bold transition-colors ${isDone ? 'text-gray-500 line-through' : 'text-gray-900 group-hover:text-indigo-700'}`}>
                          {task.title}
                        </h3>
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${CAT_CLS[task.category] || "bg-gray-100 text-gray-700"}`}>
                          {CAT_LABEL[task.category] || task.category}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${PRIO_CLS[task.priority]}`}>
                          Prio: {task.priority}
                        </span>
                        {task.status === 'VALIDATED' ? (
                          <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-full border border-emerald-100 flex items-center whitespace-nowrap">
                            <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Validé
                          </span>
                        ) : task.status === 'DONE' ? (
                          <span className="px-2.5 py-0.5 bg-blue-50 text-blue-700 text-xs font-bold rounded-full border border-blue-100 flex items-center whitespace-nowrap">
                            <Clock className="w-3.5 h-3.5 mr-1" /> En attente de validation
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-full border border-indigo-100 flex items-center whitespace-nowrap">
                            <Clock className="w-3.5 h-3.5 mr-1" /> À faire
                          </span>
                        )}
                      </div>
                    </div>
                    {task.description && (
                      <p className={`text-sm mb-4 leading-relaxed ${isDone ? 'text-gray-500 line-through' : 'text-gray-600'}`}>{task.description}</p>
                    )}
                    <div className="flex flex-wrap items-center text-xs font-medium text-gray-500 gap-3">
                      {task.dueDate && (
                        <span className="flex items-center px-3 py-1.5 bg-gray-50 rounded-lg border border-gray-200/60">
                          <Calendar className="w-4 h-4 mr-1.5 text-indigo-500" />
                          Échéance : {formatDate(task.dueDate)}
                        </span>
                      )}
                      <span className="flex items-center px-3 py-1.5 bg-gray-50 rounded-lg border border-gray-200/60">
                        <UserCheck className="w-4 h-4 mr-1.5 text-indigo-500" />
                        Validateur : {task.category === 'ADMINISTRATIF' ? 'Admin RH' : 'Manager'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
