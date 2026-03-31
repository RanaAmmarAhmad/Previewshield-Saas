import { useParams } from "wouter";
import { useGetPreview, useRecordVisit } from "@workspace/api-client-react";
import { ShieldCheck, Lock, Loader2, AlertCircle, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useState, useEffect, useRef } from "react";

type Step = "consent" | "name" | "password" | "view";

export default function Preview() {
  const params = useParams();
  const id = params.id as string;

  const [step, setStep] = useState<Step>("consent");
  const [clientName, setClientName] = useState("");
  const [clientNameInput, setClientNameInput] = useState("");
  const [password, setPassword] = useState("");
  const [passwordInput, setPasswordInput] = useState("");

  const recordVisit = useRecordVisit();
  const recordedRef = useRef(false);

  const { data: preview, isLoading, isError, error } = useGetPreview(
    id,
    { password: password || undefined },
    {
      query: {
        enabled: !!id && step === "view",
        retry: false,
        queryKey: ["getPreview", id, password],
      },
    }
  );

  const needsPassword =
    (error && (error as any)?.status === 401 && (error as any)?.body?.error === "password_required") ||
    (error && (error as any)?.status === 401 && !password);

  const wrongPassword =
    error && (error as any)?.status === 401 && password && (error as any)?.body?.error === "wrong_password";

  const isExpired = (error as any)?.status === 410;

  useEffect(() => {
    if (step !== "view") return;
    if (needsPassword && !password) { setStep("password"); return; }
    if (wrongPassword) { setStep("password"); return; }
    if (preview && !recordedRef.current) {
      recordedRef.current = true;
      recordVisit.mutate({
        id,
        data: { clientName, userAgent: navigator.userAgent, referrer: document.referrer } as any,
      });
    }
  }, [preview, needsPassword, wrongPassword, step, id, clientName, password, recordVisit]);

  // Security: block right-click, drag, selection, keyboard shortcuts, and print
  useEffect(() => {
    const noContextMenu = (e: MouseEvent) => e.preventDefault();
    const noDragStart = (e: DragEvent) => e.preventDefault();
    const noSelect = (e: Event) => e.preventDefault();

    const noKeys = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      const ctrl = e.ctrlKey || e.metaKey;
      // Block: Ctrl+S (save), Ctrl+U (view source), Ctrl+P (print),
      //        Ctrl+A (select all), Ctrl+C (copy), Ctrl+Shift+I/J/C (devtools),
      //        F12 (devtools), PrintScreen
      if (ctrl && ["s", "u", "p", "a", "c"].includes(k)) { e.preventDefault(); e.stopPropagation(); return; }
      if (ctrl && e.shiftKey && ["i", "j", "c"].includes(k)) { e.preventDefault(); e.stopPropagation(); return; }
      if (k === "f12" || k === "printscreen") { e.preventDefault(); e.stopPropagation(); return; }
    };

    document.addEventListener("contextmenu", noContextMenu);
    document.addEventListener("dragstart", noDragStart);
    document.addEventListener("selectstart", noSelect);
    document.addEventListener("keydown", noKeys, true);

    // Developer console warning
    const warnMsg = "%c🔒 PreviewShield — Protected Content\n%cThis file is confidential. Every action on this page is logged.\nYour IP address and identity have been recorded.";
    console.log(warnMsg, "color:#f87171;font-size:20px;font-weight:bold;", "color:#fca5a5;font-size:13px;");
    console.log("%cAttempting to extract or copy this content is a violation of the terms of service.", "color:#fca5a5;font-size:12px;");

    return () => {
      document.removeEventListener("contextmenu", noContextMenu);
      document.removeEventListener("dragstart", noDragStart);
      document.removeEventListener("selectstart", noSelect);
      document.removeEventListener("keydown", noKeys, true);
    };
  }, []);

  const handleConsentAccept = () => setStep("name");

  const handleNameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientNameInput.trim()) return;
    setClientName(clientNameInput.trim());
    setStep("view");
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPassword(passwordInput);
    setStep("view");
  };

  if (step === "consent") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
        <Card className="w-full max-w-md shadow-2xl border-slate-200 dark:border-slate-800">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto w-12 h-12 bg-indigo-100 dark:bg-indigo-900/40 rounded-full flex items-center justify-center mb-4">
              <ShieldCheck className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            </div>
            <CardTitle>Before You View</CardTitle>
            <CardDescription>This secure preview is protected by PreviewShield.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-amber-800 dark:text-amber-300 mb-1.5">Data Collection Notice</p>
                  <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
                    By accessing this preview, you acknowledge that the following information will be recorded and shared with the file owner:
                  </p>
                  <ul className="mt-2 space-y-1 text-xs text-amber-700 dark:text-amber-400">
                    <li className="flex items-center gap-1.5">
                      <span className="w-1 h-1 rounded-full bg-amber-500 shrink-0"></span>Your name (entered on next step)
                    </li>
                    <li className="flex items-center gap-1.5">
                      <span className="w-1 h-1 rounded-full bg-amber-500 shrink-0"></span>Your IP address
                    </li>
                    <li className="flex items-center gap-1.5">
                      <span className="w-1 h-1 rounded-full bg-amber-500 shrink-0"></span>Date and time of your visit
                    </li>
                    <li className="flex items-center gap-1.5">
                      <span className="w-1 h-1 rounded-full bg-amber-500 shrink-0"></span>Browser and device info
                    </li>
                  </ul>
                </div>
              </div>
            </div>
            <p className="text-xs text-muted-foreground text-center">
              This information is used solely for delivery verification purposes.
            </p>
            <Button
              onClick={handleConsentAccept}
              className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              I understand — Continue
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (step === "name") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
        <Card className="w-full max-w-md shadow-2xl border-slate-200 dark:border-slate-800">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto w-12 h-12 bg-slate-100 dark:bg-slate-900 rounded-full flex items-center justify-center mb-4">
              <ShieldCheck className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            </div>
            <CardTitle>Who are you?</CardTitle>
            <CardDescription>Enter your name so the sender knows who accessed this file.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleNameSubmit} className="space-y-4 mt-4">
              <Input
                type="text"
                placeholder="Your name or company"
                value={clientNameInput}
                onChange={(e) => setClientNameInput(e.target.value)}
                className="h-12"
                autoFocus
              />
              <Button
                type="submit"
                disabled={!clientNameInput.trim()}
                className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                Continue to Preview
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (step === "password") {
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
            {wrongPassword && (
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
                autoFocus
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

  // step === "view"
  if (isExpired) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Link Expired</h2>
            <p className="text-muted-foreground">This preview link has expired. The file has been deleted from the server.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading && !error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (isError && !needsPassword && !wrongPassword && !isExpired) {
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

  if (!preview) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  const streamToken = (preview as any).streamToken as string;
  const streamUrl = `/api/previews/${id}/stream?t=${encodeURIComponent(streamToken)}`;

  return (
    <>
      <style>{`
        @media print {
          body { display: none !important; visibility: hidden !important; }
          * { display: none !important; }
        }
        * {
          -webkit-user-select: none !important;
          -moz-user-select: none !important;
          user-select: none !important;
          -webkit-touch-callout: none !important;
        }
        img, video {
          pointer-events: none !important;
          -webkit-user-drag: none !important;
        }
        ::-webkit-scrollbar { display: none; }
        ::selection { background: transparent !important; }
      `}</style>

      <div className="min-h-screen flex flex-col bg-slate-950 text-slate-50" style={{ userSelect: "none", WebkitUserSelect: "none" } as React.CSSProperties}>

        {/* Header */}
        <header className="h-14 border-b border-slate-800 flex items-center justify-between px-4 md:px-6 bg-slate-950/90 backdrop-blur z-50 shrink-0">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-indigo-500" />
            <span className="font-semibold text-slate-200 text-sm">PreviewShield</span>
          </div>
          <div className="text-xs text-slate-400 font-medium hidden sm:block">
            {clientName && <span className="text-white">{clientName}</span>}
            {clientName && " · "}
            by <span className="text-white">{preview.freelancerName}</span>
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
            {/* File content — served via encrypted stream token, never exposes raw file path */}
            {preview.fileType === "image" && (
              <img
                src={streamUrl}
                alt={preview.fileName}
                className="w-full h-auto object-contain max-h-[80vh]"
                draggable={false}
                onContextMenu={(e) => e.preventDefault()}
                onDragStart={(e) => e.preventDefault()}
                style={{ pointerEvents: "none", userSelect: "none" } as React.CSSProperties}
              />
            )}

            {preview.fileType === "video" && (
              <video
                src={streamUrl}
                controls
                controlsList="nodownload nofullscreen noremoteplayback"
                disablePictureInPicture
                className="w-full h-auto max-h-[80vh]"
                onContextMenu={(e) => e.preventDefault()}
                style={{ userSelect: "none" }}
              />
            )}

            {preview.fileType === "pdf" && (
              <iframe
                src={`${streamUrl}#toolbar=0&navpanes=0&scrollbar=0`}
                className="w-full border-0"
                style={{ height: "80vh", pointerEvents: "none" }}
                title={preview.fileName}
                sandbox="allow-same-origin allow-scripts"
              />
            )}

            {/* Watermark */}
            <div className="absolute inset-0 z-10 overflow-hidden" style={{ pointerEvents: "none", userSelect: "none" }}>
              <div style={{ position: "absolute", inset: "-100px", display: "flex", flexWrap: "wrap", gap: "32px", transform: "rotate(-20deg)", opacity: 0.07, alignContent: "flex-start" }}>
                {Array.from({ length: 80 }).map((_, i) => (
                  <span key={i} style={{ fontSize: "clamp(14px, 2vw, 22px)", fontWeight: 900, letterSpacing: "0.12em", textTransform: "uppercase", color: "white", whiteSpace: "nowrap", fontFamily: "system-ui, sans-serif" }}>
                    {preview.agencyName || preview.freelancerName || "PreviewShield"} · CONFIDENTIAL
                  </span>
                ))}
              </div>
            </div>

            {/* Click interceptor */}
            <div className="absolute inset-0 z-20" style={{ pointerEvents: "all", background: "transparent" }} onContextMenu={(e) => e.preventDefault()} onMouseDown={(e) => { if (e.detail > 1) e.preventDefault(); }} />
          </div>
        </main>
      </div>
    </>
  );
}
