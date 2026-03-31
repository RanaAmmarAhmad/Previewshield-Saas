import { Link, useLocation } from "wouter";
import { Menu, X, BarChart2, User, Check, Pencil, History, Crown, FileImage, FileText, Film, Clock, ExternalLink, Trash2, AlertTriangle, Download, ShieldCheck, Lock } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { LogoFull } from "@/components/Logo";

const LS_KEY = "ps_username";
const LS_HISTORY_KEY = "ps_file_history";

export type FileHistoryItem = {
  id: string;
  ownerToken: string;
  fileName: string;
  fileType: "image" | "pdf" | "video";
  createdAt: string;
};

export function saveFileHistory(item: Omit<FileHistoryItem, "createdAt">) {
  const raw = localStorage.getItem(LS_HISTORY_KEY);
  const list: FileHistoryItem[] = raw ? JSON.parse(raw) : [];
  const newItem: FileHistoryItem = { ...item, createdAt: new Date().toISOString() };
  const updated = [newItem, ...list].slice(0, 20);
  localStorage.setItem(LS_HISTORY_KEY, JSON.stringify(updated));
}

function FileTypeIcon({ type }: { type: string }) {
  if (type === "pdf") return <FileText className="w-3 h-3 text-red-400" />;
  if (type === "video") return <Film className="w-3 h-3 text-blue-400" />;
  return <FileImage className="w-3 h-3 text-indigo-400" />;
}

function relTime(d: string) {
  const diff = Date.now() - new Date(d).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function HistoryPanel({ onClose }: { onClose: () => void }) {
  const [history, setHistory] = useState<FileHistoryItem[]>(() => {
    const raw = localStorage.getItem(LS_HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  });

  const clearAll = () => {
    if (window.confirm("Clear all file history? This only removes local records, not the actual previews.")) {
      localStorage.removeItem(LS_HISTORY_KEY);
      setHistory([]);
    }
  };

  const downloadCSV = () => {
    if (history.length === 0) return;
    const rows = [
      ["File Name", "File Type", "Tracking ID", "Owner Token", "Created At"],
      ...history.map(h => [
        `"${h.fileName.replace(/"/g, '""')}"`,
        h.fileType,
        h.id,
        h.ownerToken,
        new Date(h.createdAt).toLocaleString(),
      ]),
    ];
    const csv = rows.map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `previewshield-history-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const removeItem = (id: string) => {
    const updated = history.filter(h => h.id !== id);
    localStorage.setItem(LS_HISTORY_KEY, JSON.stringify(updated));
    setHistory(updated);
  };

  return (
    <div className="absolute right-0 top-full mt-2 w-80 rounded-xl border border-white/10 bg-[#0d1025]/95 backdrop-blur-xl shadow-2xl shadow-black/40 z-50 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
        <div className="flex items-center gap-2">
          <History className="w-3.5 h-3.5 text-indigo-400" />
          <p className="text-xs font-semibold text-white">File History</p>
          {history.length > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-[9px] font-bold">{history.length}</span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          {history.length > 0 && (
            <>
              <button onClick={downloadCSV} title="Download tracking IDs as CSV"
                className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 text-indigo-400 text-[9px] font-semibold transition-colors">
                <Download className="w-2.5 h-2.5" />
                Export
              </button>
              <button onClick={clearAll} className="text-[10px] text-white/30 hover:text-red-400 transition-colors">Clear all</button>
            </>
          )}
          <button onClick={onClose} className="text-white/30 hover:text-white transition-colors">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {history.length === 0 ? (
        <div className="py-8 text-center">
          <History className="w-6 h-6 mx-auto mb-2 text-white/10" />
          <p className="text-xs text-white/30">No files shared yet.</p>
          <p className="text-[10px] text-white/20 mt-1">Share a file to see it here.</p>
        </div>
      ) : (
        <div className="max-h-72 overflow-y-auto divide-y divide-white/5">
          {history.map((item) => (
            <div key={item.id} className="flex items-center gap-2.5 px-3 py-2.5 hover:bg-white/4 group transition-colors">
              <div className="w-7 h-7 rounded-lg bg-white/5 border border-white/8 flex items-center justify-center shrink-0">
                <FileTypeIcon type={item.fileType} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-white/80 truncate">{item.fileName}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <Clock className="w-2.5 h-2.5 text-white/20" />
                  <span className="text-[9px] text-white/30">{relTime(item.createdAt)}</span>
                  <span className="text-[9px] text-white/15 font-mono truncate max-w-[70px]">{item.ownerToken.slice(0, 8)}…</span>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Link href={`/dashboard?token=${item.ownerToken}`} onClick={onClose}>
                  <button className="w-6 h-6 rounded-md bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 flex items-center justify-center text-indigo-400 transition-colors" title="View analytics">
                    <BarChart2 className="w-3 h-3" />
                  </button>
                </Link>
                <a href={`/preview/${item.id}`} target="_blank" rel="noopener noreferrer"
                  className="w-6 h-6 rounded-md bg-white/5 hover:bg-white/10 border border-white/8 flex items-center justify-center text-white/40 hover:text-white transition-colors" title="Open preview">
                  <ExternalLink className="w-3 h-3" />
                </a>
                <button onClick={() => removeItem(item.id)}
                  className="w-6 h-6 rounded-md bg-red-500/5 hover:bg-red-500/15 border border-red-500/10 hover:border-red-500/30 flex items-center justify-center text-white/20 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100" title="Remove from history">
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="px-4 py-2 border-t border-white/5">
        <Link href="/share" onClick={onClose}>
          <button className="w-full h-7 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/20 text-indigo-300 text-[10px] font-semibold transition-colors">
            + Share a new file
          </button>
        </Link>
      </div>
    </div>
  );
}

function UsernameWidget() {
  const [name, setName] = useState(() => localStorage.getItem(LS_KEY) || "");
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(name);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => { if (editing) inputRef.current?.focus(); }, [editing]);
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setEditing(false);
        setDraft(name);
        setShowDeleteConfirm(false);
      }
    };
    if (editing) document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [editing, name]);

  const save = () => {
    const t = draft.trim();
    if (t) { localStorage.setItem(LS_KEY, t); setName(t); }
    setEditing(false);
    setShowDeleteConfirm(false);
  };

  const deleteAll = () => {
    localStorage.removeItem(LS_KEY);
    localStorage.removeItem(LS_HISTORY_KEY);
    setName("");
    setDraft("");
    setEditing(false);
    setShowDeleteConfirm(false);
  };

  return (
    <div ref={wrapRef} className="relative">
      {!editing ? (
        <button onClick={() => { setDraft(name); setEditing(true); setShowDeleteConfirm(false); }}
          className="flex items-center gap-2 h-8 pl-2.5 pr-2 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 transition-colors text-sm text-white/70 hover:text-white"
          title="Set your display name">
          <User className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
          <span className="max-w-[80px] truncate font-medium text-xs">{name || "Set name"}</span>
          {name && (
            <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/20 text-[8px] font-bold text-amber-400 ml-0.5">
              <Crown className="w-2 h-2" />FREE
            </span>
          )}
          <Pencil className="w-3 h-3 text-white/30 shrink-0 ml-0.5" />
        </button>
      ) : (
        <div className="absolute right-0 top-full mt-2 w-64 rounded-xl border border-white/10 bg-[#0d1025]/95 backdrop-blur-xl shadow-2xl shadow-black/40 z-50 overflow-hidden">
          {/* Header */}
          <div className="px-4 py-3 border-b border-white/5">
            <p className="text-xs font-semibold text-white/70">Your display name</p>
          </div>

          {/* Name input */}
          <div className="px-4 pt-3 pb-2 flex items-center gap-2">
            <input ref={inputRef} value={draft} onChange={e => setDraft(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") save(); if (e.key === "Escape") { setEditing(false); setDraft(name); setShowDeleteConfirm(false); } }}
              placeholder="Your name" autoComplete="off"
              className="flex-1 h-8 rounded-md bg-white/10 border border-white/20 text-white text-xs px-2.5 outline-none focus:border-indigo-400 placeholder-white/30" />
            <button onClick={save} className="w-8 h-8 rounded-md bg-indigo-600 hover:bg-indigo-500 flex items-center justify-center text-white shrink-0" title="Save">
              <Check className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Delete all section */}
          <div className="px-4 pb-3">
            {!showDeleteConfirm ? (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="w-full flex items-center justify-center gap-1.5 h-7 rounded-lg border border-red-500/20 bg-red-500/5 hover:bg-red-500/15 hover:border-red-500/40 text-red-400/60 hover:text-red-400 transition-all text-[10px] font-semibold mt-1"
              >
                <Trash2 className="w-3 h-3" />
                Delete all information & files
              </button>
            ) : (
              <div className="mt-1 rounded-lg border border-red-500/30 bg-red-500/10 p-2.5">
                <div className="flex items-start gap-1.5 mb-2">
                  <AlertTriangle className="w-3 h-3 text-red-400 shrink-0 mt-0.5" />
                  <p className="text-[10px] text-red-300 leading-relaxed">This will delete your saved name and all file history from this browser. This cannot be undone.</p>
                </div>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="flex-1 h-6 rounded-md bg-white/5 hover:bg-white/10 border border-white/10 text-white/50 hover:text-white text-[10px] font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={deleteAll}
                    className="flex-1 h-6 rounded-md bg-red-600 hover:bg-red-500 text-white text-[10px] font-bold transition-colors"
                  >
                    Yes, delete all
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function Navbar() {
  const [location] = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const historyRef = useRef<HTMLDivElement>(null);
  const [historyCount, setHistoryCount] = useState(() => {
    const raw = localStorage.getItem(LS_HISTORY_KEY);
    return raw ? JSON.parse(raw).length : 0;
  });

  useEffect(() => {
    const update = () => {
      const raw = localStorage.getItem(LS_HISTORY_KEY);
      setHistoryCount(raw ? JSON.parse(raw).length : 0);
    };
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (historyRef.current && !historyRef.current.contains(e.target as Node)) {
        setHistoryOpen(false);
      }
    };
    if (historyOpen) document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [historyOpen]);

  const navLinks = [
    { name: "Home", path: "/" },
    { name: "Dashboard", path: "/dashboard" },
    { name: "How It Works", path: "/how-it-works" },
    { name: "Pricing", path: "/#pricing" },
    { name: "About", path: "/about" },
  ];

  const bannerMsg = "🔒 Your username and file history are stored only in your browser — fully private. Files and credentials are securely stored on our server.";
  const bannerItems = Array(6).fill(bannerMsg);

  return (
    <header className="sticky top-0 z-50 w-full bg-[#06081a]/90 backdrop-blur-md">
      {/* Scrolling security banner */}
      <div className="w-full overflow-hidden border-b border-white/5 bg-gradient-to-r from-indigo-950/60 via-[#0a0c20]/80 to-indigo-950/60 py-1.5">
        <div className="flex whitespace-nowrap" style={{ animation: "marquee 40s linear infinite" }}>
          {bannerItems.map((msg, i) => (
            <span key={i} className="inline-flex items-center gap-2 px-8 text-[10px] text-white/40 font-medium tracking-wide shrink-0">
              <ShieldCheck className="w-3 h-3 text-indigo-400/60 shrink-0" />
              {msg}
              <Lock className="w-2.5 h-2.5 text-green-400/50 shrink-0" />
            </span>
          ))}
        </div>
      </div>
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
      <div className="border-b border-white/5">
      <div className="container mx-auto px-4 md:px-6 h-16 flex items-center justify-between gap-4">
        <Link href="/" className="shrink-0">
          <LogoFull dark />
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          {navLinks.map((link) =>
            link.path.startsWith("/#") ? (
              <a key={link.name} href={link.path}
                className="text-sm font-medium transition-colors text-white/50 hover:text-white">
                {link.name}
              </a>
            ) : (
              <Link key={link.name} href={link.path}
                className={`text-sm font-medium transition-colors flex items-center gap-1.5 ${location === link.path ? "text-white" : "text-white/50 hover:text-white"}`}>
                {link.name === "Dashboard" && <BarChart2 className="w-3.5 h-3.5 text-indigo-400" />}
                {link.name}
              </Link>
            )
          )}
        </nav>

        <div className="hidden md:flex items-center gap-2">
          {/* History button */}
          <div ref={historyRef} className="relative">
            <button
              onClick={() => setHistoryOpen(!historyOpen)}
              className={`flex items-center gap-1.5 h-8 px-2.5 rounded-lg border transition-all text-xs font-medium ${historyOpen ? "border-indigo-500/40 bg-indigo-500/10 text-indigo-300" : "border-white/10 bg-white/5 hover:bg-white/10 text-white/50 hover:text-white"}`}
              title="File history"
            >
              <History className="w-3.5 h-3.5" />
              <span>History</span>
              {historyCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-indigo-600 text-white text-[9px] font-bold flex items-center justify-center">
                  {historyCount > 9 ? "9+" : historyCount}
                </span>
              )}
            </button>
            {historyOpen && <HistoryPanel onClose={() => setHistoryOpen(false)} />}
          </div>

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

      </div>

      {isOpen && (
        <div className="md:hidden border-b border-white/5 bg-[#06081a]">
          <div className="container mx-auto px-4 py-4 flex flex-col gap-3">
            {navLinks.map((link) => (
              link.path.startsWith("/#") ? (
                <a key={link.name} href={link.path} onClick={() => setIsOpen(false)}
                  className="text-sm font-medium p-2 rounded-md text-white/50 hover:text-white">
                  {link.name}
                </a>
              ) : (
                <Link key={link.name} href={link.path} onClick={() => setIsOpen(false)}
                  className={`text-sm font-medium p-2 rounded-md flex items-center gap-2 ${location === link.path ? "bg-white/10 text-white" : "text-white/50 hover:text-white"}`}>
                  {link.name === "Dashboard" && <BarChart2 className="w-4 h-4" />}
                  {link.name}
                </Link>
              )
            ))}

            {/* Mobile history link */}
            <Link href="/dashboard" onClick={() => setIsOpen(false)}
              className="text-sm font-medium p-2 rounded-md flex items-center gap-2 text-white/50 hover:text-white">
              <History className="w-4 h-4 text-indigo-400" />
              History
              {historyCount > 0 && <span className="ml-auto px-1.5 py-0.5 rounded-full bg-indigo-600 text-white text-[9px] font-bold">{historyCount}</span>}
            </Link>

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
