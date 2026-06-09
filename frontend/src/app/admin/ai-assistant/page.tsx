"use client";

import { useEffect, useState } from "react";
import {
  Sparkles, Bot, FileText, Users, TrendingUp,
  CheckCircle, AlertTriangle, Loader2, RefreshCw,
  Brain, Zap, Shield, BarChart3,
} from "lucide-react";
import { fetchGraphQL } from "@/lib/graphqlClient";

const AI_INSIGHTS = `query { aiInsights { type title message priority } }`;
const AI_ANALYZE = `query AiAnalyze($name: String!, $type: String!) {
  aiAnalyzeDocument(name: $name, type: $type) {
    documentType confidence extractedFields missingFields recommendations
  }
}`;

interface AiInsight {
  type: string;
  title: string;
  message: string;
  priority: string;
}

interface DocAnalysis {
  documentType: string;
  confidence: number;
  extractedFields: string[];
  missingFields: string[];
  recommendations: string;
}

export default function AiAssistantPage() {
  const [insights, setInsights] = useState<AiInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [selectedDocType, setSelectedDocType] = useState("CIN");
  const [analysis, setAnalysis] = useState<DocAnalysis | null>(null);

  const loadInsights = () => {
    setLoading(true);
    fetchGraphQL<{ aiInsights: AiInsight[] }>(AI_INSIGHTS)
      .then((d) => setInsights(d.aiInsights || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadInsights(); }, []);

  const handleAnalyze = async () => {
    setAnalyzing(true);
    try {
      const docNames: Record<string, string> = {
        CIN: "Carte d'Identité Nationale", RIB: "Relevé d'Identité Bancaire",
        CV: "Curriculum Vitae", DIPLOME: "Diplôme", PHOTO: "Photo d'identité",
        CONTRAT: "Contrat de travail",
      };
      const data = await fetchGraphQL<{ aiAnalyzeDocument: DocAnalysis }>(AI_ANALYZE, {
        name: docNames[selectedDocType] || selectedDocType,
        type: selectedDocType,
      });
      setAnalysis(data.aiAnalyzeDocument);
    } catch (e) { console.error(e); }
    finally { setAnalyzing(false); }
  };

  const typeIcon: Record<string, React.ReactNode> = {
    WARNING: <AlertTriangle className="w-5 h-5 text-amber-500" />,
    SUCCESS: <CheckCircle className="w-5 h-5 text-emerald-500" />,
    INFO: <TrendingUp className="w-5 h-5 text-blue-500" />,
  };

  const priorityBadge: Record<string, string> = {
    HIGH: "bg-red-100 text-red-700",
    MEDIUM: "bg-yellow-100 text-yellow-700",
    LOW: "bg-gray-100 text-gray-600",
  };

  return (
    <div className="space-y-8 pb-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-200">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            Assistant IA
          </h1>
          <p className="text-gray-500 mt-2">
            Intelligence artificielle au service de votre gestion RH. Analyse, recommandations et insights automatiques.
          </p>
        </div>
        <button
          onClick={loadInsights}
          className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
        >
          <RefreshCw className="w-4 h-4" /> Actualiser
        </button>
      </div>

      {/* AI Capabilities Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { icon: Brain, label: "Analyse Documentaire", desc: "Vérification automatique de conformité", color: "from-violet-500 to-purple-500", bg: "bg-violet-50" },
          { icon: Bot, label: "Chatbot Intelligent", desc: "Assistant contextuel pour chaque rôle", color: "from-blue-500 to-cyan-500", bg: "bg-blue-50" },
          { icon: Zap, label: "Insights Automatiques", desc: "Recommandations basées sur les données", color: "from-amber-500 to-orange-500", bg: "bg-amber-50" },
          { icon: Shield, label: "Détection Anomalies", desc: "Identification proactive des risques", color: "from-emerald-500 to-teal-500", bg: "bg-emerald-50" },
        ].map((cap) => (
          <div key={cap.label} className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md transition-shadow group">
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${cap.color} flex items-center justify-center mb-3 shadow-sm group-hover:scale-105 transition-transform`}>
              <cap.icon className="w-6 h-6 text-white" />
            </div>
            <h3 className="font-bold text-gray-900 text-sm">{cap.label}</h3>
            <p className="text-xs text-gray-500 mt-1">{cap.desc}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Document Analysis Demo */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-violet-50 to-purple-50 flex items-center gap-2">
            <FileText className="w-5 h-5 text-violet-600" />
            <h2 className="font-bold text-gray-800">Analyse Documentaire IA</h2>
          </div>
          <div className="p-6 space-y-5">
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
                Type de document
              </label>
              <select
                value={selectedDocType}
                onChange={(e) => { setSelectedDocType(e.target.value); setAnalysis(null); }}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-violet-400"
              >
                <option value="CIN">Carte d&apos;Identité Nationale</option>
                <option value="RIB">Relevé d&apos;Identité Bancaire</option>
                <option value="CV">Curriculum Vitae</option>
                <option value="DIPLOME">Diplôme</option>
                <option value="PHOTO">Photo d&apos;identité</option>
                <option value="CONTRAT">Contrat de travail</option>
              </select>
            </div>
            <button
              onClick={handleAnalyze}
              disabled={analyzing}
              className="w-full bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 shadow-md shadow-violet-200 disabled:opacity-50 transition-all"
            >
              {analyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              {analyzing ? "Analyse en cours..." : "Lancer l'analyse IA"}
            </button>

            {analysis && (
              <div className="space-y-4 pt-2" style={{ animation: "fadeIn 0.3s ease-out" }}>
                {/* Score */}
                <div className="flex items-center justify-between bg-gray-50 rounded-xl p-4">
                  <div>
                    <p className="text-xs text-gray-500 font-semibold uppercase">Score de conformité</p>
                    <p className="text-2xl font-black text-gray-900 mt-1">{Math.round(analysis.confidence * 100)}%</p>
                  </div>
                  <div className={`w-16 h-16 rounded-full border-4 flex items-center justify-center ${
                    analysis.confidence >= 0.9 ? 'border-emerald-400 text-emerald-600' :
                    analysis.confidence >= 0.75 ? 'border-amber-400 text-amber-600' :
                    'border-red-400 text-red-600'
                  }`}>
                    <Bot className="w-7 h-7" />
                  </div>
                </div>

                {/* Type detected */}
                <div className="bg-violet-50 rounded-xl px-4 py-3">
                  <p className="text-xs text-violet-600 font-semibold">Type détecté</p>
                  <p className="text-sm font-bold text-gray-900 mt-0.5">{analysis.documentType}</p>
                </div>

                {/* Extracted fields */}
                <div>
                  <p className="text-xs text-gray-500 font-semibold uppercase mb-2">Champs extraits</p>
                  <div className="flex flex-wrap gap-1.5">
                    {analysis.extractedFields.map((f) => (
                      <span key={f} className="bg-emerald-50 text-emerald-700 text-xs font-medium px-2.5 py-1 rounded-lg border border-emerald-200">
                        ✓ {f}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Missing fields */}
                {analysis.missingFields.length > 0 && (
                  <div>
                    <p className="text-xs text-gray-500 font-semibold uppercase mb-2">Champs manquants</p>
                    <div className="flex flex-wrap gap-1.5">
                      {analysis.missingFields.map((f) => (
                        <span key={f} className="bg-red-50 text-red-700 text-xs font-medium px-2.5 py-1 rounded-lg border border-red-200">
                          ✕ {f}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recommendations */}
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <p className="text-xs text-blue-600 font-semibold mb-1 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" /> Recommandation IA
                  </p>
                  <p className="text-sm text-gray-700">{analysis.recommendations}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Insights Panel */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-amber-50 to-orange-50 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-amber-600" />
            <h2 className="font-bold text-gray-800">Insights & Recommandations</h2>
            <span className="bg-amber-100 text-amber-700 text-xs font-bold px-2 py-0.5 rounded-full ml-auto">
              {insights.length}
            </span>
          </div>
          <div className="p-6">
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-6 h-6 text-violet-400 animate-spin" />
              </div>
            ) : insights.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <Sparkles className="w-8 h-8 mx-auto mb-2 text-gray-200" />
                <p className="text-sm">Aucune recommandation</p>
              </div>
            ) : (
              <div className="space-y-3">
                {insights.map((ins, i) => (
                  <div
                    key={i}
                    className="border rounded-xl p-4 transition-all hover:shadow-sm"
                    style={{
                      animation: `fadeIn 0.3s ease-out ${i * 0.08}s both`,
                      borderColor: ins.type === 'WARNING' ? '#fbbf24' : ins.type === 'SUCCESS' ? '#34d399' : '#93c5fd',
                      backgroundColor: ins.type === 'WARNING' ? '#fffbeb' : ins.type === 'SUCCESS' ? '#ecfdf5' : '#eff6ff',
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 shrink-0">{typeIcon[ins.type] || typeIcon.INFO}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="text-sm font-bold text-gray-900">{ins.title}</h4>
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${priorityBadge[ins.priority] || priorityBadge.LOW}`}>
                            {ins.priority === 'HIGH' ? 'Haute' : ins.priority === 'MEDIUM' ? 'Moyenne' : 'Basse'}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 leading-relaxed">{ins.message}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
