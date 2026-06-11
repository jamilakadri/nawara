"use client";

import React, { useEffect, useState, useMemo } from 'react';
import {
  Search, Edit2, Trash2, Shield, Filter, Loader2, X,
  Users, AlertTriangle, Plus, FileText, Phone, MapPin,
  Calendar, AlertCircle, MessageSquare, CheckCircle,
  Clock, XCircle, Bot, Building2, Briefcase, Mail,
  User, BadgeCheck,
} from 'lucide-react';
import { fetchGraphQL } from '@/lib/graphqlClient';
import { useNotifications } from '@/lib/notificationContext';

// ─── Types ────────────────────────────────────────────────────────────────────

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  isActive: boolean;
}

interface Department {
  id: string;
  name: string;
  managerId?: string;
  manager?: { id: string; firstName: string; lastName: string };
  positions: { id: string; title: string }[];
}

interface Doc {
  id: string;
  name: string;
  type: string;
  url: string;
  status: string;
  uploadedAt: string;
  aiScore: number | null;
}

interface EmployeeDetail {
  id: string;
  phone: string | null;
  additionalInfo: string | null;
  onboardingId: string | null;
  positionTitle: string | null;
  departmentName: string | null;
  startDate: string;
  onboardingProgress: number | null;
  onboardingStatus: string | null;
}

// ─── GraphQL ──────────────────────────────────────────────────────────────────

const GET_USERS = `
  query GetUsers {
    users { id email firstName lastName role isActive }
  }
`;

const GET_DEPARTMENTS_WITH_POSITIONS = `
  query GetDepartmentsWithPositions {
    departments {
      id name managerId
      manager { id firstName lastName }
      positions { id title }
    }
  }
`;

const GET_EMPLOYEES = `
  query GetEmployees {
    employees {
      userId onboardingProgress onboardingStatus positionTitle departmentName
    }
  }
`;

const GET_EMPLOYEE_DETAIL = `
  query GetEmployeeByUserId($userId: ID!) {
    employeeByUserId(userId: $userId) {
      id phone additionalInfo onboardingId
      positionTitle departmentName startDate
      onboardingProgress onboardingStatus
    }
  }
`;

const GET_EMPLOYEE_DOCS = `
  query GetDocumentsByOnboarding($onboardingId: ID!) {
    documentsByOnboarding(onboardingId: $onboardingId) {
      id name type url status uploadedAt aiScore
    }
  }
`;

const CREATE_USER_EMPLOYEE = `
  mutation CreateUser(
    $email: String!, $firstName: String!, $lastName: String!,
    $role: Role!, $positionId: String, $startDate: String!
  ) {
    createUser(createUserInput: {
      email: $email, firstName: $firstName, lastName: $lastName,
      role: $role, positionId: $positionId, startDate: $startDate
    }) {
      id email firstName lastName role isActive
    }
  }
`;

const UPDATE_USER = `
  mutation UpdateUser($id: ID!, $firstName: String, $lastName: String, $email: String, $role: Role, $isActive: Boolean) {
    updateUser(id: $id, firstName: $firstName, lastName: $lastName, email: $email, role: $role, isActive: $isActive) {
      id email firstName lastName role isActive
    }
  }
`;

const DELETE_USER = `
  mutation DeleteUser($id: ID!) {
    deleteUser(id: $id) { id }
  }
`;

// ─── Constants ────────────────────────────────────────────────────────────────

const ROLE_OPTIONS = [
  { value: "", label: "Tous les rôles" },
  { value: "ADMINRH", label: "RH/Admin" },
  { value: "MANAGER", label: "Manager" },
  { value: "SALARIE", label: "Salarié" },
];

const statusConfig: Record<string, { label: string; class: string; icon: React.ReactNode }> = {
  PENDING:   { label: "En attente", class: "bg-amber-50 text-amber-700 border border-amber-200",       icon: <Clock className="w-3 h-3" /> },
  VALIDATED: { label: "Validé",     class: "bg-emerald-50 text-emerald-700 border border-emerald-200", icon: <CheckCircle className="w-3 h-3" /> },
  REJECTED:  { label: "Rejeté",     class: "bg-rose-50 text-rose-700 border border-rose-200",          icon: <XCircle className="w-3 h-3" /> },
};

// ─── Deserializer (matches page.tsx serialize format) ─────────────────────────

function deserializeAdditionalInfo(raw: string | null) {
  const defaults = { birthDate: "", residence: "", emergencyContact: "", additionalInfo: "" };
  if (!raw) return defaults;
  const parts = raw.split("||");
  for (const part of parts) {
    if (part.startsWith("DATE_NAISSANCE:"))      defaults.birthDate        = part.slice(15);
    else if (part.startsWith("RESIDENCE:"))       defaults.residence        = part.slice(10);
    else if (part.startsWith("URGENCE:"))         defaults.emergencyContact = part.slice(8);
    else if (part.startsWith("NOTE:"))            defaults.additionalInfo   = part.slice(5);
    else if (!part.includes(":") && part.trim())  defaults.additionalInfo   = part;
  }
  return defaults;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function UsersManagementPage() {
  const { addToast } = useNotifications();

  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDept, setSelectedDept] = useState<Department | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const [employeeStatus, setEmployeeStatus] = useState<Record<string, string>>({});

  // Employee detail drawer
  const [detailUser, setDetailUser] = useState<User | null>(null);
  const [detailEmployee, setDetailEmployee] = useState<EmployeeDetail | null>(null);
  const [detailDocs, setDetailDocs] = useState<Doc[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);

  // Employee create modal
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [submittingEmployee, setSubmittingEmployee] = useState(false);
  const [employeeForm, setEmployeeForm] = useState({
    email: "", firstName: "", lastName: "", role: "SALARIE",
    positionId: "", startDate: new Date().toISOString().split("T")[0],
  });
  const [employeeModalError, setEmployeeModalError] = useState<string | null>(null);

  // Edit modal
  const [editUser, setEditUser] = useState<User | null>(null);
  const [editForm, setEditForm] = useState({ firstName: "", lastName: "", email: "", role: "SALARIE", isActive: true });
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Delete confirm
  const [deleteConfirm, setDeleteConfirm] = useState<User | null>(null);
  const [deleting, setDeleting] = useState(false);

  // ── Load ──────────────────────────────────────────────────────────────────

  useEffect(() => {
    async function load() {
      try {
        const [usersData, deptsData, employeesData] = await Promise.all([
          fetchGraphQL<{ users: User[] }>(GET_USERS),
          fetchGraphQL<{ departments: Department[] }>(GET_DEPARTMENTS_WITH_POSITIONS),
          fetchGraphQL<{ employees: { userId: string; onboardingStatus?: string | null }[] }>(GET_EMPLOYEES),
        ]);
        setUsers(usersData.users);
        setDepartments(deptsData.departments);
        setEmployeeStatus(Object.fromEntries(
          employeesData.employees.map((e) => [e.userId, e.onboardingStatus ?? 'NOT_STARTED']),
        ));
      } catch (err) {
        console.error(err);
        setError("Impossible de charger les données.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // ── Row click → load employee detail ─────────────────────────────────────

  const handleRowClick = async (user: User) => {
    setDetailUser(user);
    setDetailEmployee(null);
    setDetailDocs([]);

    if (user.role !== 'SALARIE') return; // manager/admin: show basic info only

    setDetailLoading(true);
    try {
      const empRes = await fetchGraphQL<{ employeeByUserId: EmployeeDetail }>(
        GET_EMPLOYEE_DETAIL, { userId: user.id }
      );
      const emp = empRes?.employeeByUserId ?? null;
      setDetailEmployee(emp);

      if (emp?.onboardingId) {
        const docsRes = await fetchGraphQL<{ documentsByOnboarding: Doc[] }>(
          GET_EMPLOYEE_DOCS, { onboardingId: emp.onboardingId }
        );
        setDetailDocs(docsRes.documentsByOnboarding ?? []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setDetailLoading(false);
    }
  };

  // ── Filtered users ────────────────────────────────────────────────────────

  const filteredUsers = useMemo(() => {
    let result = users.filter((u) => u.role !== 'ADMINRH');
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((u) =>
        `${u.firstName} ${u.lastName} ${u.email}`.toLowerCase().includes(q)
      );
    }
    if (roleFilter) result = result.filter((u) => u.role === roleFilter);
    return result;
  }, [users, search, roleFilter]);

  // ── Helpers ───────────────────────────────────────────────────────────────

  const getRoleLabel = (role: string) => ({ ADMINRH: 'RH/Admin', MANAGER: 'Manager', SALARIE: 'Salarié' }[role] ?? role);

  const getRoleColor = (role: string) => ({
    ADMINRH: 'bg-purple-100 text-purple-700 border-purple-200',
    MANAGER: 'bg-blue-100 text-blue-700 border-blue-200',
    SALARIE: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  }[role] ?? 'bg-gray-100 text-gray-600');

  const getInitials = (f: string, l: string) => `${f[0]}${l[0]}`.toUpperCase();

  const getOnboardingLabel = (s: string) => ({
    IN_PROGRESS: 'En cours', COMPLETED: 'Terminé',
    NOT_STARTED: 'Non démarré', DELAYED: 'En retard',
  }[s] ?? s ?? '—');

  const getOnboardingColor = (s: string) => ({
    IN_PROGRESS: 'bg-amber-100 text-amber-700 border-amber-200',
    COMPLETED:   'bg-emerald-100 text-emerald-700 border-emerald-200',
    NOT_STARTED: 'bg-gray-100 text-gray-500 border-gray-200',
    DELAYED:     'bg-rose-100 text-rose-700 border-rose-200',
  }[s] ?? 'bg-gray-100 text-gray-500 border-gray-200');

  // ── Create employee ───────────────────────────────────────────────────────

  const handleCreateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmployeeModalError(null);
    if (!employeeForm.email || !employeeForm.firstName || !employeeForm.lastName || !employeeForm.startDate || !selectedDept ||
        (employeeForm.role === 'SALARIE' && !employeeForm.positionId)) {
      setEmployeeModalError("Tous les champs obligatoires doivent être remplis.");
      return;
    }
    setSubmittingEmployee(true);
    try {
      const data = await fetchGraphQL<{ createUser: User }>(CREATE_USER_EMPLOYEE, {
        email: employeeForm.email, firstName: employeeForm.firstName,
        lastName: employeeForm.lastName, role: employeeForm.role,
        positionId: employeeForm.role === 'SALARIE' ? employeeForm.positionId : null,
        startDate: employeeForm.startDate,
      });
      setUsers((prev) => [data.createUser, ...prev]);
      setShowEmployeeModal(false);
      setEmployeeForm({ email: "", firstName: "", lastName: "", role: "SALARIE", positionId: "", startDate: new Date().toISOString().split("T")[0] });
      setSelectedDept(null);
      addToast({ type: "success", title: "Salarié créé", message: `${data.createUser.firstName} ${data.createUser.lastName} ajouté.` });
    } catch (err: any) {
      setEmployeeModalError(err.message || "Erreur de création.");
    } finally {
      setSubmittingEmployee(false);
    }
  };

  // ── Edit user ─────────────────────────────────────────────────────────────

  const openEdit = (u: User, ev: React.MouseEvent) => {
    ev.stopPropagation();
    setEditUser(u);
    setEditForm({ firstName: u.firstName, lastName: u.lastName, email: u.email, role: u.role, isActive: u.isActive });
    setEditError(null);
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editUser) return;
    setEditSubmitting(true);
    setEditError(null);
    try {
      const data = await fetchGraphQL<{ updateUser: User }>(UPDATE_USER, { id: editUser.id, ...editForm });
      setUsers((prev) => prev.map((u) => u.id === editUser.id ? data.updateUser : u));
      setEditUser(null);
      addToast({ type: "success", title: "Utilisateur modifié", message: `${data.updateUser.firstName} ${data.updateUser.lastName} mis à jour.` });
    } catch (err: any) {
      setEditError(err.message || "Erreur de modification.");
    } finally {
      setEditSubmitting(false);
    }
  };

  // ── Delete user ───────────────────────────────────────────────────────────

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    setDeleting(true);
    try {
      await fetchGraphQL(DELETE_USER, { id: deleteConfirm.id });
      setUsers((prev) => prev.filter((u) => u.id !== deleteConfirm.id));
      setDeleteConfirm(null);
      addToast({ type: "success", title: "Utilisateur supprimé", message: "Supprimé avec succès." });
    } catch (err: any) {
      addToast({ type: "error", title: "Erreur", message: err.message || "Impossible de supprimer." });
    } finally {
      setDeleting(false);
    }
  };

  // ── Stats ─────────────────────────────────────────────────────────────────

  const adminCount    = users.filter(u => u.role === 'ADMINRH').length;
  const managerCount  = users.filter(u => u.role === 'MANAGER').length;
  const employeeCount = users.filter(u => u.role === 'SALARIE').length;

  // ── Detail modal content ──────────────────────────────────────────────────

  const parsed = detailEmployee ? deserializeAdditionalInfo(detailEmployee.additionalInfo) : null;

  const docsValidated = detailDocs.filter(d => d.status === 'VALIDATED').length;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6 pb-8">

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Utilisateurs</h1>
          <p className="text-gray-500 mt-1">Gérez les accès et les rôles de votre plateforme.</p>
        </div>
        <button
          onClick={() => { setEmployeeModalError(null); setShowEmployeeModal(true); }}
          className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white px-5 py-2.5 rounded-xl font-semibold shadow-md shadow-emerald-200 transition-all flex items-center gap-2"
        >
          <Plus className="w-5 h-5" /> Nouveau salarié
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total",      value: users.length,   cls: "text-indigo-600",  bg: "bg-indigo-50"  },
          { label: "Admins RH",  value: adminCount,     cls: "text-purple-600",  bg: "bg-purple-50"  },
          { label: "Managers",   value: managerCount,   cls: "text-blue-600",    bg: "bg-blue-50"    },
          { label: "Salariés",   value: employeeCount,  cls: "text-emerald-600", bg: "bg-emerald-50" },
        ].map(({ label, value, cls, bg }) => (
          <div key={label} className={`${bg} rounded-2xl p-4 border border-white`}>
            <p className={`text-2xl font-extrabold ${cls}`}>{loading ? "…" : value}</p>
            <p className="text-xs text-gray-500 font-medium mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Table card */}
      <div className="bg-white rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-100 overflow-hidden">

        {/* Search + filters */}
        <div className="p-5 border-b border-gray-100/80 bg-gray-50/50 space-y-3">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="relative w-full sm:w-80 group">
              <input
                type="text"
                placeholder="Rechercher par nom ou email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm transition-all shadow-sm"
              />
              <Search className="w-4 h-4 text-gray-400 absolute left-4 top-3.5 group-focus-within:text-indigo-500 transition-colors" />
              {search && (
                <button onClick={() => setSearch("")} className="absolute right-3 top-3 text-gray-400 hover:text-gray-600">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center justify-center px-4 py-2.5 rounded-xl text-sm font-medium transition-colors shadow-sm border ${
                showFilters || roleFilter
                  ? "bg-indigo-50 border-indigo-200 text-indigo-700"
                  : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              <Filter className="w-4 h-4 mr-2" /> Filtres
              {roleFilter && <span className="ml-1.5 bg-indigo-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">1</span>}
            </button>
          </div>

          {showFilters && (
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-gray-200/50">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Rôle :</span>
              {ROLE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setRoleFilter(opt.value)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition-all border ${
                    roleFilter === opt.value
                      ? "bg-indigo-600 text-white border-indigo-600"
                      : "bg-white text-gray-600 border-gray-200 hover:border-indigo-300"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex justify-center items-center py-20 text-indigo-600">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        ) : error ? (
          <div className="text-center py-10 text-rose-500 font-medium bg-rose-50/50 m-4 rounded-xl border border-rose-100">{error}</div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-20 text-gray-500 flex flex-col items-center">
            <Users className="w-12 h-12 text-gray-200 mb-3" />
            <p className="font-medium">Aucun utilisateur trouvé</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white text-gray-400 text-xs uppercase tracking-wider border-b border-gray-100">
                  <th className="px-6 py-4 font-semibold">Utilisateur</th>
                  <th className="px-6 py-4 font-semibold">Rôle</th>
                  <th className="px-6 py-4 font-semibold">Statut</th>
                  <th className="px-6 py-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50/80">
                {filteredUsers.map((user) => (
                  <tr
                    key={user.id}
                    onClick={() => handleRowClick(user)}
                    className="hover:bg-indigo-50/30 transition-colors group cursor-pointer"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm bg-gradient-to-br from-indigo-500 to-blue-500 shadow-sm shrink-0">
                          {getInitials(user.firstName, user.lastName)}
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900 group-hover:text-indigo-700 transition-colors">
                            {user.firstName} {user.lastName}
                          </div>
                          <div className="text-xs text-gray-500">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${getRoleColor(user.role)}`}>
                        {user.role === 'ADMINRH' && <Shield className="w-3 h-3 mr-1" />}
                        {getRoleLabel(user.role)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {user.role === 'SALARIE' ? (
                        <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${getOnboardingColor(employeeStatus[user.id] ?? 'NOT_STARTED')}`}>
                          {getOnboardingLabel(employeeStatus[user.id] ?? 'NOT_STARTED')}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={(ev) => openEdit(user, ev)}
                          className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="Modifier"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(ev) => { ev.stopPropagation(); setDeleteConfirm(user); }}
                          className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Supprimer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="px-6 py-4 border-t border-gray-100 flex justify-between items-center text-sm text-gray-500 bg-white">
          <span>
            Affichage de <span className="font-semibold text-gray-900">{filteredUsers.length}</span>
            {filteredUsers.length !== users.length && ` sur ${users.length}`} utilisateurs
          </span>
          <span className="text-xs text-indigo-400 italic">Cliquez sur une ligne pour voir le détail</span>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════
          DETAIL MODAL
      ════════════════════════════════════════════════════════════════ */}
      {detailUser && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
          onClick={() => setDetailUser(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/60 sticky top-0 z-10 rounded-t-2xl">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full flex items-center justify-center text-white font-bold bg-gradient-to-br from-indigo-500 to-blue-500 shadow-sm">
                  {getInitials(detailUser.firstName, detailUser.lastName)}
                </div>
                <div>
                  <p className="font-bold text-gray-900">{detailUser.firstName} {detailUser.lastName}</p>
                  <p className="text-xs text-gray-500">{detailUser.email}</p>
                </div>
                <span className={`ml-2 inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${getRoleColor(detailUser.role)}`}>
                  {getRoleLabel(detailUser.role)}
                </span>
              </div>
              <button onClick={() => setDetailUser(null)} className="text-gray-400 hover:text-gray-700 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">

              {/* ── Non-employee (Manager): just basic info ── */}
              {detailUser.role !== 'SALARIE' && (
                <div className="text-center py-10 text-gray-400">
                  <User className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Informations de base uniquement pour ce rôle.</p>
                </div>
              )}

              {/* ── Salarié: full detail ── */}
              {detailUser.role === 'SALARIE' && (
                <>
                  {detailLoading ? (
                    <div className="flex justify-center py-12">
                      <Loader2 className="w-7 h-7 text-indigo-400 animate-spin" />
                    </div>
                  ) : (
                    <>
                      {/* RH Info */}
                      <div>
                        <p className="text-[11px] font-bold text-indigo-500 uppercase tracking-widest mb-3">
                          Informations RH
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <InfoRow icon={<Briefcase className="w-4 h-4 text-indigo-400" />} label="Poste"        value={detailEmployee?.positionTitle  ?? "—"} />
                          <InfoRow icon={<Building2  className="w-4 h-4 text-indigo-400" />} label="Département" value={detailEmployee?.departmentName ?? "—"} />
                          <InfoRow icon={<Mail        className="w-4 h-4 text-indigo-400" />} label="Email"       value={detailUser.email} />
                          <InfoRow icon={<Calendar   className="w-4 h-4 text-indigo-400" />} label="Date d'entrée"
                            value={detailEmployee?.startDate ? new Date(detailEmployee.startDate).toLocaleDateString("fr-FR") : "—"} />
                        </div>

                        {/* Onboarding progress */}
                        {detailEmployee?.onboardingProgress != null && (
                          <div className="mt-3 bg-gray-50 rounded-xl px-4 py-3 flex items-center gap-4">
                            <span className="text-xs text-gray-500 font-medium whitespace-nowrap">Onboarding</span>
                            <div className="flex-1 h-2.5 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-emerald-500 transition-all"
                                style={{ width: `${detailEmployee.onboardingProgress}%` }}
                              />
                            </div>
                            <span className="text-xs font-bold text-indigo-600 whitespace-nowrap">
                              {Math.round(detailEmployee.onboardingProgress)}%
                            </span>
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${getOnboardingColor(detailEmployee.onboardingStatus ?? 'NOT_STARTED')}`}>
                              {getOnboardingLabel(detailEmployee.onboardingStatus ?? 'NOT_STARTED')}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Complementary info filled by employee */}
                      <div className="border-t border-dashed border-gray-100 pt-5">
                        <p className="text-[11px] font-bold text-indigo-500 uppercase tracking-widest mb-3">
                          Informations complémentaires (remplies par le salarié)
                        </p>

                        {!detailEmployee?.phone && !detailEmployee?.additionalInfo ? (
                          <p className="text-xs text-gray-400 italic">Le salarié n'a pas encore renseigné ses informations.</p>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <InfoRow icon={<Phone         className="w-4 h-4 text-indigo-400" />} label="Téléphone"        value={detailEmployee?.phone ?? "—"} />
                            <InfoRow icon={<Calendar      className="w-4 h-4 text-indigo-400" />} label="Date de naissance" value={parsed?.birthDate        ? new Date(parsed.birthDate).toLocaleDateString("fr-FR") : "—"} />
                            <InfoRow icon={<MapPin        className="w-4 h-4 text-indigo-400" />} label="Résidence"        value={parsed?.residence        || "—"} />
                            <InfoRow icon={<AlertCircle   className="w-4 h-4 text-indigo-400" />} label="Contact d'urgence" value={parsed?.emergencyContact || "—"} />
                            {parsed?.additionalInfo && (
                              <div className="sm:col-span-2">
                                <InfoRow icon={<MessageSquare className="w-4 h-4 text-indigo-400" />} label="Remarques" value={parsed.additionalInfo} />
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Documents */}
                      <div className="border-t border-dashed border-gray-100 pt-5">
                        <div className="flex items-center justify-between mb-3">
                          <p className="text-[11px] font-bold text-indigo-500 uppercase tracking-widest">
                            Documents soumis
                          </p>
                          {detailDocs.length > 0 && (
                            <span className="text-xs font-bold text-indigo-600">
                              {docsValidated} / {detailDocs.length} validés
                            </span>
                          )}
                        </div>

                        {detailDocs.length === 0 ? (
                          <p className="text-xs text-gray-400 italic">Aucun document soumis pour le moment.</p>
                        ) : (
                          <div className="space-y-2">
                            {detailDocs.map((doc) => {
                              const cfg = statusConfig[doc.status];
                              return (
                                <div key={doc.id} className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3 gap-3">
                                  <div className="flex items-center gap-3 min-w-0">
                                    <FileText className="w-4 h-4 text-indigo-400 shrink-0" />
                                    <div className="min-w-0">
                                      <p className="text-sm font-semibold text-gray-800 truncate">{doc.name}</p>
                                      <p className="text-[11px] text-gray-400">
                                        {new Date(doc.uploadedAt).toLocaleDateString("fr-FR")}
                                        {doc.aiScore != null && (
                                          <span className="ml-2 inline-flex items-center gap-0.5">
                                            <Bot className={`w-3 h-3 ${doc.aiScore > 85 ? "text-emerald-500" : doc.aiScore > 60 ? "text-amber-500" : "text-rose-500"}`} />
                                            Score IA: <strong>{doc.aiScore}%</strong>
                                          </span>
                                        )}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2 shrink-0">
                                    {cfg && (
                                      <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${cfg.class}`}>
                                        {cfg.icon}{cfg.label}
                                      </span>
                                    )}
                                    <a
                                      href={doc.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      onClick={(e) => e.stopPropagation()}
                                      className="text-xs text-indigo-500 hover:underline font-medium"
                                    >
                                      Voir
                                    </a>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════
          CREATE EMPLOYEE MODAL
      ════════════════════════════════════════════════════════════════ */}
      {showEmployeeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">Nouveau salarié</h2>
              <button onClick={() => { setShowEmployeeModal(false); setSelectedDept(null); }} disabled={submittingEmployee}>
                <X className="w-5 h-5 text-gray-400 hover:text-gray-700" />
              </button>
            </div>

            {employeeModalError && (
              <div className="mb-4 bg-rose-50 border border-rose-100 text-rose-700 p-3.5 rounded-xl text-xs font-semibold">
                ⚠️ {employeeModalError}
              </div>
            )}

            <form onSubmit={handleCreateEmployee} className="space-y-4">
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest">Identité</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Prénom *</label>
                  <input type="text" required value={employeeForm.firstName}
                    onChange={(e) => setEmployeeForm({ ...employeeForm, firstName: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900"
                    placeholder="Nour" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Nom *</label>
                  <input type="text" required value={employeeForm.lastName}
                    onChange={(e) => setEmployeeForm({ ...employeeForm, lastName: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900"
                    placeholder="Ben Ali" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Email professionnel *</label>
                <input type="email" required value={employeeForm.email}
                  onChange={(e) => setEmployeeForm({ ...employeeForm, email: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900"
                  placeholder="nour.benali@entreprise.com" />
              </div>

              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest pt-2">Affectation</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Rôle *</label>
                  <select value={employeeForm.role}
                    onChange={(e) => setEmployeeForm({ ...employeeForm, role: e.target.value, positionId: e.target.value === 'SALARIE' ? employeeForm.positionId : "" })}
                    className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-gray-900">
                    <option value="SALARIE">Salarié</option>
                    <option value="MANAGER">Manager</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Date d'affectation *</label>
                  <input type="date" required value={employeeForm.startDate}
                    onChange={(e) => setEmployeeForm({ ...employeeForm, startDate: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Département *</label>
                <select required value={selectedDept?.id ?? ""}
                  onChange={(e) => {
                    setSelectedDept(departments.find((d) => d.id === e.target.value) ?? null);
                    setEmployeeForm({ ...employeeForm, positionId: "" });
                  }}
                  className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-gray-900">
                  <option value="">— Sélectionner un département —</option>
                  {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>

              {employeeForm.role === 'SALARIE' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Poste *</label>
                    <select required disabled={!selectedDept} value={employeeForm.positionId}
                      onChange={(e) => setEmployeeForm({ ...employeeForm, positionId: e.target.value })}
                      className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-gray-900 disabled:opacity-40">
                      <option value="">— Sélectionner —</option>
                      {selectedDept?.positions.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Manager référent</label>
                    <div className={`w-full border rounded-xl px-3.5 py-2.5 text-sm flex items-center gap-2 ${selectedDept?.manager ? "border-gray-200 bg-gray-50 text-gray-700" : "border-dashed border-gray-200 bg-gray-50 text-gray-400"}`}>
                      {selectedDept?.manager ? (
                        <><div className="w-5 h-5 rounded-full bg-indigo-100 flex items-center justify-center text-[10px] font-bold text-indigo-600">
                          {selectedDept.manager.firstName[0]}{selectedDept.manager.lastName[0]}
                        </div><span className="font-medium">{selectedDept.manager.firstName} {selectedDept.manager.lastName}</span></>
                      ) : <span className="italic text-xs">Aucun manager assigné</span>}
                    </div>
                  </div>
                </div>
              )}

              <div className="p-3.5 bg-indigo-50 rounded-xl text-xs text-indigo-700 font-medium">
                ℹ️ Les tâches d'onboarding seront générées automatiquement. Mot de passe temporaire : <strong>password123</strong>.
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => { setShowEmployeeModal(false); setSelectedDept(null); }} disabled={submittingEmployee}
                  className="flex-1 border border-gray-200 text-gray-700 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-50 disabled:opacity-50">
                  Annuler
                </button>
                <button type="submit"
                  disabled={!employeeForm.email || !employeeForm.firstName || !employeeForm.lastName || !employeeForm.startDate || !selectedDept || (employeeForm.role === 'SALARIE' && !employeeForm.positionId) || submittingEmployee}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-2">
                  {submittingEmployee && <Loader2 className="w-4 h-4 animate-spin" />}
                  Créer le salarié
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════
          EDIT USER MODAL
      ════════════════════════════════════════════════════════════════ */}
      {editUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">Modifier l&apos;utilisateur</h2>
              <button onClick={() => setEditUser(null)} disabled={editSubmitting} className="text-gray-400 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            {editError && (
              <div className="mb-4 bg-rose-50 border border-rose-100 text-rose-700 p-3.5 rounded-xl text-xs font-semibold">⚠️ {editError}</div>
            )}
            <form onSubmit={handleEdit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Prénom *</label>
                  <input type="text" required value={editForm.firstName} onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Nom *</label>
                  <input type="text" required value={editForm.lastName} onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Email *</label>
                <input type="email" required value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Rôle *</label>
                <select value={editForm.role} onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-gray-900">
                  <option value="SALARIE">Salarié</option>
                  <option value="MANAGER">Manager</option>
                  <option value="ADMINRH">RH/Admin</option>
                </select>
              </div>
              <div className="flex items-center gap-3">
                <label className="text-sm font-semibold text-gray-700">Statut :</label>
                <button type="button" onClick={() => setEditForm({ ...editForm, isActive: !editForm.isActive })}
                  className={`relative w-12 h-6 rounded-full transition-colors ${editForm.isActive ? 'bg-emerald-500' : 'bg-gray-300'}`}>
                  <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${editForm.isActive ? 'left-6' : 'left-0.5'}`} />
                </button>
                <span className={`text-sm font-medium ${editForm.isActive ? 'text-emerald-600' : 'text-gray-500'}`}>
                  {editForm.isActive ? 'Actif' : 'Inactif'}
                </span>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setEditUser(null)} disabled={editSubmitting}
                  className="flex-1 border border-gray-200 text-gray-700 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-50 disabled:opacity-50">Annuler</button>
                <button type="submit" disabled={editSubmitting}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-2">
                  {editSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════
          DELETE CONFIRM MODAL
      ════════════════════════════════════════════════════════════════ */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
            <div className="w-14 h-14 rounded-full bg-rose-100 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-7 h-7 text-rose-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Confirmer la suppression</h3>
            <p className="text-sm text-gray-500 mb-6">
              Supprimer <strong className="text-gray-900">{deleteConfirm.firstName} {deleteConfirm.lastName}</strong> ?<br />
              <span className="text-rose-500 text-xs">Cette action est irréversible.</span>
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} disabled={deleting}
                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-50">Annuler</button>
              <button onClick={handleDelete} disabled={deleting}
                className="flex-1 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-2">
                {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Small reusable info row ──────────────────────────────────────────────────

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2.5 bg-gray-50 rounded-xl px-3.5 py-2.5">
      <span className="mt-0.5 shrink-0">{icon}</span>
      <div className="min-w-0">
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">{label}</p>
        <p className="text-sm font-medium text-gray-800 truncate">{value}</p>
      </div>
    </div>
  );
}