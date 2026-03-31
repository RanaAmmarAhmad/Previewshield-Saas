import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Upload, Link as LinkIcon, Eye, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function HowItWorks() {
  const steps = [
    {
      icon: <Upload className="w-8 h-8 text-indigo-500" />,
      title: "1. Upload Your Work",
      desc: "Connect your design, document, or video file. We handle the formatting to ensure it displays perfectly across all devices without requiring the client to download anything."
    },
    {
      icon: <LinkIcon className="w-8 h-8 text-indigo-500" />,
      title: "2. Generate Secure Link",
      desc: "Set a password, add your client's name, and generate a unique, untraceable link. No sign-up required for your clients."
    },
    {
      icon: <Eye className="w-8 h-8 text-indigo-500" />,
      title: "3. Client Views Securely",
      desc: "The client opens the link in our secure viewer. Right-click, drag-to-save, and easy copying are disabled. Your name is subtly watermarked across the work."
    },
    {
      icon: <Bell className="w-8 h-8 text-indigo-500" />,
      title: "4. Get Notified",
      desc: "Track exactly when the client views the file. Know instantly if they've seen your work, eliminating the 'I never got your email' excuse."
    }
  ];

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      
      <main className="flex-1">
        <section className="pt-24 pb-16 bg-slate-50 dark:bg-slate-950">
          <div className="container mx-auto px-4 md:px-6 text-center max-w-3xl">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">How PreviewShield Works</h1>
            <p className="text-xl text-muted-foreground">
              A streamlined workflow designed to keep your creative assets safe while looking incredibly professional to your clients.
            </p>
          </div>
        </section>

        <section className="py-20">
          <div className="container mx-auto px-4 md:px-6 max-w-5xl">
            <div className="grid md:grid-cols-2 gap-12 lg:gap-20">
              {steps.map((step, idx) => (
                <div key={idx} className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 to-transparent dark:from-indigo-950/50 dark:to-transparent rounded-3xl -z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <div className="p-8 border border-transparent group-hover:border-indigo-100 dark:group-hover:border-indigo-900/50 rounded-3xl transition-all">
                    <div className="w-16 h-16 bg-white dark:bg-slate-900 shadow-sm border border-slate-100 dark:border-slate-800 rounded-2xl flex items-center justify-center mb-6">
                      {step.icon}
                    </div>
                    <h3 className="text-2xl font-semibold mb-4">{step.title}</h3>
                    <p className="text-muted-foreground leading-relaxed text-lg">
                      {step.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-24 text-center">
              <Link href="/share">
                <Button size="lg" className="h-14 px-10 text-lg bg-gradient-accent text-white border-0 shadow-lg hover:shadow-indigo-500/25">
                  Try it now
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
