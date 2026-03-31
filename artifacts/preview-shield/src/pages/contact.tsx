import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Mail, Github, Code2 } from "lucide-react";

export default function Contact() {
  return (
    <div className="flex flex-col min-h-screen" style={{ background: "#06081a", color: "#fff" }}>
      <Navbar />

      <main className="flex-1 container mx-auto px-4 py-16 md:py-24">
        <div className="max-w-5xl mx-auto">

          {/* Header */}
          <div className="mb-14">
            <p className="text-xs text-indigo-400 font-semibold uppercase tracking-widest mb-3">Contact</p>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Get in touch</h1>
            <p className="text-white/50 text-lg max-w-xl">
              Have questions, feedback, or need help with PreviewShield? Reach out directly.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-10">

            {/* Contact Info */}
            <div className="space-y-8">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-6 flex items-start gap-4">
                <div className="w-11 h-11 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0">
                  <Mail className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white text-lg mb-1">Email</h3>
                  <p className="text-white/40 text-sm mb-2">We aim to respond within 24 hours.</p>
                  <a href="mailto:appcloud41@gmail.com" className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
                    appcloud41@gmail.com
                  </a>
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-6 flex items-start gap-4">
                <div className="w-11 h-11 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center shrink-0">
                  <Github className="w-5 h-5 text-violet-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white text-lg mb-1">GitHub</h3>
                  <p className="text-white/40 text-sm mb-2">Open source contributions and issues.</p>
                  <a href="https://github.com/RanaAmmarAhmad" target="_blank" rel="noopener noreferrer" className="text-violet-400 hover:text-violet-300 font-medium transition-colors">
                    github.com/RanaAmmarAhmad
                  </a>
                </div>
              </div>
            </div>

            {/* Developer Card */}
            <div className="rounded-2xl border border-white/10 bg-white/5 p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                  <Code2 className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                  <p className="text-xs text-white/30 uppercase tracking-widest font-semibold">Developer</p>
                  <h2 className="text-white font-bold text-lg leading-tight">Rana Ammar Ahmad Khan</h2>
                </div>
              </div>

              <p className="text-white/50 text-sm leading-relaxed mb-6">
                AI & Web Development Expert specializing in building secure, professional-grade SaaS applications.
                PreviewShield was built to solve a real problem freelancers face every day.
              </p>

              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <span className="text-white/30 w-16 shrink-0">Expertise</span>
                  <span className="text-white/70">AI Engineering, Full-Stack Web Dev</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <span className="text-white/30 w-16 shrink-0">Email</span>
                  <a href="mailto:appcloud41@gmail.com" className="text-indigo-400 hover:text-indigo-300 transition-colors">appcloud41@gmail.com</a>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <span className="text-white/30 w-16 shrink-0">GitHub</span>
                  <a href="https://github.com/RanaAmmarAhmad" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-300 transition-colors">RanaAmmarAhmad</a>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-white/5">
                <a href="https://github.com/RanaAmmarAhmad" target="_blank" rel="noopener noreferrer"
                  className="w-full h-11 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-all flex items-center justify-center gap-2">
                  <Github className="w-4 h-4" />
                  View GitHub Profile
                </a>
              </div>
            </div>

          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
