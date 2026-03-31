import { useState, useRef, useCallback, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useCreatePreview } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Copy, Check, ExternalLink, ArrowRight, Loader2, Upload, FileImage, FileText,
  FileVideo, X, Link2, HardDrive, BarChart2, User, Clock, ShieldCheck
} from "lucide-react";

const LS_KEY = "ps_username";

const MAX_FILE_SIZE = 100 * 1024 * 1024;

const ACCEPTED_TYPES: Record<string, string> = {
  "image/jpeg": "image",
  "image/png": "image",
  "image/gif": "image",
  "image/webp": "image",
  "image/svg+xml": "image",
  "application/pdf": "pdf",
  "video/mp4": "video",
  "video/webm": "video",
  "video/ogg": "video",
  "video/quicktime": "video",
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

function FileIcon({ type }: { type: "image" | "pdf" | "video" }) {
  if (type === "pdf") return <FileText className="w-8 h-8 text-red-400" />;
  if (type === "video") return <FileVideo className="w-8 h-8 text-blue-400" />;
  return <FileImage className="w-8 h-8 text-indigo-400" />;
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

type SuccessData = { url: string; id: string; ownerToken: string; expiresAt: string | null };

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
    defaultValues: {
      freelancerName: savedName,
      agencyName: "",
      password: "",
      expiresIn: "24",
    },
  });

  const freelancerNameValue = form.watch("freelancerName");
  useEffect(() => {
    clearTimeout(saveTimer.current);
    if (freelancerNameValue && freelancerNameValue.length >= 2) {
      saveTimer.current = setTimeout(() => {
        localStorage.setItem(LS_KEY, freelancerNameValue);
        setUsernameSaved(true);
        setTimeout(() => setUsernameSaved(false), 1500);
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

    const expiresInHours: number | null =
      data.expiresIn === "never" ? null : parseInt(data.expiresIn, 10);

    createPreview.mutate({
      data: {
        freelancerName: data.freelancerName,
        agencyName: data.agencyName || null,
        fileName: resolvedFileName,
        fileType: resolvedFileType,
        fileUrl: resolvedFileUrl,
        password: data.password || null,
        fileMimeType: resolvedMimeType,
        fileSize: resolvedFileSize,
        expiresInHours,
      } as any,
    }, {
      onSuccess: (response) => {
        localStorage.setItem(LS_KEY, data.freelancerName);
        const url = new URL(`/preview/${response.id}`, window.location.origin).toString();
        setSuccessData({
          url,
          id: response.id,
          ownerToken: (response as any).ownerToken,
          expiresAt: (response as any).expiresAt ?? null,
        });
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

  if (successData) {
    const dashboardUrl = `/dashboard?id=${successData.id}&token=${successData.ownerToken}`;
    return (
      <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 py-12 md:py-24">
          <div className="max-w-2xl mx-auto">
            <Card className="shadow-2xl border-indigo-100 dark:border-indigo-900/50 bg-white dark:bg-slate-900">
              <CardHeader className="text-center pb-2">
                <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center mb-4">
                  <Check className="w-8 h-8" />
                </div>
                <CardTitle className="text-2xl">Ready to share!</CardTitle>
                <CardDescription className="text-base mt-2">
                  Your secure preview link has been generated.
                  {successData.expiresAt && (
                    <span className="block mt-1 text-amber-600 dark:text-amber-400 font-medium text-sm">
                      Expires {new Date(successData.expiresAt).toLocaleString()}
                    </span>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-5">
                {/* Preview link */}
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Preview Link</p>
                  <div className="flex items-center space-x-2 p-1 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-950">
                    <Input
                      readOnly
                      value={successData.url}
                      className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-slate-600 dark:text-slate-400 text-sm"
                    />
                    <Button variant="secondary" className="shrink-0" onClick={copyLink}>
                      {copied === "link" ? <Check className="w-4 h-4 mr-1.5 text-green-500" /> : <Copy className="w-4 h-4 mr-1.5" />}
                      {copied === "link" ? "Copied!" : "Copy"}
                    </Button>
                  </div>
                </div>

                {/* Tracking UID */}
                <div className="bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800/60 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <ShieldCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <p className="text-xs font-semibold text-indigo-700 dark:text-indigo-300 uppercase tracking-wider">Your Tracking UID</p>
                  </div>
                  <p className="text-xs text-indigo-600/70 dark:text-indigo-400/70 mb-3">
                    Save this — use it to view who opened your preview, when, and from where.
                  </p>
                  <div className="flex items-center space-x-2 p-1 border border-indigo-200 dark:border-indigo-700 rounded-lg bg-white dark:bg-slate-950">
                    <Input
                      readOnly
                      value={successData.ownerToken}
                      className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-slate-700 dark:text-slate-300 text-sm font-mono"
                    />
                    <Button variant="secondary" className="shrink-0 bg-indigo-100 hover:bg-indigo-200 dark:bg-indigo-900 dark:hover:bg-indigo-800 text-indigo-700 dark:text-indigo-300" onClick={copyUID}>
                      {copied === "uid" ? <Check className="w-4 h-4 mr-1.5 text-green-500" /> : <Copy className="w-4 h-4 mr-1.5" />}
                      {copied === "uid" ? "Copied!" : "Copy"}
                    </Button>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col sm:flex-row gap-3 pt-4 border-t bg-slate-50/50 dark:bg-slate-900/20 rounded-b-xl">
                <Link href={`/preview/${successData.id}`} target="_blank" className="w-full">
                  <Button variant="outline" className="w-full">
                    <ExternalLink className="w-4 h-4 mr-2" />Open Preview
                  </Button>
                </Link>
                <Link href={dashboardUrl} className="w-full">
                  <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white">
                    <BarChart2 className="w-4 h-4 mr-2" />View Analytics
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  className="w-full"
                  onClick={() => { setSuccessData(null); setFileInfo(null); setFileUrl(""); form.reset({ freelancerName: form.getValues("freelancerName"), agencyName: "", password: "", expiresIn: "24" }); }}
                >
                  Create Another
                </Button>
              </CardFooter>
            </Card>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950">
      <Navbar />

      <main className="flex-1 container mx-auto px-4 py-12 md:py-20">
        <div className="max-w-2xl mx-auto">

          <div className="mb-10 text-center">
            <h1 className="text-3xl md:text-4xl font-bold mb-3 tracking-tight">Create Secure Preview</h1>
            <p className="text-muted-foreground text-lg">Generate a protected, view-only link for your client.</p>
          </div>

          <Card className="shadow-xl border-slate-200/60 dark:border-slate-800">
            <CardContent className="pt-6">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

                  {/* Your Info */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-muted-foreground" /> Your Profile
                      </p>
                      {usernameSaved && (
                        <span className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                          <Check className="w-3 h-3" /> Name saved
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="freelancerName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Your Name</FormLabel>
                            <FormControl>
                              <Input placeholder="John Doe" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="agencyName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Agency <span className="text-muted-foreground font-normal">(optional)</span></FormLabel>
                            <FormControl>
                              <Input placeholder="Design Studio LLC" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">Your name is automatically remembered in this browser.</p>
                  </div>

                  {/* File Section */}
                  <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-4">
                    <div>
                      <p className="text-sm font-medium text-foreground mb-2">File Source</p>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => { setUploadMode("file"); setUploadError(null); }}
                          className={`flex items-center justify-center gap-2 rounded-lg border py-2.5 text-sm font-medium transition-all ${uploadMode === "file" ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300" : "border-slate-200 dark:border-slate-700 text-muted-foreground hover:border-slate-300"}`}
                        >
                          <HardDrive className="w-4 h-4" />Upload from PC
                        </button>
                        <button
                          type="button"
                          onClick={() => { setUploadMode("url"); setUploadError(null); }}
                          className={`flex items-center justify-center gap-2 rounded-lg border py-2.5 text-sm font-medium transition-all ${uploadMode === "url" ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300" : "border-slate-200 dark:border-slate-700 text-muted-foreground hover:border-slate-300"}`}
                        >
                          <Link2 className="w-4 h-4" />Use a URL
                        </button>
                      </div>
                    </div>

                    {uploadMode === "file" ? (
                      !fileInfo ? (
                        <div
                          className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer ${dragActive ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-950/30" : "border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-700 hover:bg-slate-50 dark:hover:bg-slate-900/50"}`}
                          onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                          onDragLeave={() => setDragActive(false)}
                          onDrop={handleDrop}
                          onClick={() => fileInputRef.current?.click()}
                        >
                          <input ref={fileInputRef} type="file" className="hidden" accept="image/*,application/pdf,video/*" onChange={handleFileInput} />
                          <div className="flex flex-col items-center gap-3">
                            <div className="w-14 h-14 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                              <Upload className="w-6 h-6 text-slate-400" />
                            </div>
                            <div>
                              <p className="font-semibold text-foreground">Drop your file here</p>
                              <p className="text-sm text-muted-foreground mt-1">or click to browse</p>
                            </div>
                            <p className="text-xs text-muted-foreground bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">Images, PDFs, Videos — up to 100 MB</p>
                          </div>
                        </div>
                      ) : (
                        <div className="border rounded-xl p-4 bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700">
                          <div className="flex items-center gap-4">
                            {fileInfo.preview ? (
                              <img src={fileInfo.preview} alt="preview" className="w-16 h-16 rounded-lg object-cover border shrink-0" />
                            ) : (
                              <div className="w-16 h-16 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                                <FileIcon type={fileInfo.fileType} />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">{fileInfo.file.name}</p>
                              <p className="text-xs text-muted-foreground mt-0.5">{fileInfo.fileType.toUpperCase()} · {formatBytes(fileInfo.file.size)}</p>
                              <div className="mt-1.5 flex items-center gap-1.5">
                                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                <span className="text-xs text-green-600 dark:text-green-400 font-medium">Ready to upload</span>
                              </div>
                            </div>
                            <button type="button" onClick={clearFile} className="shrink-0 p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-muted-foreground transition-colors">
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      )
                    ) : (
                      <div className="space-y-3">
                        <div>
                          <label className="text-sm font-medium text-foreground block mb-1.5">File URL</label>
                          <Input placeholder="https://example.com/design.png" value={fileUrl} onChange={(e) => setFileUrl(e.target.value)} />
                        </div>
                        <div>
                          <label className="text-sm font-medium text-foreground block mb-1.5">File Type</label>
                          <Select value={fileUrlType} onValueChange={(v) => setFileUrlType(v as "image" | "pdf" | "video")}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="image">Image</SelectItem>
                              <SelectItem value="pdf">PDF Document</SelectItem>
                              <SelectItem value="video">Video</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    )}

                    {uploadError && <p className="text-sm text-red-500 font-medium">{uploadError}</p>}
                  </div>

                  {/* Expiration + Password */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                    <FormField
                      control={form.control}
                      name="expiresIn"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                            Link Expiry
                          </FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select expiry" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {EXPIRY_OPTIONS.map((o) => (
                                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <p className="text-xs text-muted-foreground">File is auto-deleted when the link expires.</p>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password <span className="text-muted-foreground font-normal">(optional)</span></FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="Leave blank for no password" autoComplete="new-password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-12 text-base bg-indigo-600 hover:bg-indigo-700 text-white font-semibold transition-all mt-2"
                    disabled={isSubmitting}
                  >
                    {isUploading ? (
                      <><Loader2 className="w-5 h-5 mr-2 animate-spin" />Uploading file...</>
                    ) : createPreview.isPending ? (
                      <><Loader2 className="w-5 h-5 mr-2 animate-spin" />Generating Link...</>
                    ) : (
                      <>Generate Secure Link<ArrowRight className="w-5 h-5 ml-2" /></>
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}
