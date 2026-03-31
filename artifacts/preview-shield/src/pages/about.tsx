import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ShieldCheck, Eye, Zap, Code2, Github } from "lucide-react";

export default function About() {
  return (
    <div className="flex flex-col min-h-screen" style={{ background: "#06081a", color: "#fff" }}>
      <Navbar />

      <main className="flex-1">

        {/* Hero */}
        <section className="pt-24 pb-16 relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute left-1/2 -translate-x-1/2 top-0 w-[600px] h-[300px] bg-indigo-700/15 rounded-full blur-[100px]" />
          </div>
          <div className="container mx-auto px-4 md:px-6 max-w-3xl relative">
            <p className="text-xs text-indigo-400 font-semibold uppercase tracking-widest mb-4">About</p>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">Our Mission</h1>
            <p className="text-xl text-white/50 leading-relaxed">
              We believe independent professionals deserve the same security and leverage as large agencies.
              PreviewShield was built to fix the power imbalance in freelance client relationships.
            </p>
          </div>
        </section>

        {/* Problem / Solution */}
        <section className="py-16" style={{ background: "#080b1e" }}>
          <div className="container mx-auto px-4 md:px-6 max-w-3xl">
            <div className="space-y-14">
              <div>
                <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                  <span className="w-8 h-8 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 text-lg">!</span>
                  The Problem
                </h2>
                <p className="text-white/50 leading-relaxed mb-4">
                  Every freelancer knows the feeling. You finish the work, send over the files for review, and... silence.
                  The client ghosts you. Days later, you see your "draft" design live on their website. You sent the
                  unprotected file, and they took it without paying.
                </p>
                <p className="text-white/50 leading-relaxed">
                  Watermarking manually takes time. Setting up complex portals is overkill. You need a fast, professional
                  way to say "here is the work to review, but it's not yours until the invoice is paid."
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                  <ShieldCheck className="w-8 h-8 text-indigo-400" />
                  The Solution
                </h2>
                <p className="text-white/50 leading-relaxed mb-6">
                  PreviewShield acts as the professional barrier. By presenting your work in our secure viewer, you accomplish
                  three things instantly:
                </p>
                <div className="grid sm:grid-cols-3 gap-4">
                  {[
                    { icon: <ShieldCheck className="w-5 h-5 text-indigo-400" />, title: "Security", desc: "Files are served via expiring encrypted tokens. No direct downloads possible." },
                    { icon: <Eye className="w-5 h-5 text-violet-400" />, title: "Tracking", desc: "Know exactly when they view it — time, IP, and name all logged." },
                    { icon: <Zap className="w-5 h-5 text-amber-400" />, title: "Professionalism", desc: "A secure link looks infinitely better than a ZIP attachment." },
                  ].map((item) => (
                    <div key={item.title} className="rounded-2xl border border-white/10 bg-white/5 p-5">
                      <div className="mb-3">{item.icon}</div>
                      <h3 className="font-semibold text-white mb-2">{item.title}</h3>
                      <p className="text-white/40 text-sm leading-relaxed">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-white mb-4">Our Vision</h2>
                <p className="text-white/50 leading-relaxed">
                  We want to be the default layer between creative work and final delivery. We envision a world where
                  freelance theft is technically impossible, allowing creatives to focus on doing their best work instead
                  of worrying about getting paid.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Developer */}
        <section className="py-16" style={{ background: "#06081a" }}>
          <div className="container mx-auto px-4 md:px-6 max-w-3xl">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-8">
              <div className="flex items-start gap-5">
                <div className="w-14 h-14 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center shrink-0">
                  <Code2 className="w-7 h-7 text-indigo-400" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-white/30 uppercase tracking-widest font-semibold mb-1">Built by</p>
                  <h3 className="text-xl font-bold text-white mb-1">Rana Ammar Ahmad Khan</h3>
                  <p className="text-indigo-400 text-sm font-medium mb-4">AI & Web Development Expert</p>
                  <p className="text-white/40 text-sm leading-relaxed mb-5">
                    Specializing in building secure, professional-grade tools that solve real problems for independent professionals and creative agencies.
                  </p>
                  <a href="https://github.com/RanaAmmarAhmad" target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 h-9 px-4 rounded-lg bg-white/10 hover:bg-white/15 text-white text-sm font-medium transition-colors">
                    <Github className="w-4 h-4" />
                    github.com/RanaAmmarAhmad
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

      </main>

      <Footer />
    </div>
  );
}
