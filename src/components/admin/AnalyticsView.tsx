"use client";

import { useMemo, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from "recharts";

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
  metadata: Record<string, unknown>;
};

const COLORS = ["#f97316", "#3b82f6", "#a855f7", "#10b981", "#ef4444", "#64748b"];

export default function AnalyticsView({ 
  leads, 
  onNavigate, 
  onFilter 
}: { 
  leads: Lead[], 
  onNavigate?: (view: string) => void,
  onFilter?: (status: string) => void
}) {
  const [drillDownStage, setDrillDownStage] = useState<{ id: string; label: string; color: string } | null>(null);

  // 1. Distribución por Estado
  const statusData = useMemo(() => {
    const counts: Record<string, number> = {};
    leads.forEach((l) => {
      counts[l.status] = (counts[l.status] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [leads]);

  // 2. Top Ciudades
  const cityData = useMemo(() => {
    const counts: Record<string, number> = {};
    leads.forEach((l) => {
      if (l.city) {
        counts[l.city] = (counts[l.city] || 0) + 1;
      }
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [leads]);

  // 3. Tendencia de Captación (Últimos 15 días)
  const tendencyData = useMemo(() => {
    const days: Record<string, number> = {};
    for (let i = 14; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      days[d.toISOString().split("T")[0]] = 0;
    }

    leads.forEach((l) => {
      const date = l.created_at.split("T")[0];
      if (days[date] !== undefined) {
        days[date] += 1;
      }
    });

    return Object.entries(days).map(([date, total]) => ({
      date: date.split("-").slice(1).join("/"),
      total,
    }));
  }, [leads]);

  const avgScore = useMemo(() => {
    const scores = leads.map((l) => l.score).filter((s): s is number => s !== undefined && s !== null);
    if (scores.length === 0) return 0;
    return (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1);
  }, [leads]);

  // 4. Datos del Embudo de Ventas
  const funnelData = useMemo(() => {
    const stages = [
      { id: "nuevo", label: "Leads Captados", color: "#f97316" },
      { id: "contactado", label: "Contactados", color: "#3b82f6" },
      { id: "sesion", label: "Sesiones Agendadas", color: "#a855f7" },
      { id: "cerrado", label: "Cierres Exitosos", color: "#10b981" },
    ];

    let lastValue = 0;
    return stages.map((s, i) => {
      let value = 0;
      if (s.id === 'nuevo') value = leads.length;
      else if (s.id === 'contactado') value = leads.filter(l => ['contactado', 'sesion', 'cerrado'].includes(l.status)).length;
      else if (s.id === 'sesion') value = leads.filter(l => ['sesion', 'cerrado'].includes(l.status)).length;
      else if (s.id === 'cerrado') value = leads.filter(l => l.status === 'cerrado').length;

      const conversion = i === 0 ? 100 : lastValue > 0 ? Math.round((value / lastValue) * 100) : 0;
      lastValue = value;

      return { ...s, value, conversion };
    });
  }, [leads]);

  // Leads filtrados para el drill-down
  const drillDownLeads = useMemo(() => {
    if (!drillDownStage) return [];
    
    let filtered: Lead[] = [];
    if (drillDownStage.id === 'nuevo') {
      filtered = leads;
    } else if (drillDownStage.id === 'contactado') {
      filtered = leads.filter(l => ['contactado', 'sesion', 'cerrado'].includes(l.status));
    } else if (drillDownStage.id === 'sesion') {
      filtered = leads.filter(l => ['sesion', 'cerrado'].includes(l.status));
    } else if (drillDownStage.id === 'cerrado') {
      filtered = leads.filter(l => l.status === 'cerrado');
    }
    
    return filtered.slice(0, 10);
  }, [drillDownStage, leads]);

  const handleReviewLeads = () => {
    if (drillDownStage && onNavigate && onFilter) {
      onFilter(drillDownStage.id);
      onNavigate('leads');
      setDrillDownStage(null);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10 relative">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-black text-slate-50 tracking-tight italic uppercase">Operations Intelligence</h2>
          <div className="flex items-center gap-2 mt-1">
             <div className="h-[2px] w-8 bg-orange-500"></div>
             <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Visual Data & Conversion Flow</p>
          </div>
        </div>
      </div>

      {/* Mini Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: "Leads Totales", value: leads.length, color: "text-orange-500", icon: "groups" },
          { label: "Score Promedio", value: `${avgScore}/10`, color: "text-blue-400", icon: "analytics" },
          { label: "Tasa de Cierre", value: `${Math.round((leads.filter(l => l.status === 'cerrado').length / (leads.length || 1)) * 100)}%`, color: "text-emerald-400", icon: "verified" },
          { label: "Geolocalización", value: new Set(leads.map(l => l.city).filter(Boolean)).size, color: "text-purple-400", icon: "map" },
        ].map((stat, i) => (
          <div key={i} className="bg-[#0F172A]/80 backdrop-blur-md border border-slate-800/60 p-5 rounded-2xl relative overflow-hidden group shadow-xl">
            <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
               <span className="material-symbols-outlined text-4xl">{stat.icon}</span>
            </div>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1 relative z-10">{stat.label}</p>
            <p className={`text-2xl font-black ${stat.color} relative z-10 tracking-tighter`}>{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* COLUMNA 1: EMBUDO DE VENTAS */}
        <div className="bg-[#0F172A]/80 backdrop-blur-xl border border-slate-800/60 p-6 rounded-3xl flex flex-col lg:col-span-1 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-500 via-blue-500 to-emerald-500 opacity-30"></div>
          
          <h3 className="text-xs font-black text-slate-400 mb-8 flex items-center justify-between uppercase tracking-[0.2em]">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-orange-500 text-lg">filter_alt</span>
              Embudo de Conversión
            </div>
            <span className="text-[9px] bg-slate-950 px-2 py-1 rounded-full border border-slate-800 italic">Click para ver leads</span>
          </h3>
          
          <div className="flex-1 flex flex-col justify-between gap-4">
            {funnelData.map((stage, i) => (
              <div 
                key={stage.id} 
                className="relative group cursor-pointer"
                onClick={() => setDrillDownStage(stage)}
              >
                <div className="flex justify-between items-end mb-2 px-1">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest group-hover:text-slate-300 transition-colors">{stage.label}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-slate-300 tabular-nums">{stage.value}</span>
                  </div>
                </div>
                
                <div className="h-12 w-full bg-slate-950/50 rounded-xl border border-slate-800/50 overflow-hidden flex items-center px-1 group-hover:border-slate-600 transition-all shadow-inner">
                  <div 
                    className="h-9 rounded-lg transition-all duration-1000 ease-out flex items-center justify-end px-4 relative overflow-hidden group-hover:brightness-125"
                    style={{ 
                      width: `${Math.max(15, (stage.value / (leads.length || 1)) * 100)}%`,
                      backgroundColor: `${stage.color}20`,
                      border: `1px solid ${stage.color}40`,
                    }}
                  >
                    <div className="absolute inset-0 opacity-10 bg-gradient-to-r from-transparent via-white to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                    {i > 0 && (
                      <span className="text-[10px] font-black tabular-nums shadow-sm" style={{ color: stage.color }}>
                        {stage.conversion}%
                      </span>
                    )}
                  </div>
                </div>

                {i < funnelData.length - 1 && (
                  <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 z-10 opacity-30">
                    <span className="material-symbols-outlined text-slate-400 text-xs">keyboard_double_arrow_down</span>
                  </div>
                )}
              </div>
            ))}
          </div>
          
          <div className="mt-8 pt-5 border-t border-slate-800/50">
            <div className="flex justify-between items-center">
              <div className="flex flex-col">
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Eficiencia de Cierre</span>
                <span className="text-lg font-black text-emerald-400 italic tabular-nums">{funnelData[3].conversion}%</span>
              </div>
              <div className="h-10 w-10 rounded-full border border-emerald-500/20 bg-emerald-500/5 flex items-center justify-center">
                <span className="material-symbols-outlined text-emerald-500 text-xl">speed</span>
              </div>
            </div>
          </div>
        </div>

        {/* COLUMNA 2: TENDENCIA Y ESTADOS */}
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Chart: Tendencia */}
            <div className="bg-[#0F172A]/80 border border-slate-800/60 p-6 rounded-3xl h-[320px] flex flex-col shadow-xl">
              <h3 className="text-xs font-black text-slate-400 mb-6 flex items-center gap-2 uppercase tracking-[0.2em]">
                <span className="material-symbols-outlined text-orange-500 text-lg">trending_up</span>
                Captación Temporal (15d)
              </h3>
              <div className="flex-1">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={tendencyData}>
                    <defs>
                      <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f97316" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} opacity={0.3} />
                    <XAxis dataKey="date" stroke="#475569" fontSize={9} tickLine={false} axisLine={false} />
                    <YAxis stroke="#475569" fontSize={9} tickLine={false} axisLine={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0F172A', border: '1px solid #1e293b', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold' }}
                      itemStyle={{ color: '#f97316' }}
                    />
                    <Area type="monotone" dataKey="total" stroke="#f97316" strokeWidth={4} fillOpacity={1} fill="url(#colorTotal)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart: Estados */}
            <div className="bg-[#0F172A]/80 border border-slate-800/60 p-6 rounded-3xl h-[320px] flex flex-col shadow-xl">
              <h3 className="text-xs font-black text-slate-400 mb-6 flex items-center gap-2 uppercase tracking-[0.2em]">
                <span className="material-symbols-outlined text-blue-500 text-lg">donut_large</span>
                Segmentación por Status
              </h3>
              <div className="flex-1 flex items-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={8}
                      dataKey="value"
                      stroke="none"
                    >
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0F172A', border: '1px solid #1e293b', borderRadius: '12px', fontSize: '11px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="w-1/3 space-y-2">
                  {statusData.map((s, i) => (
                    <div key={i} className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full shadow-lg" style={{ backgroundColor: COLORS[i % COLORS.length] }}></div>
                        <span className="text-[9px] font-black text-slate-400 uppercase truncate">{s.name}</span>
                      </div>
                      <span className="text-[10px] font-bold text-slate-200 ml-4 tabular-nums">{s.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Chart: Ciudades */}
          <div className="bg-[#0F172A]/80 border border-slate-800/60 p-6 rounded-3xl h-[280px] flex flex-col shadow-xl">
            <h3 className="text-xs font-black text-slate-400 mb-6 flex items-center gap-2 uppercase tracking-[0.2em]">
              <span className="material-symbols-outlined text-purple-500 text-lg">distance</span>
              Concentración Territorial
            </h3>
            <div className="flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={cityData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} opacity={0.2} />
                  <XAxis type="number" stroke="#475569" fontSize={10} hide />
                  <YAxis dataKey="name" type="category" stroke="#f8fafc" fontSize={10} tickLine={false} axisLine={false} width={100} fontWeight="bold" />
                  <Tooltip 
                    cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                    contentStyle={{ backgroundColor: '#0F172A', border: '1px solid #1e293b', borderRadius: '12px', fontSize: '11px' }}
                  />
                  <Bar dataKey="value" fill="#8b5cf6" radius={[0, 8, 8, 0]} barSize={20}>
                    {cityData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fillOpacity={1 - (index * 0.15)} fill="#a855f7" />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* DRILL-DOWN LIGHTBOX */}
      {drillDownStage && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 backdrop-blur-md animate-in fade-in duration-300">
          <div 
            className="absolute inset-0 bg-slate-950/80 cursor-pointer" 
            onClick={() => setDrillDownStage(null)}
          ></div>
          
          <div className="relative w-full max-w-2xl bg-[#0F172A] border border-slate-800 rounded-[2.5rem] shadow-[0_0_100px_rgba(0,0,0,0.8)] overflow-hidden animate-in slide-in-from-bottom-8 duration-500">
            {/* Header Modal */}
            <div className="p-8 border-b border-slate-800/50 bg-slate-900/30 flex justify-between items-start">
              <div className="flex items-center gap-4">
                <div 
                  className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg"
                  style={{ backgroundColor: `${drillDownStage.color}15`, border: `2px solid ${drillDownStage.color}30` }}
                >
                  <span className="material-symbols-outlined text-3xl" style={{ color: drillDownStage.color }}>query_stats</span>
                </div>
                <div>
                   <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Operational Deep-Dive</span>
                   <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter">
                     {drillDownStage.label}
                   </h3>
                   <p className="text-slate-400 text-xs font-bold">Mostrando registros recientes en esta etapa</p>
                </div>
              </div>
              <button 
                onClick={() => setDrillDownStage(null)}
                className="w-10 h-10 rounded-full border border-slate-800 flex items-center justify-center text-slate-500 hover:text-white hover:border-slate-600 transition-all bg-slate-950/50"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Leads List */}
            <div className="max-h-[50vh] overflow-y-auto p-6 space-y-3" style={{ scrollbarWidth: "none" }}>
              {drillDownLeads.length > 0 ? (
                drillDownLeads.map((lead, i) => (
                  <div 
                    key={lead.id}
                    className="group bg-slate-900/40 border border-slate-800/60 p-4 rounded-2xl flex items-center justify-between hover:bg-slate-800/40 hover:border-slate-700 transition-all duration-300"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center text-[11px] font-black text-slate-400 group-hover:text-white group-hover:border-slate-600 transition-colors">
                        {lead.name?.charAt(0) || "?"}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-100 group-hover:text-white transition-colors">{lead.name || "Sin Nombre"}</span>
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{lead.company || "Sin Empresa"}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex flex-col items-end">
                        <span className="text-[10px] font-black text-slate-400 uppercase">Score</span>
                        <span className="text-xs font-black text-orange-500">{lead.score || "-"}/10</span>
                      </div>
                      <div className="h-8 w-[1px] bg-slate-800"></div>
                      <div className="flex flex-col items-end">
                        <span className="text-[10px] font-black text-slate-400 uppercase">Fecha</span>
                        <span className="text-[10px] font-bold text-slate-300">
                          {new Date(lead.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-20 flex flex-col items-center justify-center opacity-20">
                  <span className="material-symbols-outlined text-6xl">cloud_off</span>
                  <p className="text-xs font-black uppercase mt-4 tracking-widest">No hay datos en esta etapa</p>
                </div>
              )}
            </div>

            {/* Footer Modal */}
            <div className="p-8 bg-slate-950/50 border-t border-slate-800/50 flex flex-col sm:flex-row gap-4 justify-between items-center">
               <div className="flex flex-col">
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Acción de Negocio</span>
                  <p className="text-xs text-slate-400 font-bold">Revisar detalles en la tabla maestra</p>
               </div>
               <button 
                onClick={handleReviewLeads}
                className="w-full sm:w-auto px-10 py-4 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white text-[11px] font-black uppercase tracking-[0.2em] transition-all shadow-[0_0_30px_rgba(249,115,22,0.3)] flex items-center justify-center gap-3 group"
               >
                 Ir a Revisar Leads
                 <span className="material-symbols-outlined text-lg group-hover:translate-x-1 transition-transform">arrow_forward</span>
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


