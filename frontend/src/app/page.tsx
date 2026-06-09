"use client";

import { Loader2 } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8fafc]">
      <div className="text-center space-y-4">
        <Loader2 className="w-10 h-10 text-indigo-500 animate-spin mx-auto" />
        <p className="text-gray-500 text-sm font-medium">Redirection en cours…</p>
      </div>
    </div>
  );
}