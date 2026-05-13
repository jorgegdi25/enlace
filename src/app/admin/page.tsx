"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import DashboardView from "@/components/admin/DashboardView";
import PipelineView from "@/components/admin/PipelineView";
import ClientsView from "@/components/admin/ClientsView";
import AnalyticsView from "@/components/admin/AnalyticsView";

const supabase = createClient();

type Lead = {
  id: string; created_at: string; name: string; phone: string;
  company: string; status: string; notes: string; needs: string;
  email?: string; city?: string; score?: number; links?: string[];
  history: { role: string; content: string }[];
  metadata: Record<string, unknown>;
};

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  nuevo: { label: "Nuevo Lead", color: "#f97316", bg: "rgba(249,115,22,0.1)", border: "rgba(249,115,22,0.25)" },
  contactado: { label: "Contactado", color: "#3b82f6", bg: "rgba(59,130,246,0.1)", border: "rgba(59,130,246,0.25)" },
  sesion: { label: "Sesión Agendada", color: "#a855f7", bg: "rgba(168,85,247,0.1)", border: "rgba(168,85,247,0.25)" },
  cerrado: { label: "Cerrado ✓", color: "#10b981", bg: "rgba(16,185,129,0.1)", border: "rgba(16,185,129,0.25)" },
  perdido: { label: "Perdido", color: "#ef4444", bg: "rgba(239,68,68,0.1)", border: "rgba(239,68,68,0.25)" },
  incompleto: { label: "Abandono / Incompleto", color: "#94a3b8", bg: "rgba(148,163,184,0.1)", border: "rgba(148,163,184,0.25)" },
};

function getInitials(name: string) {
  if (!name) return "??";
  return name.split(" ").map((w) => w[0]).join("").toUpperCase().substring(0, 2);
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `hace ${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `hace ${hrs}h`;
  return `hace ${Math.floor(hrs / 24)}d`;
}

export default function CRMDashboard() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Lead | null>(null);
  const [editNotes, setEditNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("todos");
  const [tab, setTab] = useState<"info" | "chat">("info");
  const [currentView, setCurrentView] = useState<"dashboard" | "leads" | "agenda" | "pipeline" | "clientes" | "analytics">("dashboard");
  const router = useRouter();
  
  // Estados para creación y edición manual
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [manualData, setManualData] = useState({ name: "", phone: "", company: "", needs: "" });
  const [editData, setEditData] = useState({ name: "", phone: "", company: "", needs: "", email: "", city: "" });
  const [isScheduling, setIsScheduling] = useState(false);
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");
  const [calendarEvents, setCalendarEvents] = useState<any[]>([]);

  const fetchCalendarForModal = async () => {
    try {
      const res = await fetch("/api/calendar");
      const json = await res.json();
      if (json.success) setCalendarEvents(json.data.slice(0, 4));
    } catch (e) {
      console.error("Error fetching calendar for modal", e);
    }
  };

  useEffect(() => {
    if (isScheduling) {
      fetchCalendarForModal();
    }
  }, [isScheduling]);

  const handleSchedule = async () => {
    if (!selected || !scheduleDate || !scheduleTime) return;
    setSaving(true);
    try {
      const slotIso = `${scheduleDate}T${scheduleTime}:00`;
      const res = await fetch("/api/calendar/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId: selected.id, slotIso }),
      });
      const data = await res.json();
      if (data.success) {
        alert("¡Cita agendada con éxito! Se ha enviado la invitación por correo al cliente.");
        setIsScheduling(false);
        setScheduleDate("");
        setScheduleTime("");
        // Actualizar localmente el estado del lead
        updateLead(selected.id, { status: 'sesion' });
      } else {
        alert("Error: " + data.error);
      }
    } catch (e) {
      console.error(e);
      alert("Error al agendar la cita");
    } finally {
      setSaving(false);
    }
  };


  const fetchLeads = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("leads").select("*").order("created_at", { ascending: false });
    if (data) setLeads(data as Lead[]);
    setLoading(false);
  }, []);

  useEffect(() => { fetchLeads(); }, [fetchLeads]);

  useEffect(() => {
    if (selected) {
      setEditNotes(selected.notes || "");
      setEditData({ 
        name: selected.name || "", 
        phone: selected.phone || "", 
        company: selected.company || "", 
        needs: selected.needs || "",
        email: (selected.metadata?.email as string) || "",
        city: (selected.metadata?.city as string) || ""
      });
    }
  }, [selected]);

  async function updateLead(id: string, updates: Partial<Lead>) {
    setSaving(true);
    await fetch("/api/leads", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...updates }),
    });
    await fetchLeads();
    if (selected?.id === id) {
      setSelected((prev) => prev ? { ...prev, ...updates } : null);
    }
    setSaving(false);
  }

  async function createManualLead() {
    setSaving(true);
    await fetch("/api/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...manualData, isManual: true, history: [] }),
    });
    setManualData({ name: "", phone: "", company: "", needs: "" });
    setIsModalOpen(false);
    fetchLeads();
    setSaving(false);
  }

  async function saveEdits() {
    if (!selected) return;
    const { email, city, ...rest } = editData;
    const updates = {
      ...rest,
      metadata: { ...selected.metadata, email, city }
    };
    await updateLead(selected.id, updates);
  }

  async function deleteLead(id: string) {
    if (!confirm("¿Eliminar este lead permanentemente?")) return;
    await fetch(`/api/leads?id=${id}`, { method: "DELETE" });
    setSelected(null);
    fetchLeads();
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/admin/login");
    router.refresh();
  }

  const filtered = leads.filter((l) => {
    const matchSearch = !search || [l.name, l.company, l.phone, l.needs]
      .join(" ").toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "todos" || l.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const counts = {
    total: leads.length,
    nuevo: leads.filter((l) => l.status === "nuevo").length,
    contactado: leads.filter((l) => l.status === "contactado").length,
    cerrado: leads.filter((l) => l.status === "cerrado").length,
  };

  const st = (s: string) => STATUS_CONFIG[s] || STATUS_CONFIG.nuevo;

  return (
    <div className="flex h-screen overflow-hidden" style={{ fontFamily: "Manrope, sans-serif", backgroundColor: "#0F172A", color: "#d4e4fa" }}>
      {/* SIDEBAR */}
      <aside className="w-60 flex-shrink-0 flex flex-col border-r border-slate-800">
        <div className="px-5 py-6">
          <div className="flex flex-col items-start gap-1">
            <div className="relative w-32 h-8">
              <Image 
                src="/logo-white.png" 
                alt="Enlace Logo" 
                fill 
                className="object-contain object-left"
                priority
              />
            </div>
            <p className="text-[9px] text-slate-500 uppercase tracking-wider ml-1">CRM Intelligence</p>
          </div>
        </div>

        <nav className="flex-1 px-3 space-y-0.5">
          {[
            { id: "dashboard", icon: "dashboard", label: "Dashboard" },
            { id: "leads", icon: "group", label: "Leads" },
            { id: "clientes", icon: "badge", label: "Clientes" },
            { id: "agenda", icon: "calendar_month", label: "Agenda" },
            { id: "pipeline", icon: "filter_list", label: "Pipeline" },
            { id: "analytics", icon: "insights", label: "Analytics" },
            { id: "settings", icon: "settings", label: "Settings" },
          ].map((item) => (
            <button 
              key={item.id}
              onClick={() => {
                const views = ["dashboard", "leads", "agenda", "pipeline", "clientes", "analytics"];
                if (views.includes(item.id)) {
                  setCurrentView(item.id as any);
                }
              }}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-xs font-medium transition-all rounded-lg ${
              currentView === item.id ? "bg-slate-800/60 text-orange-500" : "text-slate-400 hover:bg-slate-800/40 hover:text-slate-200"
            }`}>
              <span className="material-symbols-outlined text-[18px]">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        <div className="px-3 border-t border-slate-800 pt-4 pb-4 space-y-1">
          <a href="/" className="text-slate-400 flex items-center gap-3 px-4 py-2.5 hover:bg-slate-800/40 hover:text-slate-200 transition-all text-xs font-medium rounded-lg">
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            Volver al Sitio
          </a>
          <button onClick={handleLogout} className="w-full text-slate-400 flex items-center gap-3 px-4 py-2.5 hover:bg-slate-800/40 hover:text-red-400 transition-all text-xs font-medium rounded-lg text-left">
            <span className="material-symbols-outlined text-[18px]">logout</span>
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* TOPBAR */}
        <header className="h-14 flex-shrink-0 border-b border-slate-800 flex justify-between items-center px-6" style={{ backgroundColor: "rgba(15,23,42,0.95)" }}>
          <div className="flex items-center gap-3 flex-1 max-w-sm">
            <div className="relative w-full">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-[16px]">search</span>
              <input value={search} onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-lg pl-9 pr-4 py-2 text-xs outline-none"
                style={{ backgroundColor: "#0F172A", border: "1px solid #1e293b", color: "#cbd5e1" }}
                placeholder="Buscar por nombre, empresa, teléfono..." />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm font-semibold text-slate-200">Jorge González</span>
            <div className="w-8 h-8 rounded-lg bg-orange-500/20 border border-orange-500/30 flex items-center justify-center text-orange-500 font-bold text-xs">JG</div>
          </div>
        </header>

        {/* CONTENT */}
        <main className="flex-1 overflow-y-auto p-6" style={{ scrollbarWidth: "thin", scrollbarColor: "#273647 #0d1c2d" }}>
          <div className="max-w-[1400px] mx-auto space-y-6">
            {currentView === "dashboard" ? (
              <DashboardView leads={leads} />
            ) : currentView === "agenda" ? (
              <AgendaView />
            ) : currentView === "pipeline" ? (
              <PipelineView leads={leads} onSelectLead={setSelected} />
            ) : currentView === "clientes" ? (
              <ClientsView leads={filtered.filter(l => l.status === 'cerrado')} onSelectLead={setSelected} />
            ) : currentView === "analytics" ? (
              <AnalyticsView 
                leads={leads} 
                onNavigate={(view: any) => setCurrentView(view)}
                onFilter={(status: string) => {
                  setFilterStatus(status);
                  setSearch(""); // Limpiar búsqueda al filtrar desde analíticas
                }}
              />
            ) : (
              <>
                {/* Header + Actions */}
                <div className="flex items-end justify-between">
                  <div>
                    <h2 className="text-3xl font-extrabold text-slate-50 tracking-tight">Gestión de Leads</h2>
                <p className="text-slate-400 text-sm mt-1">Administra tus prospectos y avanza el embudo de ventas</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wider bg-orange-500 text-white hover:bg-orange-600 transition-colors">
                  <span className="material-symbols-outlined text-[16px]">add</span> Nuevo Lead
                </button>
                <button onClick={fetchLeads} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wider" style={{ backgroundColor: "#1e293b", border: "1px solid #334155", color: "#cbd5e1" }}>
                  <span className="material-symbols-outlined text-[16px]">refresh</span> Actualizar
                </button>
              </div>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-4 gap-4">
              {[
                { label: "Total Leads", value: counts.total, icon: "group", color: "#f97316" },
                { label: "Nuevos", value: counts.nuevo, icon: "fiber_new", color: "#f97316" },
                { label: "Contactados", value: counts.contactado, icon: "call", color: "#3b82f6" },
                { label: "Cerrados", value: counts.cerrado, icon: "check_circle", color: "#10b981" },
              ].map((kpi) => (
                <div key={kpi.label} className="rounded-xl p-5" style={{ backgroundColor: "#0F172A", border: "1px solid #1e293b" }}>
                  <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 mb-3">
                    <span className="material-symbols-outlined text-[16px]" style={{ color: kpi.color }}>{kpi.icon}</span>
                    {kpi.label}
                  </p>
                  <h3 className="text-2xl font-extrabold text-slate-50">{kpi.value}</h3>
                </div>
              ))}
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-1 p-1 rounded-lg" style={{ backgroundColor: "#0F172A", border: "1px solid #1e293b", width: "fit-content" }}>
              {[{ key: "todos", label: "Todos" }, ...Object.entries(STATUS_CONFIG).map(([k, v]) => ({ key: k, label: v.label }))].map((f) => (
                <button key={f.key} onClick={() => setFilterStatus(f.key)}
                  className={`px-3 py-1.5 rounded-md text-[11px] font-bold transition-all ${filterStatus === f.key ? "bg-slate-700 text-white" : "text-slate-400 hover:text-slate-200"}`}>
                  {f.label}
                </button>
              ))}
            </div>

            {/* TABLE + DETAIL */}
            <div className="flex h-full pb-6">
              {/* Table */}
              <div className="w-full flex flex-col rounded-xl overflow-hidden" style={{ backgroundColor: "#0F172A", border: "1px solid #1e293b", maxHeight: "calc(100vh - 18rem)" }}>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr style={{ borderBottom: "1px solid #1e293b", backgroundColor: "rgba(2,6,23,0.4)" }}>
                        <th className="px-4 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Contacto</th>
                        <th className="px-4 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Teléfono</th>
                        <th className="px-4 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Estado</th>
                        <th className="px-4 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Fecha</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        <tr><td colSpan={4} className="p-10 text-center text-slate-500 text-sm">Cargando...</td></tr>
                      ) : filtered.length === 0 ? (
                        <tr><td colSpan={4} className="p-10 text-center text-slate-500 text-sm">No hay leads{search && " que coincidan con tu búsqueda"}</td></tr>
                      ) : (
                        filtered.map((lead) => {
                          const s = st(lead.status);
                          return (
                            <tr key={lead.id} onClick={() => setSelected(lead)}
                              className={`cursor-pointer transition-all ${selected?.id === lead.id ? "bg-slate-800/50" : "hover:bg-slate-800/30"}`}
                              style={{ borderBottom: "1px solid rgba(30,41,59,0.4)" }}>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-4">
                                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0" style={{ backgroundColor: s.bg, color: s.color }}>
                                    {getInitials(lead.name)}
                                  </div>
                                  <div className="min-w-0">
                                    <p className={`font-bold text-sm truncate ${!lead.name ? 'text-slate-500 italic' : 'text-white'}`}>
                                      {lead.name || "Chat Abandonado"}
                                    </p>
                                    <p className="text-xs text-slate-500 truncate mt-0.5">{lead.needs || lead.company || (lead.history.length > 0 ? "Conversación en curso..." : "Sin datos")}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-sm text-slate-300 font-mono">{lead.phone || "—"}</td>
                              <td className="px-4 py-3">
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider" style={{ backgroundColor: s.bg, color: s.color, border: `1px solid ${s.border}` }}>
                                  {s.label}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-[11px] text-slate-500">{timeAgo(lead.created_at)}</td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            </>
            )}
          </div>
        </main>
      </div>

      <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
      <link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
      
      {/* MODAL CREAR LEAD MANUAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0F172A] border border-slate-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-orange-500">person_add</span>
                Nuevo Lead Manual
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-500 hover:text-white transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <div className="p-5 space-y-4">
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-500 mb-1 block">Nombre Completo</label>
                <input value={manualData.name} onChange={e => setManualData({...manualData, name: e.target.value})} placeholder="Ej: Carlos Pérez" className="w-full bg-slate-800/50 border border-slate-700 rounded-lg p-2.5 text-sm text-slate-200 outline-none focus:border-orange-500 transition-colors" />
              </div>
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-500 mb-1 block">Teléfono / WhatsApp</label>
                <input value={manualData.phone} onChange={e => setManualData({...manualData, phone: e.target.value})} placeholder="Ej: 3001234567" className="w-full bg-slate-800/50 border border-slate-700 rounded-lg p-2.5 text-sm text-slate-200 outline-none focus:border-orange-500 transition-colors" />
              </div>
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-500 mb-1 block">Empresa / Negocio</label>
                <input value={manualData.company} onChange={e => setManualData({...manualData, company: e.target.value})} placeholder="Ej: Restaurante La Parrilla" className="w-full bg-slate-800/50 border border-slate-700 rounded-lg p-2.5 text-sm text-slate-200 outline-none focus:border-orange-500 transition-colors" />
              </div>
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-500 mb-1 block">Necesidades Iniciales</label>
                <textarea value={manualData.needs} onChange={e => setManualData({...manualData, needs: e.target.value})} placeholder="Resumen corto de lo que necesita..." rows={3} className="w-full bg-slate-800/50 border border-slate-700 rounded-lg p-2.5 text-sm text-slate-200 outline-none focus:border-orange-500 transition-colors" />
              </div>
            </div>

            <div className="p-5 border-t border-slate-800 bg-slate-900/50 flex justify-end gap-3">
              <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded-lg text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-800 transition-all">
                Cancelar
              </button>
              <button onClick={createManualLead} disabled={saving || !manualData.name} className="px-4 py-2 rounded-lg text-xs font-bold bg-orange-500 hover:bg-orange-600 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2">
                {saving ? "Creando..." : "Crear Lead"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL LIGHTBOX: VER Y EDITAR LEAD */}
      {selected && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 lg:p-6">
          <div className="bg-[#0F172A] border border-slate-800 rounded-2xl shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col overflow-hidden">
            
            {/* Modal Header */}
            <div className="p-4 lg:p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold" style={{ backgroundColor: st(selected.status).bg, color: st(selected.status).color }}>
                  {getInitials(selected.name)}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">{selected.name || "Sin nombre"}</h3>
                  <div className="flex items-center gap-3 mt-1">
                    <p className="text-sm text-slate-400 flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">phone</span> {selected.phone || "Sin teléfono"}</p>
                    <p className="text-sm text-slate-400 flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">schedule</span> {timeAgo(selected.created_at)}</p>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                {/* State selector inline in header */}
                <div className="flex items-center gap-1.5 bg-slate-950/50 p-1 rounded-lg border border-slate-800">
                  {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                    <button key={key} onClick={() => updateLead(selected.id, { status: key })}
                      className="px-3 py-1.5 rounded text-[11px] font-bold transition-all"
                      style={{
                        backgroundColor: selected.status === key ? cfg.bg : "transparent",
                        color: selected.status === key ? cfg.color : "#64748b",
                      }}>
                      {cfg.label}
                    </button>
                  ))}
                </div>

                <div className="w-px h-8 bg-slate-800 mx-2"></div>
                
                <button onClick={() => setSelected(null)} className="text-slate-500 hover:text-white bg-slate-800/50 hover:bg-slate-700/50 p-2 rounded-lg transition-all">
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
            </div>
            
            {/* Modal Content - 2 Columns */}
            <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
              
              {/* LEFT COLUMN: Data Form */}
              <div className="w-full lg:w-1/2 p-6 overflow-y-auto border-r border-slate-800 flex flex-col gap-6" style={{ scrollbarWidth: "thin", scrollbarColor: "#273647 #0d1c2d" }}>
                
                {/* Actions */}
                <div className="flex flex-col gap-3">
                  <div className="flex gap-3">
                    <button onClick={() => window.open(`https://wa.me/57${selected.phone?.replace(/\D/g, "")}`, "_blank")}
                      className="flex-1 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all hover:opacity-90 shadow-lg"
                      style={{ backgroundColor: "#16a34a", color: "white" }}>
                      <span className="material-symbols-outlined text-[18px]">chat</span>
                      WhatsApp
                    </button>
                    <button 
                      onClick={() => setIsScheduling(!isScheduling)}
                      className="flex-1 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all hover:opacity-90 shadow-lg bg-blue-600 text-white"
                    >
                      <span className="material-symbols-outlined text-[18px]">calendar_month</span>
                      Agendar Auditoría
                    </button>
                    <button onClick={() => deleteLead(selected.id)}
                      className="px-4 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20">
                      <span className="material-symbols-outlined">delete</span>
                    </button>
                  </div>

                  {isScheduling && (
                    <div className="bg-slate-900 border border-blue-500/30 p-4 rounded-xl space-y-4 animate-in slide-in-from-top-2 duration-300">
                      <div className="flex justify-between items-center">
                        <p className="text-[10px] font-black uppercase text-blue-400 tracking-widest">Programar en Google Calendar</p>
                        <span className="text-[9px] bg-blue-500/10 text-blue-500 px-2 py-0.5 rounded-full border border-blue-500/20 font-bold uppercase">Live Sync</span>
                      </div>
                      
                      <div className="flex gap-2">
                        <input 
                          type="date" 
                          value={scheduleDate}
                          onChange={(e) => setScheduleDate(e.target.value)}
                          className="flex-1 bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-white outline-none focus:border-blue-500 transition-colors"
                        />
                        <input 
                          type="time" 
                          value={scheduleTime}
                          onChange={(e) => setScheduleTime(e.target.value)}
                          className="flex-1 bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-white outline-none focus:border-blue-500 transition-colors"
                        />
                      </div>

                      {/* Mini Agenda Preview */}
                      <div className="bg-slate-950/50 rounded-lg p-3 border border-slate-800/50">
                        <p className="text-[9px] font-bold text-slate-500 uppercase mb-2 flex items-center gap-1">
                          <span className="material-symbols-outlined text-[12px]">event_busy</span>
                          Tus próximos compromisos:
                        </p>
                        <div className="space-y-2">
                          {calendarEvents.length > 0 ? (
                            calendarEvents.map((ev, i) => {
                              const st = new Date(ev.start.dateTime || ev.start.date);
                              return (
                                <div key={i} className="flex items-center justify-between text-[10px] bg-slate-900/50 p-2 rounded border border-slate-800/30">
                                  <span className="text-slate-300 font-bold truncate max-w-[150px]">{ev.summary}</span>
                                  <span className="text-blue-400 font-black tabular-nums">
                                    {st.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })} - {st.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                </div>
                              );
                            })
                          ) : (
                            <p className="text-[10px] text-slate-600 italic py-2 text-center">Cargando agenda o sin eventos...</p>
                          )}
                        </div>
                      </div>

                      <button 
                        onClick={handleSchedule}
                        disabled={saving || !scheduleDate || !scheduleTime}
                        className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-black uppercase rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-blue-900/20"
                      >
                        {saving ? "Procesando..." : "Confirmar e Invitación por Email"}
                        <span className="material-symbols-outlined text-sm">mail</span>
                      </button>
                    </div>
                  )}

                </div>

                {/* Form Fields */}
                <div className="space-y-4">
                  <h4 className="text-sm font-bold text-slate-300 flex items-center gap-2 mb-4 border-b border-slate-800 pb-2">
                    <span className="material-symbols-outlined text-orange-500">manage_accounts</span>
                    Datos del Prospecto
                  </h4>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2 sm:col-span-1">
                      <label className="text-[10px] uppercase font-bold text-slate-500 mb-1 block">Nombre Completo</label>
                      <input value={editData.name} onChange={e => setEditData({...editData, name: e.target.value})} placeholder="Ej: Carlos Pérez" className="w-full bg-slate-900/50 border border-slate-700 rounded-lg p-2.5 text-sm text-slate-200 outline-none focus:border-orange-500 focus:bg-slate-800 transition-colors" />
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                      <label className="text-[10px] uppercase font-bold text-slate-500 mb-1 block">Teléfono / WhatsApp</label>
                      <input value={editData.phone} onChange={e => setEditData({...editData, phone: e.target.value})} placeholder="Ej: 3001234567" className="w-full bg-slate-900/50 border border-slate-700 rounded-lg p-2.5 text-sm text-slate-200 outline-none focus:border-orange-500 focus:bg-slate-800 transition-colors" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2 sm:col-span-1">
                      <label className="text-[10px] uppercase font-bold text-slate-500 mb-1 block">Correo Electrónico</label>
                      <input value={editData.email} onChange={e => setEditData({...editData, email: e.target.value})} placeholder="correo@ejemplo.com" className="w-full bg-slate-900/50 border border-slate-700 rounded-lg p-2.5 text-sm text-slate-200 outline-none focus:border-orange-500 focus:bg-slate-800 transition-colors" />
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                      <label className="text-[10px] uppercase font-bold text-slate-500 mb-1 block">Ciudad / País</label>
                      <input value={editData.city} onChange={e => setEditData({...editData, city: e.target.value})} placeholder="Ej: Medellín, Colombia" className="w-full bg-slate-900/50 border border-slate-700 rounded-lg p-2.5 text-sm text-slate-200 outline-none focus:border-orange-500 focus:bg-slate-800 transition-colors" />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-500 mb-1 block">Empresa / Negocio</label>
                    <input value={editData.company} onChange={e => setEditData({...editData, company: e.target.value})} placeholder="Ej: Restaurante La Parrilla" className="w-full bg-slate-900/50 border border-slate-700 rounded-lg p-2.5 text-sm text-slate-200 outline-none focus:border-orange-500 focus:bg-slate-800 transition-colors" />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2 sm:col-span-1">
                      <label className="text-[10px] uppercase font-bold text-slate-500 mb-1 block">Score de Madurez</label>
                      <input value={selected.score ? `${selected.score}/10` : 'No calculado'} disabled className="w-full bg-slate-900/30 border border-slate-800 rounded-lg p-2.5 text-sm text-slate-400 outline-none" />
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                      <label className="text-[10px] uppercase font-bold text-slate-500 mb-1 block">Links y Redes</label>
                      <input value={selected.links && selected.links.length > 0 ? selected.links.join(', ') : 'Ninguno proporcionado'} disabled className="w-full bg-slate-900/30 border border-slate-800 rounded-lg p-2.5 text-sm text-slate-400 outline-none truncate" title={selected.links?.join(', ')} />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-500 mb-1 block">Necesidades Iniciales</label>
                    <textarea value={editData.needs} onChange={e => setEditData({...editData, needs: e.target.value})} placeholder="Resumen corto de lo que necesita..." rows={3} className="w-full bg-slate-900/50 border border-slate-700 rounded-lg p-2.5 text-sm text-slate-200 outline-none focus:border-orange-500 focus:bg-slate-800 transition-colors resize-none" />
                  </div>
                  
                  <div className="pt-2">
                    <button onClick={saveEdits} disabled={saving} className="w-full py-3 rounded-lg text-sm font-bold bg-orange-500 hover:bg-orange-600 text-white disabled:opacity-50 transition-all shadow-lg shadow-orange-500/20">
                      {saving ? "Guardando..." : "Guardar Cambios"}
                    </button>
                  </div>
                </div>
              </div>

              {/* RIGHT COLUMN: Chat History & Notes */}
              <div className="w-full lg:w-1/2 flex flex-col bg-slate-900/30">
                
                {/* Notes Section (Sticky Top) */}
                <div className="p-6 border-b border-slate-800 bg-slate-900/80 backdrop-blur-md">
                  <h4 className="text-sm font-bold text-slate-300 flex items-center gap-2 mb-3">
                    <span className="material-symbols-outlined text-orange-500">edit_note</span>
                    Notas Internas del Equipo
                  </h4>
                  <div className="flex flex-col gap-2">
                    <textarea value={editNotes} onChange={(e) => setEditNotes(e.target.value)}
                      rows={5} placeholder="Escribe un seguimiento o nota importante..."
                      className="w-full rounded-lg px-3 py-2 text-sm outline-none resize-y bg-slate-950/50 border border-slate-700 focus:border-orange-500 text-slate-200 transition-colors" />
                    <button onClick={() => updateLead(selected.id, { notes: editNotes })}
                      disabled={saving}
                      className="w-full py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300">
                      Guardar Notas
                    </button>
                  </div>
                </div>

                {/* Chat History Section */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4" style={{ scrollbarWidth: "thin", scrollbarColor: "#273647 #0d1c2d" }}>
                  <h4 className="text-sm font-bold text-slate-300 flex items-center gap-2 mb-4">
                    <span className="material-symbols-outlined text-orange-500">forum</span>
                    Historial de Conversación
                  </h4>
                  
                  {(!selected.history || selected.history.length === 0) ? (
                    <div className="text-center p-8 text-slate-500 border border-dashed border-slate-800 rounded-xl">
                      <span className="material-symbols-outlined text-[32px] mb-2 opacity-50">speaker_notes_off</span>
                      <p className="text-sm">Este lead fue creado manualmente, no hay historial de chat con el agente.</p>
                    </div>
                  ) : (
                    selected.history.map((msg, i) => (
                      <div key={i} className="p-4 rounded-xl text-sm leading-relaxed shadow-sm"
                        style={msg.role === "assistant"
                          ? { backgroundColor: "rgba(15,23,42,0.6)", border: "1px solid #1e293b", color: "#94a3b8", borderLeft: "3px solid #334155" }
                          : { backgroundColor: "rgba(249,115,22,0.05)", border: "1px solid rgba(249,115,22,0.1)", color: "#e2e8f0", borderLeft: "3px solid #f97316" }}>
                        <p className="text-[10px] uppercase font-bold tracking-wider mb-1.5 flex items-center gap-1" style={{ opacity: 0.6 }}>
                          <span className="material-symbols-outlined text-[14px]">
                            {msg.role === "assistant" ? "smart_toy" : "person"}
                          </span>
                          {msg.role === "assistant" ? "Agente ENLACE" : "Prospecto"}
                        </p>
                        <div className="whitespace-pre-wrap">
                          {msg.content.replace("[CONTACTO_CAPTURADO]", "").trim()}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
              
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function AgendaView() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCalendar() {
      try {
        const res = await fetch("/api/calendar");
        const json = await res.json();
        if (json.success) setEvents(json.data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    fetchCalendar();
  }, []);

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-4xl">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight">Tu Agenda</h1>
            <p className="text-slate-400 mt-1">Eventos sincronizados de Google Calendar</p>
          </div>
          <button onClick={() => window.open("https://calendar.google.com", "_blank")} 
            className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all">
            <span className="material-symbols-outlined text-[18px]">open_in_new</span>
            Abrir Google Calendar
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
          </div>
        ) : events.length === 0 ? (
          <div className="bg-[#0F172A] border border-slate-800 rounded-2xl p-12 text-center">
            <span className="material-symbols-outlined text-slate-600 text-5xl mb-4">calendar_today</span>
            <p className="text-slate-400">No tienes eventos próximos programados.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {events.map((event) => {
              const start = new Date(event.start.dateTime || event.start.date);
              return (
                <div key={event.id} className="bg-[#0F172A] border border-slate-800 p-5 rounded-2xl hover:border-slate-700 transition-all group shadow-xl">
                  <div className="flex gap-6 items-start">
                    <div className="text-center min-w-[60px]">
                      <p className="text-[10px] uppercase font-bold text-orange-500">{start.toLocaleString('es-ES', { month: 'short' })}</p>
                      <p className="text-2xl font-black text-white">{start.getDate()}</p>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-white group-hover:text-orange-500 transition-colors">{event.summary}</h3>
                      <div className="flex items-center gap-4 mt-1">
                        <p className="text-sm text-slate-500 flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px]">schedule</span>
                          {start.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                        {event.location && (
                          <p className="text-sm text-slate-500 flex items-center gap-1">
                            <span className="material-symbols-outlined text-[14px]">location_on</span>
                            {event.location}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 rounded-full bg-orange-500/10 text-orange-500 text-[10px] font-bold uppercase border border-orange-500/20">Google Sync</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
