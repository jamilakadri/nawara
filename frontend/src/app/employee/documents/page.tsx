"use client";

import { useEffect, useState } from "react";
import {
  FileText, Upload, CheckCircle, XCircle, Clock,
  Loader2, RefreshCw, Bot, User, Phone,
  MessageSquare, Send, BadgeCheck,
  Mail, Lock, Eye, EyeOff, ShieldCheck,
} from "lucide-react";
import { fetchGraphQL } from "@/lib/graphqlClient";
import { useAuth } from "@/lib/authContext";

// ─── GraphQL ─────────────────────────────────────────────────────────────────

const GET_EMPLOYEE_FULL = `
  query GetEmployeeByUserId($userId: ID!) {
    employeeByUserId(userId: $userId) {
      id
      onboardingId
      phone
      additionalInfo
      userFirstName
      userLastName
      userEmail
      positionTitle
      departmentName
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

const ADD_DOCUMENT = `
  mutation AddDocument($onboardingId: ID!, $name: String!, $type: String!, $url: String!) {
    addDocument(onboardingId: $onboardingId, name: $name, type: $type, url: $url) {
      id name type url status uploadedAt aiScore
    }
  }
`;

const UPDATE_EMPLOYEE_PROFILE = `
  mutation UpdateEmployeeProfile($id: ID!, $phone: String, $additionalInfo: String) {
    updateEmployeeProfile(id: $id, phone: $phone, additionalInfo: $additionalInfo) {
      id phone additionalInfo
    }
  }
`;

const CHANGE_PASSWORD = `
  mutation ChangePassword($userId: ID!, $currentPassword: String!, $newPassword: String!) {
    changePassword(userId: $userId, currentPassword: $currentPassword, newPassword: $newPassword) {
      success
      message
    }
  }
`;

// ─── Types ────────────────────────────────────────────────────────────────────

interface Doc {
  id: string; name: string; type: string; url: string;
  status: string; uploadedAt: string; aiScore: number | null;
}
interface DocSide { id: string; label: string; }
interface RequiredDoc { type: string; label: string; description: string; sides?: DocSide[]; }
interface UploadState { file: File | null; preview: string | null; }

interface EmployeeData {
  id: string;
  onboardingId: string | null;
  phone: string | null;
  additionalInfo: string | null;
  userFirstName: string;
  userLastName: string;
  userEmail: string;
  positionTitle?: string | null;
  departmentName?: string | null;
}

interface ProfileForm { phone: string; additionalInfo: string; }
interface PasswordForm { current: string; next: string; confirm: string; }

// ─── Constants ────────────────────────────────────────────────────────────────

const statusConfig: Record<string, { label: string; class: string; icon: React.ReactNode }> = {
  PENDING:   { label: "En attente de validation", class: "bg-amber-50 text-amber-700 border border-amber-200",       icon: <Clock className="w-3.5 h-3.5" /> },
  VALIDATED: { label: "Validé par RH",            class: "bg-emerald-50 text-emerald-700 border border-emerald-200", icon: <CheckCircle className="w-3.5 h-3.5" /> },
  REJECTED:  { label: "À renvoyer",               class: "bg-rose-50 text-rose-700 border border-rose-200",         icon: <XCircle className="w-3.5 h-3.5" /> },
};

const REQUIRED_DOCS: RequiredDoc[] = [
  {
    type: "CIN", label: "Carte d'Identité Nationale", description: "Scan couleur recto-verso (PDF/JPG)",
    sides: [{ id: "CIN_RECTO", label: "Recto" }, { id: "CIN_VERSO", label: "Verso" }],
  },
  { type: "RIB",     label: "Relevé d'Identité Bancaire", description: "Pour le versement du salaire" },
  { type: "CV",      label: "Curriculum Vitae",           description: "Version à jour en PDF" },
  { type: "DIPLOME", label: "Diplôme(s)",                 description: "Copie certifiée conforme" },
  { type: "PHOTO",   label: "Photo d'identité",           description: "Format numérique (JPG)" },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function EmployeeDocumentsPage() {
  const { user } = useAuth();

  const [employee, setEmployee] = useState<EmployeeData | null>(null);
  const [onboardingId, setOnboardingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [docs, setDocs] = useState<Doc[]>([]);
  const [uploading, setUploading] = useState<string | null>(null);
  const [uploadStates, setUploadStates] = useState<Record<string, UploadState>>({});

  const [profileForm, setProfileForm] = useState<ProfileForm>({ phone: "", additionalInfo: "" });
  const [employeeMissing, setEmployeeMissing] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [pwForm, setPwForm] = useState<PasswordForm>({ current: "", next: "", confirm: "" });
  const [pwSubmitting, setPwSubmitting] = useState(false);
  const [pwSuccess, setPwSuccess] = useState(false);
  const [pwError, setPwError] = useState<string | null>(null);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNext, setShowNext] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // ── Load ──────────────────────────────────────────────────────────────────

  const loadEmployee = async () => {
    if (!user?.id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetchGraphQL<{ employeeByUserId: EmployeeData }>(
        GET_EMPLOYEE_FULL, { userId: user.id }
      );
      const emp = res?.employeeByUserId;
      if (emp) {
        setEmployee(emp);
        setEmployeeMissing(false);
        const obId = emp.onboardingId ?? null;
        setOnboardingId(obId);
        setProfileForm({
          phone:          emp.phone          ?? "",
          additionalInfo: emp.additionalInfo ?? "",
        });
        if (obId) {
          const docsRes = await fetchGraphQL<{ documentsByOnboarding: Doc[] }>(
            GET_EMPLOYEE_DOCS, { onboardingId: obId }
          );
          setDocs(docsRes.documentsByOnboarding || []);
        }
      } else {
        setEmployee(null);
        setEmployeeMissing(true);
        setOnboardingId(null);
        setProfileForm({ phone: "", additionalInfo: "" });
      }
    } catch (e) {
      console.error(e);
      setError("Impossible de charger votre profil.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadEmployee(); }, [user?.id]);

  const displayFirstName = employee?.userFirstName || user?.firstName || "—";
  const displayLastName = employee?.userLastName || user?.lastName || "—";
  const displayEmail = employee?.userEmail || user?.email || "—";
  const displayPosition = employee?.positionTitle || "—";
  const displayDepartment = employee?.departmentName || "—";

  // ── Document upload ───────────────────────────────────────────────────────

  const handleFileUpload = async (docType: string, docLabel: string, file: File, sideId: string) => {
    if (!onboardingId) return;
    setUploading(sideId);
    try {
      const fakeUrl = `https://storage.example.com/docs/${Date.now()}_${file.name}`;
      const result = await fetchGraphQL<{ addDocument: Doc }>(ADD_DOCUMENT, {
        onboardingId, name: docLabel, type: docType, url: fakeUrl,
      });
      setDocs((prev) => {
        const idx = prev.findIndex((d) => d.type === docType);
        if (idx >= 0) { const u = [...prev]; u[idx] = result.addDocument; return u; }
        return [...prev, result.addDocument];
      });
    } catch (e) {
      console.error("Upload failed:", e);
    } finally {
      setUploading(null);
    }
  };

  const handleFileChange = (file: File, docType: string, docLabel: string, sideId: string) => {
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (ev) =>
        setUploadStates((prev) => ({ ...prev, [sideId]: { file, preview: ev.target?.result as string } }));
      reader.readAsDataURL(file);
    } else {
      setUploadStates((prev) => ({ ...prev, [sideId]: { file, preview: null } }));
    }
    handleFileUpload(docType, docLabel, file, sideId);
  };

  const clearUploadState = (sideId: string) =>
    setUploadStates((prev) => ({ ...prev, [sideId]: { file: null, preview: null } }));

  const getDocByType = (type: string) => docs.find((d) => d.type === type);
  const getSides = (req: RequiredDoc): DocSide[] => req.sides ?? [{ id: req.type, label: req.label }];

  // ── Submit dossier ────────────────────────────────────────────────────────

  const handleSubmitDossier = async () => {
    if (!employee?.id) return;
    if (!profileForm.phone.trim()) {
      setSubmitError("Le numéro de téléphone est obligatoire.");
      return;
    }
    setSubmitting(true);
    setSubmitError(null);
    try {
      await fetchGraphQL(UPDATE_EMPLOYEE_PROFILE, {
        id: employee.id,
        phone: profileForm.phone,
        additionalInfo: profileForm.additionalInfo,
      });
      setSubmitted(true);
    } catch (e) {
      console.error(e);
      setSubmitError("Impossible d'envoyer le dossier. Veuillez réessayer.");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Change password ───────────────────────────────────────────────────────

  const handleChangePassword = async () => {
    if (!user?.id) return;
    if (!pwForm.current || !pwForm.next || !pwForm.confirm) {
      setPwError("Tous les champs sont obligatoires.");
      return;
    }
    if (pwForm.next.length < 8) {
      setPwError("Le nouveau mot de passe doit contenir au moins 8 caractères.");
      return;
    }
    if (pwForm.next !== pwForm.confirm) {
      setPwError("Les mots de passe ne correspondent pas.");
      return;
    }
    setPwSubmitting(true);
    setPwError(null);
    try {
      const res = await fetchGraphQL<{ changePassword: { success: boolean; message: string } }>(
        CHANGE_PASSWORD, { userId: user.id, currentPassword: pwForm.current, newPassword: pwForm.next }
      );
      if (res.changePassword.success) {
        setPwSuccess(true);
        setPwForm({ current: "", next: "", confirm: "" });
      } else {
        setPwError(res.changePassword.message || "Mot de passe actuel incorrect.");
      }
    } catch (e) {
      console.error(e);
      setPwError("Une erreur est survenue. Veuillez réessayer.");
    } finally {
      setPwSubmitting(false);
    }
  };

  // ── Helpers ───────────────────────────────────────────────────────────────

  const inputClass =
    "w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition bg-white";
  const readonlyClass =
    "w-full border border-gray-100 rounded-xl px-4 py-2.5 text-sm text-gray-500 bg-gray-50 cursor-default select-none";

  const docsValidated = docs.filter((d) => d.status === "VALIDATED").length;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-8 pb-10">

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Mon Dossier d'Intégration</h1>
          <p className="text-gray-500 mt-1">Complétez votre profil, changez votre mot de passe et téléversez vos documents.</p>
        </div>
        <button onClick={loadEmployee} className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors">
          <RefreshCw className="w-4 h-4" /> Actualiser
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20"><Loader2 className="w-8 h-8 text-indigo-400 animate-spin" /></div>
      ) : error ? (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-xl">{error}</div>
      ) : (
        <>
          {employeeMissing && (
            <div className="rounded-2xl border border-dashed border-indigo-200 bg-indigo-50/70 text-indigo-700 px-5 py-4 text-sm">
              Votre profil utilisateur est chargé, mais votre dossier RH n'est pas encore créé. Les informations RH seront disponibles dès que votre employé sera configuré.
            </div>
          )}

          {/* ════════════════════════════════════════════════════════════════
              SECTION 1 — PROFIL
          ════════════════════════════════════════════════════════════════ */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_4px_20px_rgb(0,0,0,0.03)] overflow-hidden">
            <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100 bg-gray-50/60">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center">
                <User className="w-[18px] h-[18px] text-indigo-600" />
              </div>
              <div>
                <h2 className="font-bold text-gray-800 text-base">Informations du profil</h2>
                <p className="text-xs text-gray-500">Les champs grisés sont définis par les RH et non modifiables.</p>
              </div>
            </div>

            <div className="p-6 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Prénom</label>
                  <div className={readonlyClass}>{displayFirstName}</div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Nom</label>
                  <div className={readonlyClass}>{displayLastName}</div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Poste</label>
                  <div className={readonlyClass}>{displayPosition}</div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Département</label>
                  <div className={readonlyClass}>{displayDepartment}</div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5" /> Adresse e-mail
                </label>
                <div className={readonlyClass}>{displayEmail}</div>
              </div>

              <div className="border-t border-dashed border-gray-100 pt-5">
                <p className="text-xs font-semibold text-indigo-500 uppercase tracking-wide mb-4">
                  Informations complémentaires — à remplir par vous
                </p>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-indigo-400" />
                    Numéro de téléphone <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="tel"
                    placeholder="+216 XX XXX XXX"
                    value={profileForm.phone}
                    onChange={(e) => setProfileForm((p) => ({ ...p, phone: e.target.value }))}
                    className={inputClass}
                  />
                </div>

                <div className="space-y-1.5 mt-4">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />
                    Informations complémentaires &amp; commentaires RH
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Adresse, contact d'urgence, date de naissance, situation particulière, questions..."
                    value={profileForm.additionalInfo}
                    onChange={(e) => setProfileForm((p) => ({ ...p, additionalInfo: e.target.value }))}
                    className={`${inputClass} resize-none`}
                  />
                  <p className="text-[11px] text-gray-400">Champ libre : adresse, contact d'urgence, remarques...</p>
                </div>
              </div>
            </div>
          </div>

          {/* ════════════════════════════════════════════════════════════════
              SECTION 2 — MOT DE PASSE
          ════════════════════════════════════════════════════════════════ */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_4px_20px_rgb(0,0,0,0.03)] overflow-hidden">
            <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100 bg-gray-50/60">
              <div className="w-9 h-9 rounded-xl bg-violet-50 flex items-center justify-center">
                <Lock className="w-[18px] h-[18px] text-violet-600" />
              </div>
              <div>
                <h2 className="font-bold text-gray-800 text-base">Changer mon mot de passe</h2>
                <p className="text-xs text-gray-500">Utilisez le mot de passe temporaire reçu par e-mail, puis choisissez-en un nouveau.</p>
              </div>
            </div>

            {pwSuccess ? (
              <div className="flex items-center gap-3 px-6 py-5">
                <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5 text-emerald-500" />
                </div>
                <div>
                  <p className="font-semibold text-gray-800 text-sm">Mot de passe mis à jour !</p>
                  <p className="text-xs text-gray-500">Votre nouveau mot de passe est actif immédiatement.</p>
                </div>
                <button onClick={() => setPwSuccess(false)} className="ml-auto text-xs text-indigo-500 hover:underline shrink-0">
                  Modifier à nouveau
                </button>
              </div>
            ) : (
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {([
                    { label: "Mot de passe actuel", key: "current", show: showCurrent, toggle: () => setShowCurrent(v => !v), placeholder: "Mot de passe reçu par e-mail" },
                    { label: "Nouveau mot de passe", key: "next",   show: showNext,    toggle: () => setShowNext(v => !v),    placeholder: "Min. 8 caractères" },
                    { label: "Confirmer",            key: "confirm",show: showConfirm, toggle: () => setShowConfirm(v => !v), placeholder: "Répéter le nouveau" },
                  ] as const).map(({ label, key, show, toggle, placeholder }) => (
                    <div key={key} className="space-y-1.5">
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</label>
                      <div className="relative">
                        <input
                          type={show ? "text" : "password"}
                          placeholder={placeholder}
                          value={pwForm[key]}
                          onChange={(e) => setPwForm((p) => ({ ...p, [key]: e.target.value }))}
                          className={`${inputClass} pr-10`}
                        />
                        <button type="button" onClick={toggle} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                {pwError && (
                  <div className="mt-4 bg-rose-50 border border-rose-100 text-rose-700 text-sm rounded-xl px-4 py-2.5">{pwError}</div>
                )}
                <div className="flex justify-end mt-4">
                  <button
                    onClick={handleChangePassword}
                    disabled={pwSubmitting}
                    className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-60 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors"
                  >
                    {pwSubmitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Mise à jour...</> : <><ShieldCheck className="w-4 h-4" /> Mettre à jour</>}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ════════════════════════════════════════════════════════════════
              SECTION 3 — DOCUMENTS
          ════════════════════════════════════════════════════════════════ */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_4px_20px_rgb(0,0,0,0.03)] p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-gray-800 text-lg flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-500" />
                Progression documentaire
              </h2>
              <span className="text-sm font-bold text-indigo-600">{docsValidated} / {REQUIRED_DOCS.length} validés</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
              <div
                className="h-2.5 rounded-full bg-gradient-to-r from-indigo-500 to-emerald-500 transition-all duration-700"
                style={{ width: `${(docsValidated / REQUIRED_DOCS.length) * 100}%` }}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {REQUIRED_DOCS.map((req) => {
              const existingDoc = getDocByType(req.type);
              const cfg = existingDoc ? statusConfig[existingDoc.status] : null;
              const sides = getSides(req);
              return (
                <div
                  key={req.type}
                  className={`bg-white rounded-2xl border overflow-hidden flex flex-col transition-shadow hover:shadow-[0_4px_20px_rgb(0,0,0,0.06)] ${
                    existingDoc?.status === "VALIDATED" ? "border-emerald-200"
                    : existingDoc?.status === "REJECTED" ? "border-rose-200"
                    : existingDoc?.status === "PENDING"  ? "border-amber-200"
                    : "border-gray-100"
                  }`}
                >
                  <div className="p-5 flex-1">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                          existingDoc?.status === "VALIDATED" ? "bg-emerald-50 text-emerald-600"
                          : existingDoc?.status === "REJECTED" ? "bg-rose-50 text-rose-600"
                          : existingDoc?.status === "PENDING"  ? "bg-amber-50 text-amber-600"
                          : "bg-indigo-50 text-indigo-600"
                        }`}>
                          <FileText className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-900 text-sm">{req.label}</h3>
                          <p className="text-xs text-gray-500">{req.description}</p>
                        </div>
                      </div>
                      {cfg && (
                        <span className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.class}`}>
                          {cfg.icon}{cfg.label}
                        </span>
                      )}
                    </div>
                    {existingDoc && (
                      <div className="mt-3 flex items-center justify-between text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2">
                        <span>Envoyé le {new Date(existingDoc.uploadedAt).toLocaleDateString("fr-FR")}</span>
                        {existingDoc.aiScore != null && (
                          <span className="flex items-center gap-1 font-medium">
                            <Bot className={`w-3.5 h-3.5 ${existingDoc.aiScore > 85 ? "text-emerald-500" : existingDoc.aiScore > 60 ? "text-amber-500" : "text-rose-500"}`} />
                            Score IA: <strong>{existingDoc.aiScore}%</strong>
                          </span>
                        )}
                      </div>
                    )}
                    {existingDoc?.status === "REJECTED" && (
                      <div className="mt-2 bg-rose-50 border border-rose-100 rounded-lg px-3 py-2 text-xs text-rose-700">
                        ⚠️ Ce document a été rejeté. Merci de le resoumettre.
                      </div>
                    )}
                  </div>

                  {(!existingDoc || existingDoc.status === "REJECTED") && (
                    <div className="px-5 pb-5">
                      <div className={`grid gap-3 ${sides.length > 1 ? "grid-cols-2" : "grid-cols-1"}`}>
                        {sides.map((side) => {
                          const st = uploadStates[side.id];
                          const isUploadingThis = uploading === side.id;
                          return (
                            <div key={side.id}>
                              {sides.length > 1 && (
                                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">{side.label}</p>
                              )}
                              <label className={`relative flex flex-col items-center justify-center w-full rounded-xl cursor-pointer transition-all overflow-hidden border-2 border-dashed ${
                                isUploadingThis ? "border-indigo-400 bg-indigo-50/50"
                                : st?.file     ? "border-emerald-400 bg-emerald-50/40"
                                : "border-gray-200 bg-gray-50 hover:border-indigo-300 hover:bg-indigo-50/30"
                              }`}>
                                <input
                                  type="file"
                                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                                  accept=".pdf,.jpg,.jpeg,.png"
                                  disabled={isUploadingThis}
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) handleFileChange(file, req.type, req.label, side.id);
                                  }}
                                />
                                {isUploadingThis ? (
                                  <div className="flex items-center gap-2 text-indigo-600 text-sm font-medium py-5">
                                    <Loader2 className="w-4 h-4 animate-spin" /> Envoi en cours...
                                  </div>
                                ) : st?.preview ? (
                                  <img src={st.preview} alt={`Aperçu ${side.label}`} className="w-full max-h-28 object-cover" />
                                ) : st?.file ? (
                                  <div className="flex flex-col items-center gap-1 py-5">
                                    <FileText className="w-6 h-6 text-indigo-400" />
                                    <span className="text-xs text-gray-600 font-medium truncate max-w-[110px] px-2">{st.file.name}</span>
                                  </div>
                                ) : (
                                  <div className="text-center py-4 px-2">
                                    <Upload className="w-5 h-5 text-indigo-400 mx-auto mb-1" />
                                    <p className="text-xs text-gray-500"><span className="font-semibold text-indigo-500">Cliquez</span> ou glissez</p>
                                    <p className="text-[11px] text-gray-400 mt-0.5">PDF, JPG ou PNG · max 5MB</p>
                                  </div>
                                )}
                              </label>
                              {st?.file && (
                                <button type="button" onClick={() => clearUploadState(side.id)}
                                  className="mt-1 flex items-center gap-0.5 text-[11px] text-rose-500 hover:text-rose-700 transition-colors">
                                  <XCircle className="w-3 h-3" /> Supprimer
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {existingDoc && existingDoc.status !== "REJECTED" && (
                    <div className="px-5 pb-5">
                      <a href={existingDoc.url} target="_blank" rel="noopener noreferrer"
                        className="w-full flex items-center justify-center gap-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 py-2.5 rounded-xl text-sm font-medium transition-colors">
                        <FileText className="w-4 h-4 text-indigo-500" /> Voir le document
                      </a>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* ════════════════════════════════════════════════════════════════
              BOUTON FINAL
          ════════════════════════════════════════════════════════════════ */}
          {submitted ? (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 flex flex-col items-center text-center gap-3">
              <div className="w-14 h-14 rounded-full bg-white border border-emerald-200 flex items-center justify-center">
                <BadgeCheck className="w-7 h-7 text-emerald-500" />
              </div>
              <div>
                <p className="font-bold text-emerald-800 text-lg">Dossier envoyé au service RH !</p>
                <p className="text-sm text-emerald-700 mt-1 max-w-md">
                  Vos informations et documents ont bien été transmis. Le service RH les examinera et vous contactera si nécessaire.
                </p>
              </div>
              <button onClick={() => setSubmitted(false)} className="mt-1 text-xs text-emerald-600 hover:underline">
                Modifier mon dossier
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_4px_20px_rgb(0,0,0,0.03)] p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <p className="font-bold text-gray-800">Prêt à soumettre votre dossier ?</p>
                  <p className="text-sm text-gray-500 mt-0.5">
                    Cliquez pour envoyer vos informations de profil et vos documents au service RH.
                  </p>
                  <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-indigo-400" />
                      Téléphone :{" "}
                      {profileForm.phone
                        ? <span className="text-emerald-600 font-semibold">✓ renseigné</span>
                        : <span className="text-amber-500">à compléter</span>}
                    </span>
                    <span className="flex items-center gap-1">
                      <FileText className="w-3.5 h-3.5 text-indigo-400" />
                      {docsValidated}/{REQUIRED_DOCS.length} documents validés
                    </span>
                  </div>
                </div>
                <div className="shrink-0">
                  {submitError && <p className="text-xs text-rose-600 mb-2 text-right">{submitError}</p>}
                  <button
                    onClick={handleSubmitDossier}
                    disabled={submitting}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-bold px-8 py-3 rounded-xl text-sm transition-colors shadow-md shadow-indigo-100 whitespace-nowrap"
                  >
                    {submitting
                      ? <><Loader2 className="w-4 h-4 animate-spin" /> Envoi en cours...</>
                      : <><Send className="w-4 h-4" /> Envoyer mon dossier au service RH</>}
                  </button>
                </div>
              </div>
            </div>
          )}

        </>
      )}
    </div>
  );
}