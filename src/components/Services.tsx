"use client";

import { motion } from "framer-motion";
import { Network, Zap, Puzzle, Map } from "lucide-react";

const services = [
  {
    icon: <Network className="text-brand-primary" size={24} />,
    title: "Sistema completo",
    description: "Ecosistema digital llave en mano diseñado para la captura y conversión de leads de alto valor.",
  },
  {
    icon: <Zap className="text-brand-primary" size={24} />,
    title: "Optimización",
    description: "Mejoramos tus activos actuales mediante auditorías de IA y optimización de flujos de usuario.",
  },
  {
    icon: <Puzzle className="text-brand-primary" size={24} />,
    title: "Piezas específicas",
    description: "Landing pages de alta conversión, embudos de venta y automatizaciones críticas para el día a día.",
  },
  {
    icon: <Map className="text-brand-primary" size={24} />,
    title: "Estrategia + guía",
    description: "Acompañamiento consultivo continuo para asegurar que la tecnología evolucione con tu mercado.",
  }
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

export default function Services() {
  return (
    <section id="servicios" className="py-32 bg-dark-surface relative overflow-hidden">
      {/* Decorative gradient blob */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-brand-primary/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <span className="label-text text-brand-primary mb-4 block">
            Nuestras Soluciones
          </span>
          <h2 className="text-h2 mb-6">¿Cómo podemos ayudarte?</h2>
          <p className="text-lg text-text-muted">
            Trabajamos con lo que tu negocio realmente necesita para escalar.
          </p>
        </div>

        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {services.map((service, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              className="glass-card p-8 rounded-2xl hover:bg-white/[0.06] transition-all hover:-translate-y-1 hover:border-brand-primary/30 group"
            >
              <div className="w-12 h-12 rounded-xl bg-brand-primary/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                {service.icon}
              </div>
              <h3 className="text-xl font-bold mb-4">{service.title}</h3>
              <p className="text-text-muted leading-relaxed text-sm">
                {service.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
