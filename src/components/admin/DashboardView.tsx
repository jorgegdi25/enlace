"use client";

import { useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import { format, subDays, isAfter, parseISO } from "date-fns";
import { es } from "date-fns/locale";

type Lead = {
  id: string;
  created_at: string;
  name: string;
  phone: string;
  company: string;
  status: string;
  notes: string;
  needs: string;
  email?: string;
  city?: string;
  score?: number;
  links?: string[];
  history: { role: string; content: string }[];
  metadata: Record<string, unknown>;
};

const STATUS_COLORS: Record<string, string> = {
  nuevo: "#f97316",
  contactado: "#3b82f6",
  sesion: "#a855f7",
  cerrado: "#10b981",
  perdido: "#ef4444",
};

export default function DashboardView({ leads }: { leads: Lead[] }) {
  const chartData = useMemo(() => {
    // Generate last 7 days data
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = subDays(new Date(), 6 - i);
      return {
        date: format(d, "yyyy-MM-dd"),
        displayDate: format(d, "dd MMM", { locale: es }),
        nuevos: 0,
        cerrados: 0,
      };
    });

    leads.forEach((lead) => {
      const leadDate = lead.created_at ? lead.created_at.split("T")[0] : null;
      if (!leadDate) return;

      const dayMatch = days.find((d) => d.date === leadDate);
      if (dayMatch) {
        if (lead.status === "cerrado") dayMatch.cerrados += 1;
        else dayMatch.nuevos += 1;
      }
    });

    return days;
  }, [leads]);

  const conversionRate = useMemo(() => {
    if (leads.length === 0) return 0;
    const closed = leads.filter((l) => l.status === "cerrado").length;
    return Math.round((closed / leads.length) * 100);
  }, [leads]);

  const recentActivity = useMemo(() => {
    return [...leads]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5);
  }, [leads]);

  const pendingLeads = useMemo(() => {
    return leads.filter((l) => l.status === "nuevo").slice(0, 5);
  }, [leads]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-xl p-6 bg-[#0F172A] border border-slate-800 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 rounded-full -mr-10 -mt-10 blur-xl"></div>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Tasa de Conversión</p>
          <div className="flex items-end gap-3">
            <h3 className="text-4xl font-extrabold text-white">{conversionRate}%</h3>
            <span className="text-sm text-slate-400 mb-1">de leads a clientes</span>
          </div>
        </div>
        
        <div className="rounded-xl p-6 bg-[#0F172A] border border-slate-800 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full -mr-10 -mt-10 blur-xl"></div>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Leads Activos</p>
          <div className="flex items-end gap-3">
            <h3 className="text-4xl font-extrabold text-white">
              {leads.filter(l => ["nuevo", "contactado", "sesion"].includes(l.status)).length}
            </h3>
            <span className="text-sm text-slate-400 mb-1">en progreso</span>
          </div>
        </div>

        <div className="rounded-xl p-6 bg-[#0F172A] border border-slate-800 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full -mr-10 -mt-10 blur-xl"></div>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Total Histórico</p>
          <div className="flex items-end gap-3">
            <h3 className="text-4xl font-extrabold text-white">{leads.length}</h3>
            <span className="text-sm text-slate-400 mb-1">oportunidades</span>
          </div>
        </div>
      </div>

      {/* Main Chart Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-xl bg-[#0F172A] border border-slate-800 p-6 flex flex-col h-[400px]">
          <h3 className="text-sm font-bold text-white mb-6">Generación de Leads (Últimos 7 días)</h3>
          <div className="flex-1 min-h-0 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="displayDate" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: "#1e293b", borderColor: "#334155", borderRadius: "8px", color: "#f8fafc" }}
                  itemStyle={{ color: "#f8fafc" }}
                />
                <Line type="monotone" dataKey="nuevos" name="Nuevos Leads" stroke="#f97316" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="cerrados" name="Leads Cerrados" stroke="#10b981" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Action Items */}
        <div className="flex flex-col gap-6">
          <div className="rounded-xl bg-[#0F172A] border border-slate-800 flex flex-col flex-1">
            <div className="p-4 border-b border-slate-800 bg-slate-900/50">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-orange-500 text-[18px]">notification_important</span>
                Prioridad de Contacto
              </h3>
            </div>
            <div className="p-4 flex-1 overflow-y-auto">
              {pendingLeads.length > 0 ? (
                <ul className="space-y-3">
                  {pendingLeads.map(lead => (
                    <li key={lead.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-800/40 border border-slate-700 hover:bg-slate-800 transition-colors cursor-default">
                      <div>
                        <p className="text-sm font-semibold text-white">{lead.name}</p>
                        <p className="text-xs text-slate-400">{lead.phone}</p>
                      </div>
                      <span className="px-2 py-1 rounded text-[10px] font-bold bg-orange-500/10 text-orange-500 border border-orange-500/20">
                        NUEVO
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-2 opacity-70">
                  <span className="material-symbols-outlined text-4xl">check_circle</span>
                  <p className="text-sm text-center">¡Todo al día!<br/>No hay leads nuevos sin contactar.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Feed */}
      <div className="rounded-xl bg-[#0F172A] border border-slate-800 overflow-hidden">
        <div className="p-5 border-b border-slate-800 bg-slate-900/50">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <span className="material-symbols-outlined text-blue-500 text-[18px]">history</span>
            Actividad Reciente
          </h3>
        </div>
        <div className="divide-y divide-slate-800/50">
          {recentActivity.map(lead => (
            <div key={lead.id} className="p-4 flex items-center gap-4 hover:bg-slate-800/30 transition-colors">
              <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs" style={{ backgroundColor: `${STATUS_COLORS[lead.status]}15`, color: STATUS_COLORS[lead.status] }}>
                {lead.name?.substring(0, 2).toUpperCase() || "??"}
              </div>
              <div className="flex-1">
                <p className="text-sm text-slate-200">
                  <span className="font-bold text-white">{lead.name}</span> ingresó al sistema.
                </p>
                <p className="text-xs text-slate-500 mt-0.5">{lead.company || "Sin empresa"} • {lead.phone}</p>
              </div>
              <div className="text-right">
                <span className="px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider" style={{ backgroundColor: `${STATUS_COLORS[lead.status]}15`, color: STATUS_COLORS[lead.status], border: `1px solid ${STATUS_COLORS[lead.status]}40` }}>
                  {lead.status}
                </span>
                <p className="text-[10px] text-slate-500 mt-1">
                  {format(new Date(lead.created_at), "dd MMM, HH:mm", { locale: es })}
                </p>
              </div>
            </div>
          ))}
          {recentActivity.length === 0 && (
             <div className="p-8 text-center text-slate-500">
               No hay actividad reciente.
             </div>
          )}
        </div>
      </div>
    </div>
  );
}
