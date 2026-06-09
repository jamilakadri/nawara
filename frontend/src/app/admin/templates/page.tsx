"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  FileText, Plus, Eye, Loader2, ToggleLeft, ToggleRight, X,
  Briefcase, AlignLeft, CheckCircle2,
} from "lucide-react";
import { fetchGraphQL } from "@/lib/graphqlClient";

/* ─── GraphQL ─────────────────────────────────────────── */
const GET_TEMPLATES = `
  query {
    onboardingTemplates {
      id name description positionTitle isActive stepsCount createdAt
    }
  }
`;
const GET_POSITIONS = `
  query { positions { id title } }
`;
const TOGGLE_TEMPLATE = `
  mutation ToggleTemplateActive($id: ID!) {
    toggleTemplateActive(id: $id) { id isActive }
  }
`;
const CREATE_TEMPLATE = `
  mutation CreateOnboardingTemplate($name: String!, $positionId: String!, $description: String) {
    createOnboardingTemplate(name: $name, positionId: $positionId, description: $description) {
      id name description positionTitle isActive stepsCount createdAt
    }
  }
`;

/* ─── Types ────────────────────────────────────────────── */
interface Template {
  id: string; name: string; description?: string;
  positionTitle?: string; isActive: boolean;
  stepsCount: number; createdAt: string;
}
interface Position { id: string; title: string; }

/* ─── Modal shell ──────────────────────────────────────── */
function Modal({ title, onClose, children }: {
  title: string; onClose: () => void; children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-indigo-50 to-purple-50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
              <FileText className="w-4 h-4 text-white" />
            </div>
            <h2 className="text-lg font-bold text-gray-900">{title}</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/80 text-gray-400 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

/* ─── Field helpers ────────────────────────────────────── */
function InputField({ label, icon: Icon, ...props }: {
  label: string; icon?: React.ElementType;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-1.5">{label}</label>
      <div className="relative">
        {Icon && <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />}
        <input
          {...props}
          className={`w-full ${Icon ? "pl-9" : "px-3.5"} pr-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent text-sm bg-gray-50 focus:bg-white transition-all`}
        />
      </div>
    </div>
  );
}

function TextareaField({ label, ...props }: { label: string } & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-1.5">{label}</label>
      <textarea
        {...props}
        rows={3}
        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent text-sm bg-gray-50 focus:bg-white transition-all resize-none"
      />
    </div>
  );
}

function SelectField({ label, icon: Icon, children, ...props }: {
  label: string; icon?: React.ElementType; children: React.ReactNode;
} & React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-1.5">{label}</label>
      <div className="relative">
        {Icon && <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />}
        <select
          {...props}
          className={`w-full ${Icon ? "pl-9" : "px-3.5"} pr-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent text-sm bg-gray-50 focus:bg-white transition-all appearance-none`}
        >
          {children}
        </select>
      </div>
    </div>
  );
}

/* ─── Page ─────────────────────────────────────────────── */
export default function TemplatesManagementPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: "", positionId: "", description: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = () => {
    setLoading(true);
    Promise.all([
      fetchGraphQL<{ onboardingTemplates: Template[] }>(GET_TEMPLATES),
      fetchGraphQL<{ positions: Position[] }>(GET_POSITIONS),
    ])
      .then(([t, p]) => { setTemplates(t.onboardingTemplates); setPositions(p.positions); })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleToggle = async (id: string) => {
    setToggling(id);
    try {
      const data = await fetchGraphQL<{ toggleTemplateActive: { id: string; isActive: boolean } }>(TOGGLE_TEMPLATE, { id });
      setTemplates((prev) =>
        prev.map((t) => t.id === id ? { ...t, isActive: data.toggleTemplateActive.isActive } : t)
      );
    } catch (e) { console.error(e); }
    finally { setToggling(null); }
  };

  const openModal = () => {
    setForm({ name: "", positionId: positions[0]?.id ?? "", description: "" });
    setError("");
    setShowModal(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.positionId) {
      setError("Le nom et le poste sont obligatoires.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const data = await fetchGraphQL<{ createOnboardingTemplate: Template }>(CREATE_TEMPLATE, {
        name: form.name.trim(),
        positionId: form.positionId,
        description: form.description.trim() || undefined,
      });
      setTemplates((prev) => [data.createOnboardingTemplate, ...prev]);
      setShowModal(false);
    } catch (err: any) {
      setError(err?.message ?? "Une erreur est survenue.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Modèles Onboarding</h1>
          <p className="text-gray-500 mt-1">Gérez les parcours standards d'intégration par poste.</p>
        </div>
        <button
          onClick={openModal}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl font-semibold flex items-center gap-2 transition-colors shadow-md shadow-indigo-200 text-sm"
        >
          <Plus className="w-5 h-5" /> Créer un modèle
        </button>
      </div>

      {/* Stats bar */}
      {!loading && templates.length > 0 && (
        <div className="flex gap-4 text-sm">
          <span className="bg-green-50 text-green-700 px-3 py-1 rounded-full font-medium">
            {templates.filter(t => t.isActive).length} actifs
          </span>
          <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full font-medium">
            {templates.filter(t => !t.isActive).length} inactifs
          </span>
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="flex justify-center items-center py-24">
          <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
        </div>
      ) : templates.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-200">
          <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-indigo-300" />
          </div>
          <p className="font-semibold text-gray-700 mb-1">Aucun modèle créé</p>
          <p className="text-sm text-gray-400 mb-4">Commencez par créer votre premier modèle d'onboarding.</p>
          <button
            onClick={openModal}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors"
          >
            Créer un modèle
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((template) => (
            <div key={template.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
              <div className="p-5 flex-1">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
                    <FileText className="w-5 h-5" />
                  </div>
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                    template.isActive
                      ? "bg-green-100 text-green-800"
                      : "bg-gray-100 text-gray-600"
                  }`}>
                    {template.isActive && <CheckCircle2 className="w-3 h-3" />}
                    {template.isActive ? "Actif" : "Inactif"}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-1 leading-tight">{template.name}</h3>
                <p className="text-sm text-indigo-600 font-medium mb-2 flex items-center gap-1">
                  <Briefcase className="w-3.5 h-3.5" />
                  {template.positionTitle || "—"}
                </p>
                {template.description && (
                  <p className="text-xs text-gray-400 mb-4 line-clamp-2">{template.description}</p>
                )}
                <div className="grid grid-cols-2 gap-3 mt-4">
                  <div className="bg-gray-50 rounded-xl p-3 text-center">
                    <p className="text-xl font-bold text-indigo-600">{template.stepsCount}</p>
                    <p className="text-xs text-gray-500 font-medium mt-0.5">Étapes</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3 text-center">
                    <p className="text-sm font-bold text-gray-700">
                      {new Date(template.createdAt).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })}
                    </p>
                    <p className="text-xs text-gray-500 font-medium mt-0.5">Créé le</p>
                  </div>
                </div>
              </div>
              <div className="px-5 py-3 border-t border-gray-100 bg-gray-50/50 flex justify-between items-center">
                <Link href={`/admin/templates/${template.id}`} className="text-sm text-indigo-600 font-semibold hover:text-indigo-700 flex items-center gap-1 transition-colors">
                  <Eye className="w-4 h-4" /> Voir
                </Link>
                <button
                  onClick={() => handleToggle(template.id)}
                  disabled={toggling === template.id}
                  className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-indigo-600 transition-colors disabled:opacity-50"
                >
                  {toggling === template.id
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : template.isActive
                      ? <ToggleRight className="w-5 h-5 text-green-500" />
                      : <ToggleLeft className="w-5 h-5" />}
                  {template.isActive ? "Désactiver" : "Activer"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Modal: Créer un modèle ── */}
      {showModal && (
        <Modal title="Créer un modèle d'onboarding" onClose={() => setShowModal(false)}>
          <form onSubmit={handleCreate} className="space-y-4">
            <InputField
              label="Nom du modèle *"
              icon={FileText}
              placeholder="ex: Onboarding Tech Senior"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              required
              autoFocus
            />

            <SelectField
              label="Poste associé *"
              icon={Briefcase}
              value={form.positionId}
              onChange={(e) => setForm((f) => ({ ...f, positionId: e.target.value }))}
              required
            >
              <option value="">— Sélectionner un poste —</option>
              {positions.map((p) => (
                <option key={p.id} value={p.id}>{p.title}</option>
              ))}
            </SelectField>

            <TextareaField
              label="Description"
              placeholder="Décrivez le parcours d'onboarding..."
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            />

            {error && (
              <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-xl">
                <X className="w-4 h-4 shrink-0" /> {error}
              </div>
            )}

            {positions.length === 0 && (
              <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 px-3 py-2 rounded-xl">
                ⚠️ Aucun poste disponible. Créez d'abord un poste dans l'onglet Départements & Postes.
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={saving || !form.name.trim() || !form.positionId}
                className="flex-1 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm shadow-indigo-200"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Créer le modèle
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
