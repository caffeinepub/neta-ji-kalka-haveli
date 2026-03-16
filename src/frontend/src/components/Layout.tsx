import { Link, useLocation } from "@tanstack/react-router";
import {
  BookOpen,
  ImageIcon,
  Phone,
  ShieldCheck,
  UtensilsCrossed,
} from "lucide-react";

const navLinks = [
  { to: "/menu", label: "Menu", icon: BookOpen, ocid: "nav.menu.link" },
  {
    to: "/gallery",
    label: "Gallery",
    icon: ImageIcon,
    ocid: "nav.gallery.link",
  },
  { to: "/contact", label: "Contact", icon: Phone, ocid: "nav.contact.link" },
  { to: "/admin", label: "Admin", icon: ShieldCheck, ocid: "nav.admin.link" },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Top header — maroon */}
      <header className="bg-primary text-primary-foreground py-4 px-6 text-center shadow-lg">
        <div className="flex items-center justify-center gap-3">
          <UtensilsCrossed className="h-8 w-8 text-secondary" />
          <div>
            <h1 className="font-display text-2xl md:text-3xl font-bold leading-tight tracking-wide">
              Neta Ji (Kalka Haveli)
            </h1>
            <p className="text-sm tracking-[0.2em] uppercase text-primary-foreground/80 font-body">
              Family Restaurant
            </p>
          </div>
          <UtensilsCrossed className="h-8 w-8 text-secondary" />
        </div>
      </header>

      {/* Nav bar — near-black */}
      <nav className="bg-[oklch(0.14_0.01_20)] text-white shadow-md sticky top-0 z-50">
        <div className="max-w-5xl mx-auto flex items-center justify-center gap-1 py-1 px-4">
          <Link
            to="/"
            className="mr-2 px-3 py-2 text-sm font-body font-medium text-white/90 hover:text-secondary transition-colors"
          >
            Home
          </Link>
          {navLinks.map((link) => {
            const active = location.pathname === link.to;
            return (
              <Link
                key={link.to}
                to={link.to}
                data-ocid={link.ocid}
                className={`flex items-center gap-1.5 px-4 py-2 text-sm font-body font-medium transition-colors rounded ${
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-white/80 hover:text-secondary hover:bg-white/5"
                }`}
              >
                <link.icon className="h-3.5 w-3.5" />
                {link.label}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Main content */}
      <main className="flex-1">{children}</main>

      {/* Footer */}
      <footer className="bg-[oklch(0.14_0.01_20)] text-white/70 py-6 px-4 text-center font-body text-sm">
        <p className="mb-1">
          © {new Date().getFullYear()} Neta Ji (Kalka Haveli) &mdash; Family
          Restaurant
        </p>
        <p className="text-white/40 text-xs">
          Built with ❤️ using{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(typeof window !== "undefined" ? window.location.hostname : "")}`}
            className="underline hover:text-secondary transition-colors"
            target="_blank"
            rel="noopener noreferrer"
          >
            caffeine.ai
          </a>
        </p>
      </footer>
    </div>
  );
}
