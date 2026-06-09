"use client";

import { useEffect, useState } from "react";
import { Star, MessageSquare, CheckCircle, Clock, Filter, ShieldCheck, AlertCircle, Loader2, X } from "lucide-react";
import { fetchGraphQL } from "@/lib/graphqlClient";
import { useAuth } from "@/lib/authContext";

const GET_EVALUATIONS = `
  query {
    evaluations {
      id score comments isAutoEvaluation createdAt
      employeeFirstName employeeLastName positionTitle
      evaluatorFirstName evaluatorLastName
    }
  }
`;

const GET_EMPLOYEES = `
  query {
    employees {
      id userFirstName userLastName positionTitle
    }
  }
`;

const CREATE_EVAL = `
  mutation CreateEvaluation($employeeId: ID!, $evaluatorId: ID!, $score: Float!, $comments: String) {
    createEvaluation(employeeId: $employeeId, evaluatorId: $evaluatorId, score: $score, comments: $comments) {
      id score employeeFirstName employeeLastName positionTitle createdAt
    }
  }
`;

interface Evaluation {
  id: string; score: number; comments?: string; isAutoEvaluation: boolean; createdAt: string;
  employeeFirstName: string; employeeLastName: string; positionTitle: string;
  evaluatorFirstName: string; evaluatorLastName: string;
}
interface Employee { id: string; userFirstName: string; userLastName: string; positionTitle: string; }

const colors = ["from-purple-500 to-indigo-500", "from-blue-500 to-sky-500", "from-emerald-500 to-teal-500", "from-orange-500 to-amber-500"];

export default function ManagerEvaluationsPage() {
  const { user } = useAuth();
  const MANAGER_ID = user?.id || "";
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ employeeId: "", score: 5, comments: "" });

  const load = () => {
    setLoading(true);
    Promise.all([
      fetchGraphQL<{ evaluations: Evaluation[] }>(GET_EVALUATIONS),
      fetchGraphQL<{ employees: Employee[] }>(GET_EMPLOYEES),
    ])
      .then(([d1, d2]) => { setEvaluations(d1.evaluations); setEmployees(d2.employees); })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleSubmit = async () => {
    if (!form.employeeId) return;
    setSubmitting(true);
    try {
      const data = await fetchGraphQL<{ createEvaluation: Evaluation }>(CREATE_EVAL, {
        employeeId: form.employeeId, evaluatorId: MANAGER_ID, score: form.score, comments: form.comments || null,
      });
      setEvaluations((prev) => [data.createEvaluation, ...prev]);
      setShowModal(false);
      setForm({ employeeId: "", score: 5, comments: "" });
    } catch (e) { console.error(e); } finally { setSubmitting(false); }
  };

  return (
    <div className="space-y-6 pb-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Évaluations d'Intégration</h1>
          <p className="text-gray-500 mt-1">Évaluez la progression de votre équipe sur le plan métier et opérationnel.</p>
        </div>
        <button onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors shadow-sm">
          <MessageSquare className="w-4 h-4" /> Nouvelle évaluation
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20"><Loader2 className="w-8 h-8 text-indigo-400 animate-spin" /></div>
      ) : evaluations.length === 0 ? (
        <div className="text-center py-16 text-gray-400 bg-white rounded-xl border border-gray-100">
          <Star className="w-12 h-12 mx-auto mb-3 text-gray-200" />
          <p className="font-medium">Aucune évaluation pour l'instant.</p>
          <button onClick={() => setShowModal(true)} className="mt-4 text-indigo-600 text-sm font-medium hover:underline">
            Créer la première évaluation
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {evaluations.map((ev, i) => (
            <div key={ev.id} className="bg-white rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-100 hover:shadow-[0_4px_20px_rgb(0,0,0,0.06)] transition-all overflow-hidden flex flex-col">
              <div className="p-6 flex-1">
                <div className="flex justify-between items-start mb-5">
                  <div className="flex items-center space-x-3">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg bg-gradient-to-br ${colors[i % colors.length]} shadow-sm`}>
                      {ev.employeeFirstName?.[0]}{ev.employeeLastName?.[0]}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">{ev.employeeFirstName} {ev.employeeLastName}</h3>
                      <p className="text-sm text-gray-500">{ev.positionTitle}</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center text-sm text-gray-600">
                    <Clock className="w-4 h-4 mr-2 text-indigo-400" />
                    <span>Date : <span className="text-gray-900 font-medium">{new Date(ev.createdAt).toLocaleDateString("fr-FR")}</span></span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Star className="w-4 h-4 mr-2 text-amber-400 fill-amber-400" />
                    <span>Score : <span className="font-bold text-gray-900 text-base ml-1">{ev.score}/10</span></span>
                  </div>
                  {ev.isAutoEvaluation && (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-indigo-50 text-indigo-700">
                      <ShieldCheck className="w-3.5 h-3.5 mr-1" /> Auto-évaluation
                    </span>
                  )}
                  {ev.comments && (
                    <p className="text-xs text-gray-500 italic line-clamp-2 pt-1">« {ev.comments} »</p>
                  )}
                </div>
              </div>
              <div className="px-6 py-4 bg-gray-50/50">
                <button className="w-full bg-white border border-gray-200 text-gray-700 hover:text-indigo-700 hover:border-indigo-200 hover:bg-indigo-50 px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center justify-center shadow-sm">
                  <CheckCircle className="w-4 h-4 mr-2 text-emerald-500" /> Voir les détails
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal nouvelle évaluation */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">Nouvelle Évaluation</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-700 transition-colors"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Employé</label>
                <select value={form.employeeId} onChange={(e) => setForm({ ...form, employeeId: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  <option value="">Sélectionner un employé…</option>
                  {employees.map((e) => <option key={e.id} value={e.id}>{e.userFirstName} {e.userLastName} ({e.positionTitle})</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Score (sur 10)</label>
                <div className="flex items-center gap-3">
                  <input type="range" min={0} max={10} step={0.5} value={form.score}
                    onChange={(e) => setForm({ ...form, score: parseFloat(e.target.value) })}
                    className="flex-1 accent-indigo-600" />
                  <span className="text-2xl font-bold text-indigo-600 w-12 text-center">{form.score}</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Commentaires (optionnel)</label>
                <textarea rows={3} value={form.comments} onChange={(e) => setForm({ ...form, comments: e.target.value })}
                  placeholder="Partagez vos observations…"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowModal(false)} className="flex-1 border border-gray-200 text-gray-700 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors">Annuler</button>
              <button onClick={handleSubmit} disabled={!form.employeeId || submitting}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
