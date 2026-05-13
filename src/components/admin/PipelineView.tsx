"use client";

import { useMemo } from "react";

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

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; border: string; glow: string }> = {
  incompleto: { label: "Incompleto", color: "#64748b", bg: "rgba(100,116,139,0.1)", border: "rgba(100,116,139,0.2)", glow: "rgba(100,116,139,0.05)" },
  nuevo: { label: "Nuevo Lead", color: "#f97316", bg: "rgba(249,115,22,0.1)", border: "rgba(249,115,22,0.2)", glow: "rgba(249,115,22,0.1)" },
  sesion: { label: "Sesión Agendada", color: "#a855f7", bg: "rgba(168,85,247,0.1)", border: "rgba(168,85,247,0.2)", glow: "rgba(168,85,247,0.1)" },
  contactado: { label: "Contactado", color: "#3b82f6", bg: "rgba(59,130,246,0.1)", border: "rgba(59,130,246,0.2)", glow: "rgba(59,130,246,0.1)" },
  cerrado: { label: "Cerrado ✓", color: "#10b981", bg: "rgba(16,185,129,0.1)", border: "rgba(16,185,129,0.2)", glow: "rgba(16,185,129,0.1)" },
  perdido: { label: "Perdido", color: "#ef4444", bg: "rgba(239,68,68,0.1)", border: "rgba(239,68,68,0.2)", glow: "rgba(239,68,68,0.1)" },
};

const getAvatarColor = (name: string) => {
  const colors = [
    'from-blue-500 to-cyan-400',
    'from-purple-500 to-pink-400',
    'from-orange-500 to-amber-400',
    'from-emerald-500 to-teal-400',
    'from-rose-500 to-red-400',
    'from-indigo-500 to-blue-400'
  ];
  const charCode = name.charCodeAt(0) || 0;
  return colors[charCode % colors.length];
};

export default function PipelineView({ leads, onSelectLead }: { leads: Lead[], onSelectLead: (lead: Lead) => void }) {
  const columns = useMemo(() => {
    const grouped: Record<string, Lead[]> = {
      incompleto: [],
      nuevo: [],
      sesion: [],
      contactado: [],
      cerrado: [],
      perdido: [],
    };
    
    leads.forEach(lead => {
      if (grouped[lead.status]) {
        grouped[lead.status].push(lead);
      }
    });
    
    return grouped;
  }, [leads]);

  return (
    <div className="h-full flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex justify-between items-end px-2">
        <div>
          <h2 className="text-4xl font-black text-slate-50 tracking-tighter uppercase italic">
            Command <span className="text-orange-500">Pipeline</span>
          </h2>
          <div className="flex items-center gap-2 mt-1">
            <div className="h-[1px] w-12 bg-orange-500/50"></div>
            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.2em]">Operational Flow & Conversion</p>
          </div>
        </div>
      </div>

      <div className="flex-1 flex gap-6 overflow-x-auto pb-8 pt-2 px-2" style={{ scrollbarWidth: "thin", scrollbarColor: "#f97316 #0d1c2d" }}>
        {Object.entries(STATUS_CONFIG).map(([statusKey, config]) => (
          <div key={statusKey} className="flex-shrink-0 w-[340px] flex flex-col rounded-3xl group/col">
            {/* Column Header */}
            <div className="relative p-5 mb-4 rounded-2xl overflow-hidden border border-slate-800/60 bg-slate-900/40 backdrop-blur-md">
              <div 
                className="absolute top-0 left-0 w-full h-1" 
                style={{ backgroundColor: config.color }}
              ></div>
              <div 
                className="absolute top-0 left-0 w-full h-full opacity-[0.03] pointer-events-none"
                style={{ background: `linear-gradient(180deg, ${config.color} 0%, transparent 100%)` }}
              ></div>
              
              <div className="flex items-center justify-between relative z-10">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-slate-950/50 border border-slate-800 shadow-inner">
                    <div className="w-2.5 h-2.5 rounded-full shadow-[0_0_10px_rgba(0,0,0,0.5)]" style={{ backgroundColor: config.color, boxShadow: `0 0 12px ${config.color}44` }}></div>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-500">{config.label}</span>
                    <span className="text-xs font-bold text-slate-300">Etapa Operativa</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                   <div className="h-4 w-[1px] bg-slate-800 mx-1"></div>
                   <span className="text-lg font-black text-slate-400 tabular-nums">
                    {columns[statusKey].length}
                  </span>
                </div>
              </div>
            </div>

            {/* Column Body */}
            <div className="flex-1 overflow-y-auto p-1 space-y-4 rounded-2xl transition-colors duration-300 group-hover/col:bg-slate-900/10" style={{ scrollbarWidth: "none" }}>
              {columns[statusKey].map((lead) => (
                <div 
                  key={lead.id}
                  onClick={() => onSelectLead(lead)}
                  className="relative group bg-slate-900/50 border border-slate-800/80 p-5 rounded-2xl cursor-pointer hover:border-slate-700 hover:bg-slate-800/40 transition-all duration-300 shadow-xl overflow-hidden backdrop-blur-sm"
                  style={{ '--glow-color': config.glow } as any}
                >
                  {/* Status Strip */}
                  <div className="absolute left-0 top-0 bottom-0 w-1 opacity-60" style={{ backgroundColor: config.color }}></div>
                  
                  {/* Hover Glow Effect */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" 
                       style={{ background: `radial-gradient(circle at center, ${config.glow} 0%, transparent 70%)` }}></div>

                  <div className="relative z-10">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex flex-col">
                        <h4 className="font-bold text-slate-100 text-base leading-tight group-hover:text-white transition-colors">{lead.name || "Sin identificar"}</h4>
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-0.5">{lead.company || "Free Agent"}</span>
                      </div>
                      {lead.score && (
                        <div className="flex flex-col items-end">
                          <span className="text-[10px] font-black text-orange-500 bg-orange-500/10 border border-orange-500/20 px-2 py-0.5 rounded-full shadow-[0_0_10px_rgba(249,115,22,0.1)]">
                            {lead.score}/10
                          </span>
                        </div>
                      )}
                    </div>
                    
                    <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800/50 mb-4">
                       <p className="text-xs text-slate-400 italic line-clamp-2 leading-relaxed">
                        {lead.needs || "No se ha registrado una necesidad específica todavía."}
                       </p>
                    </div>
                    
                    <div className="flex items-center justify-between mt-auto">
                      <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${getAvatarColor(lead.name || "?")} p-[1px] shadow-lg`}>
                          <div className="w-full h-full rounded-[11px] bg-slate-900 flex items-center justify-center text-[11px] font-black text-white">
                            {lead.name?.charAt(0) || "?"}
                          </div>
                        </div>
                        <div className="flex flex-col">
                           <span className="text-[9px] font-bold text-slate-500 uppercase">Registro</span>
                           <span className="text-[10px] text-slate-400 font-bold tabular-nums">
                            {new Date(lead.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }).replace('.', '')}
                          </span>
                        </div>
                      </div>
                      
                      <div className="h-8 w-8 rounded-full border border-slate-800 flex items-center justify-center text-slate-600 group-hover:text-slate-300 group-hover:border-slate-600 transition-all">
                        <span className="material-symbols-outlined text-sm">arrow_forward</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              {columns[statusKey].length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 border-2 border-dashed border-slate-800/40 rounded-3xl opacity-20">
                  <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mb-4">
                    <span className="material-symbols-outlined text-2xl text-slate-500">monitoring</span>
                  </div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Sin Operaciones</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

