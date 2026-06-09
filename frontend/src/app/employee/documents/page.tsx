"use client";

import { useEffect, useState } from "react";
import { FileText, Upload, CheckCircle, XCircle, Clock, Loader2, RefreshCw, Bot } from "lucide-react";
import { fetchGraphQL } from "@/lib/graphqlClient";
import { useAuth } from "@/lib/authContext";

const GET_EMPLOYEE_DOCS = `
  query GetDocumentsByOnboarding($onboardingId: ID!) {
    documentsByOnboarding(onboardingId: $onboardingId) {
      id name type url status uploadedAt aiScore
    }
  }
`;

const GET_EMPLOYEE_ONBOARDING = `
  query GetEmployeeByUserId($userId: ID!) {
    employeeByUserId(userId: $userId) {
      id
      onboardingId
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

interface Doc {
  id: string; name: string; type: string; url: string; status: string;
  uploadedAt: string; aiScore: number | null;
}

const statusConfig: Record<string, { label: string; class: string; icon: React.ReactNode }> = {
  PENDING: {
    label: "En attente de validation",
    class: "bg-amber-50 text-amber-700 border border-amber-200",
    icon: <Clock className="w-3.5 h-3.5" />,
  },
  VALIDATED: {
    label: "Validé par RH",
    class: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    icon: <CheckCircle className="w-3.5 h-3.5" />,
  },
  REJECTED: {
    label: "À renvoyer",
    class: "bg-rose-50 text-rose-700 border border-rose-200",
    icon: <XCircle className="w-3.5 h-3.5" />,
  },
};

const REQUIRED_DOCS = [
  { type: "CIN", label: "Carte d'Identité Nationale", description: "Scan couleur recto-verso (PDF/JPG)" },
  { type: "RIB", label: "Relevé d'Identité Bancaire", description: "Pour le versement du salaire" },
  { type: "CV", label: "Curriculum Vitae", description: "Version à jour en PDF" },
  { type: "DIPLOME", label: "Diplôme(s)", description: "Copie certifiée conforme" },
  { type: "PHOTO", label: "Photo d'identité", description: "Format numérique (JPG)" },
];

export default function EmployeeDocumentsPage() {
  const { user } = useAuth();
  const [docs, setDocs] = useState<Doc[]>([]);
  const [onboardingId, setOnboardingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadEmployee = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const res = await fetchGraphQL<any>(GET_EMPLOYEE_ONBOARDING, { userId: user.id });
      const obId = res?.employeeByUserId?.onboardingId;
      if (obId) {
        setOnboardingId(obId);
        const docsRes = await fetchGraphQL<{ documentsByOnboarding: Doc[] }>(GET_EMPLOYEE_DOCS, { onboardingId: obId });
        setDocs(docsRes.documentsByOnboarding || []);
      }
    } catch (e) {
      console.error(e);
      setError("Impossible de charger vos documents.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadEmployee(); }, [user?.id]);

  const handleFileUpload = async (docType: string, docLabel: string, file: File) => {
    if (!onboardingId) return;
    setUploading(docType);
    try {
      // In a real app, you'd upload the file to storage and get a URL back.
      // For demo, we use a placeholder URL.
      const fakeUrl = `https://storage.example.com/docs/${Date.now()}_${file.name}`;
      const result = await fetchGraphQL<{ addDocument: Doc }>(ADD_DOCUMENT, {
        onboardingId,
        name: docLabel,
        type: docType,
        url: fakeUrl,
      });
      setDocs((prev) => {
        const exists = prev.findIndex((d) => d.type === docType);
        if (exists >= 0) {
          const updated = [...prev];
          updated[exists] = result.addDocument;
          return updated;
        }
        return [...prev, result.addDocument];
      });
    } catch (e) {
      console.error("Upload failed:", e);
    } finally {
      setUploading(null);
    }
  };

  const getDocByType = (type: string) => docs.find((d) => d.type === type);

  return (
    <div className="space-y-6 pb-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Mes Documents Administratifs</h1>
          <p className="text-gray-500 mt-1">Téléversez et suivez le statut de vos documents requis pour l'intégration.</p>
        </div>
        <button onClick={loadEmployee} className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors">
          <RefreshCw className="w-4 h-4" /> Actualiser
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
        </div>
      ) : error ? (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-xl">{error}</div>
      ) : (
        <>
          {/* Progress Summary */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_4px_20px_rgb(0,0,0,0.03)] p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-gray-800 text-lg flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-500" />
                Progression documentaire
              </h2>
              <span className="text-sm font-bold text-indigo-600">
                {docs.filter(d => d.status === 'VALIDATED').length} / {REQUIRED_DOCS.length} validés
              </span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
              <div
                className="h-2.5 rounded-full bg-gradient-to-r from-indigo-500 to-emerald-500 transition-all duration-700"
                style={{ width: `${(docs.filter(d => d.status === 'VALIDATED').length / REQUIRED_DOCS.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Document Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {REQUIRED_DOCS.map((req) => {
              const existingDoc = getDocByType(req.type);
              const cfg = existingDoc ? statusConfig[existingDoc.status] : null;
              const isUploading = uploading === req.type;

              return (
                <div
                  key={req.type}
                  className={`bg-white rounded-2xl border overflow-hidden flex flex-col transition-shadow hover:shadow-[0_4px_20px_rgb(0,0,0,0.06)] ${
                    existingDoc?.status === 'VALIDATED' ? 'border-emerald-200' :
                    existingDoc?.status === 'REJECTED' ? 'border-rose-200' :
                    existingDoc?.status === 'PENDING' ? 'border-amber-200' :
                    'border-gray-100'
                  }`}
                >
                  <div className="p-5 flex-1">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                          existingDoc?.status === 'VALIDATED' ? 'bg-emerald-50 text-emerald-600' :
                          existingDoc?.status === 'REJECTED' ? 'bg-rose-50 text-rose-600' :
                          existingDoc?.status === 'PENDING' ? 'bg-amber-50 text-amber-600' :
                          'bg-indigo-50 text-indigo-600'
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
                          {cfg.icon}
                          {cfg.label}
                        </span>
                      )}
                    </div>

                    {existingDoc && (
                      <div className="mt-3 flex items-center justify-between text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2">
                        <span>Envoyé le {new Date(existingDoc.uploadedAt).toLocaleDateString("fr-FR")}</span>
                        {existingDoc.aiScore != null && (
                          <span className="flex items-center gap-1 font-medium">
                            <Bot className={`w-3.5 h-3.5 ${existingDoc.aiScore > 85 ? 'text-emerald-500' : existingDoc.aiScore > 60 ? 'text-amber-500' : 'text-rose-500'}`} />
                            Score IA: <strong>{existingDoc.aiScore}%</strong>
                          </span>
                        )}
                      </div>
                    )}

                    {existingDoc?.status === 'REJECTED' && (
                      <div className="mt-2 bg-rose-50 border border-rose-100 rounded-lg px-3 py-2 text-xs text-rose-700">
                        ⚠️ Ce document a été rejeté. Merci de le resoumettre.
                      </div>
                    )}
                  </div>

                  {/* Upload Zone */}
                  {(!existingDoc || existingDoc.status === 'REJECTED') && (
                    <div className="px-5 pb-5">
                      <label className={`flex flex-col items-center justify-center w-full py-4 border-2 border-dashed rounded-xl cursor-pointer transition-all ${
                        isUploading ? 'border-indigo-400 bg-indigo-50/50' : 'border-gray-200 bg-gray-50 hover:border-indigo-300 hover:bg-indigo-50/30'
                      }`}>
                        {isUploading ? (
                          <div className="flex items-center gap-2 text-indigo-600 text-sm font-medium">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Envoi en cours...
                          </div>
                        ) : (
                          <div className="text-center">
                            <Upload className="w-5 h-5 text-indigo-400 mx-auto mb-1" />
                            <p className="text-xs text-gray-500">
                              <span className="font-semibold text-indigo-600">Cliquez pour uploader</span> ou glissez le fichier
                            </p>
                            <p className="text-xs text-gray-400 mt-0.5">PDF, JPG ou PNG (max. 5MB)</p>
                          </div>
                        )}
                        <input
                          type="file"
                          className="hidden"
                          accept=".pdf,.jpg,.jpeg,.png"
                          disabled={isUploading}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleFileUpload(req.type, req.label, file);
                          }}
                        />
                      </label>
                    </div>
                  )}

                  {existingDoc && existingDoc.status !== 'REJECTED' && (
                    <div className="px-5 pb-5">
                      <a
                        href={existingDoc.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full flex items-center justify-center gap-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 py-2.5 rounded-xl text-sm font-medium transition-colors"
                      >
                        <FileText className="w-4 h-4 text-indigo-500" />
                        Voir le document
                      </a>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
