import { useState } from "react";
import { useLocation } from "wouter";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import {
  BarChart2, Eye, Users, Clock, Globe, Search, Loader2, AlertCircle,
  User, Trash2, ExternalLink, Copy, Check, ShieldCheck, FileText, Film, MapPin
} from "lucide-react";

const API_BASE = "/api";

function formatDate(d: string | Date) {
  return new Date(d).toLocaleString(undefined, {
    month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function relativeTime(d: string | Date) {
  const diff = Date.now() - new Date(d).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function FileTypeIcon({ type }: { type: string }) {
  if (type === "pdf") return <FileText className="w-3.5 h-3.5 text-red-400" />;
  if (type === "video") return <Film className="w-3.5 h-3.5 text-blue-400" />;
  return <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />;
}

function locationLabel(v: { city: string | null; region: string | null; country: string | null }) {
  const parts = [v.city, v.region, v.country].filter(Boolean);
  return parts.length ? parts.join(", ") : null;
}

type Visit = {
  id: string;
  clientName: string | null;
  ipAddress: string | null;
  city: string | null;
  region: string | null;
  country: string | null;
  visitedAt: string;
};

type DashboardData = {
  previewId: string;
  freelancerName: string;
  agencyName: string | null;
  fileName: string;
  fileType: string;
  hasPassword: boolean;
  createdAt: string;
  expiresAt: string | null;
  previewUrl: string;
  totalVisits: number;
  uniqueIps: number;
  lastVisitAt: string | null;
  recentVisits: Visit[];
};

export default function Dashboard() {
  const [, navigate] = useLocation();
  const searchParams = new URLSearchParams(window.location.search);
  const urlToken = searchParams.get("token") || "";

  const [ownerToken, setOwnerToken] = useState(urlToken);
  const [queryToken, setQueryToken] = useState(urlToken);
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<{ code: string; message: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleted, setDeleted] = useState(false);

  const fetchData = async (token: string) => {
    setLoading(true);
    setError(null);
    setData(null);
    try {
      const res = await fetch(`${API_BASE}/previews/dashboard?ownerToken=${encodeURIComponent(token)}`);
      const json = await res.json();
      if (!res.ok) throw { code: json.error, message: json.message };
      setData(json);
    } catch (e: any) {
      setError({ code: e.code || "error", message: e.message || "Something went wrong" });
    } finally {
      setLoading(false);
    }
  };

  const handleLookup = (e: React.FormEvent) => {
    e.preventDefault();
    const token = ownerToken.trim();
    if (!token) return;
    setQueryToken(token);
    setDeleted(false);
    fetchData(token);
    navigate(`/dashboard?token=${encodeURIComponent(token)}`, { replace: true });
  };

  useState(() => { if (urlToken) fetchData(urlToken); });

  const handleDelete = async () => {
    if (!data || !window.confirm("Permanently delete this preview and all visitor data?")) return;
    setDeleting(true);
    try {
      const res = await fetch(`${API_BASE}/previews/delete?ownerToken=${encodeURIComponent(queryToken)}`, { method: "DELETE" });
      if (!res.ok) throw new Error("failed");
      setDeleted(true);
      setData(null);
    } catch {
      alert("Delete failed. Please try again.");
    } finally {
      setDeleting(false);
    }
  };

  const copyLink = () => {
    if (!data) return;
    navigator.clipboard.writeText(window.location.origin + data.previewUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col min-h-screen" style={{ background: "#06081a", color: "#fff" }}>
      <Navbar />

      <main className="flex-1 w-full max-w-4xl mx-auto px-3 sm:px-4 py-6 sm:py-10">

        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2.5 mb-1.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center">
              <BarChart2 className="w-4 h-4 text-indigo-400" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white">Analytics Dashboard</h1>
          </div>
          <p className="text-white/40 text-sm">Enter your Tracking UID to see who viewed your preview.</p>
        </div>

        {/* Lookup Form */}
        <div className="rounded-xl border border-white/10 bg-white/5 p-4 mb-5">
          <p className="text-white text-sm font-semibold mb-0.5">Tracking UID</p>
          <p className="text-white/35 text-xs mb-3">Shown after you shared your file.</p>
          <form onSubmit={handleLookup} className="flex gap-2">
            <input
              value={ownerToken}
              onChange={e => setOwnerToken(e.target.value)}
              placeholder="Paste your Tracking UID..."
              autoComplete="off"
              className="flex-1 h-9 rounded-lg bg-white/5 border border-white/10 text-white text-sm px-3 outline-none focus:border-indigo-500 placeholder-white/25 transition-colors min-w-0"
            />
            <button type="submit"
              className="h-9 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-all flex items-center gap-1.5 shrink-0">
              <Search className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Check</span>
            </button>
          </form>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-5 text-center">
            <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
            <p className="font-semibold text-white text-sm">
              {error.code === "not_found" ? "UID not found" : error.code === "expired" ? "Preview expired" : "Error"}
            </p>
            <p className="text-white/40 text-xs mt-1">{error.message}</p>
          </div>
        )}

        {/* Deleted */}
        {deleted && (
          <div className="rounded-xl border border-green-500/20 bg-green-500/5 p-5 text-center">
            <p className="font-semibold text-white text-sm">Preview deleted successfully.</p>
            <p className="text-white/40 text-xs mt-1">File and all visitor data have been removed.</p>
          </div>
        )}

        {/* Results */}
        {data && !loading && !deleted && (
          <div className="space-y-4">

            {/* Preview Info Bar */}
            <div className="rounded-xl border border-white/10 bg-white/5 p-3.5 flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex items-center gap-2.5 flex-1 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-indigo-600/15 border border-indigo-500/15 flex items-center justify-center shrink-0">
                  <FileTypeIcon type={data.fileType} />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-white text-sm truncate">{data.fileName}</p>
                  <p className="text-xs text-white/35">
                    {data.agencyName || data.freelancerName}
                    {data.hasPassword && " · 🔒"}
                    {data.expiresAt && ` · expires ${formatDate(data.expiresAt)}`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button onClick={copyLink}
                  className="h-7 px-2.5 rounded-md border border-white/10 bg-white/5 hover:bg-white/10 text-white/60 hover:text-white text-xs flex items-center gap-1 transition-colors">
                  {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                  {copied ? "Copied" : "Copy"}
                </button>
                <a href={data.previewUrl} target="_blank" rel="noopener noreferrer"
                  className="h-7 px-2.5 rounded-md border border-white/10 bg-white/5 hover:bg-white/10 text-white/60 hover:text-white text-xs flex items-center gap-1 transition-colors">
                  <ExternalLink className="w-3 h-3" />
                  View
                </a>
                <button onClick={handleDelete} disabled={deleting}
                  className="h-7 px-2.5 rounded-md border border-red-500/25 bg-red-500/8 hover:bg-red-500/15 text-red-400 text-xs flex items-center gap-1 transition-colors disabled:opacity-50">
                  {deleting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                  Delete
                </button>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-2.5 sm:gap-4">
              {[
                { label: "Total Views", value: data.totalVisits, icon: <Eye className="w-4 h-4 text-indigo-400" />, accent: "text-indigo-400" },
                { label: "Unique Visitors", value: data.uniqueIps, icon: <Users className="w-4 h-4 text-violet-400" />, accent: "text-violet-400" },
                {
                  label: "Last Seen",
                  value: data.lastVisitAt ? relativeTime(data.lastVisitAt) : "Never",
                  icon: <Clock className="w-4 h-4 text-green-400" />,
                  accent: "text-green-400",
                },
              ].map((s) => (
                <div key={s.label} className="rounded-xl border border-white/10 bg-white/5 p-3 sm:p-4">
                  <div className="flex items-center justify-between mb-2">
                    {s.icon}
                    <span className="text-white/20 text-xs hidden sm:block">{s.label}</span>
                  </div>
                  <p className={`text-xl sm:text-2xl font-bold ${s.accent}`}>{s.value}</p>
                  <p className="text-white/30 text-xs mt-0.5 sm:hidden">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Visitor Log */}
            <div className="rounded-xl border border-white/10 bg-white/5 overflow-hidden">
              <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-white text-sm">Visitor Log</h3>
                  <p className="text-xs text-white/35 mt-0.5">Everyone who viewed your secure preview.</p>
                </div>
                <span className="text-xs text-white/30 bg-white/5 px-2 py-0.5 rounded-full border border-white/5">
                  {data.recentVisits.length} {data.recentVisits.length === 1 ? "entry" : "entries"}
                </span>
              </div>
              <div className="p-3">
                {data.recentVisits.length === 0 ? (
                  <div className="text-center py-10">
                    <Eye className="w-6 h-6 mx-auto mb-2 text-white/15" />
                    <p className="text-white/30 text-sm">No views yet.</p>
                    <p className="text-white/20 text-xs mt-0.5">Share your link to start tracking.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {[...data.recentVisits].reverse().map((visit) => {
                      const loc = locationLabel(visit);
                      return (
                        <div key={visit.id}
                          className="flex items-start gap-2.5 p-3 rounded-lg bg-white/[0.04] border border-white/5 hover:bg-white/[0.07] transition-colors">
                          <div className="w-7 h-7 rounded-full bg-indigo-500/15 border border-indigo-500/15 flex items-center justify-center shrink-0 mt-0.5">
                            <User className="w-3.5 h-3.5 text-indigo-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <p className="font-medium text-sm text-white truncate">
                                {visit.clientName || <span className="text-white/30 font-normal italic text-xs">Unknown</span>}
                              </p>
                              <span className="text-xs text-white/25 shrink-0">{relativeTime(visit.visitedAt)}</span>
                            </div>
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-0.5">
                              {loc && (
                                <span className="flex items-center gap-1 text-xs text-white/40">
                                  <MapPin className="w-3 h-3 text-indigo-400/60" />{loc}
                                </span>
                              )}
                              {visit.ipAddress && (
                                <span className="flex items-center gap-1 text-xs text-white/25">
                                  <Globe className="w-3 h-3" />{visit.ipAddress}
                                </span>
                              )}
                              <span className="text-xs text-white/20">{formatDate(visit.visitedAt)}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

          </div>
        )}

      </main>

      <Footer />
    </div>
  );
}
