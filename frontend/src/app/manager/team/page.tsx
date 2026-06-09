"use client";

import { useEffect, useState } from "react";
import {
  Users, Activity, CalendarClock, ArrowRight, Loader2, CheckCircle2,
  XCircle, Clock, ShieldCheck, HelpCircle, FileText, CheckSquare, MessageSquare
} from "lucide-react";
import { fetchGraphQL } from "@/lib/graphqlClient";
import { useAuth } from "@/lib/authContext";

/* ─── GraphQL ─────────────────────────────── */
const GET_ONBOARDINGS = `
  query GetOnboardings {
    employeeOnboardings {
      id employeeId status progress startDate endDate
      trialEndDate trialValidated trialValidatedAt trialComment
      employeeFirstName employeeLastName positionTitle departmentName
    }
  }
`;

const VALIDATE_TRIAL = `
  mutation ValidateTrialPeriod($id: ID!, $validated: Boolean!, $comment: String, $validatedById: String) {
    validateTrialPeriod(id: $id, validated: $validated, comment: $comment, validatedById: $validatedById) {
      id status trialValidated trialValidatedAt trialComment
    }
  }
`;

/* ─── Types ───────────────────────────────── */
interface Onboarding {
  id: string;
  employeeId: string;
  status: string;
  progress: number;
  startDate: string;
  endDate?: string;
  trialEndDate?: string;
  trialValidated?: boolean;
  trialValidatedAt?: string;
  trialComment?: string;
  employeeFirstName: string;
  employeeLastName: string;
  positionTitle: string;
  departmentName: string;
}

/* ─── Constants ───────────────────────────── */
const STATUS_LABEL: Record<string, string> = {
  IN_PROGRESS: "En cours",
  COMPLETED: "Terminé",
  NOT_STARTED: "Non démarré",
  DELAYED: "Retard",
};
const STATUS_CLS: Record<string, string> = {
  IN_PROGRESS: "bg-blue-100 text-blue-800 border-blue-200",
  COMPLETED: "bg-emerald-100 text-emerald-800 border-emerald-200",
  NOT_STARTED: "bg-gray-100 text-gray-600 border-gray-200",
  DELAYED: "bg-rose-100 text-rose-800 border-rose-200",
};
const COLORS = [
  "from-indigo-500 to-blue-500",
  "from-purple-500 to-pink-500",
  "from-emerald-500 to-teal-500",
  "from-orange-500 to-amber-500",
  "from-rose-500 to-red-500"
];

const fmtDate = (d: string) => new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });

export default function ManagerTeamPage() {
  const { user } = useAuth();
  const [onboardings, setOnboardings] = useState<Onboarding[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [selectedOb, setSelectedOb] = useState<Onboarding | null>(null);
  const [validated, setValidated] = useState<boolean>(true);
  const [comment, setComment] = useState("");

  const load = () => {
    setLoading(true);
    fetchGraphQL<{ employeeOnboardings: Onboarding[] }>(GET_ONBOARDINGS)
      .then((d) => setOnboardings(d.employeeOnboardings || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openEvaluationModal = (ob: Onboarding) => {
    setSelectedOb(ob);
    setValidated(true);
    setComment(ob.trialComment || "");
    setShowModal(true);
  };

  const handleEvaluate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOb) return;
    setActing(true);
    try {
      const res = await fetchGraphQL<{ validateTrialPeriod: Onboarding }>(VALIDATE_TRIAL, {
        id: selectedOb.id,
        validated,
        comment: comment.trim() || undefined,
        validatedById: user?.id,
      });

      // Update state
      setOnboardings((prev) =>
        prev.map((o) =>
          o.id === selectedOb.id
            ? {
                ...o,
                trialValidated: res.validateTrialPeriod.trialValidated,
                trialValidatedAt: res.validateTrialPeriod.trialValidatedAt,
                trialComment: res.validateTrialPeriod.trialComment,
                status: res.validateTrialPeriod.status,
              }
            : o
        )
      );
      setShowModal(false);
      setSelectedOb(null);
    } catch (err) {
      console.error("Evaluation error:", err);
    } finally {
      setActing(false);
    }
  };

  return (
    <div className="space-y-6 pb-8">
      <div>
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Mon Équipe & Périodes d'Essai</h1>
        <p className="text-gray-500 mt-1">Supervisez l'intégration sur 6 mois de vos nouveaux collaborateurs et validez leur titularisation.</p>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20"><Loader2 className="w-8 h-8 text-indigo-400 animate-spin" /></div>
      ) : onboardings.length === 0 ? (
        <div className="text-center py-16 text-gray-400 bg-white rounded-xl border border-gray-100">
          <Users className="w-12 h-12 mx-auto mb-3 text-gray-200" />
          <p className="font-medium">Aucun membre en onboarding pour l'instant.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {onboardings.map((ob, i) => {
            const hasTrialInfo = !!ob.trialEndDate;
            const trialStatus = ob.trialValidated; // true/false/null
            const progressPercent = Math.round(ob.progress);

            return (
              <div key={ob.id} className="bg-white rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-100 hover:shadow-[0_4px_20px_rgb(0,0,0,0.06)] transition-all overflow-hidden flex flex-col group">
                <div className="p-6 relative z-10 border-b border-gray-50 flex-1">
                  {/* Title & Status */}
                  <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center space-x-4">
                      <div className={`w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-xl bg-gradient-to-br ${COLORS[i % COLORS.length]} shadow-md`}>
                        {ob.employeeFirstName?.[0]}{ob.employeeLastName?.[0]}
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 group-hover:text-indigo-700 transition-colors">
                          {ob.employeeFirstName} {ob.employeeLastName}
                        </h3>
                        <p className="text-sm text-gray-500 font-medium">{ob.positionTitle}</p>
                        {ob.departmentName && <p className="text-xs text-gray-400">{ob.departmentName}</p>}
                      </div>
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${STATUS_CLS[ob.status]}`}>
                      {STATUS_LABEL[ob.status] || ob.status}
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="mb-5 bg-gray-50 p-4 rounded-xl border border-gray-100">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="font-semibold text-gray-700">Progression globale</span>
                      <span className="font-bold text-indigo-600">{progressPercent}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                      <div className={`h-2.5 rounded-full bg-gradient-to-r ${COLORS[i % COLORS.length]}`} style={{ width: `${ob.progress}%` }} />
                    </div>
                  </div>

                  {/* Trial Period Info */}
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between text-gray-600 bg-white border border-gray-100 p-3 rounded-lg shadow-sm">
                      <div className="flex items-center"><CalendarClock className="w-4 h-4 mr-2 text-indigo-400" /><span>Date de début</span></div>
                      <span className="font-bold text-gray-900">{fmtDate(ob.startDate)}</span>
                    </div>

                    {hasTrialInfo && (
                      <div className="flex items-center justify-between text-gray-600 bg-white border border-gray-100 p-3 rounded-lg shadow-sm">
                        <div className="flex items-center"><Clock className="w-4 h-4 mr-2 text-rose-400" /><span>Fin période d'essai (6 mois)</span></div>
                        <span className="font-bold text-gray-900">{fmtDate(ob.trialEndDate!)}</span>
                      </div>
                    )}

                    {/* Trial Period Evaluation Status */}
                    <div className="mt-4 pt-3 border-t border-gray-50">
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Décision Période d'essai</p>
                      {trialStatus === true ? (
                        <div className="bg-emerald-50 text-emerald-800 border border-emerald-100 rounded-xl p-3 flex items-start gap-2.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                          <div>
                            <p className="font-bold text-xs">Titularisation validée</p>
                            {ob.trialComment && <p className="text-xs text-emerald-600/90 italic mt-1 font-medium">« {ob.trialComment} »</p>}
                          </div>
                        </div>
                      ) : trialStatus === false ? (
                        <div className="bg-rose-50 text-rose-800 border border-rose-100 rounded-xl p-3 flex items-start gap-2.5">
                          <XCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                          <div>
                            <p className="font-bold text-xs">Période d'essai rompue</p>
                            {ob.trialComment && <p className="text-xs text-rose-600/90 italic mt-1 font-medium">« {ob.trialComment} »</p>}
                          </div>
                        </div>
                      ) : (
                        <div className="bg-blue-50/50 text-blue-800 border border-blue-100 rounded-xl p-3 flex items-start gap-2.5">
                          <HelpCircle className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <p className="font-bold text-xs">En cours de test</p>
                            <button
                              onClick={() => openEvaluationModal(ob)}
                              className="mt-2 text-xs font-bold text-indigo-600 hover:text-indigo-800 hover:underline flex items-center gap-1"
                            >
                              Évaluer & Valider l'essai <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="px-6 py-4 bg-gray-50/50 flex justify-end">
                  <a href={`/manager/team/dossier?id=${ob.id}`} className="text-indigo-600 hover:text-indigo-800 text-sm font-bold flex items-center group-hover:translate-x-1 duration-300 transition-transform">
                    Voir le dossier complet <ArrowRight className="w-4 h-4 ml-1.5" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Modal: Évaluation de Période d'Essai (6 mois) ── */}
      {showModal && selectedOb && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-indigo-50 to-violet-50">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-indigo-600" />
                <h2 className="text-lg font-bold text-gray-900">Évaluation Période d'Essai</h2>
              </div>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg hover:bg-white/80 text-gray-400 transition-colors">
                <XCircle className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleEvaluate} className="px-6 py-5 space-y-4">
              <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-xl border border-gray-100">
                <p>Collaborateur : <strong className="text-gray-900">{selectedOb.employeeFirstName} {selectedOb.employeeLastName}</strong></p>
                <p>Poste : <strong className="text-gray-900">{selectedOb.positionTitle}</strong></p>
                <p className="mt-1">Démarré le : <strong>{fmtDate(selectedOb.startDate)}</strong></p>
              </div>

              {/* Decison Radio buttons */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Décision de titularisation *</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setValidated(true)}
                    className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${validated ? "border-emerald-500 bg-emerald-50/30 text-emerald-800" : "border-gray-200 text-gray-500 hover:border-gray-300"}`}
                  >
                    <CheckCircle2 className="w-6 h-6 text-emerald-600 mb-1" />
                    <span className="text-xs font-bold">Valider l'essai</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setValidated(false)}
                    className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${!validated ? "border-rose-500 bg-rose-50/30 text-rose-800" : "border-gray-200 text-gray-500 hover:border-gray-300"}`}
                  >
                    <XCircle className="w-6 h-6 text-rose-600 mb-1" />
                    <span className="text-xs font-bold">Rompre l'essai</span>
                  </button>
                </div>
              </div>

              {/* Comments */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Observations / Commentaires *</label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={4}
                  placeholder="Justification de la décision, retours sur les forces et axes d'amélioration..."
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
                  Annuler
                </button>
                <button type="submit" disabled={acting}
                  className={`flex-1 px-4 py-2.5 rounded-xl text-white text-sm font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm ${validated ? "bg-emerald-600 hover:bg-emerald-700" : "bg-rose-600 hover:bg-rose-700"}`}>
                  {acting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
