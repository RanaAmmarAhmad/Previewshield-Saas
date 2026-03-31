import { useParams } from "wouter";
import { useGetPreview, useRecordVisit } from "@workspace/api-client-react";
import { ShieldCheck, Lock, Loader2, AlertCircle } from "lucide-react";
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
  
  const recordVisit = useRecordVisit();
  const recordedRef = useRef(false);

  // We conditionally pass password if required
  const { data: preview, isLoading, isError, error } = useGetPreview(
    id, 
    { password: password || undefined }, 
    { 
      query: { 
        enabled: !!id,
        retry: false,
        queryKey: ["getPreview", id, password]
      } 
    }
  );

  useEffect(() => {
    // Error handling for password
    if (error && (error as any)?.status === 401) {
      setNeedsPassword(true);
    } else if (preview && preview.hasPassword && !password) {
      setNeedsPassword(true);
    } else if (preview) {
      setNeedsPassword(false);
      
      // Record visit once loaded
      if (!recordedRef.current) {
        recordedRef.current = true;
        recordVisit.mutate({
          id,
          data: {
            userAgent: navigator.userAgent,
            referrer: document.referrer
          }
        });
      }
    }
  }, [preview, error, id, password, recordVisit]);

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPassword(passwordInput);
  };

  // Prevent right click and drag
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => e.preventDefault();
    const handleDragStart = (e: DragEvent) => e.preventDefault();
    
    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("dragstart", handleDragStart);
    
    return () => {
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("dragstart", handleDragStart);
    };
  }, []);

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
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>Incorrect password. Please try again.</AlertDescription>
              </Alert>
            )}
            <form onSubmit={handlePasswordSubmit} className="space-y-4 mt-4">
              <Input 
                type="password" 
                placeholder="Enter password" 
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                className="h-12"
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
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-50 selection:bg-transparent">
      {/* Viewer Header */}
      <header className="h-16 border-b border-slate-800 flex items-center justify-between px-4 md:px-6 bg-slate-950/80 backdrop-blur z-50">
        <div className="flex items-center gap-3">
          <ShieldCheck className="w-6 h-6 text-indigo-500" />
          <span className="font-semibold text-slate-200">PreviewShield Viewer</span>
        </div>
        <div className="text-sm text-slate-400 font-medium">
          Prepared for <span className="text-white">{preview.clientName}</span> by <span className="text-white">{preview.freelancerName}</span>
        </div>
      </header>

      {/* Viewer Canvas */}
      <main className="flex-1 relative flex items-center justify-center overflow-hidden p-4 md:p-8">
        
        {/* Content Container */}
        <div className="relative max-w-5xl w-full max-h-full rounded-md overflow-hidden bg-slate-900 shadow-2xl border border-slate-800">
          
          {/* File Rendering */}
          {preview.fileType === "image" && preview.fileUrl && (
            <img 
              src={preview.fileUrl} 
              alt={preview.fileName} 
              className="w-full h-auto object-contain max-h-[80vh] pointer-events-none"
              draggable={false}
            />
          )}
          
          {preview.fileType === "video" && preview.fileUrl && (
            <video 
              src={preview.fileUrl} 
              controls 
              controlsList="nodownload"
              className="w-full h-auto max-h-[80vh]"
              onContextMenu={(e) => e.preventDefault()}
            />
          )}
          
          {preview.fileType === "pdf" && preview.fileUrl && (
            <iframe 
              src={`${preview.fileUrl}#toolbar=0&navpanes=0`} 
              className="w-full h-[80vh] border-0"
              title={preview.fileName}
            />
          )}

          {/* Watermark Overlay */}
          <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center opacity-[0.07] overflow-hidden select-none z-10">
            {/* Repeated watermark pattern */}
            <div className="w-[200%] h-[200%] flex flex-wrap items-center justify-center gap-10 -rotate-12 transform scale-150">
              {Array.from({ length: 50 }).map((_, i) => (
                <span key={i} className="text-4xl md:text-6xl font-black uppercase tracking-widest text-white whitespace-nowrap drop-shadow-md">
                  {preview.freelancerName} • CONFIDENTIAL
                </span>
              ))}
            </div>
          </div>
          
        </div>
      </main>
      
      <div className="fixed bottom-4 right-4 z-50">
        <div className="bg-slate-900/80 backdrop-blur border border-slate-800 rounded-full px-4 py-2 text-xs font-medium text-slate-400 flex items-center gap-2 shadow-lg">
          <Lock className="w-3 h-3" /> Secure View Mode
        </div>
      </div>
    </div>
  );
}
