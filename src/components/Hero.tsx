"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, PlayCircle } from "lucide-react";

export default function Hero() {
  return (
    <section className="relative min-h-[85vh] flex items-center pt-24 pb-12">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/hero_bg_1777484411686.png"
          alt="ENLACE Digital Intelligence Architecture"
          fill
          priority
          className="object-cover opacity-30"
        />
        {/* Gradients for blending */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#090e1a] via-transparent to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#090e1a] via-[#090e1a]/80 to-transparent" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 w-full">
        <div className="max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="label-text text-brand-primary mb-4 block">
              Digital Intelligence Agency
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-h1 mb-4 text-white leading-tight"
          >
            Arquitectos de sistemas digitales con IA para <span className="text-brand-primary">generar clientes.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-lg md:text-xl text-text-muted mb-8 max-w-2xl leading-relaxed"
          >
            No vendemos páginas web. Diseñamos sistemas inteligentes que hacen
            que los clientes lleguen de forma recurrente a tu negocio.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4"
          >
            <Link
              href="#contacto"
              className="bg-brand-primary hover:bg-brand-primary-hover text-white px-8 py-4 font-bold tracking-wide uppercase transition-colors flex items-center justify-center gap-2 group"
            >
              Agendar Diagnóstico
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="#metodologia"
              className="border border-white/20 hover:border-white/40 bg-white/5 text-white px-8 py-4 font-bold tracking-wide uppercase transition-colors flex items-center justify-center gap-2"
            >
              Ver Cómo Trabajamos
              <PlayCircle size={18} />
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
