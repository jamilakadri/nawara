"use client";

import { useEffect, useState } from "react";
import { CheckCircle, XCircle, AlertTriangle, Info, X } from "lucide-react";
import { useNotifications, ToastMessage } from "@/lib/notificationContext";

function ToastItem({ toast, onRemove }: { toast: ToastMessage; onRemove: () => void }) {
  const [progress, setProgress] = useState(100);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Slide in
    requestAnimationFrame(() => setVisible(true));

    // Progress bar shrinks over 4s
    const start = Date.now();
    const duration = 4000;
    const frame = () => {
      const elapsed = Date.now() - start;
      const pct = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(pct);
      if (elapsed < duration) requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  }, []);

  const config = {
    success: {
      icon: CheckCircle,
      bg: "bg-white",
      border: "border-emerald-200",
      icon_cls: "text-emerald-500",
      bar: "bg-emerald-500",
    },
    error: {
      icon: XCircle,
      bg: "bg-white",
      border: "border-rose-200",
      icon_cls: "text-rose-500",
      bar: "bg-rose-500",
    },
    warning: {
      icon: AlertTriangle,
      bg: "bg-white",
      border: "border-amber-200",
      icon_cls: "text-amber-500",
      bar: "bg-amber-500",
    },
    info: {
      icon: Info,
      bg: "bg-white",
      border: "border-indigo-200",
      icon_cls: "text-indigo-500",
      bar: "bg-indigo-500",
    },
  }[toast.type];

  const Icon = config.icon;

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border shadow-xl shadow-black/5 p-4 pr-10 flex items-start gap-3 w-80 transition-all duration-300 ${config.bg} ${config.border} ${
        visible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-8"
      }`}
    >
      <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${config.icon_cls}`} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900 leading-tight">{toast.title}</p>
        {toast.message && (
          <p className="text-xs text-gray-500 mt-0.5 leading-relaxed line-clamp-2">
            {toast.message}
          </p>
        )}
      </div>
      <button
        onClick={onRemove}
        className="absolute top-2.5 right-2.5 text-gray-400 hover:text-gray-600 transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
      {/* Progress bar */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-100">
        <div
          className={`h-full transition-none ${config.bar}`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

export function ToastContainer() {
  const { toasts, removeToast } = useNotifications();

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <ToastItem toast={toast} onRemove={() => removeToast(toast.id)} />
        </div>
      ))}
    </div>
  );
}
