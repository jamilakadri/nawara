"use client";

import { useEffect, useState } from "react";
import {
  Building2, Briefcase, Plus, Trash2, Loader2, X,
  Users, Calendar, AlertTriangle,
} from "lucide-react";
import { fetchGraphQL } from "@/lib/graphqlClient";
import { useNotifications } from "@/lib/notificationContext";

/* ─── GraphQL ─────────────────────────────────────────── */
const GET_DATA = `
  query {
    departments { id name description managerId managerFirstName managerLastName employeeCount }
    positions   { id title description standardDurationDays }
  }
`;
const GET_DEPARTMENTS_WITH_POSITIONS = `
  query GetDepartmentsWithPositions {
    departments {
      id
      name
      managerId
      manager {
        id
        firstName
        lastName
      }
      positions {
        id
        title
      }
    }
  }
`;
const CREATE_DEPT = `
  mutation CreateDepartment($name: String!, $description: String) {
    createDepartment(name: $name, description: $description) {
      id name description managerFirstName managerLastName
    }
  }
`;
const DELETE_DEPT = `
  mutation DeleteDepartment($id: ID!) { deleteDepartment(id: $id) { id } }
`;
const CREATE_POS = `
  mutation CreatePosition($title: String!, $departmentId: String!, $description: String, $standardDurationDays: Int) {
    createPosition(title: $title, departmentId: $departmentId, description: $description, standardDurationDays: $standardDurationDays) {
      id title description standardDurationDays
    }
  }
`;
const DELETE_POS = `
  mutation DeletePosition($id: ID!) { deletePosition(id: $id) { id } }
`;
const CREATE_USER = `
  mutation CreateUser(
    $email: String!, $firstName: String!, $lastName: String!,
    $role: Role!, $positionId: String!, $startDate: String!
  ) {
    createUser(createUserInput: {
      email: $email, firstName: $firstName, lastName: $lastName,
      role: $role, positionId: $positionId, startDate: $startDate
    }) {
      id email firstName lastName role isActive
    }
  }
`;

/* ─── Types ────────────────────────────────────────────── */
interface Dept {
  id: string; name: string; description?: string;
  managerFirstName?: string; managerLastName?: string;
  employeeCount?: number;
}
interface Pos {
  id: string; title: string; description?: string; standardDurationDays: number;
}
interface Department {
  id: string;
  name: string;
  managerId?: string;
  manager?: { id: string; firstName: string; lastName: string };
  positions: { id: string; title: string }[];
}
interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  isActive: boolean;
}

/* ─── Small reusable Modal shell ───────────────────────── */
function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">{title}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

/* ─── Input helper ─────────────────────────────────────── */
function Field({ label, ...props }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-1.5">{label}</label>
      <input
        {...props}
        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent text-sm transition-all bg-gray-50 focus:bg-white"
      />
    </div>
  );
}

/* ─── Page ─────────────────────────────────────────────── */
export default function OrganizationManagementPage() {
  const { addToast } = useNotifications();
  const [depts, setDepts] = useState<Dept[]>([]);
  const [positions, setPositions] = useState<Pos[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDept, setSelectedDept] = useState<Department | null>(null);
  const [loading, setLoading] = useState(true);

  // Department modal state
  const [showDeptModal, setShowDeptModal] = useState(false);
  const [deptForm, setDeptForm] = useState({ name: "", description: "" });
  const [deptSaving, setDeptSaving] = useState(false);
  const [deletingDept, setDeletingDept] = useState<string | null>(null);

  // Position modal state
  const [showPosModal, setShowPosModal] = useState(false);
  const [posForm, setPosForm] = useState({
    title: "",
    description: "",
    standardDurationDays: "30",
    departmentId: "", // ✅ ajouté
  });
  const [posSaving, setPosSaving] = useState(false);
  const [deletingPos, setDeletingPos] = useState<string | null>(null);

  // Confirmation modal state
  const [confirmModal, setConfirmModal] = useState<{ type: "dept" | "pos"; id: string; name: string } | null>(null);

  // Employee form state
  const [form, setForm] = useState({
    email: "",
    firstName: "",
    lastName: "",
    role: "EMPLOYEE",
    positionId: "",
    startDate: new Date().toISOString().split("T")[0],
  });

  // Employee modal state
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    Promise.all([
      fetchGraphQL<{ departments: Dept[]; positions: Pos[] }>(GET_DATA),
      fetchGraphQL<{ departments: Department[] }>(GET_DEPARTMENTS_WITH_POSITIONS),
    ])
      .then(([data, deptData]) => {
        setDepts(data.departments);
        setPositions(data.positions);
        setDepartments(deptData.departments);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  /* ── Create Department ── */
  const handleCreateDept = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deptForm.name.trim()) return;
    setDeptSaving(true);
    try {
      const data = await fetchGraphQL<{ createDepartment: Dept }>(CREATE_DEPT, {
        name: deptForm.name.trim(),
        description: deptForm.description.trim() || undefined,
      });
      setDepts((prev) => [data.createDepartment, ...prev]);
      setDeptForm({ name: "", description: "" });
      setShowDeptModal(false);
      addToast({ type: "success", title: "Département créé", message: `"${data.createDepartment.name}" a été ajouté avec succès.` });
    } catch (e) {
      console.error(e);
      addToast({ type: "error", title: "Erreur", message: "Impossible de créer le département." });
    } finally {
      setDeptSaving(false);
    }
  };

  /* ── Delete Department ── */
  const handleDeleteDept = async (id: string) => {
    setDeletingDept(id);
    try {
      await fetchGraphQL(DELETE_DEPT, { id });
      setDepts((prev) => prev.filter((d) => d.id !== id));
      addToast({ type: "success", title: "Département supprimé", message: "Le département a été supprimé avec succès." });
    } catch (e) {
      console.error(e);
      addToast({ type: "error", title: "Erreur", message: "Impossible de supprimer le département." });
    } finally {
      setDeletingDept(null);
      setConfirmModal(null);
    }
  };

  /* ── Create Position ── */
  const handleCreatePos = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!posForm.title.trim() || !posForm.departmentId) return; // ✅ validation departmentId
    setPosSaving(true);
    try {
      const data = await fetchGraphQL<{ createPosition: Pos }>(CREATE_POS, {
        title: posForm.title.trim(),
        departmentId: posForm.departmentId, // ✅ ajouté
        description: posForm.description.trim() || undefined,
        standardDurationDays: parseInt(posForm.standardDurationDays) || 30,
      });
      setPositions((prev) => [data.createPosition, ...prev]);
      setPosForm({ title: "", description: "", standardDurationDays: "30", departmentId: "" });
      setShowPosModal(false);
      addToast({ type: "success", title: "Poste créé", message: `"${data.createPosition.title}" a été ajouté avec succès.` });
    } catch (e) {
      console.error(e);
      addToast({ type: "error", title: "Erreur", message: "Impossible de créer le poste." });
    } finally {
      setPosSaving(false);
    }
  };

  /* ── Delete Position ── */
  const handleDeletePos = async (id: string) => {
    setDeletingPos(id);
    try {
      await fetchGraphQL(DELETE_POS, { id });
      setPositions((prev) => prev.filter((p) => p.id !== id));
      addToast({ type: "success", title: "Poste supprimé", message: "Le poste a été supprimé avec succès." });
    } catch (e) {
      console.error(e);
      addToast({ type: "error", title: "Erreur", message: "Impossible de supprimer le poste." });
    } finally {
      setDeletingPos(null);
      setConfirmModal(null);
    }
  };

  /* ── Create Employee ── */
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);
    if (!form.email.trim() || !form.firstName.trim() || !form.lastName.trim() || !form.positionId || !form.startDate || !selectedDept) {
      setModalError("Tous les champs obligatoires doivent être remplis.");
      return;
    }
    setSubmitting(true);
    try {
      const data = await fetchGraphQL<{ createUser: User }>(CREATE_USER, {
        email: form.email,
        firstName: form.firstName,
        lastName: form.lastName,
        role: form.role,
        positionId: form.positionId,
        startDate: form.startDate,
      });
      addToast({ type: "success", title: "Salarié créé", message: `${data.createUser.firstName} ${data.createUser.lastName} a été ajouté avec succès.` });
      setForm({ email: "", firstName: "", lastName: "", role: "EMPLOYEE", positionId: "", startDate: new Date().toISOString().split("T")[0] });
      setSelectedDept(null);
      setShowModal(false);
    } catch (err: any) {
      setModalError(err.message || "Impossible de créer le salarié.");
      addToast({ type: "error", title: "Erreur", message: "Impossible de créer le salarié." });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Départements & Postes</h1>
        <p className="text-gray-500 mt-1">Gérez la structure organisationnelle de votre entreprise.</p>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-24">
          <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

          {/* ── Départements ── */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <span className="p-2 bg-blue-50 rounded-lg"><Building2 className="w-5 h-5 text-blue-600" /></span>
                Départements
                <span className="bg-blue-100 text-blue-700 text-xs font-semibold px-2 py-0.5 rounded-full">{depts.length}</span>
              </h2>
              <button
                onClick={() => setShowDeptModal(true)}
                className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-2 rounded-xl font-semibold flex items-center gap-1.5 transition-colors shadow-sm shadow-blue-200"
              >
                <Plus className="w-4 h-4" /> Nouveau
              </button>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              {depts.length === 0 ? (
                <div className="p-10 text-center text-gray-400">
                  <Building2 className="w-10 h-10 mx-auto mb-2 text-gray-200" />
                  <p className="text-sm font-medium">Aucun département créé</p>
                </div>
              ) : (
                <ul className="divide-y divide-gray-50">
                  {depts.map((dept) => (
                    <li key={dept.id} className="p-5 hover:bg-blue-50/30 transition-colors group">
                      <div className="flex justify-between items-start">
                        <div className="flex items-start gap-3">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-sm">
                            {dept.name[0]}
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900">{dept.name}</h3>
                            {dept.description && <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{dept.description}</p>}
                            {(dept.managerFirstName || dept.managerLastName) && (
                              <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                                <Users className="w-3 h-3" />
                                Manager: <span className="font-medium text-gray-700">{dept.managerFirstName} {dept.managerLastName}</span>
                              </p>
                            )}
                            {dept.employeeCount !== undefined && (
                              <p className="text-xs text-gray-400 mt-0.5">{dept.employeeCount} employé{dept.employeeCount !== 1 ? 's' : ''}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => setConfirmModal({ type: "dept", id: dept.id, name: dept.name })}
                            disabled={deletingDept === dept.id}
                            className="p-1.5 rounded-lg hover:bg-red-50 hover:text-red-600 text-gray-400 transition-colors disabled:opacity-40"
                          >
                            {deletingDept === dept.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* ── Postes ── */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <span className="p-2 bg-purple-50 rounded-lg"><Briefcase className="w-5 h-5 text-purple-600" /></span>
                Référentiel des Postes
                <span className="bg-purple-100 text-purple-700 text-xs font-semibold px-2 py-0.5 rounded-full">{positions.length}</span>
              </h2>
              <button
                onClick={() => setShowPosModal(true)}
                className="text-sm bg-purple-600 hover:bg-purple-700 text-white px-3.5 py-2 rounded-xl font-semibold flex items-center gap-1.5 transition-colors shadow-sm shadow-purple-200"
              >
                <Plus className="w-4 h-4" /> Nouveau
              </button>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              {positions.length === 0 ? (
                <div className="p-10 text-center text-gray-400">
                  <Briefcase className="w-10 h-10 mx-auto mb-2 text-gray-200" />
                  <p className="text-sm font-medium">Aucun poste créé</p>
                </div>
              ) : (
                <ul className="divide-y divide-gray-50">
                  {positions.map((pos) => (
                    <li key={pos.id} className="p-5 hover:bg-purple-50/30 transition-colors group">
                      <div className="flex justify-between items-start">
                        <div className="flex items-start gap-3">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-sm">
                            {pos.title[0]}
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900">{pos.title}</h3>
                            {pos.description && <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{pos.description}</p>}
                            <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              Durée standard: <span className="font-medium text-gray-700">{pos.standardDurationDays} jours</span>
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => setConfirmModal({ type: "pos", id: pos.id, name: pos.title })}
                            disabled={deletingPos === pos.id}
                            className="p-1.5 rounded-lg hover:bg-red-50 hover:text-red-600 text-gray-400 transition-colors disabled:opacity-40"
                          >
                            {deletingPos === pos.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: Nouveau Département ── */}
      {showDeptModal && (
        <Modal title="Nouveau Département" onClose={() => setShowDeptModal(false)}>
          <form onSubmit={handleCreateDept} className="space-y-4">
            <Field
              label="Nom du département *"
              placeholder="ex: Ingénierie"
              value={deptForm.name}
              onChange={(e) => setDeptForm((f) => ({ ...f, name: e.target.value }))}
              required
              autoFocus
            />
            <Field
              label="Description"
              placeholder="Description optionnelle..."
              value={deptForm.description}
              onChange={(e) => setDeptForm((f) => ({ ...f, description: e.target.value }))}
            />
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowDeptModal(false)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={deptSaving || !deptForm.name.trim()}
                className="flex-1 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {deptSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Créer
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ── Modal: Nouveau Poste ── */}
      {showPosModal && (
        <Modal title="Nouveau Poste" onClose={() => setShowPosModal(false)}>
          <form onSubmit={handleCreatePos} className="space-y-4">

            {/* ✅ Sélecteur de département ajouté */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Département *</label>
              <select
                required
                value={posForm.departmentId}
                onChange={(e) => setPosForm((f) => ({ ...f, departmentId: e.target.value }))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent text-sm transition-all bg-gray-50 focus:bg-white"
              >
                <option value="">— Sélectionner un département —</option>
                {depts.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>

            <Field
              label="Intitulé du poste *"
              placeholder="ex: Développeur Frontend"
              value={posForm.title}
              onChange={(e) => setPosForm((f) => ({ ...f, title: e.target.value }))}
              required
              autoFocus
            />
            <Field
              label="Description"
              placeholder="Description du poste..."
              value={posForm.description}
              onChange={(e) => setPosForm((f) => ({ ...f, description: e.target.value }))}
            />
            <Field
              label="Durée standard (jours)"
              type="number"
              min="1"
              max="365"
              value={posForm.standardDurationDays}
              onChange={(e) => setPosForm((f) => ({ ...f, standardDurationDays: e.target.value }))}
            />
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowPosModal(false)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={posSaving || !posForm.title.trim() || !posForm.departmentId} // ✅ validation departmentId
                className="flex-1 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {posSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Créer
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ──────── MODAL CRÉATION SALARIÉ ──────── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">Nouveau salarié</h2>
              <button onClick={() => { setShowModal(false); setSelectedDept(null); }} disabled={submitting}>
                <X className="w-5 h-5 text-gray-400 hover:text-gray-700" />
              </button>
            </div>

            {modalError && (
              <div className="mb-4 bg-rose-50 border border-rose-100 text-rose-700 p-3.5 rounded-xl text-xs font-semibold">
                ⚠️ {modalError}
              </div>
            )}

            <form onSubmit={handleCreate} className="space-y-4">
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest">Identité</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Prénom *</label>
                  <input type="text" required value={form.firstName}
                    onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900"
                    placeholder="Nour" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Nom *</label>
                  <input type="text" required value={form.lastName}
                    onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900"
                    placeholder="Ben Ali" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Email professionnel *</label>
                <input type="email" required value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900"
                  placeholder="nour.benali@entreprise.com" />
              </div>

              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest pt-2">Affectation</p>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Département *</label>
                <select
                  required
                  value={selectedDept?.id ?? ""}
                  onChange={(e) => {
                    const dept = departments.find((d) => d.id === e.target.value) ?? null;
                    setSelectedDept(dept);
                    setForm({ ...form, positionId: "" });
                  }}
                  className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-gray-900"
                >
                  <option value="">— Sélectionner un département —</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Poste *</label>
                  <select
                    required
                    disabled={!selectedDept}
                    value={form.positionId}
                    onChange={(e) => setForm({ ...form, positionId: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-gray-900 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <option value="">— Sélectionner —</option>
                    {selectedDept?.positions.map((p) => (
                      <option key={p.id} value={p.id}>{p.title}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Manager référent</label>
                  <div className={`w-full border rounded-xl px-3.5 py-2.5 text-sm flex items-center gap-2 ${
                    selectedDept?.manager
                      ? "border-gray-200 bg-gray-50 text-gray-700"
                      : "border-dashed border-gray-200 bg-gray-50 text-gray-400"
                  }`}>
                    {selectedDept?.manager ? (
                      <>
                        <div className="w-5 h-5 rounded-full bg-indigo-100 flex items-center justify-center text-[10px] font-bold text-indigo-600">
                          {selectedDept.manager.firstName[0]}{selectedDept.manager.lastName[0]}
                        </div>
                        <span className="font-medium">
                          {selectedDept.manager.firstName} {selectedDept.manager.lastName}
                        </span>
                      </>
                    ) : (
                      <span className="italic text-xs">Aucun manager assigné</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Rôle *</label>
                  <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-gray-900">
                    <option value="EMPLOYEE">Salarié</option>
                    <option value="MANAGER">Manager</option>
                    <option value="ADMIN">RH / Admin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Date d&apos;affectation *</label>
                  <input type="date" required value={form.startDate}
                    onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900" />
                  <p className="text-[11px] text-gray-400 mt-1">📅 Base de calcul des échéances</p>
                </div>
              </div>

              <div className="p-3.5 bg-indigo-50 rounded-xl text-xs text-indigo-700 leading-relaxed font-medium">
                ℹ️ Les tâches d&apos;onboarding seront générées automatiquement. Mot de passe temporaire : <strong>password123</strong>.
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => { setShowModal(false); setSelectedDept(null); }} disabled={submitting}
                  className="flex-1 border border-gray-200 text-gray-700 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50">
                  Annuler
                </button>
                <button type="submit"
                  disabled={!form.email || !form.firstName || !form.lastName || !form.positionId || !form.startDate || submitting}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  Créer le salarié
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Confirmation Modal ── */}
      {confirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setConfirmModal(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6 text-center">
            <div className="w-14 h-14 rounded-full bg-rose-100 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-7 h-7 text-rose-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Confirmer la suppression</h3>
            <p className="text-sm text-gray-500 mb-6">
              Êtes-vous sûr de vouloir supprimer <strong className="text-gray-900">&quot;{confirmModal.name}&quot;</strong> ?
              Cette action est irréversible.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmModal(null)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={() => confirmModal.type === "dept" ? handleDeleteDept(confirmModal.id) : handleDeletePos(confirmModal.id)}
                className="flex-1 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}