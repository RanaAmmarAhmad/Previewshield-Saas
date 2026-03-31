import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Mail, MessageSquare } from "lucide-react";

export default function Contact() {
  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-16 md:py-24">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-16">
          
          <div>
            <h1 className="text-4xl font-bold mb-6">Get in touch</h1>
            <p className="text-lg text-muted-foreground mb-10">
              Have questions about PreviewShield? Need help setting up your secure links? We're here to help independent professionals protect their work.
            </p>
            
            <div className="space-y-8">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full flex items-center justify-center shrink-0">
                  <Mail className="w-5 h-5 text-indigo-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Email us</h3>
                  <p className="text-muted-foreground mb-1">We aim to respond within 24 hours.</p>
                  <a href="mailto:support@previewshield.com" className="text-indigo-600 dark:text-indigo-400 font-medium hover:underline">
                    support@previewshield.com
                  </a>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full flex items-center justify-center shrink-0">
                  <MessageSquare className="w-5 h-5 text-indigo-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Feedback & Feature Requests</h3>
                  <p className="text-muted-foreground mb-1">Tell us how we can improve.</p>
                  <a href="#" className="text-indigo-600 dark:text-indigo-400 font-medium hover:underline">
                    Submit feedback
                  </a>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800">
            <h2 className="text-2xl font-semibold mb-6">Send a message</h2>
            <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" placeholder="John Doe" className="bg-slate-50 dark:bg-slate-950 h-12" />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email address</Label>
                <Input id="email" type="email" placeholder="john@example.com" className="bg-slate-50 dark:bg-slate-950 h-12" />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="message">Message</Label>
                <Textarea 
                  id="message" 
                  placeholder="How can we help you?" 
                  className="bg-slate-50 dark:bg-slate-950 min-h-[150px] resize-none" 
                />
              </div>
              
              <Button type="submit" className="w-full h-12 text-base bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-200">
                Send Message
              </Button>
            </form>
          </div>
          
        </div>
      </main>

      <Footer />
    </div>
  );
}
