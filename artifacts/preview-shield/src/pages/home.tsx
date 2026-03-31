import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Shield, Eye, Lock, Zap, CheckCircle2 } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative pt-24 pb-32 overflow-hidden">
          <div className="absolute inset-0 bg-slate-50 dark:bg-slate-900 -z-10" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-100/40 via-transparent to-transparent dark:from-indigo-900/20 -z-10" />
          
          <div className="container mx-auto px-4 md:px-6 text-center max-w-4xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-100/50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 text-sm font-medium mb-8">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
              </span>
              Protect your creative work
            </div>
            
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-slate-900 dark:text-white mb-8">
              Send secure previews without risking <span className="text-gradient-accent">file theft.</span>
            </h1>
            
            <p className="text-xl text-slate-600 dark:text-slate-400 mb-10 max-w-2xl mx-auto leading-relaxed">
              The professional layer between your work and untrusting clients. Share watermarked, view-only files that can't be downloaded, copied, or stolen.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/share">
                <Button size="lg" className="w-full sm:w-auto h-14 px-8 text-base bg-gradient-accent text-white border-0 hover:opacity-90 shadow-xl shadow-indigo-500/20">
                  Create a Secure Preview
                </Button>
              </Link>
              <Link href="/how-it-works">
                <Button size="lg" variant="outline" className="w-full sm:w-auto h-14 px-8 text-base bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800">
                  See How It Works
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-24 bg-white dark:bg-slate-950">
          <div className="container mx-auto px-4 md:px-6">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-3xl font-bold mb-4">Everything you need to share safely</h2>
              <p className="text-muted-foreground text-lg">We've built the ultimate safeguard for your design, video, and document deliverables.</p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {[
                {
                  icon: <Shield className="w-6 h-6 text-indigo-500" />,
                  title: "Copy Protection",
                  desc: "Right-click and drag-to-save are disabled. Your files stay exactly where they belong — in the browser."
                },
                {
                  icon: <Eye className="w-6 h-6 text-indigo-500" />,
                  title: "Dynamic Watermarks",
                  desc: "Your name is overlaid subtly across the content, deterring screenshots and unauthorized use."
                },
                {
                  icon: <Lock className="w-6 h-6 text-indigo-500" />,
                  title: "Password Gates",
                  desc: "Add an extra layer of security with password protection to ensure only the intended client views your work."
                }
              ].map((feat, i) => (
                <div key={i} className="p-8 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 transition-all hover:shadow-lg hover:-translate-y-1">
                  <div className="w-12 h-12 rounded-xl bg-indigo-100 dark:bg-indigo-500/10 flex items-center justify-center mb-6">
                    {feat.icon}
                  </div>
                  <h3 className="text-xl font-semibold mb-3">{feat.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{feat.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Use Cases */}
        <section className="py-24 bg-slate-50 dark:bg-slate-900">
          <div className="container mx-auto px-4 md:px-6">
            <div className="grid lg:grid-cols-2 gap-16 items-center max-w-6xl mx-auto">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold mb-6">Built for creative professionals</h2>
                <p className="text-lg text-muted-foreground mb-8">
                  Whether you're sending a brand identity, a video cut, or a drafted proposal, PreviewShield ensures you get paid before handing over the final assets.
                </p>
                
                <ul className="space-y-6">
                  {[
                    "Designers sharing logos and brand assets",
                    "Video editors sending rough cuts",
                    "Copywriters pitching article drafts",
                    "Developers showcasing UI mockups"
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <CheckCircle2 className="w-6 h-6 text-indigo-500 shrink-0" />
                      <span className="text-slate-700 dark:text-slate-300 font-medium">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-3xl blur-3xl opacity-20 dark:opacity-30"></div>
                <div className="relative rounded-3xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 p-2 shadow-2xl">
                  <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 p-8 flex flex-col items-center justify-center aspect-video text-center overflow-hidden relative">
                    {/* Mockup UI */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-10">
                      <p className="text-4xl font-black rotate-[-30deg] tracking-widest text-slate-900 dark:text-white">JOHN DOE • JOHN DOE</p>
                    </div>
                    <div className="relative z-10 w-full max-w-sm rounded-xl overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950">
                      <div className="h-8 bg-slate-100 dark:bg-slate-800 flex items-center px-4 gap-2 border-b border-slate-200 dark:border-slate-700">
                        <div className="w-3 h-3 rounded-full bg-red-400"></div>
                        <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                        <div className="w-3 h-3 rounded-full bg-green-400"></div>
                      </div>
                      <div className="p-8 flex items-center justify-center bg-slate-50 dark:bg-slate-900 h-48">
                        <Zap className="w-16 h-16 text-indigo-400 opacity-50" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-32">
          <div className="container mx-auto px-4 md:px-6 text-center max-w-3xl">
            <h2 className="text-4xl font-bold mb-6">Stop giving away your work for free.</h2>
            <p className="text-xl text-muted-foreground mb-10">
              Join thousands of freelancers who use PreviewShield to establish boundaries, build trust, and secure their payments.
            </p>
            <Link href="/share">
              <Button size="lg" className="h-14 px-10 text-lg bg-gradient-accent text-white border-0 shadow-lg hover:shadow-indigo-500/25 transition-all hover:-translate-y-1">
                Start Sharing Securely
              </Button>
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
