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

  const handleGoogleLogin = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=/admin`,
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
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

        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-700"></div>
          </div>
          <div className="relative flex justify-center text-[10px] uppercase font-bold">
            <span className="bg-[#1e293b] px-3 text-slate-500">O continúa con</span>
          </div>
        </div>

        <button
          onClick={handleGoogleLogin}
          type="button"
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 py-3 rounded-lg text-sm font-semibold bg-white text-slate-900 hover:bg-slate-100 disabled:opacity-50 transition-all shadow-md"
        >
          <svg viewBox="0 0 24 24" className="w-5 h-5">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.16H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.84l3.66-2.75z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.16l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
          </svg>
          Google
        </button>
        
        <div className="mt-8 text-center text-[11px] text-slate-500">
          <p>Solo personal autorizado.</p>
        </div>
      </div>
    </div>
  );
}
