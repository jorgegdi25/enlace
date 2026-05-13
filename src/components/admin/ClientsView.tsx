"use client";
import { useState, useMemo } from "react";

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

export default function ClientsView({ leads, onSelectLead }: { leads: Lead[], onSelectLead: (lead: Lead) => void }) {
  const [cityFilter, setCityFilter] = useState("todos");
  const [scoreFilter, setScoreFilter] = useState("todos");

  const cities = useMemo(() => {
    const allCities = leads.map(l => l.city).filter(Boolean) as string[];
    return ["todos", ...Array.from(new Set(allCities))];
  }, [leads]);

  const filteredClients = useMemo(() => {
    return leads.filter(l => {
      const matchesCity = cityFilter === "todos" || l.city === cityFilter;
      const matchesScore = scoreFilter === "todos" || 
        (scoreFilter === "alto" && (l.score || 0) >= 8) ||
        (scoreFilter === "medio" && (l.score || 0) >= 5 && (l.score || 0) < 8) ||
        (scoreFilter === "bajo" && (l.score || 0) < 5);
      
      return matchesCity && matchesScore;
    });
  }, [leads, cityFilter, scoreFilter]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-50 tracking-tight">Mis Clientes</h2>
          <p className="text-slate-400 text-sm mt-1">Base de datos de proyectos activos y clientes cerrados</p>
        </div>
        
        <div className="flex gap-2">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Filtrar por Ciudad</label>
            <select 
              value={cityFilter} 
              onChange={(e) => setCityFilter(e.target.value)}
              className="bg-slate-900 border border-slate-800 text-slate-300 text-xs rounded-lg px-3 py-2 outline-none focus:border-orange-500/50 transition-all"
            >
              {cities.map(city => (
                <option key={city} value={city}>{city === "todos" ? "Todas las ciudades" : city}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Filtrar por Score</label>
            <select 
              value={scoreFilter} 
              onChange={(e) => setScoreFilter(e.target.value)}
              className="bg-slate-900 border border-slate-800 text-slate-300 text-xs rounded-lg px-3 py-2 outline-none focus:border-orange-500/50 transition-all"
            >
              <option value="todos">Todos los scores</option>
              <option value="alto">Alto (8-10)</option>
              <option value="medio">Medio (5-7)</option>
              <option value="bajo">Bajo (0-4)</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-[#0F172A] border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-900/50 border-b border-slate-800">
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Cliente / Empresa</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Ciudad</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Score</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Enlaces Proyecto</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {filteredClients.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-20 text-center">
                    <span className="material-symbols-outlined text-slate-600 text-4xl mb-2">person_off</span>
                    <p className="text-slate-500 text-xs font-medium">No se encontraron clientes con estos filtros.</p>
                  </td>
                </tr>
              ) : (
                filteredClients.map((client) => (
                  <tr 
                    key={client.id}
                    onClick={() => onSelectLead(client)}
                    className="hover:bg-slate-800/30 cursor-pointer transition-colors group"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-500 font-bold text-xs">
                          {client.name?.charAt(0) || "C"}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-white group-hover:text-orange-400 transition-colors">{client.name}</p>
                          <p className="text-[10px] text-slate-500 truncate max-w-[150px]">{client.company || "Sin empresa"}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-400">
                      {client.city || "---"}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        (client.score || 0) >= 8 ? 'bg-green-500/10 text-green-500 border-green-500/20' :
                        (client.score || 0) >= 5 ? 'bg-orange-500/10 text-orange-500 border-orange-500/20' :
                        'bg-slate-500/10 text-slate-500 border-slate-500/20'
                      }`}>
                        {client.score ? `${client.score}/10` : 'S/N'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-1">
                        {client.links && client.links.length > 0 ? (
                          client.links.slice(0, 2).map((link, i) => (
                            <div key={i} className="w-6 h-6 rounded bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition-colors" title={link}>
                              <span className="material-symbols-outlined text-[14px]">link</span>
                            </div>
                          ))
                        ) : (
                          <span className="text-[10px] text-slate-700 italic">Sin links</span>
                        )}
                        {client.links && client.links.length > 2 && (
                          <span className="text-[10px] text-slate-600 self-center">+{client.links.length - 2}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="text-slate-500 hover:text-white transition-colors">
                        <span className="material-symbols-outlined text-[18px]">visibility</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
