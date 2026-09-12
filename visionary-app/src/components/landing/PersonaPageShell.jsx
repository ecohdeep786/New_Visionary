import LandingFooter from "@/components/landing/LandingFooter";
import LandingNav from "@/components/landing/LandingNav";

/** Shared, accessible frame for each audience landing page. */
export default function PersonaPageShell({ children }) {
  return (
    <div className="persona-page min-h-screen bg-white">
      <LandingNav />
      <main id="main" tabIndex={-1}>
        {children}
      </main>
      <LandingFooter />
    </div>
  );
}
