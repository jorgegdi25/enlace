"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Bot, User, CheckCircle2, Sparkles, Calendar } from "lucide-react";

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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  useEffect(() => {
    const last = messages[messages.length - 1];
    if (last?.role === "assistant" && last.content.includes("[CONTACTO_CAPTURADO]")) {
      setIsComplete(true);
    }
  }, [messages]);

  // Guardar lead automáticamente al completar
  useEffect(() => {
    if (isComplete && messages.length > 0) {
      const saveLead = async () => {
        try {
          await fetch("/api/leads", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              history: messages.map(m => ({ role: m.role, content: m.content })),
              timestamp: new Date().toISOString(),
            }),
          });
        } catch (error) {
          console.error("Error saving lead:", error);
        }
      };
      saveLead();
    }
  }, [isComplete, messages]);

  const sendMessage = async (userContent: string) => {
    const newMessages: Message[] = [
      ...messages,
      { role: "user", content: userContent },
    ];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);

    try {
      let fullText = "";
      // Add empty assistant message to stream into
      setMessages([...newMessages, { role: "assistant", content: "" }]);

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
    sendMessage("Hola, quiero hacer el diagnóstico gratuito de mi negocio digital.");
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

  // Filter out the user's initial trigger from display
  const displayMessages = messages.filter(
    (m) => m.content !== "Hola, quiero hacer el diagnóstico gratuito de mi negocio digital."
  );

  return (
    <section id="contacto" className="py-32 bg-dark-bg relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-brand-primary/5 blur-[100px] rounded-full" />
      </div>

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 items-start">

          {/* Left — Copy */}
          <div>
            <span className="label-text text-brand-primary mb-4 block">Diagnóstico Gratuito</span>
            <h2 className="text-h2 mb-6">
              Habla con nuestro <span className="text-brand-primary">Agente de IA</span> y descubre exactamente qué le falta a tu negocio digital.
            </h2>
            <p className="text-text-muted text-lg mb-8 leading-relaxed">
              Sin formularios aburridos. Nuestro agente inteligente te hará 4 preguntas clave y recibirás un diagnóstico personalizado de tu situación digital.
            </p>

            <div className="space-y-4">
              {[
                "Diagnóstico en menos de 3 minutos",
                "Sin compromisos ni ventas agresivas",
                "Respuesta de un especialista en 24h",
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <CheckCircle2 size={18} className="text-brand-primary flex-shrink-0" />
                  <span className="text-text-muted">{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right — Chat Widget */}
          <div className="glass-card rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
            {/* Chat Header */}
            <div className="bg-dark-surface px-6 py-4 flex items-center gap-3 border-b border-white/5">
              <div className="w-9 h-9 rounded-full bg-brand-primary/20 border border-brand-primary/40 flex items-center justify-center">
                <Sparkles size={16} className="text-brand-primary" />
              </div>
              <div>
                <p className="font-semibold text-sm text-white">Agente ENLACE</p>
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-xs text-text-muted">En línea · Impulsado por IA</span>
                </div>
              </div>
            </div>

            {/* Messages area */}
            <div className="h-[360px] overflow-y-auto p-6 space-y-4">
              {!started ? (
                <div className="h-full flex flex-col items-center justify-center text-center gap-6">
                  <div className="w-16 h-16 rounded-2xl bg-brand-primary/10 border border-brand-primary/20 flex items-center justify-center">
                    <Bot size={32} className="text-brand-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-white text-lg mb-2">¿Listo para tu diagnóstico?</p>
                    <p className="text-text-muted text-sm">El Agente ENLACE te guiará en 4 preguntas rápidas.</p>
                  </div>
                  <button
                    onClick={startConversation}
                    className="bg-brand-primary hover:bg-brand-primary-hover text-white px-8 py-3 font-bold uppercase tracking-wide transition-colors flex items-center gap-2 rounded-lg"
                  >
                    <Sparkles size={16} />
                    Iniciar Diagnóstico
                  </button>
                </div>
              ) : isComplete ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="h-full flex flex-col items-center justify-center text-center p-4"
                >
                  <div className="w-20 h-20 bg-brand-primary/10 border border-brand-primary/30 rounded-full flex items-center justify-center mb-6">
                    <CheckCircle2 size={40} className="text-brand-primary" />
                  </div>
                  
                  <h3 className="text-2xl font-bold text-white mb-3">¡Perfil Calificado!</h3>
                  <p className="text-text-muted text-sm mb-8 leading-relaxed">
                    Hemos analizado tus respuestas. Tienes un gran potencial y calificas para una 
                    <span className="text-brand-primary font-bold"> Sesión Estratégica Gratuita</span> de 15 minutos.
                  </p>

                  <div className="w-full space-y-4">
                    <button 
                      onClick={() => window.open('https://calendly.com/tu-usuario/sesion-15-min', '_blank')}
                      className="w-full py-4 bg-brand-primary hover:bg-brand-primary-hover text-white rounded-xl font-bold text-sm transition-all transform hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-brand-primary/25"
                    >
                      <Calendar size={18} />
                      AGENDAR MI SESIÓN AHORA
                    </button>
                    
                    <button 
                      onClick={() => {
                        setStarted(false);
                        setIsComplete(false);
                        setMessages([]);
                      }}
                      className="text-xs text-text-muted hover:text-white transition-colors underline underline-offset-4"
                    >
                      Reiniciar diagnóstico
                    </button>
                  </div>
                </motion.div>
              ) : (
                <AnimatePresence initial={false}>
                  {displayMessages.map((message, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      className={`flex gap-3 ${message.role === "user" ? "flex-row-reverse" : "flex-row"}`}
                    >
                      <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center
                        ${message.role === "assistant"
                          ? "bg-brand-primary/20 border border-brand-primary/40"
                          : "bg-white/10 border border-white/20"}`}
                      >
                        {message.role === "assistant"
                          ? <Bot size={14} className="text-brand-primary" />
                          : <User size={14} className="text-white" />
                        }
                      </div>

                      <div className={`max-w-[75%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap
                        ${message.role === "assistant"
                          ? "bg-dark-surface border border-white/5 text-white rounded-tl-sm"
                          : "bg-brand-primary text-white rounded-tr-sm"}`}
                      >
                        {message.content.replace("[CONTACTO_CAPTURADO]", "").trim()}
                      </div>
                    </motion.div>
                  ))}

                  {/* Typing indicator */}
                  {isLoading && displayMessages[displayMessages.length - 1]?.role !== "assistant" && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex gap-3 items-center"
                    >
                      <div className="w-8 h-8 rounded-full bg-brand-primary/20 border border-brand-primary/40 flex items-center justify-center">
                        <Bot size={14} className="text-brand-primary" />
                      </div>
                      <div className="bg-dark-surface border border-white/5 px-4 py-3 rounded-2xl rounded-tl-sm flex gap-1 items-center">
                        <span className="w-1.5 h-1.5 bg-text-muted rounded-full animate-bounce [animation-delay:0ms]" />
                        <span className="w-1.5 h-1.5 bg-text-muted rounded-full animate-bounce [animation-delay:150ms]" />
                        <span className="w-1.5 h-1.5 bg-text-muted rounded-full animate-bounce [animation-delay:300ms]" />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            {started && !isComplete && (
              <form
                onSubmit={handleSubmit}
                className="border-t border-white/5 px-4 py-3 flex gap-3 items-center bg-dark-surface"
              >
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Escribe tu respuesta..."
                  disabled={isLoading}
                  className="flex-1 bg-transparent text-white placeholder:text-text-muted text-sm focus:outline-none disabled:opacity-50"
                  autoFocus
                />
                <button
                  type="submit"
                  disabled={isLoading || !input.trim()}
                  className="w-9 h-9 rounded-full bg-brand-primary hover:bg-brand-primary-hover disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-colors flex-shrink-0"
                >
                  <Send size={14} className="text-white" />
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
