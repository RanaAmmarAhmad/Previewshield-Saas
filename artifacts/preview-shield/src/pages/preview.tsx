import { useParams } from "wouter";
import { useGetPreview, useRecordVisit } from "@workspace/api-client-react";
import { ShieldCheck, Lock, Loader2, AlertCircle, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useState, useEffect, useRef } from "react";

export default function Preview() {
  const params = useParams();
  const id = params.id as string;

  const [password, setPassword] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [needsPassword, setNeedsPassword] = useState(false);
  const [devtoolsOpen, setDevtoolsOpen] = useState(false);

  const recordVisit = useRecordVisit();
  const recordedRef = useRef(false);

  const { data: preview, isLoading, isError, error } = useGetPreview(
    id,
    { password: password || undefined },
    {
      query: {
        enabled: !!id,
        retry: false,
        queryKey: ["getPreview", id, password],
      },
    }
  );

  useEffect(() => {
    if (error && (error as any)?.status === 401) {
      setNeedsPassword(true);
    } else if (preview && preview.hasPassword && !password) {
      setNeedsPassword(true);
    } else if (preview) {
      setNeedsPassword(false);
      if (!recordedRef.current) {
        recordedRef.current = true;
        recordVisit.mutate({
          id,
          data: { userAgent: navigator.userAgent, referrer: document.referrer },
        });
      }
    }
  }, [preview, error, id, password, recordVisit]);

  // ─── Security Layer ────────────────────────────────────────────────────────
  useEffect(() => {
    // 1. Block right-click
    const noContextMenu = (e: MouseEvent) => e.preventDefault();
    // 2. Block drag
    const noDragStart = (e: DragEvent) => e.preventDefault();
    // 3. Block print
    const noPrint = (e: KeyboardEvent) => {
      const key = e.key?.toLowerCase();
      const ctrl = e.ctrlKey || e.metaKey;
      // F12 / DevTools shortcuts / Print / Save / Select All / Copy / Inspect
      if (
        e.key === "F12" ||
        (ctrl && e.shiftKey && (key === "i" || key === "j" || key === "c")) ||
        (ctrl && (key === "u" || key === "s" || key === "p" || key === "a")) ||
        e.key === "PrintScreen"
      ) {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    // 4. Block selection globally on this page
    const noSelect = (e: Event) => e.preventDefault();

    document.addEventListener("contextmenu", noContextMenu);
    document.addEventListener("dragstart", noDragStart);
    document.addEventListener("keydown", noPrint, true);
    document.addEventListener("selectstart", noSelect);

    return () => {
      document.removeEventListener("contextmenu", noContextMenu);
      document.removeEventListener("dragstart", noDragStart);
      document.removeEventListener("keydown", noPrint, true);
      document.removeEventListener("selectstart", noSelect);
    };
  }, []);

  // 5. DevTools detection via window size heuristic
  useEffect(() => {
    const THRESHOLD = 160;
    const check = () => {
      const widthDiff = window.outerWidth - window.innerWidth;
      const heightDiff = window.outerHeight - window.innerHeight;
      setDevtoolsOpen(widthDiff > THRESHOLD || heightDiff > THRESHOLD);
    };
    check();
    window.addEventListener("resize", check);
    const interval = setInterval(check, 1000);
    return () => {
      window.removeEventListener("resize", check);
      clearInterval(interval);
    };
  }, []);

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPassword(passwordInput);
  };

  if (isLoading && !error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (needsPassword) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
        <Card className="w-full max-w-md shadow-2xl border-slate-200 dark:border-slate-800">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto w-12 h-12 bg-slate-100 dark:bg-slate-900 rounded-full flex items-center justify-center mb-4">
              <Lock className="w-6 h-6 text-slate-600 dark:text-slate-400" />
            </div>
            <CardTitle>Protected File</CardTitle>
            <CardDescription>This preview is password protected.</CardDescription>
          </CardHeader>
          <CardContent>
            {error && password && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Wrong password</AlertTitle>
                <AlertDescription>Please try again.</AlertDescription>
              </Alert>
            )}
            <form onSubmit={handlePasswordSubmit} className="space-y-4 mt-4">
              <Input
                type="password"
                placeholder="Enter password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                className="h-12"
                autoComplete="current-password"
              />
              <Button type="submit" className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white">
                View File
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isError || !preview) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Preview Not Found</h2>
            <p className="text-muted-foreground">The link may be invalid or has expired.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      {/* Block printing via CSS */}
      <style>{`
        @media print {
          body { display: none !important; }
        }
        * {
          -webkit-user-select: none !important;
          -moz-user-select: none !important;
          -ms-user-select: none !important;
          user-select: none !important;
        }
        img, video {
          pointer-events: none !important;
          -webkit-user-drag: none !important;
        }
      `}</style>

      <div
        className="min-h-screen flex flex-col bg-slate-950 text-slate-50"
        style={{ userSelect: "none", WebkitUserSelect: "none" }}
      >
        {/* Devtools warning overlay */}
        {devtoolsOpen && (
          <div className="fixed inset-0 z-[9999] bg-slate-950 flex flex-col items-center justify-center text-center p-8">
            <EyeOff className="w-16 h-16 text-red-500 mb-6" />
            <h2 className="text-2xl font-bold text-white mb-3">Content Hidden</h2>
            <p className="text-slate-400 max-w-sm">
              Developer tools have been detected. Please close them to view this secure preview.
            </p>
          </div>
        )}

        {/* Header */}
        <header className="h-14 border-b border-slate-800 flex items-center justify-between px-4 md:px-6 bg-slate-950/90 backdrop-blur z-50 shrink-0">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-indigo-500" />
            <span className="font-semibold text-slate-200 text-sm">PreviewShield</span>
          </div>
          <div className="text-xs text-slate-400 font-medium hidden sm:block">
            For <span className="text-white">{preview.clientName}</span> · by <span className="text-white">{preview.freelancerName}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 border border-slate-800 rounded-full px-3 py-1">
            <Lock className="w-3 h-3" /> Secure View
          </div>
        </header>

        {/* Canvas */}
        <main className="flex-1 relative flex items-center justify-center overflow-hidden p-4 md:p-8">
          <div
            className="relative max-w-5xl w-full rounded-lg overflow-hidden bg-slate-900 shadow-2xl border border-slate-800"
            onContextMenu={(e) => e.preventDefault()}
          >
            {/* File content */}
            {preview.fileType === "image" && preview.fileUrl && (
              <img
                src={preview.fileUrl}
                alt={preview.fileName}
                className="w-full h-auto object-contain max-h-[80vh]"
                draggable={false}
                onContextMenu={(e) => e.preventDefault()}
                onDragStart={(e) => e.preventDefault()}
                style={{ pointerEvents: "none", userSelect: "none", WebkitUserDrag: "none" } as React.CSSProperties}
              />
            )}

            {preview.fileType === "video" && preview.fileUrl && (
              <video
                src={preview.fileUrl}
                controls
                controlsList="nodownload nofullscreen noremoteplayback"
                disablePictureInPicture
                className="w-full h-auto max-h-[80vh]"
                onContextMenu={(e) => e.preventDefault()}
                style={{ userSelect: "none" }}
              />
            )}

            {preview.fileType === "pdf" && preview.fileUrl && (
              <iframe
                src={`${preview.fileUrl}#toolbar=0&navpanes=0&scrollbar=0&statusbar=0&messages=0&view=FitH`}
                className="w-full border-0"
                style={{ height: "80vh", pointerEvents: "none" }}
                title={preview.fileName}
                sandbox="allow-same-origin allow-scripts"
              />
            )}

            {/* Watermark tile pattern */}
            <div
              className="absolute inset-0 z-10 overflow-hidden"
              style={{
                pointerEvents: "none",
                userSelect: "none",
                WebkitUserSelect: "none",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  inset: "-100px",
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "32px",
                  transform: "rotate(-20deg)",
                  opacity: 0.07,
                  alignContent: "flex-start",
                }}
              >
                {Array.from({ length: 80 }).map((_, i) => (
                  <span
                    key={i}
                    style={{
                      fontSize: "clamp(14px, 2vw, 22px)",
                      fontWeight: 900,
                      letterSpacing: "0.12em",
                      textTransform: "uppercase",
                      color: "white",
                      whiteSpace: "nowrap",
                      fontFamily: "system-ui, sans-serif",
                    }}
                  >
                    {preview.freelancerName} · CONFIDENTIAL
                  </span>
                ))}
              </div>
            </div>

            {/* Invisible click interceptor — prevents copying image */}
            <div
              className="absolute inset-0 z-20"
              style={{ pointerEvents: "all", background: "transparent" }}
              onContextMenu={(e) => e.preventDefault()}
              onMouseDown={(e) => { if (e.detail > 1) e.preventDefault(); }}
            />
          </div>
        </main>
      </div>
    </>
  );
}
