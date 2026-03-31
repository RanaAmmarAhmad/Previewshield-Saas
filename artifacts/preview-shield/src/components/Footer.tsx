import { Link } from "wouter";
import { Github, Mail } from "lucide-react";
import { LogoFull } from "@/components/Logo";

export function Footer() {
  return (
    <footer className="border-t border-white/5 py-12" style={{ background: "#06081a" }}>
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          <div className="col-span-1 md:col-span-2">
            <div className="mb-4">
              <LogoFull dark />
            </div>
            <p className="text-white/40 text-sm max-w-sm leading-relaxed">
              The professional layer between your work and untrusting clients. Share previews securely, track visits, and protect your livelihood.
            </p>
            <div className="flex items-center gap-4 mt-5">
              <a href="mailto:appcloud41@gmail.com" className="text-white/30 hover:text-indigo-400 transition-colors" aria-label="Email">
                <Mail className="w-5 h-5" />
              </a>
              <a href="https://github.com/RanaAmmarAhmad" target="_blank" rel="noopener noreferrer" className="text-white/30 hover:text-indigo-400 transition-colors" aria-label="GitHub">
                <Github className="w-5 h-5" />
              </a>
            </div>
          </div>

          <div>
            <h4 className="text-white font-semibold text-sm mb-4">Product</h4>
            <div className="space-y-3">
              {[
                { label: "Share a File", href: "/share" },
                { label: "Dashboard", href: "/dashboard" },
                { label: "How It Works", href: "/how-it-works" },
              ].map((l) => (
                <Link key={l.label} href={l.href} className="block text-sm text-white/40 hover:text-white/80 transition-colors">{l.label}</Link>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-white font-semibold text-sm mb-4">Company</h4>
            <div className="space-y-3">
              {[
                { label: "About", href: "/about" },
                { label: "Contact", href: "/contact" },
              ].map((l) => (
                <Link key={l.label} href={l.href} className="block text-sm text-white/40 hover:text-white/80 transition-colors">{l.label}</Link>
              ))}
            </div>
          </div>
        </div>

        <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-white/25 text-xs">
            Built by <a href="https://github.com/RanaAmmarAhmad" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-300 transition-colors">Rana Ammar Ahmad Khan</a> — AI & Web Dev Expert
          </p>
          <p className="text-white/25 text-xs">
            &copy; {new Date().getFullYear()} PreviewShield. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
