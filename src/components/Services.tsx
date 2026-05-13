"use client";

import { motion } from "framer-motion";
import { Network, Zap, Puzzle, Map } from "lucide-react";

const services = [
  {
    icon: <Network className="text-brand-primary" size={24} />,
    title: "Sistema que genera clientes",
    description: "Organizamos todo —o lo construimos desde cero— para que funcione como un sistema que atrae, genera confianza y facilita la venta.",
  },
  {
    icon: <Zap className="text-brand-primary" size={24} />,
    title: "Mejoramos lo que ya tienes",
    description: "Auditorías de IA y optimización de tus activos actuales para que dejen de ser un gasto y empiecen a generar resultados.",
  },
  {
    icon: <Puzzle className="text-brand-primary" size={24} />,
    title: "Páginas que sí venden",
    description: "Landing pages de alta conversión, embudos de venta y automatizaciones diseñadas para convertir visitantes en clientes.",
  },
  {
    icon: <Map className="text-brand-primary" size={24} />,
    title: "Acompañamiento estratégico",
    description: "No te dejamos solo. Te acompañamos para asegurar que todo funcione y evolucione con tu mercado.",
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
          <h2 className="text-h2 mb-6">Cómo te ayudamos</h2>
          <p className="text-lg text-text-muted">
            No se trata de tener más herramientas. Se trata de que funcionen.
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
