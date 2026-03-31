import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Upload, Link as LinkIcon, Eye, BarChart2 } from "lucide-react";
import { Link } from "wouter";

export default function HowItWorks() {
  const steps = [
    {
      num: "01",
      icon: <Upload className="w-7 h-7 text-indigo-400" />,
      title: "Upload Your Work",
      desc: "Upload any image, PDF, or video file up to 100 MB. You can also link an external URL. Everything is stored securely and never exposed to clients directly.",
      color: "bg-indigo-500/10 border-indigo-500/20",
    },
    {
      num: "02",
      icon: <LinkIcon className="w-7 h-7 text-violet-400" />,
      title: "Generate Secure Link",
      desc: "Set an optional password, choose when the link expires (1 hour to never), and click generate. You receive a unique preview link and your private Tracking UID.",
      color: "bg-violet-500/10 border-violet-500/20",
    },
    {
      num: "03",
      icon: <Eye className="w-7 h-7 text-blue-400" />,
      title: "Client Views Securely",
      desc: "The client enters their name, passes the optional password, and sees your work in a secure viewer. Files are served via short-lived encrypted tokens — no direct downloads.",
      color: "bg-blue-500/10 border-blue-500/20",
    },
    {
      num: "04",
      icon: <BarChart2 className="w-7 h-7 text-green-400" />,
      title: "Track Every View",
      desc: "Go to your Dashboard and enter your Tracking UID to see who viewed your file — their name, IP address, and exact timestamp. No excuses: you know when they looked.",
      color: "bg-green-500/10 border-green-500/20",
    },
  ];

  return (
    <div className="flex flex-col min-h-screen" style={{ background: "#06081a", color: "#fff" }}>
      <Navbar />

      <main className="flex-1">

        {/* Header */}
        <section className="pt-24 pb-16 relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute left-1/2 -translate-x-1/2 top-0 w-[700px] h-[300px] bg-indigo-700/15 rounded-full blur-[120px]" />
          </div>
          <div className="container mx-auto px-4 md:px-6 text-center max-w-3xl relative">
            <p className="text-xs text-indigo-400 font-semibold uppercase tracking-widest mb-4">How It Works</p>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">Four simple steps</h1>
            <p className="text-xl text-white/50">
              A streamlined workflow designed to keep your creative assets safe while looking incredibly professional to your clients.
            </p>
          </div>
        </section>

        {/* Steps */}
        <section className="py-16 pb-24" style={{ background: "#080b1e" }}>
          <div className="container mx-auto px-4 md:px-6 max-w-5xl">
            <div className="grid md:grid-cols-2 gap-6">
              {steps.map((step) => (
                <div key={step.num} className="rounded-2xl border border-white/10 bg-white/5 p-8 hover:bg-white/[0.07] transition-colors">
                  <div className="flex items-start gap-4 mb-5">
                    <div className={`w-14 h-14 rounded-2xl border flex items-center justify-center shrink-0 ${step.color}`}>
                      {step.icon}
                    </div>
                    <span className="text-5xl font-black text-white/5 leading-none mt-1">{step.num}</span>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">{step.title}</h3>
                  <p className="text-white/50 leading-relaxed">{step.desc}</p>
                </div>
              ))}
            </div>

            <div className="mt-16 text-center">
              <Link href="/share">
                <button className="h-14 px-10 text-lg rounded-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition-all shadow-xl shadow-indigo-500/20">
                  Try it for free
                </button>
              </Link>
            </div>
          </div>
        </section>

      </main>

      <Footer />
    </div>
  );
}
