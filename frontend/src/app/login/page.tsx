"use client";

import { useState } from "react";
import { useAuth } from "@/lib/authContext";
import { fetchGraphQL } from "@/lib/graphqlClient";
import { Lock, Mail, Loader2, AlertCircle, Eye, EyeOff, ArrowRight, CheckCircle } from "lucide-react";

const LOGIN_MUTATION = `
  mutation Login($email: String!, $password: String!) {
    login(loginInput: { email: $email, password: $password }) {
      access_token
      user { id email firstName lastName role }
    }
  }
`;

const FEATURES = [
  { label: "Onboarding automatisé", desc: "Parcours personnalisés par poste" },
  { label: "Suivi en temps réel", desc: "Progression et KPIs instantanés" },
  { label: "Documents centralisés", desc: "Validation et archivage sécurisé" },
];

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [focused, setFocused] = useState<"email" | "password" | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { setError("Veuillez remplir tous les champs."); return; }
    setLoading(true);
    setError("");
    try {
      const data = await fetchGraphQL<any>(LOGIN_MUTATION, { email, password });
      if (data?.login) {
        login(data.login.user, data.login.access_token);
      } else {
        setError("Identifiants incorrects.");
      }
    } catch {
      setError("Email ou mot de passe invalide.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex overflow-hidden" style={{ fontFamily: "'Inter', 'Segoe UI', sans-serif" }}>

      {/* ── Left panel — branding ── */}
      <div
        className="hidden lg:flex lg:w-[55%] relative flex-col justify-between p-12 overflow-hidden"
        style={{
          background: "linear-gradient(135deg, #1e1b4b 0%, #312e81 30%, #4338ca 65%, #6366f1 100%)",
        }}
      >
        {/* Animated blobs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div
            className="absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full opacity-20"
            style={{ background: "radial-gradient(circle, #818cf8, transparent)", animation: "pulse 8s ease-in-out infinite" }}
          />
          <div
            className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full opacity-15"
            style={{ background: "radial-gradient(circle, #c7d2fe, transparent)", animation: "pulse 6s ease-in-out infinite 2s" }}
          />
          <div
            className="absolute top-1/2 left-1/3 w-[300px] h-[300px] rounded-full opacity-10"
            style={{ background: "radial-gradient(circle, #a5b4fc, transparent)", animation: "pulse 10s ease-in-out infinite 1s" }}
          />
          {/* Grid pattern */}
          <div
            className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage: "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
              backgroundSize: "40px 40px",
            }}
          />
        </div>

        {/* Logo */}
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl flex items-center justify-center shadow-xl">
              <svg viewBox="0 0 24 24" className="w-6 h-6 text-white fill-current">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span className="text-white font-bold text-xl tracking-tight">HR Smart Onboarding</span>
          </div>
        </div>

        {/* Hero content */}
        <div className="relative z-10 space-y-8">
          <div>
            <h2 className="text-5xl font-black text-white leading-tight tracking-tight">
              Transformez<br />
              <span className="text-indigo-300">l'intégration</span><br />
              de vos talents.
            </h2>
            <p className="text-indigo-200 mt-4 text-lg leading-relaxed max-w-md">
              Plateforme RH intelligente pour un onboarding structuré, automatisé et mesurable.
            </p>
          </div>

          {/* Feature list */}
          <div className="space-y-4">
            {FEATURES.map((f, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-indigo-400/30 border border-indigo-400/50 flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle className="w-3.5 h-3.5 text-indigo-300" />
                </div>
                <div>
                  <p className="text-white font-semibold text-sm">{f.label}</p>
                  <p className="text-indigo-300 text-xs mt-0.5">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Stats */}
          <div className="flex gap-8 pt-4 border-t border-white/10">
            {[
              { value: "98%", label: "Satisfaction RH" },
              { value: "3×", label: "Plus rapide" },
              { value: "100%", label: "Conforme RGPD" },
            ].map((s) => (
              <div key={s.label}>
                <p className="text-3xl font-black text-white">{s.value}</p>
                <p className="text-indigo-300 text-xs font-medium mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom */}
        <div className="relative z-10">
          <p className="text-indigo-400 text-xs">© 2026 HR Smart Onboarding · Tous droits réservés</p>
        </div>
      </div>

      {/* ── Right panel — form ── */}
      <div className="w-full lg:w-[45%] flex items-center justify-center bg-white p-8 relative">

        {/* Subtle top decoration */}
        <div className="absolute top-0 left-0 right-0 h-1" style={{ background: "linear-gradient(90deg, #4338ca, #818cf8, #4338ca)" }} />

        {/* Mobile logo */}
        <div className="absolute top-6 left-6 lg:hidden flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-600 rounded-xl flex items-center justify-center">
            <svg viewBox="0 0 24 24" className="w-4 h-4 text-white fill-current">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span className="text-gray-900 font-bold text-sm">HR Smart</span>
        </div>

        <div className="w-full max-w-md">
          {/* Heading */}
          <div className="mb-8">
            <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-4 border border-indigo-100">
              <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse" />
              Espace sécurisé
            </div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">Bon retour 👋</h1>
            <p className="text-gray-500 mt-1.5 text-sm">Connectez-vous à votre espace RH.</p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-5 bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-2xl flex items-center gap-2.5 text-sm animate-in fade-in slide-in-from-top-1 duration-200">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <p>{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Adresse Email
              </label>
              <div className={`relative transition-all duration-200 ${focused === "email" ? "transform scale-[1.01]" : ""}`}>
                <Mail className={`w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-200 ${focused === "email" ? "text-indigo-500" : "text-gray-400"}`} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setFocused("email")}
                  onBlur={() => setFocused(null)}
                  placeholder="jean.dupont@entreprise.com"
                  className="w-full pl-11 pr-4 py-3.5 rounded-2xl border text-sm text-gray-900 transition-all duration-200 outline-none placeholder:text-gray-300"
                  style={{
                    borderColor: focused === "email" ? "#6366f1" : "#e5e7eb",
                    boxShadow: focused === "email" ? "0 0 0 4px rgba(99,102,241,0.1)" : "none",
                    background: focused === "email" ? "#fff" : "#f9fafb",
                  }}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-semibold text-gray-700">Mot de Passe</label>
                <button type="button" className="text-xs text-indigo-600 hover:text-indigo-700 font-medium transition-colors">
                  Mot de passe oublié ?
                </button>
              </div>
              <div className={`relative transition-all duration-200 ${focused === "password" ? "transform scale-[1.01]" : ""}`}>
                <Lock className={`w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-200 ${focused === "password" ? "text-indigo-500" : "text-gray-400"}`} />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setFocused("password")}
                  onBlur={() => setFocused(null)}
                  placeholder="••••••••••"
                  className="w-full pl-11 pr-12 py-3.5 rounded-2xl border text-sm text-gray-900 transition-all duration-200 outline-none placeholder:text-gray-300"
                  style={{
                    borderColor: focused === "password" ? "#6366f1" : "#e5e7eb",
                    boxShadow: focused === "password" ? "0 0 0 4px rgba(99,102,241,0.1)" : "none",
                    background: focused === "password" ? "#fff" : "#f9fafb",
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-indigo-500 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-2xl text-white text-sm font-bold transition-all duration-300 flex items-center justify-center gap-2 mt-2 group"
              style={{
                background: loading
                  ? "#a5b4fc"
                  : "linear-gradient(135deg, #4338ca 0%, #6366f1 100%)",
                boxShadow: loading ? "none" : "0 8px 24px rgba(99,102,241,0.4)",
                transform: loading ? "scale(0.98)" : "scale(1)",
              }}
              onMouseEnter={(e) => { if (!loading) (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 12px 32px rgba(99,102,241,0.5)"; }}
              onMouseLeave={(e) => { if (!loading) (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 8px 24px rgba(99,102,241,0.4)"; }}
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <span>Se Connecter</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1 duration-200" />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="mt-8 pt-6 border-t border-gray-100">
            <div className="flex items-center justify-center gap-4 text-xs text-gray-400">
              <span className="flex items-center gap-1">
                <svg className="w-3.5 h-3.5 text-green-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
                Chiffrement SSL
              </span>
              <span className="w-1 h-1 bg-gray-300 rounded-full" />
              <span className="flex items-center gap-1">
                <svg className="w-3.5 h-3.5 text-blue-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
                Conforme RGPD
              </span>
              <span className="w-1 h-1 bg-gray-300 rounded-full" />
              <span>Support RH disponible</span>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 0.2; }
          50% { transform: scale(1.05); opacity: 0.3; }
        }
        .animate-in { animation: fadeSlideIn 0.2s ease-out; }
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
