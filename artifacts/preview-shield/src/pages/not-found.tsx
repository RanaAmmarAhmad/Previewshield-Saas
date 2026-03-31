import { Link } from "wouter";
import { LogoIcon } from "@/components/Logo";
import { Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center" style={{ background: "#06081a" }}>
      <div className="text-center px-4">
        <div className="flex justify-center mb-6">
          <LogoIcon size={48} />
        </div>
        <h1 className="text-7xl font-black text-white mb-4">404</h1>
        <p className="text-xl font-semibold text-white mb-2">Page not found</p>
        <p className="text-white/40 text-sm mb-8 max-w-xs mx-auto">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link href="/">
          <button className="inline-flex items-center gap-2 h-11 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-all shadow-lg shadow-indigo-500/20">
            <Home className="w-4 h-4" />
            Back to Home
          </button>
        </Link>
      </div>
    </div>
  );
}
