import { Link } from "wouter";
import { Twitter, Github, Linkedin } from "lucide-react";
import { LogoFull } from "@/components/Logo";

export function Footer() {
  return (
    <footer className="border-t bg-slate-50 dark:bg-slate-900/50 py-12 mt-20">
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <Link href="/" className="mb-4 inline-block">
              <LogoFull />
            </Link>
            <p className="text-muted-foreground text-sm max-w-sm">
              The professional layer between your work and untrusting clients. Share previews securely, track visits, and protect your livelihood.
            </p>
            <div className="flex items-center gap-4 mt-6">
              <button className="text-muted-foreground hover:text-indigo-500 transition-colors">
                <Twitter className="w-5 h-5" />
              </button>
              <button className="text-muted-foreground hover:text-indigo-500 transition-colors">
                <Github className="w-5 h-5" />
              </button>
              <button className="text-muted-foreground hover:text-indigo-500 transition-colors">
                <Linkedin className="w-5 h-5" />
              </button>
            </div>
          </div>
          
          <div>
            <h3 className="font-semibold mb-4">Product</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/how-it-works" className="text-sm text-muted-foreground hover:text-indigo-500">
                  How It Works
                </Link>
              </li>
              <li>
                <Link href="/share" className="text-sm text-muted-foreground hover:text-indigo-500">
                  Share a File
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-sm text-muted-foreground hover:text-indigo-500">
                  About Us
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Legal</h3>
            <ul className="space-y-3">
              <li>
                <Link href="#" className="text-sm text-muted-foreground hover:text-indigo-500">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="#" className="text-sm text-muted-foreground hover:text-indigo-500">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-sm text-muted-foreground hover:text-indigo-500">
                  Contact
                </Link>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="border-t mt-12 pt-8 flex flex-col md:flex-row items-center justify-between text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} PreviewShield. All rights reserved.</p>
          <p className="mt-2 md:mt-0">Crafted for independent professionals.</p>
        </div>
      </div>
    </footer>
  );
}
