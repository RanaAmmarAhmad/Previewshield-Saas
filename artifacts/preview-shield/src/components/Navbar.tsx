import { Link, useLocation } from "wouter";
import { Menu, X, BarChart2, User, Check, Pencil } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { LogoFull } from "@/components/Logo";

const LS_KEY = "ps_username";

function UsernameWidget() {
  const [name, setName] = useState(() => localStorage.getItem(LS_KEY) || "");
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(name);
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => { if (editing) inputRef.current?.focus(); }, [editing]);
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) { setEditing(false); setDraft(name); }
    };
    if (editing) document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [editing, name]);

  const save = () => {
    const t = draft.trim();
    if (t) { localStorage.setItem(LS_KEY, t); setName(t); }
    setEditing(false);
  };

  return (
    <div ref={wrapRef} className="relative">
      {!editing ? (
        <button onClick={() => { setDraft(name); setEditing(true); }}
          className="flex items-center gap-2 h-8 px-3 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 transition-colors text-sm text-white/70 hover:text-white"
          title="Set your display name">
          <User className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
          <span className="max-w-[90px] truncate font-medium">{name || "Set name"}</span>
          <Pencil className="w-3 h-3 text-white/30 shrink-0" />
        </button>
      ) : (
        <div className="flex items-center gap-1.5">
          <input ref={inputRef} value={draft} onChange={e => setDraft(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") save(); if (e.key === "Escape") { setEditing(false); setDraft(name); } }}
            placeholder="Your name" autoComplete="off"
            className="h-8 w-32 rounded-md bg-white/10 border border-white/20 text-white text-sm px-2 outline-none focus:border-indigo-400 placeholder-white/30" />
          <button onClick={save} className="w-8 h-8 rounded-md bg-indigo-600 hover:bg-indigo-500 flex items-center justify-center text-white">
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
    <header className="sticky top-0 z-50 w-full border-b border-white/5 bg-[#06081a]/90 backdrop-blur-md">
      <div className="container mx-auto px-4 md:px-6 h-16 flex items-center justify-between gap-4">
        <Link href="/" className="shrink-0">
          <LogoFull dark />
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.path}
              className={`text-sm font-medium transition-colors flex items-center gap-1.5 ${
                location === link.path ? "text-white" : "text-white/50 hover:text-white"
              }`}
            >
              {link.name === "Dashboard" && <BarChart2 className="w-3.5 h-3.5 text-indigo-400" />}
              {link.name}
            </Link>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <UsernameWidget />
          <Link href="/share">
            <button className="h-9 px-5 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-all shadow-lg shadow-indigo-500/30">
              Share File
            </button>
          </Link>
        </div>

        <button className="md:hidden p-2 text-white/70 hover:text-white" onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {isOpen && (
        <div className="md:hidden border-b border-white/5 bg-[#06081a]">
          <div className="container mx-auto px-4 py-4 flex flex-col gap-3">
            {navLinks.map((link) => (
              <Link key={link.name} href={link.path} onClick={() => setIsOpen(false)}
                className={`text-sm font-medium p-2 rounded-md flex items-center gap-2 ${
                  location === link.path ? "bg-white/10 text-white" : "text-white/50 hover:text-white"
                }`}>
                {link.name === "Dashboard" && <BarChart2 className="w-4 h-4" />}
                {link.name}
              </Link>
            ))}
            <div className="pt-2 border-t border-white/10">
              <p className="text-xs text-white/30 mb-2 font-medium">Your profile name</p>
              <UsernameWidget />
            </div>
            <Link href="/share" onClick={() => setIsOpen(false)}>
              <button className="w-full h-10 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold mt-1">
                Share File
              </button>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
