import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import ContextSection from "@/components/ContextSection";
import Services from "@/components/Services";
import Process from "@/components/Process";
import About from "@/components/About";
import ChatCTA from "@/components/ChatCTA";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <main className="min-h-screen bg-dark-bg text-text-light selection:bg-brand-primary selection:text-white">
      <Navbar />
      <Hero />
      <ContextSection />
      <Services />
      <Process />
      <About />
      <ChatCTA />
      <Footer />
    </main>
  );
}

