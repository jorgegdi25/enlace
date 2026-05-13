"use client";

import { motion } from "framer-motion";
import Image from "next/image";

export default function ContextSection() {
  return (
    <section className="py-24 bg-dark-bg relative">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
          >
            <span className="label-text text-brand-primary mb-4 block">
              La realidad
            </span>
            <h2 className="text-h2 mb-6">
              Si no genera clientes, no es un activo. Es un gasto.
            </h2>
            <p className="text-lg text-text-muted mb-8 leading-relaxed">
              Una página web sin tráfico, redes sociales sin resultados, o campañas sin estrategia... 
              no son activos. No importa cuánto inviertas si no existe una forma clara de atraer 
              y convertir clientes.
            </p>
            
            <div className="flex items-center gap-4">
              <div className="w-12 h-px bg-brand-primary"></div>
              <span className="text-brand-primary font-medium">Eso es lo que resolvemos</span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="relative h-[500px] w-full rounded-2xl overflow-hidden border border-white/10 shadow-2xl"
          >
            <Image
              src="/context_office_1777484425728.png"
              alt="Data center showing digital infrastructure"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
            {/* Overlay gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#090e1a] to-transparent opacity-60" />
          </motion.div>

        </div>
      </div>
    </section>
  );
}
