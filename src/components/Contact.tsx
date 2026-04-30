"use client";

import { motion } from "framer-motion";
import { Send, MessageSquare } from "lucide-react";
import Link from "next/link";

export default function Contact() {
  return (
    <section id="contacto" className="py-32 bg-dark-bg">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-16">
          
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-h2 mb-4">
              SI TU NEGOCIO NECESITA CLIENTES,<br/>
              <span className="text-brand-primary">ESTO NO ES OPCIONAL.</span>
            </h2>
            <p className="text-lg text-text-muted mb-12">
              Agenda hoy mismo una sesión de diagnóstico gratuita de 30 minutos 
              para evaluar tu infraestructura digital actual o escríbenos directamente.
            </p>

            <div className="space-y-6">
              <Link 
                href="https://wa.me/1234567890?text=Hola,%20quiero%20mejorar%20la%20captaci%C3%B3n%20de%20clientes%20de%20mi%20negocio." 
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-3 bg-[#25D366] hover:bg-[#20bd5a] text-white px-8 py-5 font-bold uppercase transition-colors"
              >
                <MessageSquare size={20} />
                Contactar por WhatsApp
              </Link>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="glass-card p-8 md:p-12 rounded-2xl"
          >
            <h3 className="text-2xl font-bold mb-8">Solicitar Contacto</h3>
            <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); alert('Funcionalidad de envío en desarrollo. Redirigiendo a WhatsApp o CRM próximamente.'); }}>
              <div>
                <label className="label-text text-text-muted mb-2 block">NOMBRE / EMPRESA</label>
                <input 
                  type="text" 
                  placeholder="Tu nombre" 
                  className="w-full bg-dark-surface border-b-2 border-white/10 px-4 py-4 text-white focus:outline-none focus:border-brand-primary transition-colors"
                  required 
                />
              </div>
              <div>
                <label className="label-text text-text-muted mb-2 block">CORREO ELECTRÓNICO</label>
                <input 
                  type="email" 
                  placeholder="correo@empresa.com" 
                  className="w-full bg-dark-surface border-b-2 border-white/10 px-4 py-4 text-white focus:outline-none focus:border-brand-primary transition-colors"
                  required 
                />
              </div>
              <div>
                <label className="label-text text-text-muted mb-2 block">SERVICIO DE INTERÉS</label>
                <select className="w-full bg-dark-surface border-b-2 border-white/10 px-4 py-4 text-white focus:outline-none focus:border-brand-primary transition-colors appearance-none">
                  <option value="sistema">Sistema Completo</option>
                  <option value="auditoria">Auditoría / Optimización</option>
                  <option value="landing">Landing Page</option>
                  <option value="otro">Otro</option>
                </select>
              </div>
              <button 
                type="submit" 
                className="w-full mt-4 flex items-center justify-center gap-3 border-2 border-brand-primary hover:bg-brand-primary text-brand-primary hover:text-white px-8 py-5 font-bold uppercase transition-all"
              >
                <Send size={18} />
                Enviar Solicitud
              </button>
            </form>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
