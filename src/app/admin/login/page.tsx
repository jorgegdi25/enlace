"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push("/admin");
      router.refresh();
    }
  };

  return (
    <div className="flex h-screen items-center justify-center bg-[#0F172A] px-4" style={{ fontFamily: "Manrope, sans-serif" }}>
      <div className="w-full max-w-md bg-[#1e293b] rounded-2xl shadow-2xl p-8 border border-slate-800">
        <div className="text-center mb-8 flex flex-col items-center">
          <div className="relative w-48 h-12 mb-4">
            <Image 
              src="/logo-white.png" 
              alt="Enlace Logo" 
              fill 
              className="object-contain"
              priority
            />
          </div>
          <p className="text-xs text-slate-400 uppercase tracking-wider mt-1">Admin Dashboard</p>
        </div>

        {error && (
          <div className="mb-6 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
            {error === "Invalid login credentials" ? "Credenciales incorrectas." : error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="text-[10px] uppercase font-bold text-slate-500 mb-1.5 block">Correo Electrónico</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@correo.com"
              required
              className="w-full bg-[#0F172A] border border-slate-700 rounded-lg p-3 text-sm text-slate-200 outline-none focus:border-orange-500 transition-colors"
            />
          </div>
          <div>
            <label className="text-[10px] uppercase font-bold text-slate-500 mb-1.5 block">Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full bg-[#0F172A] border border-slate-700 rounded-lg p-3 text-sm text-slate-200 outline-none focus:border-orange-500 transition-colors"
            />
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 mt-2 rounded-lg text-sm font-bold bg-orange-500 hover:bg-orange-600 text-white disabled:opacity-50 transition-all shadow-lg shadow-orange-500/20"
          >
            {loading ? "Verificando..." : "Iniciar Sesión"}
          </button>
        </form>
        
        <div className="mt-8 text-center text-[11px] text-slate-500">
          <p>Solo personal autorizado.</p>
        </div>
      </div>
    </div>
  );
}
