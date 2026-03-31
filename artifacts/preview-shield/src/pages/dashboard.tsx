import { useState } from "react";
import { useLocation } from "wouter";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { BarChart2, Eye, Users, Clock, Globe, Search, Loader2, AlertCircle, User, Trash2, ExternalLink, Copy, Check, ShieldCheck, FileText, Film } from "lucide-react";

const API_BASE = "/api";

function formatDate(d: string | Date) {
  return new Date(d).toLocaleString(undefined, {
    year: "numeric", month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function relativeTime(d: string | Date) {
  const diff = Date.now() - new Date(d).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function FileTypeIcon({ type }: { type: string }) {
  if (type === "pdf") return <FileText className="w-4 h-4 text-red-400" />;
  if (type === "video") return <Film className="w-4 h-4 text-blue-400" />;
  return <ShieldCheck className="w-4 h-4 text-indigo-400" />;
}

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
  recentVisits: Array<{ id: string; clientName: string | null; ipAddress: string | null; visitedAt: string }>;
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
  const [hasQueried, setHasQueried] = useState(!!urlToken);
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
      if (!res.ok) throw { code: json.error, message: json.message, status: res.status };
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
    setHasQueried(true);
    setDeleted(false);
    fetchData(token);
    navigate(`/dashboard?token=${encodeURIComponent(token)}`, { replace: true });
  };

  // auto-fetch if URL has token
  useState(() => { if (urlToken) fetchData(urlToken); });

  const handleDelete = async () => {
    if (!data || !window.confirm("Delete this preview permanently? The file and all visit data will be removed.")) return;
    setDeleting(true);
    try {
      const res = await fetch(`${API_BASE}/previews/delete?ownerToken=${encodeURIComponent(queryToken)}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      setDeleted(true);
      setData(null);
    } catch {
      alert("Failed to delete. Please try again.");
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

      <main className="flex-1 container mx-auto px-4 py-12 md:py-16">
        <div className="max-w-4xl mx-auto">

          {/* Header */}
          <div className="mb-10">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center">
                <BarChart2 className="w-5 h-5 text-indigo-400" />
              </div>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white">Analytics Dashboard</h1>
            </div>
            <p className="text-white/50 text-lg">Enter your Tracking UID to see who viewed your preview.</p>
          </div>

          {/* Lookup Form */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 mb-8 backdrop-blur-sm">
            <h2 className="text-white font-semibold mb-1">Your Tracking UID</h2>
            <p className="text-white/40 text-sm mb-4">This was shown after you shared your file.</p>
            <form onSubmit={handleLookup} className="flex flex-col sm:flex-row gap-3">
              <input
                value={ownerToken}
                onChange={e => setOwnerToken(e.target.value)}
                placeholder="Paste your Tracking UID here..."
                autoComplete="off"
                className="flex-1 h-11 rounded-xl bg-white/5 border border-white/10 text-white text-sm px-4 outline-none focus:border-indigo-500 placeholder-white/25 transition-colors"
              />
              <button type="submit"
                className="h-11 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-all shadow-lg shadow-indigo-500/20 flex items-center gap-2 shrink-0">
                <Search className="w-4 h-4" />
                Check Analytics
              </button>
            </form>
          </div>

          {/* Loading */}
          {loading && (
            <div className="flex items-center justify-center py-24">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
            </div>
          )}

          {/* Error */}
          {error && !loading && (
            <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-8 text-center">
              <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
              <h3 className="font-semibold text-lg text-white mb-1">
                {error.code === "not_found" ? "Tracking UID Not Found"
                  : error.code === "expired" ? "Preview Expired"
                  : "Something went wrong"}
              </h3>
              <p className="text-white/40 text-sm">{error.message}</p>
            </div>
          )}

          {/* Deleted */}
          {deleted && (
            <div className="rounded-2xl border border-green-500/20 bg-green-500/5 p-8 text-center">
              <h3 className="font-semibold text-lg text-white mb-1">Preview deleted</h3>
              <p className="text-white/40 text-sm">The file and all visitor data have been permanently removed.</p>
            </div>
          )}

          {/* Results */}
          {data && !loading && !deleted && (
            <div className="space-y-6">

              {/* Preview Info Bar */}
              <div className="rounded-2xl border border-white/10 bg-white/5 p-5 flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-indigo-600/20 border border-indigo-500/20 flex items-center justify-center shrink-0">
                    <FileTypeIcon type={data.fileType} />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-white truncate">{data.fileName}</p>
                    <p className="text-xs text-white/40">
                      by {data.agencyName || data.freelancerName}
                      {data.hasPassword && " · password protected"}
                      {data.expiresAt && ` · expires ${formatDate(data.expiresAt)}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={copyLink}
                    className="h-9 px-3 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white text-xs flex items-center gap-1.5 transition-colors">
                    {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? "Copied" : "Copy link"}
                  </button>
                  <a href={data.previewUrl} target="_blank" rel="noopener noreferrer"
                    className="h-9 px-3 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white text-xs flex items-center gap-1.5 transition-colors">
                    <ExternalLink className="w-3.5 h-3.5" />
                    Preview
                  </a>
                  <button onClick={handleDelete} disabled={deleting}
                    className="h-9 px-3 rounded-lg border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs flex items-center gap-1.5 transition-colors disabled:opacity-50">
                    {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                    Delete
                  </button>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { label: "Total Views", value: data.totalVisits, icon: <Eye className="w-5 h-5 text-indigo-400" />, color: "bg-indigo-500/10 border-indigo-500/20" },
                  { label: "Unique Viewers", value: data.uniqueIps, icon: <Users className="w-5 h-5 text-violet-400" />, color: "bg-violet-500/10 border-violet-500/20" },
                  {
                    label: "Last Viewed",
                    value: data.lastVisitAt ? relativeTime(data.lastVisitAt) : "Never",
                    sub: data.lastVisitAt ? formatDate(data.lastVisitAt) : undefined,
                    icon: <Clock className="w-5 h-5 text-green-400" />,
                    color: "bg-green-500/10 border-green-500/20",
                  },
                ].map((stat) => (
                  <div key={stat.label} className="rounded-2xl border border-white/10 bg-white/5 p-5">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-xs text-white/40 font-medium mb-1">{stat.label}</p>
                        <p className="text-3xl font-bold text-white">{stat.value}</p>
                        {stat.sub && <p className="text-xs text-white/30 mt-0.5">{stat.sub}</p>}
                      </div>
                      <div className={`w-10 h-10 rounded-xl border flex items-center justify-center ${stat.color}`}>
                        {stat.icon}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Visitor Log */}
              <div className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
                <div className="p-5 border-b border-white/5">
                  <h3 className="font-semibold text-white">Visitor Log</h3>
                  <p className="text-xs text-white/40 mt-0.5">Every person who accessed your secure preview.</p>
                </div>
                <div className="p-5">
                  {data.recentVisits.length === 0 ? (
                    <div className="text-center py-12">
                      <Eye className="w-8 h-8 mx-auto mb-3 text-white/20" />
                      <p className="text-white/30 text-sm">No views yet. Share your link to start tracking.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {[...data.recentVisits].reverse().map((visit) => (
                        <div key={visit.id}
                          className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 rounded-xl bg-white/5 border border-white/5">
                          <div className="w-9 h-9 rounded-full bg-indigo-500/20 border border-indigo-500/20 flex items-center justify-center shrink-0">
                            <User className="w-4 h-4 text-indigo-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm text-white truncate">
                              {visit.clientName || <span className="text-white/30 font-normal italic">Unknown visitor</span>}
                            </p>
                            <div className="flex items-center gap-3 mt-1 flex-wrap">
                              {visit.ipAddress && (
                                <span className="flex items-center gap-1 text-xs text-white/30">
                                  <Globe className="w-3 h-3" />{visit.ipAddress}
                                </span>
                              )}
                              <span className="flex items-center gap-1 text-xs text-white/30">
                                <Clock className="w-3 h-3" />{formatDate(visit.visitedAt)}
                              </span>
                            </div>
                          </div>
                          <span className="text-xs text-white/25 shrink-0">{relativeTime(visit.visitedAt)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

            </div>
          )}

        </div>
      </main>

      <Footer />
    </div>
  );
}
