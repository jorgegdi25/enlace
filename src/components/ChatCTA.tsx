"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Bot, User, CheckCircle2, Sparkles, Calendar, ArrowLeft, X } from "lucide-react";

type Message = {
  role: "user" | "assistant";
  content: string;
};

async function* streamResponse(messages: Message[]): AsyncGenerator<string> {
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages }),
  });

  if (!res.ok || !res.body) throw new Error("Error al contactar con el agente.");

  const reader = res.body.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const text = decoder.decode(value, { stream: true });
    if (text) yield text;
  }
}

export default function ChatCTA() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [started, setStarted] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const leadIdRef = useRef<string | null>(null);
  const lastSavedCountRef = useRef<number>(0);
  const [availableSlots, setAvailableSlots] = useState<{display: string, iso: string}[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [isScheduling, setIsScheduling] = useState(false);
  const [selectedDateGroup, setSelectedDateGroup] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  // Escuchar eventos globales para abrir el chat desde otros botones (Navbar, Hero, etc)
  useEffect(() => {
    const handleOpenChat = () => setIsOpen(true);
    window.addEventListener('open-chat', handleOpenChat);
    return () => window.removeEventListener('open-chat', handleOpenChat);
  }, []);

  const [scheduleError, setScheduleError] = useState<string | null>(null);

  // Agrupar los slots por día
  const slotsByDate = availableSlots.reduce((acc, slot) => {
    const dateObj = new Date(slot.iso);
    let dateStr = dateObj.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' });
    dateStr = dateStr.charAt(0).toUpperCase() + dateStr.slice(1);
    if (!acc[dateStr]) acc[dateStr] = [];
    acc[dateStr].push(slot);
    return acc;
  }, {} as Record<string, typeof availableSlots>);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  useEffect(() => {
    if (isLoading || isComplete) return;

    const last = messages[messages.length - 1];
    if (last?.role === "assistant" && last.content.includes("[CONTACTO_CAPTURADO]")) {
      setIsComplete(true);
      fetchAvailability();
    }
  }, [messages, isLoading, isComplete]);

  const fetchAvailability = async () => {
    try {
      const res = await fetch("/api/calendar/availability");
      const data = await res.json();
      if (data.success) {
        setAvailableSlots(data.slots);
      }
    } catch (error) {
      console.error("Error fetching availability:", error);
    }
  };

  const handleSchedule = async (slot: { display: string, iso: string }) => {
    if (isScheduling) return;
    setIsScheduling(true);
    setScheduleError(null);
    try {
      const res = await fetch("/api/calendar/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadId: leadIdRef.current,
          slotIso: slot.iso
        })
      });
      const data = await res.json();
      
      if (data.success) {
        setSelectedSlot(slot.display);
      } else {
        setScheduleError(data.error || "Error desconocido al agendar.");
      }
    } catch (error) {
      console.error("Schedule error:", error);
      setScheduleError("Hubo un problema de conexión al intentar agendar tu cita.");
    } finally {
      setIsScheduling(false);
    }
  };

  // Guardar lead solo cuando el bot termina de hablar para evitar sobrecarga
  useEffect(() => {
    if (isLoading || messages.length === 0) return;

    const assistantMessages = messages.filter(m => m.role === "assistant");
    const userMessages = messages.filter(m => m.role === "user");
    
    const realUserMessages = userMessages.filter(m => m.content !== "Hola, quiero empezar el análisis de mi negocio digital.");
    if (realUserMessages.length === 0) return;
    
    if (messages.length <= lastSavedCountRef.current) return;

    const saveOrUpdateLead = async () => {
      const payload = {
        history: messages.map(m => ({ role: m.role, content: m.content })),
        timestamp: new Date().toISOString(),
      };

      try {
        if (!leadIdRef.current) {
          const res = await fetch("/api/leads", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
          const result = await res.json();
          if (result.data?.[0]?.id) {
            leadIdRef.current = result.data[0].id;
          }
        } else {
          await fetch("/api/leads", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              id: leadIdRef.current,
              history: payload.history,
            }),
          });
        }
        lastSavedCountRef.current = messages.length;
      } catch (error) {
        console.error("Error saving/updating lead:", error);
      }
    };
    saveOrUpdateLead();
  }, [messages, isLoading]);

  const sendMessage = async (userContent: string) => {
    const newMessages: Message[] = [
      ...messages,
      { role: "user", content: userContent },
    ];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);

    try {
      setMessages([...newMessages, { role: "assistant", content: "" }]);
      
      let fullText = "";
      for await (const chunk of streamResponse(newMessages)) {
        fullText += chunk;
        setMessages([
          ...newMessages,
          { role: "assistant", content: fullText },
        ]);
      }
    } catch {
      setMessages([
        ...newMessages,
        { role: "assistant", content: "Lo siento, hubo un error. Por favor intenta de nuevo." },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const startConversation = () => {
    setStarted(true);
    sendMessage("Hola, quiero empezar el análisis de mi negocio digital.");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      sendMessage(input.trim());
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (input.trim() && !isLoading) {
        sendMessage(input.trim());
      }
    }
  };

  const displayMessages = messages.filter(
    (m) => m.content !== "Hola, quiero empezar el análisis de mi negocio digital."
  ).map(m => ({
    ...m,
    content: m.content.replace(/\[CONTACTO_CAPTURADO\]/g, "").trim()
  })).filter(m => m.content !== "");


  const [showCalendar, setShowCalendar] = useState(false);

  return (
    <>
      {/* SECTION CTA CENTRADO */}
      <section className="py-24 bg-dark-bg relative overflow-hidden" id="chat-cta">
        {/* Background gradients */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-brand-primary/5 rounded-full blur-[150px] pointer-events-none" />

        <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-brand-primary/10 border border-brand-primary/20 rounded-2xl mb-8">
            <Bot size={32} className="text-brand-primary" />
          </div>
          <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6 leading-tight">
            Te mostramos exactamente qué <span className="text-brand-primary">mejorar en tu negocio</span>
          </h2>
          <p className="text-text-muted text-lg mb-10 leading-relaxed max-w-2xl mx-auto">
            Responde 3 preguntas y en menos de 2 minutos descubrirás qué está frenando tu crecimiento digital.
          </p>

          <ul className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-10 mb-12">
            {[
              "Análisis en 2 minutos",
              "Sin compromisos",
              "Sesión gratuita de 15 min",
            ].map((item, i) => (
              <li key={i} className="flex items-center gap-2 text-slate-300">
                <CheckCircle2 size={20} className="text-brand-primary flex-shrink-0" />
                <span className="font-medium">{item}</span>
              </li>
            ))}
          </ul>

          <button
            onClick={() => setIsOpen(true)}
            className="flex items-center gap-3 bg-brand-primary hover:bg-orange-600 text-white px-8 py-4 rounded-full font-bold text-lg mx-auto transition-all shadow-[0_0_30px_rgba(249,115,22,0.3)] hover:shadow-[0_0_40px_rgba(249,115,22,0.5)] transform hover:-translate-y-1"
          >
            <Sparkles size={20} />
            Empezar análisis
          </button>
        </div>
      </section>

      {/* FLOATING TRIGGER BUTTON */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 w-16 h-16 bg-brand-primary text-white rounded-full flex items-center justify-center shadow-2xl hover:bg-orange-600 transition-all hover:scale-105"
        style={{ boxShadow: "0 10px 25px -5px rgba(249, 115, 22, 0.4), 0 8px 10px -6px rgba(249, 115, 22, 0.1)" }}
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
            >
              <X size={32} />
            </motion.div>
          ) : (
            <motion.div
              key="bot"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
            >
              <Bot size={32} />
            </motion.div>
          )}
        </AnimatePresence>
      </button>

      {/* FLOATING CHAT WINDOW */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-28 right-6 z-50 w-[380px] h-[600px] max-w-[calc(100vw-3rem)] max-h-[calc(100vh-8rem)] bg-dark-surface/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
            style={{ boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)" }}
          >
            {/* Header */}
            <div className="bg-brand-primary p-4 flex items-center gap-3 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center border border-white/30 relative z-10 shadow-inner">
                <Bot size={20} className="text-white" />
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 border-2 border-brand-primary rounded-full" />
              </div>
              <div className="relative z-10">
                <h3 className="text-white font-bold text-sm">Análisis de tu Negocio</h3>
                <p className="text-xs text-white/80 flex items-center gap-1">
                  En línea • ENLACE
                </p>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-dark-surface/50">
              {!started ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6">
                  <div className="w-16 h-16 bg-brand-primary/10 rounded-full flex items-center justify-center mb-4 border border-brand-primary/20">
                    <Sparkles size={28} className="text-brand-primary" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Comienza tu Análisis</h3>
                  <p className="text-text-muted text-sm mb-6">
                    Descubre qué está frenando tu crecimiento digital en menos de 2 minutos.
                  </p>
                  <button
                    onClick={startConversation}
                    className="flex items-center gap-2 bg-brand-primary hover:bg-orange-600 text-white px-6 py-3 rounded-full font-bold transition-all shadow-lg transform hover:-translate-y-0.5"
                  >
                    <Sparkles size={16} />
                    Empezar análisis
                  </button>
                </div>
              ) : isComplete && showCalendar ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="h-full flex flex-col items-center justify-center text-center p-2"
                >
                  <div className="w-16 h-16 bg-brand-primary/10 border border-brand-primary/30 rounded-full flex items-center justify-center mb-4">
                    <CheckCircle2 size={32} className="text-brand-primary" />
                  </div>
                  
                  <h3 className="text-xl font-bold text-white mb-2">¡Calificas!</h3>
                  <p className="text-text-muted text-xs mb-6 leading-relaxed">
                    Tienes un gran potencial para una Sesión Estratégica Gratuita.
                  </p>

                  <div className="w-full space-y-4">
                    {scheduleError && (
                      <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-3 rounded-xl text-xs text-left mb-4">
                        {scheduleError}
                      </div>
                    )}
                    
                    {selectedSlot ? (
                      <div className="bg-brand-primary/10 border border-brand-primary/20 p-5 rounded-2xl animate-pulse">
                        <CheckCircle2 size={24} className="text-brand-primary mx-auto mb-2" />
                        <p className="text-white font-bold text-sm">¡Cita Agendada!</p>
                        <p className="text-text-muted text-[10px] mt-1">Revisa tu correo para la invitación.</p>
                        <p className="text-brand-primary font-bold text-[11px] mt-2 uppercase tracking-wider">{selectedSlot}</p>
                      </div>
                    ) : (
                      <>
                        {Object.keys(slotsByDate).length > 0 ? (
                          selectedDateGroup ? (
                            <div className="text-left w-full">
                              <div className="flex items-center gap-2 mb-3 px-1">
                                <button 
                                  onClick={() => setSelectedDateGroup(null)}
                                  className="text-slate-400 hover:text-white p-1 hover:bg-white/5 rounded-lg transition-colors"
                                >
                                  <ArrowLeft size={16} />
                                </button>
                                <span className="text-white font-bold text-xs uppercase tracking-wider">{selectedDateGroup}</span>
                              </div>
                              <div className="grid grid-cols-2 gap-2 max-h-[160px] overflow-y-auto pr-1 custom-scrollbar">
                                {slotsByDate[selectedDateGroup].map((slot, i) => {
                                  const timeStr = new Date(slot.iso).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
                                  return (
                                    <button
                                      key={i}
                                      onClick={() => handleSchedule(slot)}
                                      disabled={isScheduling}
                                      className="py-2.5 px-2 bg-dark-surface border border-white/10 hover:border-brand-primary hover:bg-brand-primary/5 text-white rounded-lg text-xs font-bold transition-all flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                      <span>{isScheduling ? "..." : timeStr}</span>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          ) : (
                            <div className="text-left w-full">
                              <p className="text-[9px] uppercase font-bold text-slate-500 tracking-[0.2em] mb-2 px-1">Elige un Día Disponible</p>
                              <div className="grid grid-cols-2 gap-2 max-h-[160px] overflow-y-auto pr-1 custom-scrollbar">
                                {Object.keys(slotsByDate).map((dateStr, i) => (
                                  <button
                                    key={i}
                                    onClick={() => setSelectedDateGroup(dateStr)}
                                    className="py-2.5 px-3 bg-dark-surface border border-white/10 hover:border-brand-primary hover:bg-brand-primary/5 text-slate-300 hover:text-white rounded-lg text-xs font-medium transition-all text-left flex items-center justify-between group"
                                  >
                                    <span className="truncate">{dateStr}</span>
                                  </button>
                                ))}
                              </div>
                            </div>
                          )
                        ) : (
                          <div className="py-8 border border-dashed border-white/10 rounded-xl text-slate-500 text-xs">
                            Cargando tu calendario...
                          </div>
                        )}
                      </>
                    )}
                    
                    <button 
                      onClick={() => {
                        setStarted(false);
                        setIsComplete(false);
                        setShowCalendar(false);
                        setMessages([]);
                        setSelectedSlot(null);
                        setAvailableSlots([]);
                        setSelectedDateGroup(null);
                        setScheduleError(null);
                      }}
                      className="text-[10px] text-text-muted hover:text-white transition-colors underline underline-offset-4 pt-4"
                    >
                      Reiniciar diagnóstico
                    </button>
                  </div>
                </motion.div>
              ) : (
                <div className="flex flex-col gap-4">
                  {displayMessages.map((m, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex gap-3 max-w-[85%] ${m.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"}`}
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1 ${m.role === "user" ? "bg-slate-800 border border-white/10" : "bg-brand-primary/20 border border-brand-primary/30"}`}>
                        {m.role === "user" ? <User size={14} className="text-slate-400" /> : <Bot size={14} className="text-brand-primary" />}
                      </div>
                      <div className={`p-3 rounded-2xl text-sm leading-relaxed ${m.role === "user" ? "bg-brand-primary text-white rounded-tr-sm" : "bg-dark-surface border border-white/5 text-slate-200 rounded-tl-sm"}`}>
                        {m.content}
                      </div>
                    </motion.div>
                  ))}
                  {isLoading && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3 max-w-[85%] mr-auto">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1 bg-brand-primary/20 border border-brand-primary/30">
                        <Bot size={14} className="text-brand-primary" />
                      </div>
                      <div className="p-4 rounded-2xl bg-dark-surface border border-white/5 rounded-tl-sm flex gap-1.5 items-center">
                        <span className="w-1.5 h-1.5 bg-brand-primary rounded-full animate-bounce" />
                        <span className="w-1.5 h-1.5 bg-brand-primary rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
                        <span className="w-1.5 h-1.5 bg-brand-primary rounded-full animate-bounce" style={{ animationDelay: "0.4s" }} />
                      </div>
                    </motion.div>
                  )}
                  {isComplete && !showCalendar && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex justify-center mt-6 mb-2">
                      <button
                        onClick={() => setShowCalendar(true)}
                        className="bg-brand-primary hover:bg-brand-primary-hover text-white px-6 py-3 rounded-full font-bold text-sm shadow-lg flex items-center gap-2 transform hover:scale-105 transition-all"
                      >
                        <Calendar size={16} />
                        Ver Fechas Disponibles
                      </button>
                    </motion.div>
                  )}
                  <div ref={messagesEndRef} className="h-2" />
                </div>
              )}
            </div>

            {/* Input Area */}
            {!isComplete && started && (
              <div className="p-4 bg-dark-surface border-t border-white/10 relative z-10">
                <form
                  onSubmit={handleSubmit}
                  className="flex items-center gap-2 bg-dark-bg border border-white/10 p-1.5 rounded-full focus-within:border-brand-primary/50 focus-within:shadow-[0_0_15px_rgba(249,115,22,0.1)] transition-all"
                >
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Escribe tu respuesta..."
                    disabled={isLoading}
                    className="flex-1 bg-transparent border-none text-white text-sm px-4 py-2 focus:outline-none focus:ring-0 placeholder-slate-500 disabled:opacity-50"
                  />
                  <button
                    type="submit"
                    disabled={!input.trim() || isLoading}
                    className="w-10 h-10 bg-white/5 hover:bg-brand-primary text-brand-primary hover:text-white rounded-full flex items-center justify-center transition-all disabled:opacity-50 disabled:hover:bg-white/5 disabled:hover:text-brand-primary"
                  >
                    <Send size={16} className="ml-1" />
                  </button>
                </form>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
