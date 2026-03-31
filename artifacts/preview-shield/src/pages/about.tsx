import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export default function About() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      
      <main className="flex-1">
        <section className="pt-24 pb-20">
          <div className="container mx-auto px-4 md:px-6 max-w-3xl">
            <h1 className="text-4xl md:text-5xl font-bold mb-8">Our Mission</h1>
            
            <div className="prose prose-lg dark:prose-invert prose-slate max-w-none">
              <p className="lead text-xl text-muted-foreground mb-10">
                We believe independent professionals deserve the same security and leverage as large agencies. PreviewShield was built to fix the power imbalance in freelance client relationships.
              </p>
              
              <h2 className="text-2xl font-semibold mt-12 mb-4">The Problem</h2>
              <p>
                Every freelancer knows the feeling. You finish the work, send over the files for review, and... silence. The client ghosts you. Days later, you see your "draft" design live on their website. You sent the unprotected file, and they took it without paying.
              </p>
              <p>
                Watermarking manually takes time. Setting up complex portals is overkill. You need a fast, professional way to say "here is the work to review, but it's not yours until the invoice is paid."
              </p>
              
              <h2 className="text-2xl font-semibold mt-12 mb-4">The Solution</h2>
              <p>
                PreviewShield acts as the professional barrier. By presenting your work in our secure viewer, you accomplish three things instantly:
              </p>
              <ul>
                <li><strong>Security:</strong> The file cannot be easily downloaded or saved.</li>
                <li><strong>Tracking:</strong> You know exactly when they look at it.</li>
                <li><strong>Professionalism:</strong> Sending a secure link looks infinitely more professional than attaching a ZIP file.</li>
              </ul>

              <h2 className="text-2xl font-semibold mt-12 mb-4">Our Vision</h2>
              <p>
                We want to be the default layer between creative work and final delivery. We envision a world where freelance theft is technically impossible, allowing creatives to focus on doing their best work instead of worrying about getting paid.
              </p>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
