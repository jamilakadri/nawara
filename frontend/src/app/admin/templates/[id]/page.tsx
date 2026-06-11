"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft, Loader2, FileText, Briefcase, CheckCircle2,
  Users, Clock, BookOpen, MessageSquare, Award, ChevronRight,
  Plus, Trash2, X, AlertCircle,
} from "lucide-react";
import { fetchGraphQL } from "@/lib/graphqlClient";

const GET_DETAIL = `
  query GetTemplateDetail($id: ID!) {
    onboardingTemplateDetail(id: $id) {
      id name description positionTitle isActive stepsCount createdAt
      steps {
        id title description order
        tasks {
          id title description defaultAssigneeRole priority daysToComplete
        }
      }
    }
  }
`;

const ADD_STEP = `
  mutation CreateOnboardingStep($templateId: String!, $title: String!, $order: Int!, $description: String) {
    createOnboardingStep(templateId: $templateId, title: $title, order: $order, description: $description) {
      id title description order templateId tasks { id title }
    }
  }
`;

const ADD_TASK = `
  mutation CreateTaskTemplate($stepId: String!, $title: String!, $defaultAssigneeRole: String!, $priority: String!, $daysToComplete: Int!, $description: String) {
    createTaskTemplate(stepId: $stepId, title: $title, defaultAssigneeRole: $defaultAssigneeRole, priority: $priority, daysToComplete: $daysToComplete, description: $description) {
      id title description defaultAssigneeRole priority daysToComplete
    }
  }
`;

const DEL_TASK = `
  mutation DeleteTaskTemplate($id: ID!) { deleteTaskTemplate(id: $id) { id } }
`;

interface TaskTpl { id: string; title: string; description?: string; defaultAssigneeRole: string; priority: string; daysToComplete: number; }
interface Step { id: string; title: string; description?: string; order: number; tasks: TaskTpl[]; }
interface TemplateDetail {
  id: string; name: string; description?: string; positionTitle?: string;
  isActive: boolean; stepsCount: number; createdAt: string; steps: Step[];
}

const PHASE_COLORS = [
  { bg: "bg-violet-50", border: "border-violet-200", badge: "bg-violet-600", text: "text-violet-700", dot: "bg-violet-500", light: "bg-violet-100" },
  { bg: "bg-blue-50", border: "border-blue-200", badge: "bg-blue-600", text: "text-blue-700", dot: "bg-blue-500", light: "bg-blue-100" },
  { bg: "bg-emerald-50", border: "border-emerald-200", badge: "bg-emerald-600", text: "text-emerald-700", dot: "bg-emerald-500", light: "bg-emerald-100" },
  { bg: "bg-amber-50", border: "border-amber-200", badge: "bg-amber-600", text: "text-amber-700", dot: "bg-amber-500", light: "bg-amber-100" },
];

const ROLE_LABELS: Record<string, string> = { ADMINRH: "Admin", MANAGER: "Manager", SALARIE: "Collaborateur" };
const PRIORITY_LABELS: Record<string, { label: string; cls: string }> = {
  CRITICAL: { label: "Critique", cls: "bg-red-100 text-red-700" },
  HIGH: { label: "Haute", cls: "bg-orange-100 text-orange-700" },
  MEDIUM: { label: "Moyenne", cls: "bg-yellow-100 text-yellow-700" },
  LOW: { label: "Basse", cls: "bg-gray-100 text-gray-600" },
};

function dayLabel(d: number) {
  if (d < 0) return `J${d}`;
  if (d === 0) return "Jour J";
  return `J+${d}`;
}

function TaskTypeIcon({ role }: { role: string }) {
  if (role === "ADMINRH") return <FileText className="w-3.5 h-3.5" />;
  if (role === "MANAGER") return <Users className="w-3.5 h-3.5" />;
  return <BookOpen className="w-3.5 h-3.5" />;
}

export default function TemplateDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [detail, setDetail] = useState<TemplateDetail | null>(null);
  const [loading, setLoading] = useState(true);

  // Add step modal
  const [showStepModal, setShowStepModal] = useState(false);
  const [stepForm, setStepForm] = useState({ title: "", description: "" });
  const [savingStep, setSavingStep] = useState(false);

  // Add task modal
  const [activeStepId, setActiveStepId] = useState<string | null>(null);
  const [taskForm, setTaskForm] = useState({ title: "", description: "", defaultAssigneeRole: "SALARIE", priority: "MEDIUM", daysToComplete: 7 });
  const [savingTask, setSavingTask] = useState(false);

  const [deletingTask, setDeletingTask] = useState<string | null>(null);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    fetchGraphQL<{ onboardingTemplateDetail: TemplateDetail }>(GET_DETAIL, { id })
      .then((d) => setDetail(d.onboardingTemplateDetail))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  const handleAddStep = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stepForm.title.trim()) { setFormError("Le titre est obligatoire."); return; }
    setSavingStep(true); setFormError("");
    try {
      const order = (detail?.steps.length ?? 0) + 1;
      const res = await fetchGraphQL<{ createOnboardingStep: Step }>(ADD_STEP, {
        templateId: id, title: stepForm.title.trim(), order,
        description: stepForm.description.trim() || undefined,
      });
      setDetail((prev) => prev ? { ...prev, steps: [...prev.steps, { ...res.createOnboardingStep, tasks: [] }], stepsCount: prev.stepsCount + 1 } : prev);
      setShowStepModal(false);
      setStepForm({ title: "", description: "" });
    } catch (err: any) { setFormError(err?.message ?? "Erreur."); }
    finally { setSavingStep(false); }
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskForm.title.trim() || !activeStepId) { setFormError("Le titre est obligatoire."); return; }
    setSavingTask(true); setFormError("");
    try {
      const res = await fetchGraphQL<{ createTaskTemplate: TaskTpl }>(ADD_TASK, {
        stepId: activeStepId, title: taskForm.title.trim(),
        defaultAssigneeRole: taskForm.defaultAssigneeRole,
        priority: taskForm.priority,
        daysToComplete: Number(taskForm.daysToComplete),
        description: taskForm.description.trim() || undefined,
      });
      setDetail((prev) => prev ? {
        ...prev,
        steps: prev.steps.map((s) => s.id === activeStepId ? { ...s, tasks: [...s.tasks, res.createTaskTemplate] } : s),
      } : prev);
      setActiveStepId(null);
      setTaskForm({ title: "", description: "", defaultAssigneeRole: "SALARIE", priority: "MEDIUM", daysToComplete: 7 });
    } catch (err: any) { setFormError(err?.message ?? "Erreur."); }
    finally { setSavingTask(false); }
  };

  const handleDeleteTask = async (taskId: string, stepId: string) => {
    setDeletingTask(taskId);
    try {
      await fetchGraphQL(DEL_TASK, { id: taskId });
      setDetail((prev) => prev ? {
        ...prev,
        steps: prev.steps.map((s) => s.id === stepId ? { ...s, tasks: s.tasks.filter((t) => t.id !== taskId) } : s),
      } : prev);
    } catch (err) { console.error(err); }
    finally { setDeletingTask(null); }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-96">
      <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
    </div>
  );
  if (!detail) return (
    <div className="text-center py-24 text-gray-400">Modèle introuvable.</div>
  );

  const totalTasks = detail.steps.reduce((a, s) => a + s.tasks.length, 0);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <button onClick={() => router.back()} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-indigo-600 mb-4 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Retour aux modèles
        </button>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-md shadow-indigo-200">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-2xl font-extrabold text-gray-900">{detail.name}</h1>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${detail.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                {detail.isActive ? "Actif" : "Inactif"}
              </span>
            </div>
            {detail.description && <p className="text-gray-500 ml-13 text-sm">{detail.description}</p>}
          </div>
          <div className="flex gap-3 shrink-0">
            <div className="bg-white rounded-xl border border-gray-100 px-4 py-2.5 text-center shadow-sm">
              <p className="text-xl font-bold text-indigo-600">{detail.steps.length}</p>
              <p className="text-xs text-gray-500 font-medium">Phases</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 px-4 py-2.5 text-center shadow-sm">
              <p className="text-xl font-bold text-indigo-600">{totalTasks}</p>
              <p className="text-xs text-gray-500 font-medium">Tâches</p>
            </div>
            {detail.positionTitle && (
              <div className="bg-indigo-50 rounded-xl border border-indigo-100 px-4 py-2.5 flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-indigo-500" />
                <p className="text-sm font-semibold text-indigo-700">{detail.positionTitle}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Timeline Phases */}
      <div className="space-y-6">
        {detail.steps.map((step, idx) => {
          const c = PHASE_COLORS[idx % PHASE_COLORS.length];
          return (
            <div key={step.id} className={`rounded-2xl border ${c.border} ${c.bg} overflow-hidden`}>
              {/* Phase header */}
              <div className="px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className={`w-8 h-8 rounded-lg ${c.badge} text-white text-sm font-bold flex items-center justify-center shadow-sm`}>
                    {step.order}
                  </span>
                  <div>
                    <h2 className={`font-bold text-base ${c.text}`}>{step.title}</h2>
                    {step.description && <p className="text-xs text-gray-500 mt-0.5">{step.description}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-semibold ${c.text} ${c.light} px-2.5 py-1 rounded-full`}>
                    {step.tasks.length} tâche{step.tasks.length !== 1 ? "s" : ""}
                  </span>
                  <button
                    onClick={() => { setActiveStepId(step.id); setFormError(""); setTaskForm({ title: "", description: "", defaultAssigneeRole: "SALARIE", priority: "MEDIUM", daysToComplete: 7 }); }}
                    className={`flex items-center gap-1 text-xs font-semibold ${c.text} hover:opacity-80 transition-opacity px-2.5 py-1 rounded-lg ${c.light}`}
                  >
                    <Plus className="w-3.5 h-3.5" /> Ajouter
                  </button>
                </div>
              </div>

              {/* Tasks grid */}
              {step.tasks.length > 0 ? (
                <div className="px-6 pb-5 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                  {step.tasks.map((task, ti) => {
                    const prio = PRIORITY_LABELS[task.priority] ?? { label: task.priority, cls: "bg-gray-100 text-gray-600" };
                    return (
                      <div key={task.id} className="bg-white rounded-xl border border-white shadow-sm p-4 flex flex-col gap-2 group hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className={`w-5 h-5 rounded-md ${c.badge} text-white flex items-center justify-center shrink-0 text-xs font-bold`}>{ti + 1}</span>
                            <p className="text-sm font-semibold text-gray-800 leading-tight truncate">{task.title}</p>
                          </div>
                          <button
                            onClick={() => handleDeleteTask(task.id, step.id)}
                            disabled={deletingTask === task.id}
                            className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-400 transition-all shrink-0"
                          >
                            {deletingTask === task.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                        {task.description && (
                          <p className="text-xs text-gray-400 leading-relaxed line-clamp-2">{task.description}</p>
                        )}
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${prio.cls}`}>
                            {prio.label}
                          </span>
                          <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                            <TaskTypeIcon role={task.defaultAssigneeRole} />
                            {ROLE_LABELS[task.defaultAssigneeRole] ?? task.defaultAssigneeRole}
                          </span>
                          <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600">
                            <Clock className="w-3 h-3" />
                            {dayLabel(task.daysToComplete)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="px-6 pb-5">
                  <div className="bg-white/60 border border-dashed border-gray-200 rounded-xl py-6 text-center">
                    <p className="text-sm text-gray-400">Aucune tâche — cliquez sur <span className="font-semibold">Ajouter</span> pour en créer une.</p>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add Phase button */}
      <button
        onClick={() => { setShowStepModal(true); setFormError(""); setStepForm({ title: "", description: "" }); }}
        className="w-full py-3.5 rounded-2xl border-2 border-dashed border-indigo-200 text-indigo-500 font-semibold text-sm hover:bg-indigo-50 hover:border-indigo-400 transition-all flex items-center justify-center gap-2"
      >
        <Plus className="w-4 h-4" /> Ajouter une phase
      </button>

      {/* Modal – Add Phase */}
      {showStepModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowStepModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">Nouvelle phase</h2>
              <button onClick={() => setShowStepModal(false)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleAddStep} className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Titre *</label>
                <input value={stepForm.title} onChange={(e) => setStepForm((f) => ({ ...f, title: e.target.value }))} placeholder="ex: Phase 5 – Autonomie" className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm bg-gray-50" autoFocus />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Description</label>
                <textarea value={stepForm.description} onChange={(e) => setStepForm((f) => ({ ...f, description: e.target.value }))} rows={2} className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm bg-gray-50 resize-none" />
              </div>
              {formError && <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-xl"><AlertCircle className="w-4 h-4" />{formError}</div>}
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowStepModal(false)} className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50">Annuler</button>
                <button type="submit" disabled={savingStep} className="flex-1 px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2">
                  {savingStep ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Créer la phase
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal – Add Task */}
      {activeStepId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setActiveStepId(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">Nouvelle tâche</h2>
              <button onClick={() => setActiveStepId(null)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleAddTask} className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Titre *</label>
                <input value={taskForm.title} onChange={(e) => setTaskForm((f) => ({ ...f, title: e.target.value }))} placeholder="ex: Valider le plan de vente" className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm bg-gray-50" autoFocus />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Description</label>
                <textarea value={taskForm.description} onChange={(e) => setTaskForm((f) => ({ ...f, description: e.target.value }))} rows={2} className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm bg-gray-50 resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Acteur</label>
                  <select value={taskForm.defaultAssigneeRole} onChange={(e) => setTaskForm((f) => ({ ...f, defaultAssigneeRole: e.target.value }))} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-400">
                    <option value="SALARIE">Collaborateur</option>
                    <option value="MANAGER">Manager</option>
                    <option value="ADMINRH">Admin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Priorité</label>
                  <select value={taskForm.priority} onChange={(e) => setTaskForm((f) => ({ ...f, priority: e.target.value }))} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-400">
                    <option value="LOW">Basse</option>
                    <option value="MEDIUM">Moyenne</option>
                    <option value="HIGH">Haute</option>
                    <option value="CRITICAL">Critique</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Échéance (jours depuis J)</label>
                <input type="number" value={taskForm.daysToComplete} onChange={(e) => setTaskForm((f) => ({ ...f, daysToComplete: parseInt(e.target.value) || 0 }))} className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm bg-gray-50" placeholder="ex: 3 pour J+3, -2 pour J-2" />
                <p className="text-xs text-gray-400 mt-1">Valeur négative pour le pré-onboarding (ex: -3 = J-3)</p>
              </div>
              {formError && <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-xl"><AlertCircle className="w-4 h-4" />{formError}</div>}
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setActiveStepId(null)} className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50">Annuler</button>
                <button type="submit" disabled={savingTask} className="flex-1 px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2">
                  {savingTask ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Ajouter
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
