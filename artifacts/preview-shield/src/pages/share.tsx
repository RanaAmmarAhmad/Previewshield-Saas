import { useState } from "react";
import { useLocation, Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useCreatePreview, CreatePreviewRequestFileType } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Copy, Check, ExternalLink, ArrowRight, Loader2 } from "lucide-react";

const shareSchema = z.object({
  freelancerName: z.string().min(2, "Name is required"),
  agencyName: z.string().optional(),
  clientName: z.string().min(2, "Client name is required"),
  fileName: z.string().min(2, "File name is required"),
  fileType: z.enum(["image", "pdf", "video"]),
  fileUrl: z.string().url("Must be a valid URL").min(1, "File URL is required"),
  password: z.string().optional(),
});

type ShareFormValues = z.infer<typeof shareSchema>;

export default function Share() {
  const [copied, setCopied] = useState(false);
  const [successData, setSuccessData] = useState<{ url: string; id: string } | null>(null);
  
  const createPreview = useCreatePreview();

  const form = useForm<ShareFormValues>({
    resolver: zodResolver(shareSchema),
    defaultValues: {
      freelancerName: "",
      agencyName: "",
      clientName: "",
      fileName: "",
      fileType: "image",
      fileUrl: "",
      password: "",
    },
  });

  const onSubmit = (data: ShareFormValues) => {
    createPreview.mutate({
      data: {
        freelancerName: data.freelancerName,
        agencyName: data.agencyName || null,
        clientName: data.clientName,
        fileName: data.fileName,
        fileType: data.fileType,
        fileUrl: data.fileUrl,
        password: data.password || null,
        fileMimeType: data.fileType === "pdf" ? "application/pdf" : data.fileType === "video" ? "video/mp4" : "image/jpeg",
        fileSize: 1024 * 1024, // Placeholder size since we're using URLs for now
      }
    }, {
      onSuccess: (response) => {
        const url = new URL(`/preview/${response.id}`, window.location.origin).toString();
        setSuccessData({ url, id: response.id });
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

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-12 md:py-24">
        <div className="max-w-2xl mx-auto">
          
          <div className="mb-10 text-center">
            <h1 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight">Create Secure Preview</h1>
            <p className="text-muted-foreground text-lg">Generate a protected, view-only link for your client.</p>
          </div>

          {!successData ? (
            <Card className="shadow-xl border-slate-200/60 dark:border-slate-800">
              <CardContent className="pt-6">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="freelancerName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Your Name</FormLabel>
                            <FormControl>
                              <Input placeholder="John Doe" className="bg-slate-50/50 dark:bg-slate-900/50" {...field} />
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
                            <FormLabel>Agency (Optional)</FormLabel>
                            <FormControl>
                              <Input placeholder="Design Studio LLC" className="bg-slate-50/50 dark:bg-slate-900/50" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="space-y-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                      <FormField
                        control={form.control}
                        name="clientName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Client Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Acme Corp" className="bg-slate-50/50 dark:bg-slate-900/50" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          control={form.control}
                          name="fileName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>File Name</FormLabel>
                              <FormControl>
                                <Input placeholder="Hero_Section_v2" className="bg-slate-50/50 dark:bg-slate-900/50" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="fileType"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>File Type</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger className="bg-slate-50/50 dark:bg-slate-900/50">
                                    <SelectValue placeholder="Select a type" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="image">Image</SelectItem>
                                  <SelectItem value="pdf">PDF Document</SelectItem>
                                  <SelectItem value="video">Video</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="fileUrl"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>File URL</FormLabel>
                            <FormControl>
                              <Input placeholder="https://example.com/my-design.png" className="bg-slate-50/50 dark:bg-slate-900/50" {...field} />
                            </FormControl>
                            <p className="text-xs text-muted-foreground mt-2">
                              Provide a direct link to the file to be embedded.
                            </p>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Password Protection (Optional)</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="Leave blank for public link" className="bg-slate-50/50 dark:bg-slate-900/50" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full h-12 text-base bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-200 transition-all mt-4"
                      disabled={createPreview.isPending}
                    >
                      {createPreview.isPending ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          Generating Link...
                        </>
                      ) : (
                        <>
                          Generate Secure Link
                          <ArrowRight className="w-5 h-5 ml-2" />
                        </>
                      )}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          ) : (
            <Card className="shadow-2xl border-indigo-100 dark:border-indigo-900/50 bg-white/50 dark:bg-slate-900/50 backdrop-blur">
              <CardHeader className="text-center pb-2">
                <div className="mx-auto w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">
                  <Check className="w-8 h-8" />
                </div>
                <CardTitle className="text-2xl">Ready to share!</CardTitle>
                <CardDescription className="text-base mt-2">
                  Your secure preview link has been generated successfully.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2 p-1 border rounded-lg bg-slate-50 dark:bg-slate-950">
                  <Input 
                    readOnly 
                    value={successData.url} 
                    className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-slate-600 dark:text-slate-400"
                  />
                  <Button 
                    variant="secondary" 
                    className="shrink-0 font-medium"
                    onClick={copyToClipboard}
                  >
                    {copied ? <Check className="w-4 h-4 mr-2 text-green-500" /> : <Copy className="w-4 h-4 mr-2" />}
                    {copied ? "Copied" : "Copy Link"}
                  </Button>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col sm:flex-row gap-4 pt-4 border-t bg-slate-50/50 dark:bg-slate-900/20 rounded-b-xl">
                <Link href={`/preview/${successData.id}`} target="_blank" rel="noopener noreferrer" className="w-full">
                  <Button variant="outline" className="w-full">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Open Preview
                  </Button>
                </Link>
                <Button 
                  variant="ghost" 
                  className="w-full"
                  onClick={() => {
                    setSuccessData(null);
                    form.reset();
                  }}
                >
                  Create Another
                </Button>
              </CardFooter>
            </Card>
          )}

        </div>
      </main>

      <Footer />
    </div>
  );
}
