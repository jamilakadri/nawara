"use client";

import { useState } from "react";
import { FileText, Send, Star, Loader2, CheckCircle, Sparkles, MessageSquare, Package } from "lucide-react";
import { fetchGraphQL } from "@/lib/graphqlClient";
import { useAuth } from "@/lib/authContext";
import { useNotifications } from "@/lib/notificationContext";

const CREATE_EVAL = `
  mutation CreateEvaluation($employeeId: ID!, $evaluatorId: ID!, $score: Float!, $comments: String, $isAutoEvaluation: Boolean) {
    createEvaluation(employeeId: $employeeId, evaluatorId: $evaluatorId, score: $score, comments: $comments, isAutoEvaluation: $isAutoEvaluation) {
      id score
    }
  }
`;

export default function EmployeeEvaluationPage() {
  const { user } = useAuth();
  const { addToast } = useNotifications();
  const [rating, setRating] = useState(0);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [material, setMaterial] = useState("");
  const [comments, setComments] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const ratingLabels = ["", "Très insatisfait", "Insatisfait", "Neutre", "Satisfait", "Très satisfait"];

  const handleSubmit = async () => {
    if (rating === 0 || !user?.id) return;
    setSubmitting(true);
    try {
      const empQuery = `query { employeeByUserId(userId: "${user.id}") { id } }`;
      const empData = await fetchGraphQL<any>(empQuery);
      const employeeId = empData?.employeeByUserId?.id;

      if (!employeeId) throw new Error("Employé introuvable");

      const fullComments = `Matériel : ${material || "Non spécifié"}. Commentaires : ${comments}`;
      await fetchGraphQL(CREATE_EVAL, {
        employeeId: employeeId,
        evaluatorId: user.id,
        score: rating * 2,
        comments: fullComments,
        isAutoEvaluation: true
      });
      setSubmitted(true);
      addToast({
        type: "success",
        title: "Évaluation envoyée",
        message: "Votre auto-évaluation a bien été enregistrée. Merci !",
      });
    } catch (e) {
      console.error(e);
      addToast({
        type: "error",
        title: "Erreur",
        message: "Impossible de soumettre votre évaluation. Réessayez.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto text-center py-20 px-6">
        <div className="w-24 h-24 bg-gradient-to-br from-emerald-100 to-green-50 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-lg shadow-emerald-100">
          <CheckCircle className="w-12 h-12" />
        </div>
        <h2 className="text-3xl font-extrabold text-gray-900 mb-3 tracking-tight">Merci pour vos retours !</h2>
        <p className="text-gray-500 text-lg max-w-md mx-auto leading-relaxed">
          Votre évaluation a bien été enregistrée. Vos retours nous aident à améliorer continuellement notre processus d&apos;intégration.
        </p>
        <div className="mt-8 inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 px-4 py-2 rounded-full text-sm font-semibold border border-emerald-200">
          <Sparkles className="w-4 h-4" />
          Évaluation complétée avec succès
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto pb-8">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Mon Auto-évaluation</h1>
        <p className="text-gray-500 mt-2">
          Cette étape nous permet de recueillir vos impressions sur votre intégration afin d&apos;améliorer nos processus continuellement.
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-indigo-50 to-violet-50 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-sm">
            <FileText className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">Formulaire d&apos;évaluation</h2>
            <p className="text-xs text-gray-500">Fin du 1er mois d&apos;intégration</p>
          </div>
        </div>
        
        <div className="p-6 space-y-8">
          {/* Question 1 — Star Rating */}
          <div>
            <label className="block text-sm font-bold text-gray-900 mb-4">
              Comment évaluez-vous votre intégration globale ? <span className="text-rose-500">*</span>
            </label>
            <div className="flex items-center gap-4">
              <div className="flex items-center space-x-1.5">
                {[1, 2, 3, 4, 5].map((star) => {
                  const active = star <= (hoveredStar || rating);
                  return (
                    <button
                      key={star}
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoveredStar(star)}
                      onMouseLeave={() => setHoveredStar(0)}
                      className={`transition-all duration-200 hover:scale-125 ${
                        active ? "text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.4)]" : "text-gray-200 hover:text-amber-300"
                      }`}
                    >
                      <Star className={`w-10 h-10 ${active ? "fill-amber-400" : ""}`} />
                    </button>
                  );
                })}
              </div>
              {(hoveredStar || rating) > 0 && (
                <span className="text-sm font-semibold text-amber-600 bg-amber-50 px-3 py-1 rounded-full border border-amber-200 animate-in fade-in duration-200">
                  {ratingLabels[hoveredStar || rating]}
                </span>
              )}
            </div>
          </div>

          {/* Question 2 — Material */}
          <div>
            <label className="block text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Package className="w-4 h-4 text-indigo-500" />
              Avez-vous eu toutes les informations et le matériel nécessaires ?
            </label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Oui, tout à fait", val: "Oui", emoji: "✅", color: "border-emerald-500 bg-emerald-50/30 text-emerald-800" },
                { label: "Partiellement", val: "Partiellement", emoji: "⚠️", color: "border-amber-500 bg-amber-50/30 text-amber-800" },
                { label: "Non, pas encore", val: "Non", emoji: "❌", color: "border-rose-500 bg-rose-50/30 text-rose-800" }
              ].map((opt) => (
                <button
                  key={opt.val}
                  onClick={() => setMaterial(opt.val)}
                  className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all text-center ${
                    material === opt.val
                      ? opt.color
                      : "border-gray-200 text-gray-500 hover:border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  <span className="text-2xl mb-1.5">{opt.emoji}</span>
                  <span className="text-xs font-bold leading-tight">{opt.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Question 3 — Comments */}
          <div>
            <label className="block text-sm font-bold text-gray-900 mb-2 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-indigo-500" />
              Commentaires ou suggestions d&apos;amélioration
              <span className="text-xs text-gray-400 font-normal">(Optionnel)</span>
            </label>
            <textarea 
              rows={4} 
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              className="block w-full px-4 py-3 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-indigo-400 focus:border-transparent text-sm transition-all resize-none bg-gray-50 focus:bg-white placeholder:text-gray-400"
              placeholder="Partagez vos impressions, suggestions ou points d'amélioration..."
            ></textarea>
          </div>
        </div>

        <div className="px-6 py-5 border-t border-gray-100 bg-gray-50/50 flex justify-between items-center">
          <p className="text-xs text-gray-400">
            {rating > 0 ? "✓ Prêt à soumettre" : "Sélectionnez une note pour continuer"}
          </p>
          <button 
            onClick={handleSubmit}
            disabled={rating === 0 || submitting}
            className="bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-indigo-200"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Soumettre mon évaluation
          </button>
        </div>
      </div>
    </div>
  );
}
