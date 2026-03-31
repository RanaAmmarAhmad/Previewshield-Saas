import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useGetPreviewStats, useGetPreviewVisits } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BarChart2, Eye, Users, Clock, Globe, ArrowRight, Loader2, AlertCircle, User } from "lucide-react";

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

export default function Dashboard() {
  const [location] = useLocation();
  const searchParams = new URLSearchParams(window.location.search);
  const urlId = searchParams.get("id") || "";
  const urlToken = searchParams.get("token") || "";

  const [previewId, setPreviewId] = useState(urlId);
  const [ownerToken, setOwnerToken] = useState(urlToken);
  const [queryId, setQueryId] = useState(urlId);
  const [queryToken, setQueryToken] = useState(urlToken);
  const [hasQueried, setHasQueried] = useState(!!(urlId && urlToken));

  const { data: stats, isLoading: statsLoading, isError: statsError, error: statsErr } = useGetPreviewStats(
    queryId,
    { ownerToken: queryToken },
    { query: { enabled: hasQueried && !!queryId && !!queryToken, retry: false } }
  );

  const handleLookup = (e: React.FormEvent) => {
    e.preventDefault();
    setQueryId(previewId.trim());
    setQueryToken(ownerToken.trim());
    setHasQueried(true);
  };

  const isUnauthorized = (statsErr as any)?.status === 403;
  const isNotFound = (statsErr as any)?.status === 404;

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950">
      <Navbar />

      <main className="flex-1 container mx-auto px-4 py-12 md:py-16">
        <div className="max-w-4xl mx-auto">

          <div className="mb-10">
            <h1 className="text-3xl md:text-4xl font-bold mb-3 tracking-tight flex items-center gap-3">
              <BarChart2 className="w-8 h-8 text-indigo-500" />
              Preview Analytics
            </h1>
            <p className="text-muted-foreground text-lg">Track who viewed your preview, when, and from where.</p>
          </div>

          {/* Lookup Form */}
          <Card className="shadow-xl border-slate-200/60 dark:border-slate-800 mb-8">
            <CardHeader>
              <CardTitle className="text-lg">Enter Your Tracking Details</CardTitle>
              <CardDescription>Find your Preview ID and Tracking UID on the share success page.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLookup} className="flex flex-col sm:flex-row gap-3">
                <Input
                  placeholder="Preview ID (e.g. a1b2c3d4)"
                  value={previewId}
                  onChange={(e) => setPreviewId(e.target.value)}
                  className="flex-1"
                />
                <Input
                  placeholder="Tracking UID (your owner token)"
                  value={ownerToken}
                  onChange={(e) => setOwnerToken(e.target.value)}
                  className="flex-1"
                />
                <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white shrink-0">
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Results */}
          {hasQueried && (
            <>
              {statsLoading && (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                </div>
              )}

              {statsError && !statsLoading && (
                <Card className="border-red-200 dark:border-red-900/50">
                  <CardContent className="pt-6 text-center">
                    <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
                    <h3 className="font-semibold text-lg mb-1">
                      {isUnauthorized ? "Invalid Tracking UID" : isNotFound ? "Preview Not Found" : "Something went wrong"}
                    </h3>
                    <p className="text-muted-foreground text-sm">
                      {isUnauthorized
                        ? "The Tracking UID does not match this preview. Check you copied it correctly."
                        : isNotFound
                        ? "No preview found with that ID. It may have expired and been deleted."
                        : "Unable to load analytics. Please try again."}
                    </p>
                  </CardContent>
                </Card>
              )}

              {stats && !statsLoading && (
                <div className="space-y-6">
                  {/* Stats cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Card className="shadow-md border-slate-200 dark:border-slate-800">
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-sm text-muted-foreground font-medium">Total Views</p>
                            <p className="text-4xl font-bold mt-1">{stats.totalVisits}</p>
                          </div>
                          <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center">
                            <Eye className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="shadow-md border-slate-200 dark:border-slate-800">
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-sm text-muted-foreground font-medium">Unique Viewers</p>
                            <p className="text-4xl font-bold mt-1">{stats.uniqueIps}</p>
                          </div>
                          <div className="w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center">
                            <Users className="w-5 h-5 text-violet-600 dark:text-violet-400" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="shadow-md border-slate-200 dark:border-slate-800">
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-sm text-muted-foreground font-medium">Last Viewed</p>
                            <p className="text-lg font-bold mt-1">
                              {stats.lastVisitAt ? relativeTime(stats.lastVisitAt) : "Never"}
                            </p>
                            {stats.lastVisitAt && (
                              <p className="text-xs text-muted-foreground mt-0.5">{formatDate(stats.lastVisitAt)}</p>
                            )}
                          </div>
                          <div className="w-10 h-10 rounded-xl bg-green-100 dark:bg-green-900/40 flex items-center justify-center">
                            <Clock className="w-5 h-5 text-green-600 dark:text-green-400" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Visitor Log */}
                  <Card className="shadow-md border-slate-200 dark:border-slate-800">
                    <CardHeader>
                      <CardTitle className="text-lg">Visitor Log</CardTitle>
                      <CardDescription>Every person who accessed your secure preview.</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {stats.recentVisits.length === 0 ? (
                        <div className="text-center py-10 text-muted-foreground">
                          <Eye className="w-8 h-8 mx-auto mb-3 opacity-30" />
                          <p>No views yet. Share your link to start tracking.</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {[...stats.recentVisits].reverse().map((visit: any) => (
                            <div
                              key={visit.id}
                              className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800"
                            >
                              <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center shrink-0">
                                <User className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-sm truncate">
                                  {visit.clientName || <span className="text-muted-foreground italic">Unknown</span>}
                                </p>
                                <div className="flex items-center gap-3 mt-1 flex-wrap">
                                  {visit.ipAddress && (
                                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                      <Globe className="w-3 h-3" />{visit.ipAddress}
                                    </span>
                                  )}
                                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                    <Clock className="w-3 h-3" />{formatDate(visit.visitedAt)}
                                  </span>
                                </div>
                              </div>
                              <div className="shrink-0">
                                <span className="text-xs text-muted-foreground">{relativeTime(visit.visitedAt)}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}
            </>
          )}

        </div>
      </main>

      <Footer />
    </div>
  );
}
