"use client";

import { motion } from "framer-motion";
import Image from "next/image";

export default function About() {
  return (
    <section id="nosotros" className="bg-dark-surface overflow-hidden">
      {/* Marquee */}
      <div className="bg-brand-primary py-6 rotate-1 scale-105 border-y border-brand-primary-hover">
        <div className="flex whitespace-nowrap overflow-hidden">
          <motion.div
            animate={{ x: [0, -1035] }}
            transition={{
              repeat: Infinity,
              ease: "linear",
              duration: 20,
            }}
            className="flex items-center gap-8 text-2xl md:text-4xl font-bold font-sora text-dark-bg italic uppercase"
          >
            <span>NO VENDEMOS HERRAMIENTAS. HACEMOS QUE FUNCIONEN.</span>
            <span>▪</span>
            <span>NO VENDEMOS HERRAMIENTAS. HACEMOS QUE FUNCIONEN.</span>
            <span>▪</span>
            <span>NO VENDEMOS HERRAMIENTAS. HACEMOS QUE FUNCIONEN.</span>
            <span>▪</span>
          </motion.div>
        </div>
      </div>

      <div className="py-32">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6 }}
            >
              <span className="label-text text-brand-primary mb-4 block">Sobre Enlace</span>
              <h2 className="text-h2 mb-8">
                No somos una agencia tradicional.
              </h2>
              <p className="text-lg text-text-muted mb-8 leading-relaxed">
                Trabajamos contigo como aliados para ayudarte a conseguir clientes de forma constante. 
                No hacemos páginas bonitas sin propósito. Construimos sistemas que funcionan como 
                activos reales para tu negocio.
              </p>
              
              <div className="grid grid-cols-2 gap-8 border-t border-white/10 pt-8 mt-8">
                <div>
                  <div className="text-4xl font-bold text-white mb-2">+10</div>
                  <div className="text-text-muted text-sm">Años Experiencia</div>
                </div>
                <div>
                  <div className="text-4xl font-bold text-white mb-2">100%</div>
                  <div className="text-text-muted text-sm">Foco en ROI</div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6 }}
              className="relative h-[600px] w-full rounded-2xl overflow-hidden glass-card"
            >
              <Image
                src="/about_team_1777484443574.png"
                alt="ENLACE Leadership Team"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-dark-bg via-transparent to-transparent opacity-80" />
              <div className="absolute bottom-8 left-8 right-8">
                <p className="text-white/80 font-medium italic text-xl">
                  "No vendemos herramientas. Hacemos que funcionen."
                </p>
              </div>
            </motion.div>

          </div>
        </div>
      </div>
    </section>
  );
}
