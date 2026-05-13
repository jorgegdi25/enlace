"use client";

import { motion } from "framer-motion";

const steps = [
  {
    number: "01",
    title: "Entendemos tu negocio",
    description: "Analizamos tu situación actual, tu mercado y qué está fallando para tener un diagnóstico claro."
  },
  {
    number: "02",
    title: "Diseño de la solución",
    description: "Definimos las herramientas, la estructura y la estrategia exacta que tu negocio necesita para generar clientes."
  },
  {
    number: "03",
    title: "Lo ponemos a funcionar",
    description: "Construimos tu sistema o guiamos a tu equipo para ponerlo en marcha y medir resultados."
  },
  {
    number: "04",
    title: "Acompañamiento",
    description: "Te acompañamos para optimizar, medir y escalar los resultados en el tiempo."
  }
];

export default function Process() {
  return (
    <section id="metodologia" className="py-32 bg-dark-bg relative">
      <div className="max-w-7xl mx-auto px-6">
        <div className="mb-20">
          <span className="label-text text-brand-primary mb-4 block">Metodología</span>
          <h2 className="text-h2">NUESTRO PROCESO.<br/><span className="text-text-muted">Así trabajamos.</span></h2>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 relative">
          {/* Connector line for desktop */}
          <div className="hidden md:block absolute top-12 left-[10%] right-[10%] h-px bg-white/10 z-0" />

          {steps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.5, delay: index * 0.2 }}
              className="relative z-10"
            >
              <div className="w-24 h-24 rounded-2xl glass-card flex items-center justify-center text-4xl font-bold font-sora text-brand-primary mb-8 border-brand-primary/20 bg-[#090e1a]">
                {step.number}
              </div>
              <h3 className="text-2xl font-bold mb-4">{step.title}</h3>
              <p className="text-text-muted leading-relaxed">
                {step.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
