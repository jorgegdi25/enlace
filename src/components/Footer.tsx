"use client";

import Link from "next/link";
import Image from "next/image";

export default function Footer() {
  return (
    <footer className="bg-[#060913] border-t border-white/5 py-12">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          
          <div className="flex items-center gap-4">
            <Image
              src="/logo-white.png"
              alt="ENLACE"
              width={100}
              height={30}
              className="h-6 w-auto opacity-50"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                e.currentTarget.nextElementSibling?.classList.remove('hidden');
              }}
            />
            <span className="hidden text-white/50 font-bold text-xl tracking-tighter">ENLACE</span>
          </div>

          <div className="text-text-muted text-sm text-center md:text-left">
            © {new Date().getFullYear()} ENLACE Digital Intelligence. Todos los derechos reservados.
          </div>

          <div className="flex gap-6">
            <Link href="#" className="text-sm text-text-muted hover:text-white transition-colors">
              Términos de Servicio
            </Link>
            <Link href="#" className="text-sm text-text-muted hover:text-white transition-colors">
              Política de Privacidad
            </Link>
          </div>

        </div>
      </div>
    </footer>
  );
}
