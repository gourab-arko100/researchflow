import { Navbar } from "@/components/landing/navbar";
import { Hero } from "@/components/landing/hero";
import { Capabilities } from "@/components/landing/capabilities";
import { ArchitectureStrip } from "@/components/landing/architecture-strip";
import { Footer } from "@/components/landing/footer";

export default function HomePage() {
  return (
    <main>
      <Navbar />
      <Hero />
      <Capabilities />
      <ArchitectureStrip />
      <Footer />
    </main>
  );
}
