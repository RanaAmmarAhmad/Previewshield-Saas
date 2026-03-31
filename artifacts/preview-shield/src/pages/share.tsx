import { useState, useRef, useCallback, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { Navbar, saveFileHistory } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useCreatePreview } from "@workspace/api-client-react";
import { Form, FormField } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Copy, Check, ExternalLink, ArrowRight, Loader2, Upload, FileImage, FileText,
  FileVideo, X, Link2, HardDrive, BarChart2, Lock, Clock, ShieldCheck,
  Eye, MapPin, User, Share2, Zap,
} from "lucide-react";

const LS_KEY = "ps_username";
const MAX_FILE_SIZE = 100 * 1024 * 1024;

const ACCEPTED_TYPES: Record<string, string> = {
  "image/jpeg": "image", "image/png": "image", "image/gif": "image",
  "image/webp": "image", "image/svg+xml": "image",
  "application/pdf": "pdf",
  "video/mp4": "video", "video/webm": "video", "video/ogg": "video", "video/quicktime": "video",
};

const EXPIRY_OPTIONS = [
  { label: "1 hour", value: "1" },
  { label: "6 hours", value: "6" },
  { label: "12 hours", value: "12" },
  { label: "24 hours (default)", value: "24" },
  { label: "48 hours", value: "48" },
  { label: "7 days", value: "168" },
  { label: "Never", value: "never" },
];

const shareSchema = z.object({
  freelancerName: z.string().min(2, "Your name is required"),
  agencyName: z.string().optional(),
  password: z.string().optional(),
  expiresIn: z.string().default("24"),
});

type ShareFormValues = z.infer<typeof shareSchema>;
type UploadMode = "file" | "url";
type FileInfo = { file: File; preview: string | null; fileType: "image" | "pdf" | "video" };
type SuccessData = { url: string; id: string; ownerToken: string; expiresAt: string | null };

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function StepBadge({ n, label, active }: { n: number; label: string; active: boolean }) {
  return (
    <div className={`flex items-center gap-2 transition-all ${active ? "opacity-100" : "opacity-35"}`}>
      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${active ? "bg-indigo-600 text-white" : "bg-white/10 text-white/50"}`}>{n}</div>
      <span className={`text-xs font-medium hidden sm:block ${active ? "text-white" : "text-white/50"}`}>{label}</span>
    </div>
  );
}

const sideFeatures = [
  { icon: <ShieldCheck className="w-5 h-5" />, color: "text-indigo-400", bg: "bg-indigo-500/10 border-indigo-500/20", title: "Watermark Protection", desc: "Client's name printed across the preview — screenshots are traceable." },
  { icon: <Eye className="w-5 h-5" />, color: "text-violet-400", bg: "bg-violet-500/10 border-violet-500/20", title: "Real-time Tracking", desc: "See who opened it, when, and from which city on the planet." },
  { icon: <Lock className="w-5 h-5" />, color: "text-pink-400", bg: "bg-pink-500/10 border-pink-500/20", title: "Password Gate", desc: "Add an optional password so only the right person can view it." },
  { icon: <Zap className="w-5 h-5" />, color: "text-cyan-400", bg: "bg-cyan-500/10 border-cyan-500/20", title: "Auto-Expires", desc: "Links self-destruct and files are deleted after your chosen time." },
];

export default function Share() {
  const [, navigate] = useLocation();
  const [copied, setCopied] = useState<"link" | "uid" | null>(null);
  const [successData, setSuccessData] = useState<SuccessData | null>(null);
  const [uploadMode, setUploadMode] = useState<UploadMode>("file");
  const [fileInfo, setFileInfo] = useState<FileInfo | null>(null);
  const [fileUrl, setFileUrl] = useState("");
  const [fileUrlType, setFileUrlType] = useState<"image" | "pdf" | "video">("image");
  const [dragActive, setDragActive] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [usernameSaved, setUsernameSaved] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout>>();

  const createPreview = useCreatePreview();
  const savedName = typeof window !== "undefined" ? localStorage.getItem(LS_KEY) || "" : "";

  const form = useForm<ShareFormValues>({
    resolver: zodResolver(shareSchema),
    defaultValues: { freelancerName: savedName, agencyName: "", password: "", expiresIn: "24" },
  });

  const freelancerNameValue = form.watch("freelancerName");
  useEffect(() => {
    clearTimeout(saveTimer.current);
    if (freelancerNameValue && freelancerNameValue.length >= 2) {
      saveTimer.current = setTimeout(() => {
        localStorage.setItem(LS_KEY, freelancerNameValue);
        setUsernameSaved(true); setTimeout(() => setUsernameSaved(false), 1500);
      }, 800);
    }
    return () => clearTimeout(saveTimer.current);
  }, [freelancerNameValue]);

  const processFile = useCallback((file: File) => {
    setUploadError(null);
    if (file.size > MAX_FILE_SIZE) { setUploadError("File is too large. Maximum size is 100 MB."); return; }
    const detectedType = ACCEPTED_TYPES[file.type];
    if (!detectedType) { setUploadError("Unsupported file type. Upload an image, PDF, or video."); return; }
    const preview = file.type.startsWith("image/") ? URL.createObjectURL(file) : null;
    setFileInfo({ file, preview, fileType: detectedType as "image" | "pdf" | "video" });
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDragActive(false);
    const file = e.dataTransfer.files[0]; if (file) processFile(file);
  }, [processFile]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (file) processFile(file);
  };

  const clearFile = () => {
    if (fileInfo?.preview) URL.revokeObjectURL(fileInfo.preview);
    setFileInfo(null); setUploadError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const uploadFileToServer = async (file: File): Promise<{ fileUrl: string; fileMimeType: string; fileSize: number }> => {
    const formData = new FormData();
    formData.append("file", file);
    const response = await fetch("/api/upload", { method: "POST", body: formData });
    if (!response.ok) {
      const err = await response.json().catch(() => ({ message: "Upload failed" }));
      throw new Error(err.message || "Upload failed");
    }
    return response.json();
  };

  const onSubmit = async (data: ShareFormValues) => {
    setUploadError(null);
    let resolvedFileUrl: string | null = null;
    let resolvedFileType: "image" | "pdf" | "video" = "image";
    let resolvedMimeType = "image/jpeg";
    let resolvedFileSize = 0;
    let resolvedFileName = "file";

    if (uploadMode === "file") {
      if (!fileInfo) { setUploadError("Please select a file to upload."); return; }
      setIsUploading(true);
      try {
        const result = await uploadFileToServer(fileInfo.file);
        resolvedFileUrl = result.fileUrl;
        resolvedMimeType = result.fileMimeType;
        resolvedFileSize = result.fileSize;
        resolvedFileType = fileInfo.fileType;
        resolvedFileName = fileInfo.file.name;
      } catch (err: any) {
        setUploadError(err.message || "Upload failed. Please try again.");
        setIsUploading(false); return;
      }
      setIsUploading(false);
    } else {
      if (!fileUrl.trim()) { setUploadError("Please enter a file URL."); return; }
      resolvedFileUrl = fileUrl.trim();
      resolvedFileType = fileUrlType;
      resolvedMimeType = fileUrlType === "pdf" ? "application/pdf" : fileUrlType === "video" ? "video/mp4" : "image/jpeg";
      resolvedFileSize = 0;
      resolvedFileName = fileUrl.split("/").pop() || "file";
    }

    const expiresInHours: number | null = data.expiresIn === "never" ? null : parseInt(data.expiresIn, 10);
    createPreview.mutate({ data: { freelancerName: data.freelancerName, agencyName: data.agencyName || null, fileName: resolvedFileName, fileType: resolvedFileType, fileUrl: resolvedFileUrl, password: data.password || null, fileMimeType: resolvedMimeType, fileSize: resolvedFileSize, expiresInHours } as any }, {
      onSuccess: (response) => {
        localStorage.setItem(LS_KEY, data.freelancerName);
        saveFileHistory({
          id: response.id,
          ownerToken: (response as any).ownerToken,
          fileName: resolvedFileName,
          fileType: resolvedFileType,
        });
        const url = new URL(`/preview/${response.id}`, window.location.origin).toString();
        setSuccessData({ url, id: response.id, ownerToken: (response as any).ownerToken, expiresAt: (response as any).expiresAt ?? null });
      },
      onError: () => setUploadError("Failed to create preview link. Please try again."),
    });
  };

  const copyLink = () => {
    if (successData) { navigator.clipboard.writeText(successData.url); setCopied("link"); setTimeout(() => setCopied(null), 2000); }
  };
  const copyUID = () => {
    if (successData) { navigator.clipboard.writeText(successData.ownerToken); setCopied("uid"); setTimeout(() => setCopied(null), 2000); }
  };

  const isSubmitting = isUploading || createPreview.isPending;

  /* ─── SUCCESS SCREEN ──────────────────────────────────────────────── */
  if (successData) {
    const dashboardUrl = `/dashboard?token=${successData.ownerToken}`;
    return (
      <div className="flex flex-col min-h-screen" style={{ background: "#06081a" }}>
        <Navbar />
        <main className="flex-1 flex items-center justify-center px-4 py-12 relative overflow-hidden">
          {/* Background glow */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-green-500/8 rounded-full blur-[120px]" />
            <div className="absolute top-1/3 left-1/3 w-[400px] h-[400px] bg-indigo-600/10 rounded-full blur-[100px]" />
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="w-full max-w-xl relative"
          >
            {/* Glowing top border */}
            <div className="absolute -inset-px rounded-2xl bg-gradient-to-r from-green-500/30 via-indigo-500/30 to-violet-500/30 blur-sm" />
            <div className="relative rounded-2xl border border-white/10 bg-[#0d1025]/95 backdrop-blur-xl overflow-hidden">

              {/* Header */}
              <div className="relative px-6 pt-8 pb-6 text-center border-b border-white/5">
                <div className="absolute inset-0 bg-gradient-to-b from-green-500/5 to-transparent pointer-events-none" />
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 300, damping: 20 }}
                  className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-green-400/20 to-emerald-600/20 border border-green-500/30 flex items-center justify-center mb-4 relative"
                >
                  <div className="absolute inset-0 rounded-full bg-green-500/10 animate-ping" />
                  <Check className="w-7 h-7 text-green-400 relative z-10" />
                </motion.div>
                <h2 className="text-2xl font-black text-white mb-1">Link is live!</h2>
                <p className="text-white/50 text-sm">Your secure preview is ready to share with your client.</p>
                {successData.expiresAt && (
                  <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-medium">
                    <Clock className="w-3 h-3" />
                    Expires {new Date(successData.expiresAt).toLocaleString()}
                  </div>
                )}
              </div>

              <div className="p-6 space-y-4">
                {/* Preview link */}
                <div>
                  <p className="text-[10px] text-white/30 font-semibold uppercase tracking-widest mb-2">Preview Link</p>
                  <div className="flex items-center gap-2 p-1.5 rounded-xl border border-white/10 bg-white/3">
                    <input readOnly value={successData.url}
                      className="flex-1 bg-transparent text-white/70 text-xs px-2 outline-none min-w-0 truncate" />
                    <button onClick={copyLink}
                      className={`shrink-0 h-8 px-3 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${copied === "link" ? "bg-green-600/20 text-green-400 border border-green-500/30" : "bg-indigo-600 hover:bg-indigo-500 text-white"}`}>
                      {copied === "link" ? <><Check className="w-3 h-3" />Copied!</> : <><Copy className="w-3 h-3" />Copy</>}
                    </button>
                  </div>
                </div>

                {/* Tracking UID */}
                <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <ShieldCheck className="w-4 h-4 text-indigo-400" />
                    <p className="text-xs font-bold text-indigo-300 uppercase tracking-wider">Your Private Tracking UID</p>
                  </div>
                  <p className="text-xs text-white/40 mb-3 leading-relaxed">
                    Save this — paste it in your Dashboard to see every visitor's name, IP, city, and timestamp.
                  </p>
                  <div className="flex items-center gap-2 p-1.5 rounded-lg border border-indigo-500/20 bg-black/20">
                    <input readOnly value={successData.ownerToken}
                      className="flex-1 bg-transparent text-indigo-300/80 text-xs font-mono px-2 outline-none min-w-0 truncate" />
                    <button onClick={copyUID}
                      className={`shrink-0 h-7 px-3 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 ${copied === "uid" ? "bg-green-600/20 text-green-400" : "bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 border border-indigo-500/30"}`}>
                      {copied === "uid" ? <><Check className="w-3 h-3" />Copied</> : <><Copy className="w-3 h-3" />Copy</>}
                    </button>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="grid grid-cols-2 gap-2">
                  <a href={`/preview/${successData.id}`} target="_blank" rel="noopener noreferrer"
                    className="h-10 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors">
                    <ExternalLink className="w-3.5 h-3.5" />Open Preview
                  </a>
                  <Link href={dashboardUrl}>
                    <button className="w-full h-10 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-all">
                      <BarChart2 className="w-3.5 h-3.5" />View Analytics
                    </button>
                  </Link>
                </div>

                {/* Social sharing */}
                <div>
                  <p className="text-[10px] text-white/25 font-medium uppercase tracking-widest text-center mb-2 flex items-center justify-center gap-1.5">
                    <Share2 className="w-3 h-3" /> Share via
                  </p>
                  <div className="grid grid-cols-4 gap-2">
                    <a href={`https://twitter.com/intent/tweet?text=${encodeURIComponent("Check out my secure preview 👇")}&url=${encodeURIComponent(successData.url)}`}
                      target="_blank" rel="noopener noreferrer" title="X / Twitter"
                      className="h-9 rounded-lg bg-white/5 hover:bg-white/10 border border-white/8 flex items-center justify-center transition-colors group">
                      <svg className="w-4 h-4 text-white/50 group-hover:text-white transition-colors" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                    </a>
                    <a href={`https://wa.me/?text=${encodeURIComponent(`View my secure preview: ${successData.url}`)}`}
                      target="_blank" rel="noopener noreferrer" title="WhatsApp"
                      className="h-9 rounded-lg bg-white/5 hover:bg-[#25d366]/20 border border-white/8 hover:border-[#25d366]/40 flex items-center justify-center transition-colors group">
                      <svg className="w-4 h-4 text-white/50 group-hover:text-[#25d366] transition-colors" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                    </a>
                    <a href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(successData.url)}`}
                      target="_blank" rel="noopener noreferrer" title="LinkedIn"
                      className="h-9 rounded-lg bg-white/5 hover:bg-[#0077b5]/20 border border-white/8 hover:border-[#0077b5]/40 flex items-center justify-center transition-colors group">
                      <svg className="w-4 h-4 text-white/50 group-hover:text-[#0077b5] transition-colors" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                    </a>
                    <button onClick={() => { if (navigator.share) { navigator.share({ title: "Secure Preview", url: successData.url }).catch(() => {}); } else { window.open(`https://t.me/share/url?url=${encodeURIComponent(successData.url)}`, "_blank"); } }}
                      className="h-9 rounded-lg bg-white/5 hover:bg-indigo-500/20 border border-white/8 hover:border-indigo-500/40 flex items-center justify-center transition-colors group">
                      <Share2 className="w-3.5 h-3.5 text-white/50 group-hover:text-indigo-400 transition-colors" />
                    </button>
                  </div>
                </div>

                <button
                  className="w-full h-7 text-white/25 hover:text-white/50 text-xs transition-colors"
                  onClick={() => { setSuccessData(null); setFileInfo(null); setFileUrl(""); form.reset({ freelancerName: form.getValues("freelancerName"), agencyName: "", password: "", expiresIn: "24" }); }}
                >
                  + Create another preview
                </button>
              </div>
            </div>
          </motion.div>
        </main>
        <Footer />
      </div>
    );
  }

  /* ─── FORM ────────────────────────────────────────────────────────── */
  return (
    <div className="flex flex-col min-h-screen" style={{ background: "#06081a", color: "#fff" }}>
      <Navbar />

      <main className="flex-1 relative overflow-hidden">
        {/* Background glows */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-20 left-1/4 w-[500px] h-[500px] bg-indigo-700/15 rounded-full blur-[120px]" />
          <div className="absolute top-1/3 right-0 w-[400px] h-[400px] bg-violet-700/10 rounded-full blur-[100px]" />
          <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-indigo-900/20 rounded-full blur-[80px]" />
        </div>

        <div className="container mx-auto px-4 md:px-6 py-10 md:py-16 relative z-10">
          {/* Page header */}
          <div className="text-center mb-8 md:mb-12">
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 text-xs font-medium mb-4">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              Free forever · No credit card needed
            </motion.div>
            <motion.h1 initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.05 }}
              className="text-2xl sm:text-4xl md:text-5xl font-black text-white mb-3 tracking-tight">
              Create a Secure Preview
            </motion.h1>
            <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}
              className="text-white/50 text-sm sm:text-base max-w-lg mx-auto">
              Upload your file, set the rules, and send a protected link — your client views, but can't steal.
            </motion.p>
          </div>

          {/* Main layout: form + sidebar */}
          <div className="grid xl:grid-cols-[1fr_340px] gap-6 max-w-5xl mx-auto items-start">

            {/* ── Form Card ── */}
            <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.15 }}>
              {/* Step indicators */}
              <div className="flex items-center gap-3 sm:gap-5 mb-5 px-1">
                <StepBadge n={1} label="Your info" active />
                <div className="flex-1 h-px bg-white/8" />
                <StepBadge n={2} label="Your file" active={!!(fileInfo || fileUrl)} />
                <div className="flex-1 h-px bg-white/8" />
                <StepBadge n={3} label="Options" active={false} />
              </div>

              {/* The glowing card */}
              <div className="relative">
                <div className="absolute -inset-px rounded-2xl bg-gradient-to-br from-indigo-500/20 via-violet-500/10 to-transparent" />
                <div className="relative rounded-2xl border border-white/10 bg-[#0d1025]/80 backdrop-blur-sm overflow-hidden">

                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="divide-y divide-white/5">

                      {/* Section 1 — Your Profile */}
                      <div className="p-5 sm:p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center">
                              <User className="w-3.5 h-3.5 text-indigo-400" />
                            </div>
                            <p className="text-sm font-semibold text-white">Your Profile</p>
                          </div>
                          <AnimatePresence>
                            {usernameSaved && (
                              <motion.span initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
                                className="text-xs text-green-400 flex items-center gap-1 font-medium">
                                <Check className="w-3 h-3" />Saved
                              </motion.span>
                            )}
                          </AnimatePresence>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <FormField control={form.control} name="freelancerName" render={({ field, fieldState }) => (
                            <div>
                              <label className="text-xs text-white/40 font-medium mb-1.5 block">Your Name <span className="text-red-400">*</span></label>
                              <input placeholder="John Doe" {...field}
                                className="w-full h-10 rounded-xl bg-white/5 border border-white/10 focus:border-indigo-500 text-white text-sm px-3 outline-none transition-colors placeholder-white/20" />
                              {fieldState.error && <p className="text-red-400 text-xs mt-1">{fieldState.error.message}</p>}
                            </div>
                          )} />
                          <FormField control={form.control} name="agencyName" render={({ field }) => (
                            <div>
                              <label className="text-xs text-white/40 font-medium mb-1.5 block">Agency <span className="text-white/20 font-normal">(optional)</span></label>
                              <input placeholder="Design Studio LLC" {...field}
                                className="w-full h-10 rounded-xl bg-white/5 border border-white/10 focus:border-indigo-500 text-white text-sm px-3 outline-none transition-colors placeholder-white/20" />
                            </div>
                          )} />
                        </div>
                        <p className="text-xs text-white/25 mt-2">Your name appears as a watermark on the client's preview.</p>
                      </div>

                      {/* Section 2 — File */}
                      <div className="p-5 sm:p-6">
                        <div className="flex items-center gap-2 mb-4">
                          <div className="w-6 h-6 rounded-lg bg-violet-500/20 border border-violet-500/30 flex items-center justify-center">
                            <Upload className="w-3.5 h-3.5 text-violet-400" />
                          </div>
                          <p className="text-sm font-semibold text-white">Your File</p>
                        </div>

                        {/* Mode toggle */}
                        <div className="grid grid-cols-2 gap-2 mb-4 p-1 rounded-xl bg-white/3 border border-white/8">
                          <button type="button" onClick={() => { setUploadMode("file"); setUploadError(null); }}
                            className={`flex items-center justify-center gap-2 rounded-lg py-2 text-xs font-semibold transition-all ${uploadMode === "file" ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20" : "text-white/40 hover:text-white/70"}`}>
                            <HardDrive className="w-3.5 h-3.5" />Upload from PC
                          </button>
                          <button type="button" onClick={() => { setUploadMode("url"); setUploadError(null); }}
                            className={`flex items-center justify-center gap-2 rounded-lg py-2 text-xs font-semibold transition-all ${uploadMode === "url" ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20" : "text-white/40 hover:text-white/70"}`}>
                            <Link2 className="w-3.5 h-3.5" />Use a URL
                          </button>
                        </div>

                        {uploadMode === "file" ? (
                          !fileInfo ? (
                            <div
                              className={`relative rounded-xl border-2 border-dashed p-8 text-center cursor-pointer transition-all ${dragActive ? "border-indigo-500 bg-indigo-500/10" : "border-white/10 hover:border-indigo-500/50 hover:bg-indigo-500/5"}`}
                              onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                              onDragLeave={() => setDragActive(false)}
                              onDrop={handleDrop}
                              onClick={() => fileInputRef.current?.click()}
                            >
                              <input ref={fileInputRef} type="file" className="hidden" accept="image/*,application/pdf,video/*" onChange={handleFileInput} />
                              <div className="flex flex-col items-center gap-3">
                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${dragActive ? "bg-indigo-500/20 border border-indigo-500/40" : "bg-white/5 border border-white/10"}`}>
                                  <Upload className={`w-6 h-6 transition-colors ${dragActive ? "text-indigo-400" : "text-white/30"}`} />
                                </div>
                                <div>
                                  <p className="font-semibold text-white text-sm">Drop your file here</p>
                                  <p className="text-white/40 text-xs mt-0.5">or click to browse</p>
                                </div>
                                <div className="flex items-center gap-2 flex-wrap justify-center">
                                  {[{ icon: <FileImage className="w-3 h-3" />, label: "Images" }, { icon: <FileText className="w-3 h-3" />, label: "PDFs" }, { icon: <FileVideo className="w-3 h-3" />, label: "Videos" }].map(t => (
                                    <span key={t.label} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-white/40 text-[10px] font-medium">
                                      {t.icon}{t.label}
                                    </span>
                                  ))}
                                  <span className="text-[10px] text-white/20">— up to 100 MB</span>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="rounded-xl border border-green-500/20 bg-green-500/5 p-4">
                              <div className="flex items-center gap-3">
                                {fileInfo.preview ? (
                                  <img src={fileInfo.preview} alt="" className="w-14 h-14 rounded-lg object-cover shrink-0 border border-white/10" />
                                ) : (
                                  <div className="w-14 h-14 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                                    {fileInfo.fileType === "pdf" ? <FileText className="w-7 h-7 text-red-400" /> : <FileVideo className="w-7 h-7 text-blue-400" />}
                                  </div>
                                )}
                                <div className="flex-1 min-w-0">
                                  <p className="font-semibold text-sm text-white truncate">{fileInfo.file.name}</p>
                                  <p className="text-xs text-white/40 mt-0.5">{fileInfo.fileType.toUpperCase()} · {formatBytes(fileInfo.file.size)}</p>
                                  <div className="mt-1.5 flex items-center gap-1.5">
                                    <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                                    <span className="text-xs text-green-400 font-medium">Ready to upload</span>
                                  </div>
                                </div>
                                <button type="button" onClick={clearFile}
                                  className="shrink-0 w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-white/40 hover:text-white transition-colors">
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          )
                        ) : (
                          <div className="space-y-3">
                            <div>
                              <label className="text-xs text-white/40 font-medium mb-1.5 block">File URL</label>
                              <input placeholder="https://example.com/design.png" value={fileUrl} onChange={(e) => setFileUrl(e.target.value)}
                                className="w-full h-10 rounded-xl bg-white/5 border border-white/10 focus:border-indigo-500 text-white text-sm px-3 outline-none transition-colors placeholder-white/20" />
                            </div>
                            <div>
                              <label className="text-xs text-white/40 font-medium mb-1.5 block">File Type</label>
                              <Select value={fileUrlType} onValueChange={(v) => setFileUrlType(v as "image" | "pdf" | "video")}>
                                <SelectTrigger className="h-10 rounded-xl bg-white/5 border-white/10 text-white text-sm"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="image">Image</SelectItem>
                                  <SelectItem value="pdf">PDF Document</SelectItem>
                                  <SelectItem value="video">Video</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        )}

                        {uploadError && (
                          <div className="mt-3 flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                            <X className="w-4 h-4 text-red-400 shrink-0" />
                            <p className="text-xs text-red-400 font-medium">{uploadError}</p>
                          </div>
                        )}
                      </div>

                      {/* Section 3 — Options */}
                      <div className="p-5 sm:p-6">
                        <div className="flex items-center gap-2 mb-4">
                          <div className="w-6 h-6 rounded-lg bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center">
                            <Clock className="w-3.5 h-3.5 text-cyan-400" />
                          </div>
                          <p className="text-sm font-semibold text-white">Options</p>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <FormField control={form.control} name="expiresIn" render={({ field }) => (
                            <div>
                              <label className="text-xs text-white/40 font-medium mb-1.5 flex items-center gap-1.5 block">
                                <Clock className="w-3 h-3" />Link Expiry
                              </label>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <SelectTrigger className="h-10 rounded-xl bg-white/5 border-white/10 text-white text-sm"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  {EXPIRY_OPTIONS.map((o) => (<SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>))}
                                </SelectContent>
                              </Select>
                              <p className="text-[10px] text-white/25 mt-1">File auto-deletes when expired.</p>
                            </div>
                          )} />
                          <FormField control={form.control} name="password" render={({ field }) => (
                            <div>
                              <label className="text-xs text-white/40 font-medium mb-1.5 flex items-center gap-1.5 block">
                                <Lock className="w-3 h-3" />Password <span className="text-white/20 font-normal">(optional)</span>
                              </label>
                              <input type="password" placeholder="Leave blank for none" autoComplete="new-password" {...field}
                                className="w-full h-10 rounded-xl bg-white/5 border border-white/10 focus:border-indigo-500 text-white text-sm px-3 outline-none transition-colors placeholder-white/20" />
                            </div>
                          )} />
                        </div>
                      </div>

                      {/* Submit button */}
                      <div className="p-5 sm:p-6">
                        <button type="submit" disabled={isSubmitting}
                          className="w-full h-12 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-sm transition-all shadow-xl shadow-indigo-500/20 hover:shadow-indigo-500/40 hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0 flex items-center justify-center gap-2">
                          {isUploading ? (
                            <><Loader2 className="w-4 h-4 animate-spin" />Uploading file...</>
                          ) : createPreview.isPending ? (
                            <><Loader2 className="w-4 h-4 animate-spin" />Generating link...</>
                          ) : (
                            <>Generate Secure Link <ArrowRight className="w-4 h-4" /></>
                          )}
                        </button>
                        <p className="text-center text-[10px] text-white/20 mt-3">
                          By sharing, your client will be asked to consent to visit tracking.
                        </p>
                      </div>

                    </form>
                  </Form>
                </div>
              </div>
            </motion.div>

            {/* ── Side Panel ── */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="hidden xl:flex flex-col gap-4"
            >
              <p className="text-xs text-white/30 font-semibold uppercase tracking-widest px-1">What you get</p>
              {sideFeatures.map((f, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 + i * 0.07 }}
                  className={`rounded-xl border ${f.bg} p-4 flex gap-3 items-start`}>
                  <div className={`w-9 h-9 rounded-lg ${f.bg} flex items-center justify-center shrink-0 ${f.color}`}>
                    {f.icon}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white mb-0.5">{f.title}</p>
                    <p className="text-xs text-white/45 leading-relaxed">{f.desc}</p>
                  </div>
                </motion.div>
              ))}

              {/* Client view mockup */}
              <div className="rounded-xl border border-white/8 bg-white/3 p-4 mt-2">
                <p className="text-xs text-white/30 font-semibold uppercase tracking-widest mb-3">What your client sees</p>
                <div className="rounded-lg border border-white/8 bg-black/30 p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-400" />
                    <p className="text-xs text-white/60 font-medium">Enter your name to view</p>
                  </div>
                  <div className="h-7 rounded-md bg-white/5 border border-white/8 flex items-center px-2">
                    <span className="text-xs text-white/25">Your full name...</span>
                  </div>
                  <div className="h-7 rounded-md bg-indigo-600/50 flex items-center justify-center">
                    <span className="text-xs text-indigo-200 font-semibold">View Preview</span>
                  </div>
                  <p className="text-[9px] text-white/20 text-center">Viewing is logged · Screenshots are traceable</p>
                </div>
              </div>
            </motion.div>

          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
