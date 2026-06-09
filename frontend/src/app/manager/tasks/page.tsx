"use client";

import { useEffect, useState } from "react";
import {
  CheckCircle2, XCircle, Calendar, Loader2, RefreshCw,
  AlertTriangle, Clock, Plus, X, Users, Briefcase, Tag,
  ChevronDown, Filter, SlidersHorizontal,
} from "lucide-react";
import { fetchGraphQL } from "@/lib/graphqlClient";
import { useAuth } from "@/lib/authContext";
import { useNotifications } from "@/lib/notificationContext";

/* ─── GraphQL ─────────────────────────────── */
const GET_DATA = `
  query ManagerTasksData {
    tasks {
      id title description status priority category dueDate
      assigneeFirstName assigneeLastName
      employeeFirstName employeeLastName
      onboardingId
    }
    employeeOnboardings {
      id employeeFirstName employeeLastName positionTitle
    }
    users { id firstName lastName role }
  }
`;
const VALIDATE = `mutation ValidateTask($id: ID!, $validatorId: ID) { validateTask(id: $id, validatorId: $validatorId) { id status } }`;
const REJECT = `mutation RejectTask($id: ID!, $validatorId: ID) { rejectTask(id: $id, validatorId: $validatorId) { id status } }`;
const CREATE_TASK = `
  mutation CreateTask(
    $onboardingId: String!, $title: String!, $priority: String!,
    $category: TaskCategory!, $dueDate: String!,
    $assigneeId: String, $createdById: String, $description: String
  ) {
    createTask(
      onboardingId: $onboardingId, title: $title, priority: $priority,
      category: $category, dueDate: $dueDate,
      assigneeId: $assigneeId, createdById: $createdById, description: $description
    ) { id title status category priority dueDate employeeFirstName employeeLastName }
  }
`;

/* ─── Types ───────────────────────────────── */
interface Task {
  id: string; title: string; description?: string; status: string;
  priority: string; category: string; dueDate: string;
  onboardingId: string;
  assigneeFirstName?: string; assigneeLastName?: string;
  employeeFirstName?: string; employeeLastName?: string;
}
interface Onboarding { id: string; employeeFirstName?: string; employeeLastName?: string; positionTitle?: string; }
interface User { id: string; firstName: string; lastName: string; role: string; }

/* ─── Constants ───────────────────────────── */
const STATUS_LABEL: Record<string, string> = {
  TODO: "À faire", IN_PROGRESS: "En cours", DONE: "Soumise",
  VALIDATED: "Validée", OVERDUE: "En retard",
};
const STATUS_CLS: Record<string, string> = {
  TODO: "bg-gray-100 text-gray-700", IN_PROGRESS: "bg-blue-100 text-blue-700",
  DONE: "bg-amber-100 text-amber-800", VALIDATED: "bg-emerald-100 text-emerald-800",
  OVERDUE: "bg-rose-100 text-rose-700",
};
const PRIO_CLS: Record<string, string> = {
  CRITICAL: "bg-red-100 text-red-700", HIGH: "bg-orange-100 text-orange-700",
  MEDIUM: "bg-yellow-100 text-yellow-700", LOW: "bg-gray-100 text-gray-500",
};
const PRIO_LABEL: Record<string, string> = {
  CRITICAL: "Critique", HIGH: "Haute", MEDIUM: "Moyenne", LOW: "Basse",
};
const CAT_CLS: Record<string, string> = {
  METIER: "bg-violet-100 text-violet-700",
  ADMINISTRATIF: "bg-cyan-100 text-cyan-700",
  ONBOARDING: "bg-indigo-100 text-indigo-700",
};
const CAT_LABEL: Record<string, string> = {
  METIER: "Métier", ADMINISTRATIF: "Administratif", ONBOARDING: "Onboarding",
};

const fmt = (d: string) => new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
const isOverdue = (d: string) => new Date(d) < new Date();

/* ─── Page ────────────────────────────────── */
export default function ManagerTasksPage() {
  const { user } = useAuth();
  const { addToast } = useNotifications();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [onboardings, setOnboardings] = useState<Onboarding[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);

  // Filters
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [filterCat, setFilterCat] = useState("ALL");

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [form, setForm] = useState({
    onboardingId: "", title: "", description: "",
    priority: "MEDIUM", category: "METIER",
    dueDate: "", assigneeId: "",
  });

  const load = () => {
    setLoading(true);
    fetchGraphQL<{ tasks: Task[]; employeeOnboardings: Onboarding[]; users: User[] }>(GET_DATA)
      .then((d) => {
        setTasks(d.tasks || []);
        setOnboardings(d.employeeOnboardings || []);
        setUsers(d.users || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleValidate = async (id: string) => {
    setActing(id + "_v");
    try {
      await fetchGraphQL(VALIDATE, { id, validatorId: user?.id });
      setTasks((prev) => prev.map((t) => t.id === id ? { ...t, status: "VALIDATED" } : t));
      addToast({ type: "success", title: "Tâche validée", message: "La tâche a été validée avec succès." });
    } catch (e) { console.error(e); addToast({ type: "error", title: "Erreur", message: "Impossible de valider la tâche." }); }
    finally { setActing(null); }
  };

  const handleReject = async (id: string) => {
    setActing(id + "_r");
    try {
      await fetchGraphQL(REJECT, { id, validatorId: user?.id });
      setTasks((prev) => prev.map((t) => t.id === id ? { ...t, status: "TODO" } : t));
      addToast({ type: "warning", title: "Tâche rejetée", message: "La tâche a été renvoyée pour correction." });
    } catch (e) { console.error(e); addToast({ type: "error", title: "Erreur", message: "Impossible de rejeter la tâche." }); }
    finally { setActing(null); }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.onboardingId || !form.title.trim() || !form.dueDate) {
      setFormError("Employé, titre et date sont obligatoires."); return;
    }
    setSaving(true); setFormError("");
    try {
      const res = await fetchGraphQL<{ createTask: Task }>(CREATE_TASK, {
        onboardingId: form.onboardingId,
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        priority: form.priority,
        category: form.category,
        dueDate: new Date(form.dueDate).toISOString(),
        assigneeId: form.assigneeId || undefined,
        createdById: user?.id,
      });
      setTasks((prev) => [res.createTask, ...prev]);
      setShowModal(false);
      setForm({ onboardingId: "", title: "", description: "", priority: "MEDIUM", category: "METIER", dueDate: "", assigneeId: "" });
      addToast({ type: "success", title: "Tâche créée", message: `"${res.createTask.title}" a été ajoutée avec succès.` });
    } catch (err: any) {
      setFormError(err?.message ?? "Erreur lors de la création.");
    } finally { setSaving(false); }
  };

  const filtered = tasks.filter((t) => {
    if (filterStatus !== "ALL" && t.status !== filterStatus) return false;
    if (filterCat !== "ALL" && t.category !== filterCat) return false;
    return true;
  });

  const pendingValidation = tasks.filter((t) => t.status === "DONE").length;
  const metierCount = tasks.filter((t) => t.category === "METIER").length;
  const adminCount = tasks.filter((t) => t.category === "ADMINISTRATIF").length;

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Gestion des Tâches</h1>
          <p className="text-gray-500 mt-1 text-sm">Créez des tickets métier et validez les soumissions de votre équipe.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="flex items-center gap-2 border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors">
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => { setShowModal(true); setFormError(""); }}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors shadow-md shadow-indigo-200"
          >
            <Plus className="w-4 h-4" /> Nouveau ticket
          </button>
        </div>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "En attente validation", value: pendingValidation, cls: "text-amber-600", bg: "bg-amber-50" },
          { label: "Tickets métier", value: metierCount, cls: "text-violet-600", bg: "bg-violet-50" },
          { label: "Tâches admin", value: adminCount, cls: "text-cyan-600", bg: "bg-cyan-50" },
          { label: "Total", value: tasks.length, cls: "text-indigo-600", bg: "bg-indigo-50" },
        ].map(({ label, value, cls, bg }) => (
          <div key={label} className={`${bg} rounded-2xl p-4 border border-white`}>
            <p className={`text-2xl font-extrabold ${cls}`}>{loading ? "…" : value}</p>
            <p className="text-xs text-gray-500 font-medium mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        <SlidersHorizontal className="w-4 h-4 text-gray-400" />
        <span className="text-xs text-gray-500 font-medium">Statut :</span>
        {["ALL", "TODO", "IN_PROGRESS", "DONE", "VALIDATED", "OVERDUE"].map((s) => (
          <button key={s} onClick={() => setFilterStatus(s)}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition-all border ${filterStatus === s ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-gray-600 border-gray-200 hover:border-indigo-300"}`}>
            {s === "ALL" ? "Tous" : STATUS_LABEL[s]}
          </button>
        ))}
        <span className="text-xs text-gray-500 font-medium ml-2">Catégorie :</span>
        {["ALL", "METIER", "ADMINISTRATIF", "ONBOARDING"].map((c) => (
          <button key={c} onClick={() => setFilterCat(c)}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition-all border ${filterCat === c ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-gray-600 border-gray-200 hover:border-indigo-300"}`}>
            {c === "ALL" ? "Toutes" : CAT_LABEL[c]}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center py-24"><Loader2 className="w-8 h-8 text-indigo-400 animate-spin" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-gray-200" />
            <p className="font-medium">Aucune tâche pour ce filtre.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {["Tâche", "Catégorie", "Employé", "Assignée à", "Échéance", "Priorité", "Statut", "Actions"].map((h) => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((task) => {
                  const overdue = task.status !== "VALIDATED" && isOverdue(task.dueDate);
                  return (
                    <tr key={task.id} className="hover:bg-indigo-50/20 transition-colors">
                      <td className="px-5 py-4 max-w-xs">
                        <p className="text-sm font-semibold text-gray-900 leading-tight">{task.title}</p>
                        {task.description && <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{task.description}</p>}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${CAT_CLS[task.category] ?? "bg-gray-100 text-gray-600"}`}>
                          {CAT_LABEL[task.category] ?? task.category}
                        </span>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-400 to-blue-400 flex items-center justify-center text-white text-xs font-bold shrink-0">
                            {task.employeeFirstName?.[0]}{task.employeeLastName?.[0]}
                          </div>
                          <span className="text-sm text-gray-800">{task.employeeFirstName} {task.employeeLastName}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-500">
                        {task.assigneeFirstName ? `${task.assigneeFirstName} ${task.assigneeLastName}` : <span className="text-gray-300">—</span>}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className={`flex items-center gap-1 text-sm font-medium ${overdue ? "text-rose-500" : "text-gray-600"}`}>
                          <Calendar className="w-3.5 h-3.5" /> {fmt(task.dueDate)}
                          {overdue && <AlertTriangle className="w-3 h-3" />}
                        </span>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${PRIO_CLS[task.priority]}`}>
                          {PRIO_LABEL[task.priority] ?? task.priority}
                        </span>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium inline-flex items-center gap-1 ${STATUS_CLS[task.status]}`}>
                          {task.status === "DONE" && <Clock className="w-3 h-3" />}
                          {task.status === "OVERDUE" && <AlertTriangle className="w-3 h-3" />}
                          {STATUS_LABEL[task.status] ?? task.status}
                        </span>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        {task.status === "DONE" ? (
                          <div className="flex gap-2">
                            <button onClick={() => handleValidate(task.id)} disabled={!!acting}
                              className="flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1.5 rounded-lg transition-colors disabled:opacity-50">
                              {acting === task.id + "_v" ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
                              Valider
                            </button>
                            <button onClick={() => handleReject(task.id)} disabled={!!acting}
                              className="flex items-center gap-1 text-xs font-semibold text-rose-500 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 px-2.5 py-1.5 rounded-lg transition-colors disabled:opacity-50">
                              {acting === task.id + "_r" ? <Loader2 className="w-3 h-3 animate-spin" /> : <XCircle className="w-3 h-3" />}
                              Renvoyer
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">
                            {task.status === "VALIDATED" ? "✓ Validée" : "—"}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Modal: Créer ticket ── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-indigo-50 to-violet-50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                  <Plus className="w-4 h-4 text-white" />
                </div>
                <h2 className="text-lg font-bold text-gray-900">Nouveau ticket</h2>
              </div>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg hover:bg-white/80 text-gray-400 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="px-6 py-5 space-y-4">
              {/* Employee */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Employé *</label>
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  <select value={form.onboardingId} onChange={(e) => setForm((f) => ({ ...f, onboardingId: e.target.value }))}
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-gray-200 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-400 appearance-none" required>
                    <option value="">— Sélectionner un employé —</option>
                    {onboardings.map((o) => (
                      <option key={o.id} value={o.id}>{o.employeeFirstName} {o.employeeLastName} — {o.positionTitle}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Titre de la tâche *</label>
                <input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="ex: Implémenter le module de reporting" required autoFocus
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-400" />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Description</label>
                <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  rows={2} placeholder="Détails, critères d'acceptation..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none" />
              </div>

              {/* Category + Priority */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Catégorie</label>
                  <div className="relative">
                    <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    <select value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-400 appearance-none">
                      <option value="METIER">Métier</option>
                      <option value="ADMINISTRATIF">Administratif</option>
                      <option value="ONBOARDING">Onboarding</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Priorité</label>
                  <select value={form.priority} onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-400">
                    <option value="LOW">Basse</option>
                    <option value="MEDIUM">Moyenne</option>
                    <option value="HIGH">Haute</option>
                    <option value="CRITICAL">Critique</option>
                  </select>
                </div>
              </div>

              {/* Assignee + Due date */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Assignée à</label>
                  <div className="relative">
                    <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    <select value={form.assigneeId} onChange={(e) => setForm((f) => ({ ...f, assigneeId: e.target.value }))}
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-400 appearance-none">
                      <option value="">— Employé auto —</option>
                      {users.map((u) => (
                        <option key={u.id} value={u.id}>{u.firstName} {u.lastName} ({u.role})</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Date d'échéance *</label>
                  <input type="date" value={form.dueDate} onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))}
                    required min={new Date().toISOString().split("T")[0]}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                </div>
              </div>

              {formError && (
                <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-xl">
                  <X className="w-4 h-4 shrink-0" /> {formError}
                </div>
              )}

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
                  Annuler
                </button>
                <button type="submit" disabled={saving}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm shadow-indigo-200">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  Créer le ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
