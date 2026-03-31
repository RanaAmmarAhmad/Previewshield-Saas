import { useState, useRef, useCallback } from "react";
import { Link } from "wouter";
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
import { Copy, Check, ExternalLink, ArrowRight, Loader2, Upload, FileImage, FileText, FileVideo, X, Link2, HardDrive } from "lucide-react";

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100 MB

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

const shareSchema = z.object({
  freelancerName: z.string().min(2, "Name is required"),
  agencyName: z.string().optional(),
  clientName: z.string().min(2, "Client name is required"),
  password: z.string().optional(),
});

type ShareFormValues = z.infer<typeof shareSchema>;

type UploadMode = "file" | "url";

type FileInfo = {
  file: File;
  preview: string | null;
  fileType: "image" | "pdf" | "video";
};

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

export default function Share() {
  const [copied, setCopied] = useState(false);
  const [successData, setSuccessData] = useState<{ url: string; id: string } | null>(null);
  const [uploadMode, setUploadMode] = useState<UploadMode>("file");
  const [fileInfo, setFileInfo] = useState<FileInfo | null>(null);
  const [fileUrl, setFileUrl] = useState("");
  const [fileUrlType, setFileUrlType] = useState<"image" | "pdf" | "video">("image");
  const [dragActive, setDragActive] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const createPreview = useCreatePreview();

  const form = useForm<ShareFormValues>({
    resolver: zodResolver(shareSchema),
    defaultValues: {
      freelancerName: "",
      agencyName: "",
      clientName: "",
      password: "",
    },
  });

  const processFile = useCallback((file: File) => {
    setUploadError(null);

    if (file.size > MAX_FILE_SIZE) {
      setUploadError("File is too large. Maximum size is 100 MB.");
      return;
    }

    const detectedType = ACCEPTED_TYPES[file.type];
    if (!detectedType) {
      setUploadError("Unsupported file type. Upload an image, PDF, or video.");
      return;
    }

    const preview = file.type.startsWith("image/")
      ? URL.createObjectURL(file)
      : null;

    setFileInfo({
      file,
      preview,
      fileType: detectedType as "image" | "pdf" | "video",
    });
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }, [processFile]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const clearFile = () => {
    if (fileInfo?.preview) URL.revokeObjectURL(fileInfo.preview);
    setFileInfo(null);
    setUploadError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const uploadFileToServer = async (file: File): Promise<{ fileUrl: string; fileMimeType: string; fileSize: number }> => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

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
      if (!fileInfo) {
        setUploadError("Please select a file to upload.");
        return;
      }
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
        setIsUploading(false);
        return;
      }
      setIsUploading(false);
    } else {
      if (!fileUrl.trim()) {
        setUploadError("Please enter a file URL.");
        return;
      }
      resolvedFileUrl = fileUrl.trim();
      resolvedFileType = fileUrlType;
      resolvedMimeType =
        fileUrlType === "pdf" ? "application/pdf" :
        fileUrlType === "video" ? "video/mp4" :
        "image/jpeg";
      resolvedFileSize = 0;
      resolvedFileName = fileUrl.split("/").pop() || "file";
    }

    createPreview.mutate({
      data: {
        freelancerName: data.freelancerName,
        agencyName: data.agencyName || null,
        clientName: data.clientName,
        fileName: resolvedFileName,
        fileType: resolvedFileType,
        fileUrl: resolvedFileUrl,
        password: data.password || null,
        fileMimeType: resolvedMimeType,
        fileSize: resolvedFileSize,
      }
    }, {
      onSuccess: (response) => {
        const url = new URL(`/preview/${response.id}`, window.location.origin).toString();
        setSuccessData({ url, id: response.id });
      },
      onError: () => {
        setUploadError("Failed to create preview link. Please try again.");
      }
    });
  };

  const copyToClipboard = () => {
    if (successData) {
      navigator.clipboard.writeText(successData.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const isSubmitting = isUploading || createPreview.isPending;

  if (successData) {
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
                  Your secure preview link has been generated. Share it with your client.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2 p-1 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-950">
                  <Input
                    readOnly
                    value={successData.url}
                    className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-slate-600 dark:text-slate-400 text-sm"
                  />
                  <Button
                    variant="secondary"
                    className="shrink-0 font-medium"
                    onClick={copyToClipboard}
                  >
                    {copied ? <Check className="w-4 h-4 mr-2 text-green-500" /> : <Copy className="w-4 h-4 mr-2" />}
                    {copied ? "Copied!" : "Copy"}
                  </Button>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col sm:flex-row gap-3 pt-4 border-t bg-slate-50/50 dark:bg-slate-900/20 rounded-b-xl">
                <Link href={`/preview/${successData.id}`} target="_blank" rel="noopener noreferrer" className="w-full">
                  <Button variant="outline" className="w-full">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Open Preview
                  </Button>
                </Link>
                <Button
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
                  onClick={() => {
                    setSuccessData(null);
                    setFileInfo(null);
                    setFileUrl("");
                    form.reset();
                  }}
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

                  <FormField
                    control={form.control}
                    name="clientName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Client Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Acme Corp" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* File Section */}
                  <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-4">
                    <div>
                      <p className="text-sm font-medium text-foreground mb-2">File Source</p>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => { setUploadMode("file"); setUploadError(null); }}
                          className={`flex items-center justify-center gap-2 rounded-lg border py-2.5 text-sm font-medium transition-all ${
                            uploadMode === "file"
                              ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300"
                              : "border-slate-200 dark:border-slate-700 text-muted-foreground hover:border-slate-300 dark:hover:border-slate-600"
                          }`}
                        >
                          <HardDrive className="w-4 h-4" />
                          Upload from PC
                        </button>
                        <button
                          type="button"
                          onClick={() => { setUploadMode("url"); setUploadError(null); }}
                          className={`flex items-center justify-center gap-2 rounded-lg border py-2.5 text-sm font-medium transition-all ${
                            uploadMode === "url"
                              ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300"
                              : "border-slate-200 dark:border-slate-700 text-muted-foreground hover:border-slate-300 dark:hover:border-slate-600"
                          }`}
                        >
                          <Link2 className="w-4 h-4" />
                          Use a URL
                        </button>
                      </div>
                    </div>

                    {uploadMode === "file" ? (
                      <div>
                        {!fileInfo ? (
                          <div
                            className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer ${
                              dragActive
                                ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-950/30"
                                : "border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-700 hover:bg-slate-50 dark:hover:bg-slate-900/50"
                            }`}
                            onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                            onDragLeave={() => setDragActive(false)}
                            onDrop={handleDrop}
                            onClick={() => fileInputRef.current?.click()}
                          >
                            <input
                              ref={fileInputRef}
                              type="file"
                              className="hidden"
                              accept="image/*,application/pdf,video/*"
                              onChange={handleFileInput}
                            />
                            <div className="flex flex-col items-center gap-3">
                              <div className="w-14 h-14 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                                <Upload className="w-6 h-6 text-slate-400" />
                              </div>
                              <div>
                                <p className="font-semibold text-foreground">Drop your file here</p>
                                <p className="text-sm text-muted-foreground mt-1">or click to browse</p>
                              </div>
                              <p className="text-xs text-muted-foreground bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">
                                Images, PDFs, Videos — up to 100 MB
                              </p>
                            </div>
                          </div>
                        ) : (
                          <div className="border rounded-xl p-4 bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700">
                            <div className="flex items-center gap-4">
                              {fileInfo.preview ? (
                                <img
                                  src={fileInfo.preview}
                                  alt="preview"
                                  className="w-16 h-16 rounded-lg object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                                />
                              ) : (
                                <div className="w-16 h-16 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                                  <FileIcon type={fileInfo.fileType} />
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm truncate">{fileInfo.file.name}</p>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  {fileInfo.fileType.toUpperCase()} · {formatBytes(fileInfo.file.size)}
                                </p>
                                <div className="mt-1.5 flex items-center gap-1.5">
                                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                  <span className="text-xs text-green-600 dark:text-green-400 font-medium">Ready to upload</span>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={clearFile}
                                className="shrink-0 p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-muted-foreground transition-colors"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div>
                          <label className="text-sm font-medium text-foreground block mb-1.5">File URL</label>
                          <Input
                            placeholder="https://example.com/design.png"
                            value={fileUrl}
                            onChange={(e) => setFileUrl(e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium text-foreground block mb-1.5">File Type</label>
                          <Select value={fileUrlType} onValueChange={(v) => setFileUrlType(v as "image" | "pdf" | "video")}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
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
                      <p className="text-sm text-red-500 font-medium">{uploadError}</p>
                    )}
                  </div>

                  {/* Password */}
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password Protection <span className="text-muted-foreground font-normal">(optional)</span></FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            placeholder="Leave blank for a public link"
                            autoComplete="new-password"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

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
