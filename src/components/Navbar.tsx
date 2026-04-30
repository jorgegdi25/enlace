"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { motion } from "framer-motion";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="fixed w-full z-50 bg-[#090e1a]/90 backdrop-blur-md border-b border-white/5">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <Link href="/">
          <Image
            src="/logo-white.png"
            alt="ENLACE"
            width={120}
            height={40}
            className="h-8 w-auto"
            onError={(e) => {
              // Fallback to text if logo is missing
              e.currentTarget.style.display = 'none';
              e.currentTarget.nextElementSibling?.classList.remove('hidden');
            }}
          />
          <span className="hidden text-brand-primary font-bold text-2xl tracking-tighter">ENLACE</span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-8">
          <Link href="#servicios" className="text-sm font-medium text-text-muted hover:text-brand-primary transition-colors">SERVICIOS</Link>
          <Link href="#metodologia" className="text-sm font-medium text-text-muted hover:text-brand-primary transition-colors">METODOLOGÍA</Link>
          <Link href="#nosotros" className="text-sm font-medium text-text-muted hover:text-brand-primary transition-colors">NOSOTROS</Link>
          <Link href="#contacto" className="bg-brand-primary hover:bg-brand-primary-hover text-white px-6 py-2.5 text-sm font-bold tracking-wide transition-colors uppercase">
            Iniciar Proyecto
          </Link>
        </div>

        {/* Mobile Toggle */}
        <button className="md:hidden text-white" onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Nav */}
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="md:hidden absolute top-20 left-0 w-full bg-[#090e1a] border-b border-white/5 p-6 flex flex-col gap-6"
        >
          <Link href="#servicios" onClick={() => setIsOpen(false)} className="text-sm font-medium text-white">SERVICIOS</Link>
          <Link href="#metodologia" onClick={() => setIsOpen(false)} className="text-sm font-medium text-white">METODOLOGÍA</Link>
          <Link href="#nosotros" onClick={() => setIsOpen(false)} className="text-sm font-medium text-white">NOSOTROS</Link>
          <Link href="#contacto" onClick={() => setIsOpen(false)} className="bg-brand-primary text-center text-white px-6 py-3 text-sm font-bold uppercase mt-4">
            Iniciar Proyecto
          </Link>
        </motion.div>
      )}
    </nav>
  );
}
