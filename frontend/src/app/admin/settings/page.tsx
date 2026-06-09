"use client";

import React, { useState } from "react";
import {
  Save, Bell, Shield, Bot, User, Lock, CheckCircle, Loader2,
  Mail, Phone, Globe, Palette, Database, Clock,
} from "lucide-react";
import { useAuth } from "@/lib/authContext";
import { useNotifications } from "@/lib/notificationContext";

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative inline-flex w-11 h-6 rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 ${
        checked ? "bg-indigo-600" : "bg-gray-200"
      }`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-all duration-300 ${
          checked ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  );
}

function SectionCard({
  icon: Icon,
  title,
  color,
  children,
}: {
  icon: React.ElementType;
  title: string;
  color: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-100 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3 bg-gray-50/50">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${color}`}>
          <Icon className="w-5 h-5" />
        </div>
        <h2 className="text-base font-bold text-gray-800">{title}</h2>
      </div>
      <div className="p-6 space-y-5">{children}</div>
    </div>
  );
}

function ToggleRow({
  title,
  desc,
  checked,
  onChange,
}: {
  title: string;
  desc: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex-1">
        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
        <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
      </div>
      <Toggle checked={checked} onChange={onChange} />
    </div>
  );
}

export default function SettingsPage() {
  const { user } = useAuth();
  const { addToast } = useNotifications();
  const [saving, setSaving] = useState(false);

  // Profile state
  const [profile, setProfile] = useState({
    firstName: user?.firstName ?? "",
    lastName: user?.lastName ?? "",
    email: user?.email ?? "",
    phone: "",
    language: "fr",
  });

  // Notification preferences
  const [notifPrefs, setNotifPrefs] = useState({
    taskOverdue: true,
    docValidation: true,
    trialPeriod: true,
    newEmployee: true,
    weeklyReport: false,
  });

  // AI preferences
  const [aiPrefs, setAiPrefs] = useState({
    autoDocAnalysis: true,
    summaryGeneration: true,
    anomalyDetection: false,
    chatbot: true,
  });

  // Security
  const [security, setSecurity] = useState({
    sessionTimeout: "8",
    twoFactor: false,
    auditLog: true,
  });

  const handleSave = async () => {
    setSaving(true);
    // Simulate save delay
    await new Promise((r) => setTimeout(r, 900));
    setSaving(false);
    addToast({
      type: "success",
      title: "Paramètres enregistrés",
      message: "Vos préférences ont été sauvegardées avec succès.",
    });
  };

  return (
    <div className="max-w-4xl space-y-8 pb-10">
      <div>
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Paramètres</h1>
        <p className="text-gray-500 mt-2 text-sm">
          Gérez votre profil, vos préférences et la configuration du système.
        </p>
      </div>

      {/* Profile */}
      <SectionCard icon={User} title="Profil & Informations" color="bg-indigo-50 text-indigo-600">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wider">
              Prénom
            </label>
            <input
              value={profile.firstName}
              onChange={(e) => setProfile((p) => ({ ...p, firstName: e.target.value }))}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-all"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wider">
              Nom
            </label>
            <input
              value={profile.lastName}
              onChange={(e) => setProfile((p) => ({ ...p, lastName: e.target.value }))}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-all"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wider">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                value={profile.email}
                onChange={(e) => setProfile((p) => ({ ...p, email: e.target.value }))}
                className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-gray-200 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-all"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wider">
              Téléphone
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                value={profile.phone}
                onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))}
                placeholder="+33 6 00 00 00 00"
                className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-gray-200 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-all"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wider">
              Langue
            </label>
            <div className="relative">
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <select
                value={profile.language}
                onChange={(e) => setProfile((p) => ({ ...p, language: e.target.value }))}
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-400 appearance-none"
              >
                <option value="fr">Français</option>
                <option value="en">English</option>
                <option value="ar">العربية</option>
              </select>
            </div>
          </div>
        </div>

        {/* Role badge */}
        <div className="pt-2 border-t border-gray-100">
          <p className="text-xs text-gray-500">
            Rôle actuel :{" "}
            <span className="font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full">
              {user?.role ?? "ADMIN"}
            </span>
          </p>
        </div>
      </SectionCard>

      {/* Notifications */}
      <SectionCard icon={Bell} title="Notifications & Alertes" color="bg-blue-50 text-blue-600">
        <ToggleRow
          title="Rappels tâches en retard"
          desc="Notifier automatiquement le manager et l'employé quand une tâche dépasse l'échéance."
          checked={notifPrefs.taskOverdue}
          onChange={(v) => setNotifPrefs((p) => ({ ...p, taskOverdue: v }))}
        />
        <ToggleRow
          title="Validation de documents"
          desc="Envoyer une notification à l'employé à chaque décision de validation."
          checked={notifPrefs.docValidation}
          onChange={(v) => setNotifPrefs((p) => ({ ...p, docValidation: v }))}
        />
        <ToggleRow
          title="Décision période d'essai"
          desc="Notifier l'employé de la décision de titularisation à la fin des 6 mois."
          checked={notifPrefs.trialPeriod}
          onChange={(v) => setNotifPrefs((p) => ({ ...p, trialPeriod: v }))}
        />
        <ToggleRow
          title="Nouvel employé intégré"
          desc="Alerter les managers lorsqu'un nouvel employé commence son parcours."
          checked={notifPrefs.newEmployee}
          onChange={(v) => setNotifPrefs((p) => ({ ...p, newEmployee: v }))}
        />
        <ToggleRow
          title="Rapport hebdomadaire"
          desc="Recevoir un résumé des KPIs RH chaque lundi matin."
          checked={notifPrefs.weeklyReport}
          onChange={(v) => setNotifPrefs((p) => ({ ...p, weeklyReport: v }))}
        />
      </SectionCard>

      {/* AI */}
      <SectionCard icon={Bot} title="Intelligence Artificielle" color="bg-purple-50 text-purple-600">
        <ToggleRow
          title="Analyse documentaire automatique"
          desc="L'IA pré-analyse les documents uploadés pour vérifier leur conformité et qualité."
          checked={aiPrefs.autoDocAnalysis}
          onChange={(v) => setAiPrefs((p) => ({ ...p, autoDocAnalysis: v }))}
        />
        <ToggleRow
          title="Génération de rapports de synthèse"
          desc="Générer un bilan textuel IA à la fin de chaque parcours d'intégration."
          checked={aiPrefs.summaryGeneration}
          onChange={(v) => setAiPrefs((p) => ({ ...p, summaryGeneration: v }))}
        />
        <ToggleRow
          title="Détection d'anomalies"
          desc="Identifier automatiquement les parcours à risque (retards, documents manquants)."
          checked={aiPrefs.anomalyDetection}
          onChange={(v) => setAiPrefs((p) => ({ ...p, anomalyDetection: v }))}
        />
        <ToggleRow
          title="Assistant IA (chatbot)"
          desc="Activer l'assistant conversationnel pour les employés et managers."
          checked={aiPrefs.chatbot}
          onChange={(v) => setAiPrefs((p) => ({ ...p, chatbot: v }))}
        />
      </SectionCard>

      {/* Security */}
      <SectionCard icon={Shield} title="Sécurité & Accès" color="bg-emerald-50 text-emerald-600">
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wider">
            Expiration de session
          </label>
          <div className="relative w-48">
            <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <select
              value={security.sessionTimeout}
              onChange={(e) => setSecurity((s) => ({ ...s, sessionTimeout: e.target.value }))}
              className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-400 appearance-none"
            >
              <option value="1">1 heure</option>
              <option value="4">4 heures</option>
              <option value="8">8 heures</option>
              <option value="24">24 heures</option>
            </select>
          </div>
        </div>
        <ToggleRow
          title="Double authentification (2FA)"
          desc="Exiger un code OTP à chaque connexion pour renforcer la sécurité."
          checked={security.twoFactor}
          onChange={(v) => setSecurity((s) => ({ ...s, twoFactor: v }))}
        />
        <ToggleRow
          title="Journal d'audit"
          desc="Conserver un historique de toutes les actions effectuées dans la plateforme."
          checked={security.auditLog}
          onChange={(v) => setSecurity((s) => ({ ...s, auditLog: v }))}
        />
      </SectionCard>

      {/* Save button */}
      <div className="flex justify-end pt-2">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2.5 bg-indigo-600 hover:bg-indigo-700 text-white px-7 py-3 rounded-2xl font-semibold text-sm shadow-lg shadow-indigo-200 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          {saving ? "Enregistrement…" : "Enregistrer les modifications"}
        </button>
      </div>
    </div>
  );
}
