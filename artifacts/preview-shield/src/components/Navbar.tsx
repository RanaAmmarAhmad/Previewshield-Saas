import { Link, useLocation } from "wouter";
import { Menu, X, ShieldCheck, BarChart2, User, Check, Pencil } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const LS_KEY = "ps_username";

function UsernameWidget() {
  const [name, setName] = useState(() => localStorage.getItem(LS_KEY) || "");
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(name);
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setEditing(false);
        setDraft(name);
      }
    };
    if (editing) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [editing, name]);

  const save = () => {
    const trimmed = draft.trim();
    if (trimmed) {
      localStorage.setItem(LS_KEY, trimmed);
      setName(trimmed);
    }
    setEditing(false);
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") save();
    if (e.key === "Escape") { setEditing(false); setDraft(name); }
  };

  return (
    <div ref={wrapRef} className="relative">
      {!editing ? (
        <button
          onClick={() => { setDraft(name); setEditing(true); }}
          className="flex items-center gap-2 h-8 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-sm"
          title="Set your name"
        >
          <User className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
          <span className="max-w-[100px] truncate font-medium text-slate-700 dark:text-slate-300">
            {name || "Set name"}
          </span>
          <Pencil className="w-3 h-3 text-slate-400 shrink-0" />
        </button>
      ) : (
        <div className="flex items-center gap-1.5">
          <Input
            ref={inputRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Your name"
            className="h-8 w-36 text-sm py-0 focus-visible:ring-indigo-500"
          />
          <button
            onClick={save}
            className="w-8 h-8 rounded-md bg-indigo-600 hover:bg-indigo-700 flex items-center justify-center text-white transition-colors"
          >
            <Check className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}

export function Navbar() {
  const [location] = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const navLinks = [
    { name: "Home", path: "/" },
    { name: "Dashboard", path: "/dashboard" },
    { name: "How It Works", path: "/how-it-works" },
    { name: "About", path: "/about" },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md">
      <div className="container mx-auto px-4 md:px-6 h-16 flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <ShieldCheck className="w-6 h-6 text-indigo-500" />
          <span className="font-semibold text-xl tracking-tight">PreviewShield</span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.path}
              className={`text-sm font-medium transition-colors hover:text-indigo-500 flex items-center gap-1.5 ${
                location === link.path ? "text-indigo-600 dark:text-indigo-400" : "text-muted-foreground"
              }`}
            >
              {link.name === "Dashboard" && <BarChart2 className="w-3.5 h-3.5" />}
              {link.name}
            </Link>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <UsernameWidget />
          <Link href="/share">
            <Button className="bg-gradient-accent text-white border-0 hover:opacity-90 transition-opacity">
              Share File
            </Button>
          </Link>
        </div>

        {/* Mobile Menu Toggle */}
        <button
          className="md:hidden p-2 text-foreground"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Nav */}
      {isOpen && (
        <div className="md:hidden border-b bg-background">
          <div className="container mx-auto px-4 py-4 flex flex-col gap-3">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.path}
                onClick={() => setIsOpen(false)}
                className={`text-sm font-medium p-2 rounded-md flex items-center gap-2 ${
                  location === link.path
                    ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400"
                    : "text-muted-foreground"
                }`}
              >
                {link.name === "Dashboard" && <BarChart2 className="w-4 h-4" />}
                {link.name}
              </Link>
            ))}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <p className="text-xs text-muted-foreground mb-2 font-medium">Your profile name</p>
              <UsernameWidget />
            </div>
            <Link href="/share" onClick={() => setIsOpen(false)}>
              <Button className="w-full bg-gradient-accent text-white border-0 mt-1">
                Share File
              </Button>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
