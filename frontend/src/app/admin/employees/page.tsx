"use client";

import { useEffect, useState } from "react";
import { Search, UserPlus, Eye, Mail, Loader2, RefreshCw, X, Target, CheckSquare, FileText, Calendar, ArrowRight } from "lucide-react";
import { fetchGraphQL } from "@/lib/graphqlClient";
import { useNotifications } from "@/lib/notificationContext";

const GET_EMPLOYEES = `
  query {
    employees {
      id userId userEmail userFirstName userLastName
      positionTitle departmentName
      onboardingStatus onboardingProgress onboardingId startDate
    }
  }
`;

const GET_POSITIONS = `
  query {
    positions { id title }
  }
`;

const GET_DEPARTMENTS = `
  query {
    departments { id name }
  }
`;

const CREATE_EMPLOYEE = `
  mutation CreateEmployee($email: String!, $firstName: String!, $lastName: String!, $positionId: ID!, $departmentId: ID) {
    createEmployee(email: $email, firstName: $firstName, lastName: $lastName, positionId: $positionId, departmentId: $departmentId) {
      id userId userFirstName userLastName userEmail positionTitle departmentName onboardingStatus onboardingProgress onboardingId startDate
    }
  }
`;

const GET_TASKS_BY_ONBOARDING = `
  query TasksByOnboarding($onboardingId: ID!) {
    tasksByOnboarding(onboardingId: $onboardingId) {
      id title status priority category dueDate
    }
  }
`;

const GET_DOCS_BY_ONBOARDING = `
  query DocsByOnboarding($onboardingId: ID!) {
    documentsByOnboarding(onboardingId: $onboardingId) {
      id name type status uploadedAt aiScore
    }
  }
`;

interface Employee {
  id: string; userId: string; userEmail: string; userFirstName: string; userLastName: string;
  positionTitle: string; departmentName: string; onboardingStatus: string;
  onboardingProgress: number; onboardingId: string; startDate: string;
}
interface Position { id: string; title: string; }
interface Department { id: string; name: string; }
interface Task { id: string; title: string; status: string; priority: string; category: string; dueDate: string; }
interface Doc { id: string; name: string; type: string; status: string; uploadedAt: string; aiScore: number | null; }

const statusLabel: Record<string, string> = {
  IN_PROGRESS: "En cours", COMPLETED: "Terminé", NOT_STARTED: "Non démarré", DELAYED: "Retard",
};
const statusClass: Record<string, string> = {
  IN_PROGRESS: "bg-blue-100 text-blue-800",
  COMPLETED: "bg-green-100 text-green-800",
  NOT_STARTED: "bg-orange-100 text-orange-800",
  DELAYED: "bg-rose-100 text-rose-800",
};
const taskStatusLabel: Record<string, string> = {
  TODO: "À faire", IN_PROGRESS: "En cours", DONE: "Soumise", VALIDATED: "Validée", OVERDUE: "En retard",
};
const taskStatusCls: Record<string, string> = {
  TODO: "bg-gray-100 text-gray-700", IN_PROGRESS: "bg-blue-100 text-blue-700",
  DONE: "bg-amber-100 text-amber-700", VALIDATED: "bg-emerald-100 text-emerald-700",
  OVERDUE: "bg-rose-100 text-rose-700",
};
const docStatusLabel: Record<string, string> = { PENDING: "En attente", VALIDATED: "Validé", REJECTED: "Rejeté" };
const docStatusCls: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-700", VALIDATED: "bg-emerald-100 text-emerald-700", REJECTED: "bg-rose-100 text-rose-700",
};

export default function AdminEmployeesPage() {
  const { addToast } = useNotifications();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [filtered, setFiltered] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("");
  const [form, setForm] = useState({
    email: "", firstName: "", lastName: "", positionId: "", departmentId: "",
  });

  // Detail drawer
  const [selectedEmp, setSelectedEmp] = useState<Employee | null>(null);
  const [detailTasks, setDetailTasks] = useState<Task[]>([]);
  const [detailDocs, setDetailDocs] = useState<Doc[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);

  const load = () => {
    setLoading(true);
    Promise.all([
      fetchGraphQL<{ employees: Employee[] }>(GET_EMPLOYEES),
      fetchGraphQL<{ positions: Position[] }>(GET_POSITIONS),
      fetchGraphQL<{ departments: Department[] }>(GET_DEPARTMENTS),
    ])
      .then(([empData, posData, deptData]) => {
        setEmployees(empData.employees);
        setFiltered(empData.employees);
        setPositions(posData.positions);
        setDepartments(deptData.departments);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    let list = employees;
    if (search) list = list.filter((e) =>
      `${e.userFirstName} ${e.userLastName} ${e.userEmail}`.toLowerCase().includes(search.toLowerCase())
    );
    if (deptFilter) list = list.filter((e) => e.departmentName === deptFilter);
    setFiltered(list);
  }, [search, deptFilter, employees]);

  const handleCreate = async () => {
    if (!form.email || !form.firstName || !form.lastName || !form.positionId) return;
    setSubmitting(true);
    try {
      const data = await fetchGraphQL<{ createEmployee: Employee }>(CREATE_EMPLOYEE, {
        email: form.email,
        firstName: form.firstName,
        lastName: form.lastName,
        positionId: form.positionId,
        departmentId: form.departmentId || null,
      });
      setEmployees((prev) => [data.createEmployee, ...prev]);
      setShowModal(false);
      setForm({ email: "", firstName: "", lastName: "", positionId: "", departmentId: "" });
      addToast({
        type: "success",
        title: "Salarié créé avec succès",
        message: `${data.createEmployee.userFirstName} ${data.createEmployee.userLastName} a été ajouté et son parcours d'intégration est lancé.`,
      });
    } catch (e) {
      console.error(e);
      addToast({ type: "error", title: "Erreur", message: "Impossible de créer le salarié." });
    } finally {
      setSubmitting(false);
    }
  };

  const openDetail = async (emp: Employee) => {
    setSelectedEmp(emp);
    setDetailTasks([]);
    setDetailDocs([]);
    if (!emp.onboardingId) return;
    setDetailLoading(true);
    try {
      const [tasksRes, docsRes] = await Promise.all([
        fetchGraphQL<{ tasksByOnboarding: Task[] }>(GET_TASKS_BY_ONBOARDING, { onboardingId: emp.onboardingId }),
        fetchGraphQL<{ documentsByOnboarding: Doc[] }>(GET_DOCS_BY_ONBOARDING, { onboardingId: emp.onboardingId }),
      ]);
      setDetailTasks(tasksRes.tasksByOnboarding || []);
      setDetailDocs(docsRes.documentsByOnboarding || []);
    } catch (e) {
      console.error(e);
    } finally {
      setDetailLoading(false);
    }
  };

  const uniqueDepts = [...new Set(employees.map((e) => e.departmentName).filter(Boolean))];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Gestion des Employés</h1>
          <p className="text-gray-500 mt-1">Suivez et gérez l&apos;intégration de tous les nouveaux collaborateurs.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={load} className="flex items-center gap-2 border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors">
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl font-semibold transition-colors flex items-center space-x-2 shadow-md shadow-indigo-200 text-sm"
          >
            <UserPlus className="w-5 h-5" /><span>Nouveau Salarié</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-8">
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 gap-4 flex-wrap">
          <div className="relative w-72">
            <input type="text" placeholder="Rechercher par nom ou email..." value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm bg-white" />
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
          </div>
          <select value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-gray-700">
            <option value="">Tous les départements</option>
            {uniqueDepts.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20"><Loader2 className="w-8 h-8 text-indigo-400 animate-spin" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-left">
              <thead className="bg-gray-50">
                <tr>
                  {["Employé", "Poste & Dépt", "Statut Onboarding", "Progression", "Actions"].map((h) => (
                    <th key={h} className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {filtered.length === 0 ? (
                  <tr><td colSpan={5} className="text-center py-10 text-gray-400">Aucun employé trouvé.</td></tr>
                ) : filtered.map((emp) => (
                  <tr key={emp.id} className="hover:bg-indigo-50/30 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-blue-400 flex items-center justify-center text-white text-xs font-bold">
                          {emp.userFirstName?.[0]}{emp.userLastName?.[0]}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{emp.userFirstName} {emp.userLastName}</div>
                          <div className="text-xs text-gray-500 flex items-center mt-0.5"><Mail className="w-3 h-3 mr-1" />{emp.userEmail}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 font-medium">{emp.positionTitle || "—"}</div>
                      <div className="text-xs text-gray-500">{emp.departmentName || "—"}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusClass[emp.onboardingStatus] || "bg-gray-100 text-gray-700"}`}>
                        {statusLabel[emp.onboardingStatus] || emp.onboardingStatus || "—"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-700">
                        <span className="w-10 text-right font-medium mr-2">{Math.round(emp.onboardingProgress ?? 0)}%</span>
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${(emp.onboardingProgress ?? 0) >= 100 ? "bg-green-500" : "bg-indigo-600"}`}
                            style={{ width: `${emp.onboardingProgress ?? 0}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => openDetail(emp)}
                        className="text-indigo-600 hover:text-indigo-900 flex items-center justify-end w-full group"
                      >
                        <Eye className="w-4 h-4 mr-1 group-hover:scale-110 transition-transform" /> Détails
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Detail Drawer ── */}
      {selectedEmp && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setSelectedEmp(null)} />
          <div className="relative bg-white w-full max-w-lg shadow-2xl overflow-y-auto animate-in slide-in-from-right duration-300">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-gradient-to-r from-indigo-600 to-blue-600 text-white p-6">
              <button onClick={() => setSelectedEmp(null)} className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-white/20 transition-colors">
                <X className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-2xl font-bold border-2 border-white/30">
                  {selectedEmp.userFirstName?.[0]}{selectedEmp.userLastName?.[0]}
                </div>
                <div>
                  <h2 className="text-2xl font-bold">{selectedEmp.userFirstName} {selectedEmp.userLastName}</h2>
                  <p className="text-indigo-100 text-sm">{selectedEmp.positionTitle} · {selectedEmp.departmentName || "—"}</p>
                  <p className="text-indigo-200 text-xs mt-0.5">{selectedEmp.userEmail}</p>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Progress */}
              <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Target className="w-5 h-5 text-indigo-500" />
                    <h3 className="font-bold text-gray-800">Progression Onboarding</h3>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusClass[selectedEmp.onboardingStatus] || "bg-gray-100 text-gray-700"}`}>
                    {statusLabel[selectedEmp.onboardingStatus] || selectedEmp.onboardingStatus}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 bg-gray-200 rounded-full h-3 overflow-hidden">
                    <div className="h-3 rounded-full bg-gradient-to-r from-indigo-500 to-blue-500 transition-all duration-700" style={{ width: `${selectedEmp.onboardingProgress ?? 0}%` }} />
                  </div>
                  <span className="text-lg font-bold text-indigo-600">{Math.round(selectedEmp.onboardingProgress ?? 0)}%</span>
                </div>
                {selectedEmp.startDate && (
                  <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    Début : {new Date(selectedEmp.startDate).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
                  </p>
                )}
              </div>

              {detailLoading ? (
                <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 text-indigo-400 animate-spin" /></div>
              ) : (
                <>
                  {/* Tasks */}
                  <div>
                    <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                      <CheckSquare className="w-5 h-5 text-indigo-500" />
                      Tâches
                      <span className="bg-indigo-100 text-indigo-700 text-xs font-bold px-2 py-0.5 rounded-full">{detailTasks.length}</span>
                    </h3>
                    {detailTasks.length === 0 ? (
                      <p className="text-sm text-gray-400 bg-gray-50 rounded-xl p-4 text-center">Aucune tâche assignée.</p>
                    ) : (
                      <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                        {detailTasks.map((t) => (
                          <div key={t.id} className="bg-white border border-gray-100 rounded-xl p-3 flex items-center justify-between hover:border-indigo-200 transition-colors">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">{t.title}</p>
                              <p className="text-xs text-gray-500">Échéance : {new Date(t.dueDate).toLocaleDateString("fr-FR")}</p>
                            </div>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ml-2 shrink-0 ${taskStatusCls[t.status] || "bg-gray-100 text-gray-600"}`}>
                              {taskStatusLabel[t.status] || t.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Documents */}
                  <div>
                    <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                      <FileText className="w-5 h-5 text-indigo-500" />
                      Documents
                      <span className="bg-indigo-100 text-indigo-700 text-xs font-bold px-2 py-0.5 rounded-full">{detailDocs.length}</span>
                    </h3>
                    {detailDocs.length === 0 ? (
                      <p className="text-sm text-gray-400 bg-gray-50 rounded-xl p-4 text-center">Aucun document soumis.</p>
                    ) : (
                      <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                        {detailDocs.map((d) => (
                          <div key={d.id} className="bg-white border border-gray-100 rounded-xl p-3 flex items-center justify-between hover:border-indigo-200 transition-colors">
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <FileText className="w-4 h-4 text-gray-400 shrink-0" />
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">{d.name}</p>
                                <p className="text-xs text-gray-500">{d.type} · {new Date(d.uploadedAt).toLocaleDateString("fr-FR")}</p>
                              </div>
                            </div>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ml-2 shrink-0 ${docStatusCls[d.status] || "bg-gray-100 text-gray-600"}`}>
                              {docStatusLabel[d.status] || d.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create Employee Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">Nouveau Salarié</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-700 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Prénom *</label>
                  <input value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Jean" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nom *</label>
                  <input value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Dupont" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email professionnel *</label>
                <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="jean.dupont@entreprise.com" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Poste *</label>
                <select value={form.positionId} onChange={(e) => setForm({ ...form, positionId: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  <option value="">Sélectionner un poste…</option>
                  {positions.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Département</label>
                <select value={form.departmentId} onChange={(e) => setForm({ ...form, departmentId: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  <option value="">Aucun département</option>
                  {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
            </div>
            <div className="mt-2 p-3 bg-blue-50 rounded-xl text-xs text-blue-700">
              ℹ️ Un mot de passe temporaire <strong>password123</strong> sera attribué. L&apos;employé pourra le changer lors de sa première connexion.
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowModal(false)}
                className="flex-1 border border-gray-200 text-gray-700 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors">
                Annuler
              </button>
              <button
                onClick={handleCreate}
                disabled={!form.email || !form.firstName || !form.lastName || !form.positionId || submitting}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Créer le salarié
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
