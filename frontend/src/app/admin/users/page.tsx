"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { UserPlus, Search, Edit2, Trash2, Shield, Filter, Loader2, X, ChevronDown, Users, AlertTriangle, Plus } from 'lucide-react';
import { fetchGraphQL } from '@/lib/graphqlClient';
import { useNotifications } from '@/lib/notificationContext';

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

const GET_USERS = `
  query GetUsers {
    users { id email firstName lastName role isActive }
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

const CREATE_USER = `
  mutation CreateUser($email: String!, $firstName: String!, $lastName: String!, $role: Role!) {
    createUser(createUserInput: { email: $email, firstName: $firstName, lastName: $lastName, role: $role }) {
      id email firstName lastName role isActive
    }
  }
`;

const CREATE_USER_EMPLOYEE = `
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

const ROLE_OPTIONS = [
  { value: "", label: "Tous les rôles" },
  { value: "ADMIN", label: "RH/Admin" },
  { value: "MANAGER", label: "Manager" },
  { value: "EMPLOYEE", label: "Salarié" },
];

export default function UsersManagementPage() {
  const { addToast } = useNotifications();
  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDept, setSelectedDept] = useState<Department | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Search & filter
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  
  // Create modal
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ email: "", firstName: "", lastName: "", role: "EMPLOYEE" });
  const [modalError, setModalError] = useState<string | null>(null);

  // Employee modal
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [submittingEmployee, setSubmittingEmployee] = useState(false);
  const [employeeForm, setEmployeeForm] = useState({
    email: "",
    firstName: "",
    lastName: "",
    role: "EMPLOYEE",
    positionId: "",
    startDate: new Date().toISOString().split("T")[0],
  });
  const [employeeModalError, setEmployeeModalError] = useState<string | null>(null);

  // Edit modal
  const [editUser, setEditUser] = useState<User | null>(null);
  const [editForm, setEditForm] = useState({ firstName: "", lastName: "", email: "", role: "EMPLOYEE", isActive: true });
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Delete confirm
  const [deleteConfirm, setDeleteConfirm] = useState<User | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    async function loadUsers() {
      try {
        const [usersData, deptsData] = await Promise.all([
          fetchGraphQL<{ users: User[] }>(GET_USERS),
          fetchGraphQL<{ departments: Department[] }>(GET_DEPARTMENTS_WITH_POSITIONS),
        ]);
        setUsers(usersData.users);
        setDepartments(deptsData.departments);
      } catch (err: any) {
        console.error(err);
        setError("Impossible de charger les données.");
      } finally {
        setLoading(false);
      }
    }
    loadUsers();
  }, []);

  // Filtered users
  const filteredUsers = useMemo(() => {
    let result = users;
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((u) =>
        `${u.firstName} ${u.lastName} ${u.email}`.toLowerCase().includes(q)
      );
    }
    if (roleFilter) {
      result = result.filter((u) => u.role === roleFilter);
    }
    return result;
  }, [users, search, roleFilter]);

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'RH/Admin';
      case 'MANAGER': return 'Manager';
      case 'EMPLOYEE': return 'Salarié';
      default: return role;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'MANAGER': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'EMPLOYEE': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const getInitials = (first: string, last: string) => {
    return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email || !form.firstName || !form.lastName || !form.role) {
      setModalError("Veuillez remplir tous les champs obligatoires.");
      return;
    }
    setSubmitting(true);
    setModalError(null);

    try {
      const data = await fetchGraphQL<{ createUser: User }>(CREATE_USER, {
        email: form.email,
        firstName: form.firstName,
        lastName: form.lastName,
        role: form.role,
      });

      if (data && data.createUser) {
        setUsers((prev) => [data.createUser, ...prev]);
        setShowModal(false);
        setForm({ email: "", firstName: "", lastName: "", role: "EMPLOYEE" });
        addToast({
          type: "success",
          title: "Utilisateur créé",
          message: `${data.createUser.firstName} ${data.createUser.lastName} a été ajouté avec succès.`,
        });
      } else {
        setModalError("Une erreur s'est produite lors de la création.");
      }
    } catch (err: any) {
      console.error(err);
      setModalError(err.message || "Erreur de création de l'utilisateur.");
    } finally {
      setSubmitting(false);
    }
  };

  // Edit user
  const openEdit = (u: User) => {
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
      const data = await fetchGraphQL<{ updateUser: User }>(UPDATE_USER, {
        id: editUser.id, ...editForm,
      });
      setUsers((prev) => prev.map((u) => u.id === editUser.id ? data.updateUser : u));
      setEditUser(null);
      addToast({ type: "success", title: "Utilisateur modifié", message: `${data.updateUser.firstName} ${data.updateUser.lastName} mis à jour.` });
    } catch (err: any) {
      setEditError(err.message || "Erreur de modification.");
    } finally {
      setEditSubmitting(false);
    }
  };

  // Delete user
  const handleDelete = async () => {
    if (!deleteConfirm) return;
    setDeleting(true);
    try {
      await fetchGraphQL(DELETE_USER, { id: deleteConfirm.id });
      setUsers((prev) => prev.filter((u) => u.id !== deleteConfirm.id));
      setDeleteConfirm(null);
      addToast({ type: "success", title: "Utilisateur supprimé", message: "L'utilisateur a été supprimé avec succès." });
    } catch (err: any) {
      addToast({ type: "error", title: "Erreur", message: err.message || "Impossible de supprimer." });
    } finally {
      setDeleting(false);
    }
  };

  // Create employee
  const handleCreateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmployeeModalError(null);
    if (!employeeForm.email || !employeeForm.firstName || !employeeForm.lastName || !employeeForm.positionId || !employeeForm.startDate || !selectedDept) {
      setEmployeeModalError("Tous les champs obligatoires doivent être remplis.");
      return;
    }
    setSubmittingEmployee(true);
    try {
      const data = await fetchGraphQL<{ createUser: User }>(CREATE_USER_EMPLOYEE, {
        email: employeeForm.email,
        firstName: employeeForm.firstName,
        lastName: employeeForm.lastName,
        role: employeeForm.role,
        positionId: employeeForm.positionId,
        startDate: employeeForm.startDate,
      });
      setUsers((prev) => [data.createUser, ...prev]);
      setShowEmployeeModal(false);
      setEmployeeForm({
        email: "",
        firstName: "",
        lastName: "",
        role: "EMPLOYEE",
        positionId: "",
        startDate: new Date().toISOString().split("T")[0],
      });
      setSelectedDept(null);
      addToast({
        type: "success",
        title: "Salarié créé",
        message: `${data.createUser.firstName} ${data.createUser.lastName} a été ajouté avec succès.`,
      });
    } catch (err: any) {
      console.error(err);
      setEmployeeModalError(err.message || "Erreur de création du salarié.");
    } finally {
      setSubmittingEmployee(false);
    }
  };

  // Stats
  const adminCount = users.filter(u => u.role === 'ADMIN').length;
  const managerCount = users.filter(u => u.role === 'MANAGER').length;
  const employeeCount = users.filter(u => u.role === 'EMPLOYEE').length;

  return (
    <div className="space-y-6 pb-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Utilisateurs</h1>
          <p className="text-gray-500 mt-1">Gérez les accès et les rôles de votre plateforme.</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto flex-col sm:flex-row">
          <button 
            onClick={() => { setEmployeeModalError(null); setShowEmployeeModal(true); }}
            className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white px-5 py-2.5 rounded-xl font-semibold shadow-md shadow-emerald-200 transition-all flex items-center justify-center space-x-2 order-first sm:order-last"
          >
            <Plus className="w-5 h-5" />
            <span>Nouveau salarié</span>
          </button>
          <button 
            onClick={() => { setModalError(null); setShowModal(true); }}
            className="bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white px-5 py-2.5 rounded-xl font-semibold shadow-md shadow-indigo-200 transition-all flex items-center justify-center space-x-2"
          >
            <UserPlus className="w-5 h-5" />
            <span>Nouvel Utilisateur</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total", value: users.length, cls: "text-indigo-600", bg: "bg-indigo-50", icon: Users },
          { label: "Admins RH", value: adminCount, cls: "text-purple-600", bg: "bg-purple-50", icon: Shield },
          { label: "Managers", value: managerCount, cls: "text-blue-600", bg: "bg-blue-50", icon: Users },
          { label: "Salariés", value: employeeCount, cls: "text-emerald-600", bg: "bg-emerald-50", icon: Users },
        ].map(({ label, value, cls, bg }) => (
          <div key={label} className={`${bg} rounded-2xl p-4 border border-white`}>
            <p className={`text-2xl font-extrabold ${cls}`}>{loading ? "…" : value}</p>
            <p className="text-xs text-gray-500 font-medium mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-100 overflow-hidden">
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
                <button 
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <div className="flex items-center space-x-3 w-full sm:w-auto">
              <button 
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center justify-center px-4 py-2.5 rounded-xl text-sm font-medium transition-colors shadow-sm w-full sm:w-auto border ${
                  showFilters || roleFilter
                    ? "bg-indigo-50 border-indigo-200 text-indigo-700"
                    : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-indigo-600"
                }`}
              >
                <Filter className="w-4 h-4 mr-2" /> 
                Filtres
                {roleFilter && <span className="ml-1.5 bg-indigo-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">1</span>}
              </button>
            </div>
          </div>

          {/* Filter row */}
          {showFilters && (
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-gray-200/50 animate-in fade-in slide-in-from-top-1 duration-200">
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
        
        {loading ? (
          <div className="flex justify-center items-center py-20 text-indigo-600">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        ) : error ? (
          <div className="text-center py-10 text-rose-500 font-medium bg-rose-50/50 m-4 rounded-xl border border-rose-100">
            {error}
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-20 text-gray-500 flex flex-col items-center">
            <Users className="w-12 h-12 text-gray-200 mb-3" />
            <p className="font-medium">Aucun utilisateur trouvé</p>
            {search && <p className="text-xs text-gray-400 mt-1">Essayez avec d&apos;autres termes de recherche.</p>}
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
                  <tr key={user.id} className="hover:bg-indigo-50/30 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm bg-gradient-to-br from-indigo-500 to-blue-500 shadow-sm">
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
                        {user.role === 'ADMIN' && <Shield className="w-3 h-3 mr-1" />}
                        {getRoleLabel(user.role)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                        user.isActive ? 'bg-emerald-100/80 text-emerald-700 border border-emerald-200' : 'bg-gray-100 text-gray-600 border border-gray-200'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${user.isActive ? 'bg-emerald-500' : 'bg-gray-400'}`}></span>
                        {user.isActive ? 'Actif' : 'Inactif'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => openEdit(user)}
                          className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="Modifier"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(user)}
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
          <span>Affichage de <span className="font-semibold text-gray-900">{filteredUsers.length}</span>{filteredUsers.length !== users.length && ` sur ${users.length}`} utilisateurs</span>
        </div>
      </div>

      {/* Creation Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">Nouvel Utilisateur</h2>
              <button 
                onClick={() => setShowModal(false)} 
                className="text-gray-400 hover:text-gray-700 transition-colors"
                disabled={submitting}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalError && (
              <div className="mb-4 bg-rose-50 border border-rose-100 text-rose-700 p-3.5 rounded-xl text-xs font-semibold">
                ⚠️ {modalError}
              </div>
            )}

            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Prénom *</label>
                  <input 
                    type="text"
                    required
                    value={form.firstName} 
                    onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900"
                    placeholder="Jean" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Nom *</label>
                  <input 
                    type="text"
                    required
                    value={form.lastName} 
                    onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900"
                    placeholder="Dupont" 
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Email professionnel *</label>
                <input 
                  type="email" 
                  required
                  value={form.email} 
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900"
                  placeholder="jean.dupont@entreprise.com" 
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Rôle *</label>
                <select 
                  value={form.role} 
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-gray-900 font-medium"
                >
                  <option value="EMPLOYEE">Salarié</option>
                  <option value="MANAGER">Manager</option>
                  <option value="ADMIN">RH/Admin</option>
                </select>
              </div>

              <div className="p-3.5 bg-indigo-50 rounded-xl text-xs text-indigo-700 leading-relaxed font-medium">
                ℹ️ Un mot de passe temporaire <strong>password123</strong> sera configuré. L&apos;utilisateur pourra le réinitialiser ultérieurement.
              </div>

              <div className="flex gap-3 pt-4">
                <button 
                  type="button"
                  onClick={() => setShowModal(false)}
                  disabled={submitting}
                  className="flex-1 border border-gray-200 text-gray-700 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={!form.email || !form.firstName || !form.lastName || submitting}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  Créer l&apos;utilisateur
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ──────── MODAL CRÉATION SALARIÉ ──────── */}
      {showEmployeeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            
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

              {/* ── Identité ── */}
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

              {/* ── Affectation ── */}
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest pt-2">Affectation</p>

              {/* Département */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Département *</label>
                <select
                  required
                  value={selectedDept?.id ?? ""}
                  onChange={(e) => {
                    const dept = departments.find((d) => d.id === e.target.value) ?? null;
                    setSelectedDept(dept);
                    setEmployeeForm({ ...employeeForm, positionId: "" }); // reset poste
                  }}
                  className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-gray-900"
                >
                  <option value="">— Sélectionner un département —</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>

              {/* Poste + Manager sur la même ligne */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Poste *</label>
                  <select
                    required
                    disabled={!selectedDept}
                    value={employeeForm.positionId}
                    onChange={(e) => setEmployeeForm({ ...employeeForm, positionId: e.target.value })}
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

              {/* Rôle + Date d'affectation */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Rôle *</label>
                  <select value={employeeForm.role} onChange={(e) => setEmployeeForm({ ...employeeForm, role: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-gray-900">
                    <option value="EMPLOYEE">Salarié</option>
                    <option value="MANAGER">Manager</option>
                    <option value="ADMIN">RH / Admin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Date d'affectation *</label>
                  <input type="date" required value={employeeForm.startDate}
                    onChange={(e) => setEmployeeForm({ ...employeeForm, startDate: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900" />
                  <p className="text-[11px] text-gray-400 mt-1">📅 Base de calcul des échéances</p>
                </div>
              </div>

              <div className="p-3.5 bg-indigo-50 rounded-xl text-xs text-indigo-700 leading-relaxed font-medium">
                ℹ️ Les tâches d'onboarding seront générées automatiquement à partir de la date d'affectation. Mot de passe temporaire : <strong>password123</strong>.
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => { setShowEmployeeModal(false); setSelectedDept(null); }} disabled={submittingEmployee}
                  className="flex-1 border border-gray-200 text-gray-700 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50">
                  Annuler
                </button>
                <button type="submit"
                  disabled={!employeeForm.email || !employeeForm.firstName || !employeeForm.lastName || !employeeForm.positionId || !employeeForm.startDate || submittingEmployee}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                  {submittingEmployee && <Loader2 className="w-4 h-4 animate-spin" />}
                  Créer le salarié
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">Modifier l&apos;utilisateur</h2>
              <button onClick={() => setEditUser(null)} className="text-gray-400 hover:text-gray-700 transition-colors" disabled={editSubmitting}>
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
                  className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-gray-900 font-medium">
                  <option value="EMPLOYEE">Salarié</option>
                  <option value="MANAGER">Manager</option>
                  <option value="ADMIN">RH/Admin</option>
                </select>
              </div>
              <div className="flex items-center gap-3">
                <label className="text-sm font-semibold text-gray-700">Statut :</label>
                <button type="button" onClick={() => setEditForm({ ...editForm, isActive: !editForm.isActive })}
                  className={`relative w-12 h-6 rounded-full transition-colors ${editForm.isActive ? 'bg-emerald-500' : 'bg-gray-300'}`}>
                  <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${editForm.isActive ? 'left-6' : 'left-0.5'}`} />
                </button>
                <span className={`text-sm font-medium ${editForm.isActive ? 'text-emerald-600' : 'text-gray-500'}`}>{editForm.isActive ? 'Actif' : 'Inactif'}</span>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setEditUser(null)} disabled={editSubmitting}
                  className="flex-1 border border-gray-200 text-gray-700 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50">Annuler</button>
                <button type="submit" disabled={editSubmitting}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                  {editSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
            <div className="w-14 h-14 rounded-full bg-rose-100 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-7 h-7 text-rose-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Confirmer la suppression</h3>
            <p className="text-sm text-gray-500 mb-6">
              Supprimer <strong className="text-gray-900">{deleteConfirm.firstName} {deleteConfirm.lastName}</strong> ?<br />
              <span className="text-rose-500 text-xs">Cette action est irréversible et supprime toutes les données associées.</span>
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} disabled={deleting}
                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50">Annuler</button>
              <button onClick={handleDelete} disabled={deleting}
                className="flex-1 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-sm font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
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
